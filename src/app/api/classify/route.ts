/**
 * @fileoverview Batch content classification route — step 2 of the content pipeline.
 *
 * After content enters `content_inbox` via `/api/ingest`, this route picks up
 * pending items and classifies them against the full Change Engine taxonomy.
 *
 * Uses the shared classification module for consistent v4-unified classification
 * across all code paths.
 *
 * Auth: every request is validated by {@link validateApiRequest}.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  classifyEntity,
  validateAndEnrich,
  populateAllJunctions,
  parseClaudeJson,
} from '@/lib/classification'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helper ────────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Classify a single content item ──────────────────────────────────────

async function classifyItem(
  item: { id: string; source_url: string; source_domain: string | null; title: string | null; description: string | null },
  taxonomy: Awaited<ReturnType<typeof fetchFullTaxonomy>>,
  systemPrompt: string,
) {
  const pageTitle = item.title || ''
  const pageText = (item.description || '').substring(0, 2500)

  if (!pageTitle && !pageText) {
    return { success: false, error: 'No content to classify' }
  }

  const userContent = `Title: ${pageTitle}\nURL: ${item.source_url || 'N/A'}\nSource: ${item.source_domain || 'manual'}\nContent: ${pageText}\n\nReturn JSON with: theme_primary, theme_secondary, focus_area_ids, sdg_ids, sdoh_code, ntee_codes, airs_codes, center, resource_type_id, content_type, audience_segment_ids, life_situation_ids, service_cat_ids, skill_ids, time_commitment_id, action_type_ids, gov_level_id, title_6th_grade, summary_6th_grade, geographic_scope, confidence, reasoning`

  try {
    const rawText = await classifyEntity(
      systemPrompt,
      userContent,
      ANTHROPIC_KEY,
      2000,
    )

    const classification = parseClaudeJson(rawText)
    const enriched = validateAndEnrich(classification, taxonomy, 'content')

    const confidence = enriched.confidence ?? 0
    const status = confidence >= 0.8 ? 'classified' : confidence >= 0.5 ? 'needs_review' : 'flagged'

    // Update content_inbox status
    await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, { status, content_type: enriched.content_type || null })

    // Write to content_review_queue
    await supaRest('POST', 'content_review_queue', {
      inbox_id: item.id,
      ai_classification: enriched,
      confidence,
      review_status: status,
    })

    // Populate junction tables
    await populateAllJunctions('content', item.id, enriched, SUPABASE_URL, SUPABASE_KEY)

    // Log
    await supaRest('POST', 'ingestion_log', {
      event_type: 'classify_v4',
      source: item.source_domain || 'manual',
      source_url: item.source_url,
      status: 'success',
      message: `v4-unified: ${(enriched.focus_area_ids || []).length}FA ${(enriched.sdg_ids || []).length}SDG | conf:${confidence}`,
      item_count: 1,
    })

    return {
      success: true,
      inbox_id: item.id,
      status,
      confidence,
      title_6th: enriched.title_6th_grade,
      focus_areas: enriched.focus_area_ids,
      center: enriched.center,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ── Route handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const batchSize = Math.min(body.batch_size || 10, 50)
  const inboxIds: string[] | undefined = body.inbox_ids

  if (inboxIds !== undefined && !Array.isArray(inboxIds)) {
    return NextResponse.json({ error: 'inbox_ids must be an array' }, { status: 400 })
  }

  // Fetch taxonomy once for the batch
  const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY)
  const systemPrompt = buildPromptForEntity(taxonomy, 'content')

  // Get items to classify
  let items: any[]
  if (inboxIds && inboxIds.length > 0) {
    const idFilter = inboxIds.map(id => `"${id}"`).join(',')
    items = await supaRest('GET', `content_inbox?id=in.(${idFilter})&select=id,source_url,source_domain,title,description,image_url`)
  } else {
    items = await supaRest('GET', `content_inbox?status=eq.pending&select=id,source_url,source_domain,title,description,image_url&order=created_at.asc&limit=${batchSize}`)
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ message: 'No pending items to classify', processed: 0 })
  }

  const results: any[] = []
  let succeeded = 0
  let failed = 0

  for (const item of items) {
    try {
      const result = await classifyItem(item, taxonomy, systemPrompt)
      results.push({ url: item.source_url, ...result })
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ url: item.source_url, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit: 1s between Claude calls
    if (items.indexOf(item) < items.length - 1) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }

  return NextResponse.json({
    processed: items.length,
    succeeded,
    failed,
    results,
  })
}
