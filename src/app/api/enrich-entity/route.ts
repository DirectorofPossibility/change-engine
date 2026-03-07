import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import {
  fetchFullTaxonomy,
  buildPromptForEntity,
  classifyEntity,
  validateAndEnrich,
  populateAllJunctions,
  parseClaudeJson,
  buildUserPrompt,
  TABLE_CONFIGS,
} from '@/lib/classification'

/**
 * @fileoverview POST /api/enrich-entity — Unified entity enrichment.
 *
 * Classifies ANY entity type across all 16 taxonomy dimensions using
 * the shared classification module. Supports all entity tables:
 *   elected_officials, policies, organizations, services_211,
 *   opportunities, agencies, benefit_programs, campaigns, ballot_items
 *
 * Auth: Requires API key (x-api-key) or cron secret (Bearer token).
 *
 * Body:
 *   { "table": "elected_officials", "limit": 10, "ids": ["OFFICIAL_001"] }
 *   { "table": "organizations", "limit": 10, "force": true }
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

async function logToIngestion(eventType: string, source: string, status: string, message: string, itemCount?: number) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_type: eventType,
        source,
        status,
        message,
        item_count: itemCount || 0,
      }),
    })
  } catch { /* non-critical */ }
}

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const tableName: string = body.table || 'elected_officials'
  const limit = Math.min(body.limit || 10, 50)
  const offset: number = body.offset || 0
  const entityIds: string[] | undefined = body.ids
  const force = body.force === true

  const config = TABLE_CONFIGS[tableName]
  if (!config) {
    return NextResponse.json({ error: `Unknown table: ${tableName}. Supported: ${Object.keys(TABLE_CONFIGS).join(', ')}` }, { status: 400 })
  }

  // Fetch full 16-dimension taxonomy once
  const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY)
  const systemPrompt = buildPromptForEntity(taxonomy, config.entityType)

  // Get entities to enrich
  const selectCols = [config.idCol, config.nameCol, config.descCol, 'classification_v2', 'focus_area_ids', ...config.contextCols].join(',')
  let rows: any[]

  if (entityIds && entityIds.length > 0) {
    const idFilter = entityIds.map(id => `"${id}"`).join(',')
    rows = await supaRest('GET', `${tableName}?${config.idCol}=in.(${idFilter})&select=${selectCols}`)
  } else {
    rows = await supaRest('GET', `${tableName}?select=${selectCols}&limit=${limit}&offset=${offset}&order=${config.idCol}.asc`)
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ message: 'No entities found', processed: 0 })
  }

  const results: any[] = []
  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const row of rows) {
    const entityId = row[config.idCol]

    // Skip if already enriched (v4) unless force
    if (!force && (row.classification_v2?._version === 'v4-unified' || row.classification_v2?._version === 'v3-entity-enrich')) {
      skipped++
      continue
    }

    const name = row[config.nameCol] || ''
    if (!name) {
      results.push({ id: entityId, success: false, error: 'No name' })
      failed++
      continue
    }

    const desc = row[config.descCol] || ''
    const context = config.contextCols
      .map(col => row[col] ? `${col}: ${row[col]}` : '')
      .filter(Boolean)
      .join('\n')

    try {
      const userPromptText = buildUserPrompt(config.entityType, { name, description: desc, context })
      const rawResponse = await classifyEntity(systemPrompt, userPromptText, ANTHROPIC_KEY)
      const classification = parseClaudeJson(rawResponse)
      const enriched = validateAndEnrich(classification, taxonomy, config.entityType)

      // Update the entity row
      const updateData: Record<string, unknown> = {
        classification_v2: enriched,
        focus_area_ids: enriched.focus_area_ids.join(','),
      }
      if (enriched.theme_primary) updateData.theme_id = enriched.theme_primary
      if (enriched.center) updateData.engagement_level = enriched.center

      // Write plain-language rewrites to the correct columns per table
      // Tables use different column names: some have title_6th_grade/summary_6th_grade,
      // others have description_5th_grade/summary_5th_grade
      if (enriched.title_6th_grade) updateData.title_6th_grade = enriched.title_6th_grade
      if (enriched.summary_6th_grade) {
        updateData.summary_6th_grade = enriched.summary_6th_grade
        // Also write to description_5th_grade / summary_5th_grade for tables that use those columns
        if (['elected_official', 'organization', 'service', 'opportunity', 'agency', 'benefit_program', 'campaign', 'ballot_item'].includes(config.entityType)) {
          updateData.description_5th_grade = enriched.summary_6th_grade
        }
        if (config.entityType === 'policy') {
          updateData.summary_5th_grade = enriched.summary_6th_grade
        }
      }

      if (config.entityType === 'policy' && enriched.impact_statement) {
        updateData.impact_statement = enriched.impact_statement
      }
      // Write first NTEE code to top-level column so org_type trigger fires
      if (config.entityType === 'organization' && enriched.ntee_codes?.length > 0) {
        updateData.ntee_code = enriched.ntee_codes[0]
      }

      await supaRest('PATCH', `${tableName}?${config.idCol}=eq.${entityId}`, updateData)

      // Populate ALL junction tables (not just focus areas)
      await populateAllJunctions(config.entityType, entityId, enriched, SUPABASE_URL, SUPABASE_KEY)

      results.push({
        success: true,
        id: entityId,
        name,
        focus_areas: enriched.focus_area_ids,
        sdgs: enriched.sdg_ids,
        center: enriched.center,
        theme: enriched.theme_primary,
        confidence: enriched.confidence,
        keywords: enriched.keywords || [],
      })
      succeeded++
    } catch (err) {
      const errMsg = (err as Error).message
      results.push({ id: entityId, success: false, error: errMsg })
      failed++
      await logToIngestion('classify_error', tableName, 'error',
        `Failed to classify ${entityId} (${name}): ${errMsg}`)
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }

  // Log summary
  if (succeeded > 0 || failed > 0) {
    await logToIngestion('classify_batch', tableName,
      failed === 0 ? 'success' : 'partial',
      `Classified ${succeeded}/${succeeded + failed} in ${tableName} (${skipped} skipped)`,
      succeeded)
  }

  return NextResponse.json({
    table: tableName,
    version: 'v4-unified',
    processed: succeeded + failed,
    succeeded,
    failed,
    skipped,
    results,
  })
}
