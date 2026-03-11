/**
 * Supabase REST helpers for the ingestion pipeline.
 *
 * Direct REST calls to Supabase (bypassing the JS client) for performance
 * in the high-throughput ingestion context.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

export async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function supaUpsert(table: string, body: Record<string, unknown>, conflictCol: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflictCol}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation,resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/** Collects non-fatal junction insert errors for logging. */
export const junctionErrors: Array<{ table: string; error: string }> = []

export async function supaJunctionInsert(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    })
    if (!res.ok) {
      const errText = await res.text()
      const msg = `${table}: ${res.status} ${errText.substring(0, 200)}`
      junctionErrors.push({ table, error: msg })
      console.error(`Junction insert failed — ${msg}`)
    }
  } catch (e) {
    const msg = (e as Error).message
    junctionErrors.push({ table, error: msg })
    console.error(`Junction insert ${table} error:`, msg)
  }
}

/**
 * Populate all junction tables for a newly classified content item.
 */
export async function populateJunctionTables(contentId: string, classification: any) {
  const focusAreaIds: string[] = classification.focus_area_ids || []
  const sdgIds: string[] = classification.sdg_ids || []
  const lifeSituationIds: string[] = classification.life_situation_ids || []
  const audienceSegmentIds: string[] = classification.audience_segment_ids || []
  const serviceCatIds: string[] = classification.service_cat_ids || []
  const skillIds: string[] = classification.skill_ids || []
  const neighborhoods: string[] = classification.locations?.neighborhoods || []
  const zipCodes: string[] = classification.locations?.zip_codes || []

  const pathwayRows: Record<string, unknown>[] = []
  if (classification.theme_primary) {
    pathwayRows.push({ content_id: contentId, theme_id: classification.theme_primary, is_primary: true })
  }
  for (const themeId of (classification.theme_secondary || [])) {
    pathwayRows.push({ content_id: contentId, theme_id: themeId, is_primary: false })
  }

  await Promise.allSettled([
    supaJunctionInsert('content_focus_areas', focusAreaIds.map(fid => ({ content_id: contentId, focus_id: fid }))),
    supaJunctionInsert('content_sdgs', sdgIds.map(sid => ({ content_id: contentId, sdg_id: sid }))),
    supaJunctionInsert('content_life_situations', lifeSituationIds.map(lid => ({ content_id: contentId, situation_id: lid }))),
    supaJunctionInsert('content_audience_segments', audienceSegmentIds.map(aid => ({ content_id: contentId, segment_id: aid }))),
    supaJunctionInsert('content_pathways', pathwayRows),
    supaJunctionInsert('content_service_categories', serviceCatIds.map(scId => ({ content_id: contentId, service_cat_id: scId }))),
    supaJunctionInsert('content_skills', skillIds.map(skId => ({ content_id: contentId, skill_id: skId }))),
    supaJunctionInsert('content_neighborhoods', neighborhoods.map(n => ({ content_id: contentId, neighborhood: n }))),
    supaJunctionInsert('content_zip_codes', zipCodes.map(z => ({ content_id: contentId, zip_code: z }))),
  ])
}
