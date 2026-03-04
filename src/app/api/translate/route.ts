import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

/**
 * @fileoverview POST /api/translate — Batch translation stage of the content pipeline.
 *
 * Translates entity titles + summaries to Spanish (LANG-ES) and Vietnamese (LANG-VI)
 * using Claude. Supports multiple table types (content_published, services_211,
 * elected_officials, etc.) via TABLE_CONFIGS.
 *
 * For each untranslated item, sends title + summary to Claude for translation,
 * then upserts into the `translations` table keyed by content_id + language_id + field_name.
 *
 * Auth: Requires API key (x-api-key) or cron secret (Bearer token).
 * Called by: batch-translate cron job, "Translate All" dashboard button, /api/ingest.
 *
 * Body:
 *   { "tables": ["content_published"], "languages": ["es", "vi"], "limit": 50, "offset": 0 }
 *
 * Env: ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

const LANGUAGE_MAP: Record<string, { name: string; id: string }> = {
  es: { name: 'Spanish', id: 'LANG-ES' },
  vi: { name: 'Vietnamese', id: 'LANG-VI' },
}

const TABLE_CONFIGS: Record<string, {
  idCol: string
  nameCol: string
  descCol: string
  contentType: string
  selectCols: string
  activeFilter?: { col: string; val: string }
}> = {
  content_published: {
    idCol: 'inbox_id',
    nameCol: 'title_6th_grade',
    descCol: 'summary_6th_grade',
    contentType: 'content_published',
    selectCols: 'inbox_id,title_6th_grade,summary_6th_grade',
    activeFilter: { col: 'is_active', val: 'true' },
  },
  organizations: {
    idCol: 'org_id',
    nameCol: 'org_name',
    descCol: 'description_5th_grade',
    contentType: 'organizations',
    selectCols: 'org_id,org_name,description_5th_grade',
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

// ── Supabase REST helper ─────────────────────────────────────────────

async function supaGet(path: string, params: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}?${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase GET ${path}: ${res.status} ${text}`)
  }
  return res.json()
}

async function supaPost(table: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=translation_id`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase POST ${table}: ${res.status} ${text}`)
  }
  return res.json()
}

// ── Claude translation helper ─────────────────────────────────────────

async function translateText(
  title: string,
  summary: string,
  langCode: string,
): Promise<{ title: string; summary: string }> {
  const lang = LANGUAGE_MAP[langCode]

  // Retry up to 3 times on failure
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
        console.error(`Anthropic API error (attempt ${attempt + 1}):`, data.error)
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(data.error.message || 'API error')
      }
      const text = data.content?.[0]?.text || '{}'
      // Clean any markdown wrapping
      const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      return JSON.parse(cleaned)
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries exceeded')
}

// ── Main route ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const authError = await validateApiRequest(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const {
      tables = ['content_published'],
      languages = ['es', 'vi'],
      limit = 50,
      offset = 0,
      inbox_ids,
    } = body

    const validInboxIds = Array.isArray(inbox_ids) ? inbox_ids : undefined

    let totalTranslated = 0
    let totalErrors = 0
    let totalSkipped = 0
    const details: Record<string, { translated: number; skipped: number; errors: number }> = {}

    for (const tableName of tables) {
      const config = TABLE_CONFIGS[tableName]
      if (!config) {
        details[tableName] = { translated: 0, skipped: 0, errors: 0 }
        continue
      }

      let rows: any[]

      // If explicit inbox_ids provided, fetch those specific rows
      if (validInboxIds && validInboxIds.length > 0 && tableName === 'content_published') {
        const idFilter = validInboxIds.map((id: string) => `"${id}"`).join(',')
        rows = await supaGet(tableName, `select=${config.selectCols}&inbox_id=in.(${idFilter})`)
      } else {
        let queryParams = `select=${config.selectCols}&limit=${limit}&offset=${offset}`
        if (config.activeFilter) {
          queryParams += `&${config.activeFilter.col}=eq.${config.activeFilter.val}`
        }
        rows = await supaGet(tableName, queryParams)
      }

      if (!Array.isArray(rows)) {
        details[tableName] = { translated: 0, skipped: 0, errors: 0 }
        continue
      }

      let translated = 0
      let skipped = 0
      let errors = 0

      for (const row of rows) {
        const contentId = row[config.idCol]
        const titleText = row[config.nameCol] || ''
        const descText = row[config.descCol] || ''
        if (!contentId || !titleText) { skipped++; continue }

        for (const langCode of languages) {
          const langInfo = LANGUAGE_MAP[langCode]
          if (!langInfo) continue

          // Check if translation already exists
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

            // Store title translation
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

            // Store summary translation
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

            // Delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (e) {
            console.error(`Translation error for ${tableName}/${contentId} (${langCode}):`, e)
            errors++
          }
        }
      }

      details[tableName] = { translated, skipped, errors }
      totalTranslated += translated
      totalSkipped += skipped
      totalErrors += errors
    }

    return NextResponse.json({
      success: true,
      total_translated: totalTranslated,
      total_skipped: totalSkipped,
      total_errors: totalErrors,
      languages,
      details,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
