#!/usr/bin/env node
/**
 * Standalone batch translation script.
 * Bypasses the Vercel API route — calls Supabase REST + Anthropic directly.
 *
 * Usage:
 *   node scripts/batch-translate.mjs [table] [limit] [lang]
 *   node scripts/batch-translate.mjs elected_officials 50 es
 *   node scripts/batch-translate.mjs all 20         # all tables, 20 per table
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
const env = {}
for (const line of envLines) {
  const m = line.match(/^([A-Z_]+)=(.+)$/)
  if (m) env[m[1]] = m[2]
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing env vars. Check .env.local')
  process.exit(1)
}

const LANGUAGE_MAP = {
  es: { name: 'Spanish', id: 'LANG-ES' },
  vi: { name: 'Vietnamese', id: 'LANG-VI' },
}

const TABLE_CONFIGS = {
  content_published: {
    idCol: 'inbox_id', nameCol: 'title_6th_grade', descCol: 'summary_6th_grade',
    contentType: 'content_published',
    selectCols: 'inbox_id,title_6th_grade,summary_6th_grade',
    activeFilter: { col: 'is_active', val: 'true' },
  },
  organizations: {
    idCol: 'org_id', nameCol: 'org_name', descCol: 'description_5th_grade',
    contentType: 'organizations',
    selectCols: 'org_id,org_name,description_5th_grade',
  },
  services_211: {
    idCol: 'service_id', nameCol: 'service_name', descCol: 'description_5th_grade',
    contentType: 'services_211',
    selectCols: 'service_id,service_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  elected_officials: {
    idCol: 'official_id', nameCol: 'official_name', descCol: 'description_5th_grade',
    contentType: 'elected_officials',
    selectCols: 'official_id,official_name,description_5th_grade',
  },
  policies: {
    idCol: 'policy_id', nameCol: 'policy_name', descCol: 'summary_5th_grade',
    contentType: 'policies',
    selectCols: 'policy_id,policy_name,summary_5th_grade',
  },
  opportunities: {
    idCol: 'opportunity_id', nameCol: 'opportunity_name', descCol: 'description_5th_grade',
    contentType: 'opportunities',
    selectCols: 'opportunity_id,opportunity_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  agencies: {
    idCol: 'agency_id', nameCol: 'agency_name', descCol: 'description_5th_grade',
    contentType: 'agencies',
    selectCols: 'agency_id,agency_name,description_5th_grade',
  },
  benefit_programs: {
    idCol: 'benefit_id', nameCol: 'benefit_name', descCol: 'description_5th_grade',
    contentType: 'benefit_programs',
    selectCols: 'benefit_id,benefit_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  campaigns: {
    idCol: 'campaign_id', nameCol: 'campaign_name', descCol: 'description_5th_grade',
    contentType: 'campaigns',
    selectCols: 'campaign_id,campaign_name,description_5th_grade',
  },
  events: {
    idCol: 'event_id', nameCol: 'event_name', descCol: 'description_5th_grade',
    contentType: 'events',
    selectCols: 'event_id,event_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  foundations: {
    idCol: 'id', nameCol: 'name', descCol: 'mission',
    contentType: 'foundations',
    selectCols: 'id,name,mission',
  },
  learning_paths: {
    idCol: 'path_id', nameCol: 'path_name', descCol: 'description_5th_grade',
    contentType: 'learning_paths',
    selectCols: 'path_id,path_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
  },
  life_situations: {
    idCol: 'situation_id', nameCol: 'situation_name', descCol: 'description_5th_grade',
    contentType: 'life_situations',
    selectCols: 'situation_id,situation_name,description_5th_grade',
  },
  ballot_items: {
    idCol: 'item_id', nameCol: 'item_name', descCol: 'description_5th_grade',
    contentType: 'ballot_items',
    selectCols: 'item_id,item_name,description_5th_grade',
  },
  guides: {
    idCol: 'guide_id', nameCol: 'title', descCol: 'description',
    contentType: 'guides',
    selectCols: 'guide_id,title,description',
    activeFilter: { col: 'is_active', val: 'true' },
  },
}

const SYSTEM_PROMPT = `You are a professional translator for The Change Engine, a civic engagement platform in Houston, Texas.

Your job is to translate civic content that has already been simplified to a 5th/6th-grade reading level in English.

CRITICAL RULES:
1. Maintain the reading level in the target language — use simple, everyday words.
2. Keep the same tone: warm, helpful, community-focused.
3. Do NOT add or remove information. Translate what's there.
4. For civic/government terms, use commonly understood terms in the Houston community.
5. Keep proper nouns (organization names, place names, people names) in their original form.
6. For Vietnamese, use standard Southern Vietnamese dialect common in Houston.

Respond with JSON only. No markdown, no backticks.`

async function supaGet(path, params) {
  const url = `${SUPABASE_URL}/rest/v1/${path}?${params}`
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase GET ${path}: ${res.status} ${text}`)
  }
  return res.json()
}

async function supaPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=translation_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase POST ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

async function translateText(title, summary, langCode) {
  const lang = LANGUAGE_MAP[langCode]
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: 'user',
            content: `Translate the following to ${lang.name}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
          }],
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (data.error) {
        console.error(`  API error (attempt ${attempt + 1}):`, data.error.message)
        if (attempt < 2) { await sleep(2000 * (attempt + 1)); continue }
        throw new Error(data.error.message)
      }
      const text = data.content?.[0]?.text || '{}'
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch (e) {
      if (attempt < 2) { await sleep(2000 * (attempt + 1)); continue }
      throw e
    }
  }
  throw new Error('Max retries')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function translateTable(tableName, limit, languages) {
  const config = TABLE_CONFIGS[tableName]
  if (!config) { console.error(`Unknown table: ${tableName}`); return }

  let queryParams = `select=${config.selectCols}&limit=${limit}`
  if (config.activeFilter) {
    queryParams += `&${config.activeFilter.col}=eq.${config.activeFilter.val}`
  }

  console.log(`\n--- ${tableName} ---`)
  console.log(`  Query: ${queryParams}`)

  let rows
  try {
    rows = await supaGet(tableName, queryParams)
  } catch (e) {
    console.error(`  Fetch error: ${e.message}`)
    return
  }

  if (!Array.isArray(rows)) {
    console.error(`  Unexpected response:`, rows)
    return
  }
  console.log(`  Rows fetched: ${rows.length}`)

  let translated = 0, skipped = 0, errors = 0

  for (const row of rows) {
    const contentId = row[config.idCol]
    const titleText = row[config.nameCol] || ''
    const descText = row[config.descCol] || ''
    if (!contentId || !titleText) { skipped++; continue }

    for (const langCode of languages) {
      const langInfo = LANGUAGE_MAP[langCode]
      if (!langInfo) continue

      // Check existing
      const existing = await supaGet(
        'translations',
        `content_type=eq.${config.contentType}&content_id=eq.${contentId}&language_id=eq.${langInfo.id}&field_name=in.("title","title_6th_grade")&select=translation_id`
      )
      if (Array.isArray(existing) && existing.length > 0) {
        skipped++
        continue
      }

      try {
        const result = await translateText(titleText, descText, langCode)
        const idPrefix = String(contentId).substring(0, 8)

        await supaPost('translations', {
          translation_id: `TR-${idPrefix}-${langCode}-title`,
          content_type: config.contentType,
          content_id: contentId,
          field_name: 'title',
          language_id: langInfo.id,
          translated_text: result.title,
          is_verified: 'No',
          machine_translated: 'Yes',
          data_source: 'Claude API',
          last_updated: new Date().toISOString(),
        })

        if (result.summary) {
          await supaPost('translations', {
            translation_id: `TR-${idPrefix}-${langCode}-summary`,
            content_type: config.contentType,
            content_id: contentId,
            field_name: 'summary',
            language_id: langInfo.id,
            translated_text: result.summary,
            is_verified: 'No',
            machine_translated: 'Yes',
            data_source: 'Claude API',
            last_updated: new Date().toISOString(),
          })
        }

        translated++
        console.log(`  [${langCode}] ${titleText.substring(0, 50)}...`)
        await sleep(300)
      } catch (e) {
        console.error(`  Error ${contentId} (${langCode}): ${e.message}`)
        errors++
      }
    }
  }

  console.log(`  Done: ${translated} translated, ${skipped} skipped, ${errors} errors`)
  return { translated, skipped, errors }
}

// Main
const args = process.argv.slice(2)
const tableArg = args[0] || 'all'
const limit = parseInt(args[1] || '50', 10)
const langArg = args[2]
const languages = langArg ? [langArg] : ['es', 'vi']

const tables = tableArg === 'all' ? Object.keys(TABLE_CONFIGS) : [tableArg]

console.log(`Batch translate: ${tables.length} table(s), limit=${limit}, languages=${languages.join(',')}`)

let totalT = 0, totalS = 0, totalE = 0
for (const t of tables) {
  const r = await translateTable(t, limit, languages)
  if (r) { totalT += r.translated; totalS += r.skipped; totalE += r.errors }
}

console.log(`\n=== TOTAL: ${totalT} translated, ${totalS} skipped, ${totalE} errors ===`)
