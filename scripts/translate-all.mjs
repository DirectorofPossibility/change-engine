#!/usr/bin/env node

/**
 * Batch-translate all content tables to ES and VI.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/translate-all.mjs
 *
 * Options (env vars):
 *   TABLES    — comma-separated list (default: all 6 tables)
 *   LANGUAGES — comma-separated (default: es,vi)
 *   LIMIT     — max rows per table (default: 500)
 *   DRY_RUN   — set to "true" to skip actual translation calls
 */

const SUPABASE_URL = 'https://xesojwzcnjqtpuossmuv.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhlc29qd3pjbmpxdHB1b3NzbXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODEzODUsImV4cCI6MjA4NzU1NzM4NX0.9B3_TX3qBG0SXI9UifYH7sJQMmiHjc_YRbaYBAk7l0w'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }

const LANGUAGES = (process.env.LANGUAGES || 'es,vi').split(',')
const DRY_RUN = process.env.DRY_RUN === 'true'
const LIMIT = parseInt(process.env.LIMIT || '500', 10)

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
  services_211: {
    idCol: 'service_id', nameCol: 'service_name', descCol: 'description_5th_grade',
    contentType: 'services_211',
    selectCols: 'service_id,service_name,description_5th_grade',
    activeFilter: { col: 'is_active', val: 'Yes' },
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
  organizations: {
    idCol: 'org_id', nameCol: 'org_name', descCol: 'description_5th_grade',
    contentType: 'organizations',
    selectCols: 'org_id,org_name,description_5th_grade',
  },
  elected_officials: {
    idCol: 'official_id', nameCol: 'official_name', descCol: 'title',
    contentType: 'elected_officials',
    selectCols: 'official_id,official_name,title',
  },
}

const ALL_TABLES = Object.keys(TABLE_CONFIGS)
const TABLES = (process.env.TABLES || ALL_TABLES.join(',')).split(',')

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

// --- Supabase helpers (anon key for reads, RPC for writes) ---

async function supabaseGet(table, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  })
  if (!res.ok) throw new Error(`GET ${table}: ${res.status}`)
  return res.json()
}

async function supabaseRpc(fnName, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`RPC ${fnName}: ${res.status} ${body}`)
  }
}

// --- Anthropic translation ---

async function translateText(title, summary, langCode) {
  const lang = LANGUAGE_MAP[langCode]
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Translate the following to ${lang.name}. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\nSummary: ${summary}`,
      }],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Anthropic ${res.status}: ${body}`)
  }
  const data = await res.json()
  let text = data.content?.[0]?.text || '{}'
  // Strip markdown code fence if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/g, '').trim()
  return JSON.parse(text)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// --- Main ---

async function main() {
  console.log(`\n=== translate-all ===`)
  console.log(`Tables:    ${TABLES.join(', ')}`)
  console.log(`Languages: ${LANGUAGES.join(', ')}`)
  console.log(`Limit:     ${LIMIT} per table`)
  console.log(`Dry run:   ${DRY_RUN}\n`)

  let grandTotal = 0, grandSkipped = 0, grandErrors = 0

  for (const tableName of TABLES) {
    const config = TABLE_CONFIGS[tableName]
    if (!config) { console.log(`  [${tableName}] unknown — skipping`); continue }

    let qp = `select=${config.selectCols}&limit=${LIMIT}`
    if (config.activeFilter) qp += `&${config.activeFilter.col}=eq.${config.activeFilter.val}`

    let rows
    try { rows = await supabaseGet(tableName, qp) }
    catch (e) { console.error(`  [${tableName}] fetch error: ${e.message}`); continue }

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log(`  [${tableName}] 0 rows`); continue
    }

    console.log(`  [${tableName}] ${rows.length} rows`)
    let translated = 0, skipped = 0, errors = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const contentId = row[config.idCol]
      const titleText = row[config.nameCol] || ''
      const descText = row[config.descCol] || ''
      if (!contentId || !titleText) { skipped++; continue }

      for (const langCode of LANGUAGES) {
        const langInfo = LANGUAGE_MAP[langCode]
        if (!langInfo) continue

        // Check existing
        try {
          const ex = await supabaseGet('translations',
            `content_type=eq.${config.contentType}&content_id=eq.${contentId}&language_id=eq.${langInfo.id}&field_name=in.(title,title_6th_grade)&limit=1`)
          if (Array.isArray(ex) && ex.length > 0) { skipped++; continue }
        } catch { /* proceed */ }

        if (DRY_RUN) { translated++; continue }

        try {
          const result = await translateText(titleText, descText, langCode)
          const idPrefix = String(contentId).substring(0, 8)

          // Write title via RPC
          await supabaseRpc('upsert_translation', {
            p_translation_id: `TR-${idPrefix}-${langCode}-title`,
            p_content_type: config.contentType,
            p_content_id: contentId,
            p_field_name: 'title',
            p_language_id: langInfo.id,
            p_translated_text: result.title,
          })

          // Write summary via RPC
          if (result.summary) {
            await supabaseRpc('upsert_translation', {
              p_translation_id: `TR-${idPrefix}-${langCode}-summary`,
              p_content_type: config.contentType,
              p_content_id: contentId,
              p_field_name: 'summary',
              p_language_id: langInfo.id,
              p_translated_text: result.summary,
            })
          }

          translated++
          const short = titleText.length > 45 ? titleText.substring(0, 45) + '...' : titleText
          console.log(`    [${langCode}] ${i + 1}/${rows.length} ${short}`)

          await sleep(250)
        } catch (e) {
          console.error(`    ERROR [${langCode}] ${contentId}: ${e.message}`)
          errors++
          await sleep(1000)
        }
      }
    }

    console.log(`  [${tableName}] done — translated: ${translated}, skipped: ${skipped}, errors: ${errors}\n`)
    grandTotal += translated
    grandSkipped += skipped
    grandErrors += errors
  }

  console.log(`=== DONE ===`)
  console.log(`Total translated: ${grandTotal}`)
  console.log(`Total skipped:    ${grandSkipped}`)
  console.log(`Total errors:     ${grandErrors}`)
}

main().catch(e => { console.error(e); process.exit(1) })
