import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/translate-page — On-demand translation for a single page.
 *
 * Called by TranslatePageButton when a user views a page in a non-English
 * language that hasn't been translated yet by the nightly cron.
 *
 * Body: { contentType: string, contentId: string, lang: string }
 *
 * This calls Claude to translate title + summary, then upserts into
 * the translations table so subsequent visits are instant.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

const LANGUAGE_MAP: Record<string, { name: string; id: string }> = {
  es: { name: 'Spanish', id: 'LANG-ES' },
  vi: { name: 'Vietnamese', id: 'LANG-VI' },
}

const TABLE_CONFIGS: Record<string, {
  table: string
  idCol: string
  nameCol: string
  descCol: string
}> = {
  content_published: { table: 'content_published', idCol: 'inbox_id', nameCol: 'title_6th_grade', descCol: 'summary_6th_grade' },
  organizations: { table: 'organizations', idCol: 'org_id', nameCol: 'org_name', descCol: 'description_5th_grade' },
  services_211: { table: 'services_211', idCol: 'service_id', nameCol: 'service_name', descCol: 'description_5th_grade' },
  elected_officials: { table: 'elected_officials', idCol: 'official_id', nameCol: 'official_name', descCol: 'title' },
  policies: { table: 'policies', idCol: 'policy_id', nameCol: 'title_6th_grade', descCol: 'summary_6th_grade' },
  opportunities: { table: 'opportunities', idCol: 'opportunity_id', nameCol: 'opportunity_name', descCol: 'description_5th_grade' },
}

export async function POST(req: NextRequest) {
  try {
    const { contentType, contentId, lang } = await req.json()

    const langInfo = LANGUAGE_MAP[lang]
    if (!langInfo) return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })

    const config = TABLE_CONFIGS[contentType]
    if (!config) return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 })

    // Check if translation already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/translations?content_type=eq.${contentType}&content_id=eq.${contentId}&language_id=eq.${langInfo.id}&field_name=eq.title&select=translation_id`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const existing = await checkRes.json()
    if (existing && existing.length > 0) {
      return NextResponse.json({ status: 'already_translated' })
    }

    // Fetch source content
    const srcRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${config.table}?${config.idCol}=eq.${contentId}&select=${config.nameCol},${config.descCol}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    const srcRows = await srcRes.json()
    if (!srcRows || srcRows.length === 0) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const src = srcRows[0]
    const title = src[config.nameCol] || ''
    const summary = src[config.descCol] || ''

    if (!title && !summary) {
      return NextResponse.json({ error: 'No content to translate' }, { status: 400 })
    }

    // Call Claude for translation
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Translate the following civic content to ${langInfo.name}. Maintain a 6th-grade reading level. Return JSON with "title" and "summary" keys only.\n\nTitle: ${title}\n\nSummary: ${summary}`,
        }],
      }),
    })

    if (!claudeRes.ok) {
      return NextResponse.json({ error: 'Translation API error' }, { status: 502 })
    }

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text || ''

    // Parse JSON from response
    let translated: { title?: string; summary?: string } = {}
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) translated = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Failed to parse translation' }, { status: 500 })
    }

    // Upsert translations
    const rows: any[] = []
    if (translated.title) {
      rows.push({
        content_type: contentType,
        content_id: contentId,
        language_id: langInfo.id,
        field_name: 'title',
        translated_text: translated.title,
      })
    }
    if (translated.summary) {
      rows.push({
        content_type: contentType,
        content_id: contentId,
        language_id: langInfo.id,
        field_name: 'summary',
        translated_text: translated.summary,
      })
    }

    if (rows.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/translations`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(rows),
      })
    }

    return NextResponse.json({ status: 'translated', title: translated.title, summary: translated.summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}
