/**
 * @fileoverview Core entity completeness scoring logic.
 *
 * Extracted from the API route so it can be called directly from server actions
 * (avoiding self-fetch issues on Vercel) as well as from the API route for
 * external/cron access.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Supabase REST helper ──────────────────────────────────────────────

async function supaRest(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  }
  if (method === 'POST') headers['Prefer'] = extraHeaders?.['Prefer'] || 'return=representation'
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

// ── Field weight configs per entity type ──────────────────────────────

interface FieldDef {
  fields: string[]       // OR-group: at least one filled counts
  category: 'CRITICAL' | 'IMPORTANT' | 'NICE'
  weight: number
  label: string          // human-readable name for missing-fields report
  checkType?: 'json' | 'array' | 'string'
}

export const ENTITY_CONFIGS: Record<string, {
  table: string
  idCol: string
  nameCol: string
  selectCols: string
  fields: FieldDef[]
}> = {
  organization: {
    table: 'organizations',
    idCol: 'org_id',
    nameCol: 'org_name',
    selectCols: 'org_id,org_name,description_5th_grade,logo_url,phone,email,website,address,mission_statement,social_media,focus_area_ids,hero_image_url,hours_of_operation,annual_budget,year_founded,tags,service_area,app_store_url,google_play_url',
    fields: [
      { fields: ['org_name'], category: 'CRITICAL', weight: 3, label: 'org_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['logo_url'], category: 'CRITICAL', weight: 3, label: 'logo_url' },
      { fields: ['phone', 'email'], category: 'CRITICAL', weight: 3, label: 'phone/email' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['mission_statement'], category: 'IMPORTANT', weight: 2, label: 'mission_statement' },
      { fields: ['social_media'], category: 'IMPORTANT', weight: 2, label: 'social_media', checkType: 'json' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['hero_image_url'], category: 'NICE', weight: 1, label: 'hero_image_url' },
      { fields: ['hours_of_operation'], category: 'NICE', weight: 1, label: 'hours_of_operation' },
      { fields: ['annual_budget'], category: 'NICE', weight: 1, label: 'annual_budget' },
      { fields: ['year_founded'], category: 'NICE', weight: 1, label: 'year_founded' },
      { fields: ['tags'], category: 'NICE', weight: 1, label: 'tags', checkType: 'array' },
      { fields: ['service_area'], category: 'NICE', weight: 1, label: 'service_area' },
      { fields: ['app_store_url', 'google_play_url'], category: 'NICE', weight: 1, label: 'app_store_url/google_play_url' },
    ],
  },
  official: {
    table: 'elected_officials',
    idCol: 'official_id',
    nameCol: 'official_name',
    selectCols: 'official_id,official_name,description_5th_grade,photo_url,email,title,party,website,level,jurisdiction,office_phone,focus_area_ids,term_end,counties_served,bio',
    fields: [
      { fields: ['official_name'], category: 'CRITICAL', weight: 3, label: 'official_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['photo_url'], category: 'CRITICAL', weight: 3, label: 'photo_url' },
      { fields: ['email'], category: 'CRITICAL', weight: 3, label: 'email' },
      { fields: ['title'], category: 'IMPORTANT', weight: 2, label: 'title' },
      { fields: ['party'], category: 'IMPORTANT', weight: 2, label: 'party' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['level'], category: 'IMPORTANT', weight: 2, label: 'level' },
      { fields: ['jurisdiction'], category: 'IMPORTANT', weight: 2, label: 'jurisdiction' },
      { fields: ['office_phone'], category: 'IMPORTANT', weight: 2, label: 'office_phone' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['term_end'], category: 'NICE', weight: 1, label: 'term_end' },
      { fields: ['counties_served'], category: 'NICE', weight: 1, label: 'counties_served' },
      { fields: ['bio'], category: 'NICE', weight: 1, label: 'bio' },
    ],
  },
  content: {
    table: 'content_published',
    idCol: 'id',
    nameCol: 'title_6th_grade',
    selectCols: 'id,title_6th_grade,summary_6th_grade,image_url,source_url,pathway_primary,center,focus_area_ids,org_id,engagement_level,audience_segments,sdg_ids,sdoh_domain,life_situations,geographic_scope,resource_type',
    fields: [
      { fields: ['title_6th_grade'], category: 'CRITICAL', weight: 3, label: 'title_6th_grade' },
      { fields: ['summary_6th_grade'], category: 'CRITICAL', weight: 3, label: 'summary_6th_grade' },
      { fields: ['image_url'], category: 'CRITICAL', weight: 3, label: 'image_url' },
      { fields: ['source_url'], category: 'CRITICAL', weight: 3, label: 'source_url' },
      { fields: ['pathway_primary'], category: 'IMPORTANT', weight: 2, label: 'pathway_primary' },
      { fields: ['center'], category: 'IMPORTANT', weight: 2, label: 'center' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['org_id'], category: 'IMPORTANT', weight: 2, label: 'org_id' },
      { fields: ['engagement_level'], category: 'IMPORTANT', weight: 2, label: 'engagement_level' },
      { fields: ['audience_segments'], category: 'IMPORTANT', weight: 2, label: 'audience_segments' },
      { fields: ['sdg_ids'], category: 'NICE', weight: 1, label: 'sdg_ids' },
      { fields: ['sdoh_domain'], category: 'NICE', weight: 1, label: 'sdoh_domain' },
      { fields: ['life_situations'], category: 'NICE', weight: 1, label: 'life_situations' },
      { fields: ['geographic_scope'], category: 'NICE', weight: 1, label: 'geographic_scope' },
      { fields: ['resource_type'], category: 'NICE', weight: 1, label: 'resource_type' },
    ],
  },
  service: {
    table: 'services_211',
    idCol: 'service_id',
    nameCol: 'service_name',
    selectCols: 'service_id,service_name,description_5th_grade,phone,org_id,website,address,service_cat_id,focus_area_ids,eligibility,hours,fees,languages,airs_code',
    fields: [
      { fields: ['service_name'], category: 'CRITICAL', weight: 3, label: 'service_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['phone'], category: 'CRITICAL', weight: 3, label: 'phone' },
      { fields: ['org_id'], category: 'CRITICAL', weight: 3, label: 'org_id' },
      { fields: ['website'], category: 'IMPORTANT', weight: 2, label: 'website' },
      { fields: ['address'], category: 'IMPORTANT', weight: 2, label: 'address' },
      { fields: ['service_cat_id'], category: 'IMPORTANT', weight: 2, label: 'service_cat_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['eligibility'], category: 'IMPORTANT', weight: 2, label: 'eligibility' },
      { fields: ['hours'], category: 'NICE', weight: 1, label: 'hours' },
      { fields: ['fees'], category: 'NICE', weight: 1, label: 'fees' },
      { fields: ['languages'], category: 'NICE', weight: 1, label: 'languages' },
      { fields: ['airs_code'], category: 'NICE', weight: 1, label: 'airs_code' },
    ],
  },
  resource: {
    table: 'resources',
    idCol: 'resource_id',
    nameCol: 'resource_name',
    selectCols: 'resource_id,resource_name,description_5th_grade,source_url,image_url,resource_type_id,focus_area_ids,source_org,content_format,path_ids,estimated_minutes,reading_level,language_ids',
    fields: [
      { fields: ['resource_name'], category: 'CRITICAL', weight: 3, label: 'resource_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['source_url'], category: 'CRITICAL', weight: 3, label: 'source_url' },
      { fields: ['image_url'], category: 'CRITICAL', weight: 3, label: 'image_url' },
      { fields: ['resource_type_id'], category: 'IMPORTANT', weight: 2, label: 'resource_type_id' },
      { fields: ['focus_area_ids'], category: 'IMPORTANT', weight: 2, label: 'focus_area_ids' },
      { fields: ['source_org'], category: 'IMPORTANT', weight: 2, label: 'source_org' },
      { fields: ['content_format'], category: 'IMPORTANT', weight: 2, label: 'content_format' },
      { fields: ['path_ids'], category: 'NICE', weight: 1, label: 'path_ids' },
      { fields: ['estimated_minutes'], category: 'NICE', weight: 1, label: 'estimated_minutes' },
      { fields: ['reading_level'], category: 'NICE', weight: 1, label: 'reading_level' },
      { fields: ['language_ids'], category: 'NICE', weight: 1, label: 'language_ids' },
    ],
  },
  life_situation: {
    table: 'life_situations',
    idCol: 'situation_id',
    nameCol: 'situation_name',
    selectCols: 'situation_id,situation_name,description_5th_grade,theme_id,focus_area_ids,icon_name,color,urgency_level,situation_slug,service_cat_ids,resource_ids,agency_ids,benefit_ids,display_order',
    fields: [
      { fields: ['situation_name'], category: 'CRITICAL', weight: 3, label: 'situation_name' },
      { fields: ['description_5th_grade'], category: 'CRITICAL', weight: 3, label: 'description_5th_grade' },
      { fields: ['theme_id'], category: 'CRITICAL', weight: 3, label: 'theme_id' },
      { fields: ['focus_area_ids'], category: 'CRITICAL', weight: 3, label: 'focus_area_ids' },
      { fields: ['icon_name'], category: 'IMPORTANT', weight: 2, label: 'icon_name' },
      { fields: ['color'], category: 'IMPORTANT', weight: 2, label: 'color' },
      { fields: ['urgency_level'], category: 'IMPORTANT', weight: 2, label: 'urgency_level' },
      { fields: ['situation_slug'], category: 'IMPORTANT', weight: 2, label: 'situation_slug' },
      { fields: ['service_cat_ids'], category: 'IMPORTANT', weight: 2, label: 'service_cat_ids' },
      { fields: ['resource_ids'], category: 'NICE', weight: 1, label: 'resource_ids' },
      { fields: ['agency_ids'], category: 'NICE', weight: 1, label: 'agency_ids' },
      { fields: ['benefit_ids'], category: 'NICE', weight: 1, label: 'benefit_ids' },
      { fields: ['display_order'], category: 'NICE', weight: 1, label: 'display_order' },
    ],
  },
}

// ── Field checking ────────────────────────────────────────────────────

function isFieldFilled(value: unknown, checkType?: string): boolean {
  if (value === null || value === undefined) return false

  if (checkType === 'json') {
    let parsed: unknown = value
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed) } catch { return false }
    }
    if (typeof parsed !== 'object' || parsed === null) return false
    return Object.keys(parsed).length > 0
  }

  if (checkType === 'array') {
    if (typeof value === 'string') {
      if (value.startsWith('[')) {
        try {
          const arr = JSON.parse(value)
          return Array.isArray(arr) && arr.length > 0
        } catch {
          return value.trim().length > 0
        }
      }
      return value.trim().length > 0
    }
    if (Array.isArray(value)) return value.length > 0
    return false
  }

  // Default: string check
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return true
  if (Array.isArray(value)) return value.length > 0
  return true
}

function scoreEntity(row: Record<string, unknown>, config: typeof ENTITY_CONFIGS[string]) {
  const fieldScores: Record<string, { weight: number; filled: boolean; category: string }> = {}
  const missingFields: string[] = []
  const criticalMissing: string[] = []
  let totalWeight = 0
  let filledWeight = 0
  let totalFields = 0
  let filledFields = 0

  for (const fieldDef of config.fields) {
    const filled = fieldDef.fields.some(f => isFieldFilled(row[f], fieldDef.checkType))
    fieldScores[fieldDef.label] = { weight: fieldDef.weight, filled, category: fieldDef.category }
    totalWeight += fieldDef.weight
    totalFields++
    if (filled) {
      filledWeight += fieldDef.weight
      filledFields++
    } else {
      missingFields.push(fieldDef.label)
      if (fieldDef.category === 'CRITICAL') {
        criticalMissing.push(fieldDef.label)
      }
    }
  }

  const score = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0
  let tier: string
  if (score >= 95) tier = 'platinum'
  else if (score >= 80) tier = 'gold'
  else if (score >= 50) tier = 'silver'
  else tier = 'bronze'

  return {
    completeness_score: score,
    completeness_tier: tier,
    total_fields: totalFields,
    filled_fields: filledFields,
    missing_fields: missingFields,
    critical_missing: criticalMissing,
    field_scores: fieldScores,
  }
}

// ── Score all entities of a given type ─────────────────────────────────

async function scoreEntityType(entityType: string): Promise<{ scored: number; errors: number }> {
  const config = ENTITY_CONFIGS[entityType]
  if (!config) throw new Error(`Unknown entity type: ${entityType}`)

  // Fetch all rows (paginated in batches of 1000)
  let allRows: Record<string, unknown>[] = []
  let offset = 0
  const batchSize = 1000

  while (true) {
    const rows = await supaRest('GET',
      `${config.table}?select=${config.selectCols}&limit=${batchSize}&offset=${offset}&order=${config.idCol}.asc`
    )
    if (!rows || rows.length === 0) break
    allRows = allRows.concat(rows)
    if (rows.length < batchSize) break
    offset += batchSize
  }

  if (allRows.length === 0) return { scored: 0, errors: 0 }

  // Score each entity
  const upsertBatch: Record<string, unknown>[] = []
  let errors = 0

  for (const row of allRows) {
    try {
      const entityId = String(row[config.idCol])
      const entityName = String(row[config.nameCol] || '')
      const scores = scoreEntity(row as Record<string, unknown>, config)

      upsertBatch.push({
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        ...scores,
        scored_at: new Date().toISOString(),
      })
    } catch {
      errors++
    }
  }

  // Batch upsert via PostgREST (chunks of 500)
  const chunkSize = 500
  for (let i = 0; i < upsertBatch.length; i += chunkSize) {
    const chunk = upsertBatch.slice(i, i + chunkSize)
    await supaRest('POST', 'entity_completeness', chunk, {
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    })
  }

  return { scored: upsertBatch.length, errors }
}

// ── Public API ────────────────────────────────────────────────────────

export interface ScoreResult {
  totalScored: number
  totalErrors: number
  results: Record<string, { scored: number; errors: number }>
}

/**
 * Score entities for completeness. Can score a single type or all types.
 * Called directly by the server action and by the API route.
 */
export async function runEntityScoring(entityType?: string): Promise<ScoreResult> {
  const typesToScore = entityType
    ? [entityType]
    : Object.keys(ENTITY_CONFIGS)

  const results: Record<string, { scored: number; errors: number }> = {}
  let totalScored = 0
  let totalErrors = 0

  for (const type of typesToScore) {
    if (!ENTITY_CONFIGS[type]) {
      results[type] = { scored: 0, errors: 1 }
      totalErrors++
      continue
    }
    try {
      const result = await scoreEntityType(type)
      results[type] = result
      totalScored += result.scored
      totalErrors += result.errors
    } catch (err) {
      results[type] = { scored: 0, errors: 1 }
      totalErrors++
      console.error(`Error scoring ${type}:`, err)
    }
  }

  return { totalScored, totalErrors, results }
}
