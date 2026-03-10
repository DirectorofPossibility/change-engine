/**
 * @fileoverview Unified classification module for The Change Engine.
 *
 * Extracts and centralizes the taxonomy fetching, prompt building,
 * Claude classification, validation/enrichment, and junction table
 * population logic that was previously duplicated across:
 *   - /api/ingest/route.ts
 *   - /api/enrich-entity/route.ts
 *   - supabase/functions/classify-content-v2/index.ts
 *   - supabase/functions/backfill-v2/index.ts
 *
 * All entity types are classified across 16 taxonomy dimensions.
 */

// ── Types ────────────────────────────────────────────────────────────

export type EntityType =
  | 'content'
  | 'organization'
  | 'service'
  | 'elected_official'
  | 'policy'
  | 'opportunity'
  | 'agency'
  | 'benefit_program'
  | 'campaign'
  | 'ballot_item'

export interface Taxonomy {
  themes: any[]
  focusAreas: any[]
  sdgs: any[]
  sdoh: any[]
  ntee: any[]
  airs: any[]
  segments: any[]
  situations: any[]
  resourceTypes: any[]
  serviceCats: any[]
  skills: any[]
  timeCommitments: any[]
  actionTypes: any[]
  govLevels: any[]
}

export interface ClassificationResult {
  theme_primary: string
  theme_secondary: string[]
  focus_area_ids: string[]
  sdg_ids: string[]
  sdoh_code: string | null
  ntee_codes: string[]
  airs_codes: string[]
  center: string
  resource_type_id: string | null
  audience_segment_ids: string[]
  life_situation_ids: string[]
  service_cat_ids: string[]
  skill_ids: string[]
  time_commitment_id: string | null
  action_type_ids: string[]
  gov_level_id: string | null
  content_type: string | null
  keywords: string[]
  geographic_scope: string
  confidence: number
  reasoning: string
  title_6th_grade?: string
  summary_6th_grade?: string
  impact_statement?: string
  [key: string]: any
}

export interface EnrichedClassification extends ClassificationResult {
  _enriched_focus_areas: Array<{
    id: string; name: string; theme: string
    sdg: string | null; ntee: string | null; airs: string | null; sdoh: string | null; bridging: boolean
  }>
  _keywords: string[]
  _version: string
}

// ── Supabase REST helper (works in both Node.js and Deno) ────────────

async function supaFetch(
  method: string,
  url: string,
  key: string,
  path: string,
  body?: unknown,
) {
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'resolution=ignore-duplicates,return=minimal'
  if (method === 'DELETE') headers['Prefer'] = 'return=minimal'

  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (method === 'DELETE') return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Taxonomy fetching ────────────────────────────────────────────────

export async function fetchFullTaxonomy(supabaseUrl: string, supabaseKey: string): Promise<Taxonomy> {
  const get = (table: string, select = '*') =>
    supaFetch('GET', supabaseUrl, supabaseKey, `${table}?select=${select}&limit=500`)

  const [themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels] = await Promise.all([
    get('themes', 'theme_id,theme_name'),
    get('focus_areas', 'focus_id,focus_area_name,theme_id,sdg_id,ntee_code,airs_code,sdoh_code,is_bridging'),
    get('sdgs', 'sdg_id,sdg_number,sdg_name'),
    get('sdoh_domains', 'sdoh_code,sdoh_name'),
    get('ntee_codes', 'ntee_code,ntee_name'),
    get('airs_codes', 'airs_code,airs_name'),
    get('audience_segments', 'segment_id,segment_name,description'),
    get('life_situations', 'situation_id,situation_name,theme_id,urgency_level'),
    get('resource_types', 'resource_type_id,resource_type_name,center'),
    get('service_categories', 'service_cat_id,service_cat_name'),
    get('skills', 'skill_id,skill_name,skill_category'),
    get('time_commitments', 'time_id,time_name,min_minutes,max_minutes').catch(() => []),
    get('action_types', 'action_type_id,action_type_name,category').catch(() => []),
    get('government_levels', 'gov_level_id,gov_level_name').catch(() => []),
  ])

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills, timeCommitments, actionTypes, govLevels }
}

// ── Dimension matrix per entity type ─────────────────────────────────

interface DimensionSpec {
  themes: string        // e.g. "1+0-2" = 1 primary + 0-2 secondary
  focusAreas: string    // e.g. "1-4"
  sdgs: string          // "inherit" or "inherit+"
  sdoh: boolean
  nteeAirs: string      // "yes", "primary", "opt"
  audienceSegments: string
  lifeSituations: string
  serviceCats: string
  skills: string
  timeCommitment: boolean
  actionTypes: string
  govLevels: string
  contentType: boolean
  keywords: string
  geographicScope: boolean
}

const DIMENSION_MATRIX: Record<EntityType, DimensionSpec> = {
  content: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit+', sdoh: true,
    nteeAirs: 'yes', audienceSegments: '1-3', lifeSituations: '0-3',
    serviceCats: '0-2', skills: '0-3', timeCommitment: true,
    actionTypes: '0-2', govLevels: '0-1', contentType: true,
    keywords: '3-8', geographicScope: true,
  },
  organization: {
    themes: '1+0-2', focusAreas: '1-5', sdgs: 'inherit+', sdoh: true,
    nteeAirs: 'primary', audienceSegments: '1-3', lifeSituations: '0-3',
    serviceCats: '0-3', skills: '0-2', timeCommitment: false,
    actionTypes: '0-1', govLevels: '-', contentType: false,
    keywords: '3-8', geographicScope: true,
  },
  service: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit+', sdoh: true,
    nteeAirs: 'primary', audienceSegments: '1-4', lifeSituations: '1-4',
    serviceCats: '1-3', skills: '0-2', timeCommitment: false,
    actionTypes: '0-1', govLevels: '0-1', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  elected_official: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit+', sdoh: false,
    nteeAirs: 'opt', audienceSegments: '1-2', lifeSituations: '0-2',
    serviceCats: '0-1', skills: '0-1', timeCommitment: false,
    actionTypes: '0-1', govLevels: 'req', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  policy: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit+', sdoh: true,
    nteeAirs: 'opt', audienceSegments: '1-3', lifeSituations: '0-3',
    serviceCats: '0-2', skills: '-', timeCommitment: false,
    actionTypes: '0-1', govLevels: 'req', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  opportunity: {
    themes: '1+0-2', focusAreas: '1-3', sdgs: 'inherit', sdoh: false,
    nteeAirs: 'opt', audienceSegments: '1-3', lifeSituations: '0-2',
    serviceCats: '0-2', skills: '1-3', timeCommitment: true,
    actionTypes: '1-2', govLevels: '0-1', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  agency: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit+', sdoh: true,
    nteeAirs: 'yes', audienceSegments: '1-2', lifeSituations: '0-2',
    serviceCats: '1-3', skills: '-', timeCommitment: false,
    actionTypes: '0-1', govLevels: 'req', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  benefit_program: {
    themes: '1+0-2', focusAreas: '1-4', sdgs: 'inherit', sdoh: true,
    nteeAirs: 'yes', audienceSegments: '1-4', lifeSituations: '1-4',
    serviceCats: '0-2', skills: '-', timeCommitment: false,
    actionTypes: '0-1', govLevels: '0-1', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  campaign: {
    themes: '1+0-2', focusAreas: '1-3', sdgs: 'inherit', sdoh: false,
    nteeAirs: 'opt', audienceSegments: '1-3', lifeSituations: '0-2',
    serviceCats: '0-1', skills: '0-2', timeCommitment: true,
    actionTypes: '1-2', govLevels: '0-1', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
  ballot_item: {
    themes: '1+0-2', focusAreas: '1-3', sdgs: 'inherit', sdoh: false,
    nteeAirs: 'opt', audienceSegments: '1-2', lifeSituations: '0-2',
    serviceCats: '0-1', skills: '-', timeCommitment: false,
    actionTypes: '0-1', govLevels: '0-1', contentType: false,
    keywords: '3-6', geographicScope: true,
  },
}

// ── Prompt building ──────────────────────────────────────────────────

function buildTaxonomyLists(tax: Taxonomy) {
  const themeList = tax.themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')

  const faByTheme: Record<string, string[]> = {}
  for (const fa of tax.focusAreas) {
    const key = fa.theme_id || 'NONE'
    if (!faByTheme[key]) faByTheme[key] = []
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`)
  }
  let faText = ''
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = tax.themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`
  }

  return {
    themeList,
    faText,
    segList: tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n'),
    sitList: tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n'),
    rtList: tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n'),
    scList: tax.serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n'),
    skillList: tax.skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n'),
    timeList: (tax.timeCommitments || []).map((t: any) => `${t.time_id}: ${t.time_name} (${t.min_minutes}-${t.max_minutes} min)`).join('\n'),
    actionList: (tax.actionTypes || []).map((a: any) => `${a.action_type_id}: ${a.action_type_name} [${a.category}]`).join('\n'),
    govList: (tax.govLevels || []).map((g: any) => `${g.gov_level_id}: ${g.gov_level_name}`).join('\n'),
  }
}

export function buildPromptForEntity(tax: Taxonomy, entityType: EntityType): string {
  const lists = buildTaxonomyLists(tax)
  const spec = DIMENSION_MATRIX[entityType]

  const entityLabel = entityType.replace(/_/g, ' ')

  let prompt = `You are the Change Engine v4 classifier for Houston, Texas civic data.
You are classifying a ${entityLabel}. Map it onto the FULL knowledge graph taxonomy.
Return ONLY valid IDs from the taxonomy below. Respond with a single JSON object, no markdown, no backticks.
Use asset-based language — focus on strengths, opportunities, and what's available.

THEMES / PATHWAYS (pick ${spec.themes}):
${lists.themeList}

FOCUS AREAS (pick ${spec.focusAreas} by ID):
${lists.faText}

AUDIENCE SEGMENTS (pick ${spec.audienceSegments}):
${lists.segList}

LIFE SITUATIONS (pick ${spec.lifeSituations}):
${lists.sitList}

RESOURCE TYPES (pick 1):
${lists.rtList}

SERVICE CATEGORIES (pick ${spec.serviceCats}):
${lists.scList}
`

  if (spec.skills !== '-') {
    prompt += `\nSKILLS (pick ${spec.skills}):\n${lists.skillList}\n`
  }

  if (spec.timeCommitment && lists.timeList) {
    prompt += `\nTIME COMMITMENTS (pick 0-1):\n${lists.timeList}\n`
  }

  if (spec.actionTypes !== '-' && lists.actionList) {
    prompt += `\nACTION TYPES (pick ${spec.actionTypes}):\n${lists.actionList}\n`
  }

  if (spec.govLevels !== '-' && lists.govList) {
    const govLabel = spec.govLevels === 'req' ? 'pick 1 — REQUIRED' : `pick ${spec.govLevels}`
    prompt += `\nGOVERNMENT LEVELS (${govLabel}):\n${lists.govList}\n`
  }

  if (spec.contentType) {
    prompt += `\nCONTENT TYPE (pick 1 — REQUIRED): article | event | report | video | opportunity | guide | course | announcement | campaign | tool\n`
  }

  prompt += `\nCENTERS (pick 1): Learning | Action | Resource | Accountability`
  prompt += `\nGEOGRAPHIC SCOPE: Houston | Harris County | Texas | National | Global`

  return prompt
}

// ── JSON parsing ─────────────────────────────────────────────────────

export function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return JSON.parse(text.substring(start, end + 1))
}

// ── Claude API call ──────────────────────────────────────────────────

export async function classifyEntity(
  system: string,
  user: string,
  anthropicKey: string,
  maxTokens = 2000,
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      if (data.error) {
        if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
        throw new Error(data.error.message || 'Claude API error')
      }
      return data.content?.[0]?.text || ''
    } catch (e) {
      if (attempt < 2) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue }
      throw e
    }
  }
  throw new Error('Max retries exceeded')
}

// ── Validate + Enrich ────────────────────────────────────────────────

export function validateAndEnrich(
  classification: ClassificationResult,
  tax: Taxonomy,
  entityType: EntityType,
): EnrichedClassification {
  const validFocusIds = new Set(tax.focusAreas.map((f: any) => f.focus_id))

  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      const fa = tax.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    }
  }

  const sdgArr = Array.from(inheritedSdgs) as string[]
  const nteeArr = Array.from(inheritedNtee) as string[]
  const airsArr = Array.from(inheritedAirs) as string[]
  const allSdgIds = sdgArr.concat(classification.sdg_ids || []).filter((v, i, a) => a.indexOf(v) === i)
  const allNteeCodes = nteeArr.concat(classification.ntee_codes || []).filter((v, i, a) => a.indexOf(v) === i)
  const allAirsCodes = airsArr.concat(classification.airs_codes || []).filter((v, i, a) => a.indexOf(v) === i)
  const sdohCode = classification.sdoh_code || inheritedSdoh || null

  return {
    ...classification,
    focus_area_ids: enrichedFocusAreas.map((fa: any) => fa.focus_id),
    sdg_ids: allSdgIds,
    ntee_codes: allNteeCodes,
    airs_codes: allAirsCodes,
    sdoh_code: sdohCode,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _keywords: classification.keywords || [],
    _version: 'v4-unified',
  }
}

// ── Junction table population ────────────────────────────────────────

/**
 * Maps entity types to their junction table configurations.
 * Each entry: [junctionTable, entityIdColumn]
 */
const JUNCTION_CONFIG: Record<EntityType, {
  idCol: string
  focus: string
  sdgs: string
  audiences: string
  situations: string
  serviceCats: string
  pathways: string
  actionTypes?: string
}> = {
  content: {
    idCol: 'content_id',
    focus: 'content_focus_areas',
    sdgs: 'content_sdgs',
    audiences: 'content_audience_segments',
    situations: 'content_life_situations',
    serviceCats: 'content_service_categories',
    pathways: 'content_pathways',
  },
  organization: {
    idCol: 'org_id',
    focus: 'organization_focus_areas',
    sdgs: 'organization_sdgs',
    audiences: 'organization_audience_segments',
    situations: 'organization_life_situations',
    serviceCats: 'organization_service_categories',
    pathways: 'organization_pathways',
  },
  service: {
    idCol: 'service_id',
    focus: 'service_focus_areas',
    sdgs: 'service_sdgs',
    audiences: 'service_audience_segments',
    situations: 'service_life_situations',
    serviceCats: '', // services don't have their own service_cat junction (they ARE service_cats)
    pathways: 'service_pathways',
  },
  elected_official: {
    idCol: 'official_id',
    focus: 'official_focus_areas',
    sdgs: 'official_sdgs',
    audiences: 'official_audience_segments',
    situations: '',
    serviceCats: '',
    pathways: 'official_pathways',
  },
  policy: {
    idCol: 'policy_id',
    focus: 'policy_focus_areas',
    sdgs: 'policy_sdgs',
    audiences: 'policy_audience_segments',
    situations: 'policy_life_situations',
    serviceCats: '',
    pathways: 'policy_pathways',
  },
  opportunity: {
    idCol: 'opportunity_id',
    focus: 'opportunity_focus_areas',
    sdgs: 'opportunity_sdgs',
    audiences: 'opportunity_audience_segments',
    situations: 'opportunity_life_situations',
    serviceCats: '',
    pathways: 'opportunity_pathways',
    actionTypes: 'opportunity_action_types',
  },
  agency: {
    idCol: 'agency_id',
    focus: 'agency_focus_areas',
    sdgs: 'agency_sdgs',
    audiences: 'agency_audience_segments',
    situations: '',
    serviceCats: 'agency_service_categories',
    pathways: 'agency_pathways',
  },
  benefit_program: {
    idCol: 'benefit_id',
    focus: 'benefit_focus_areas',
    sdgs: 'benefit_sdgs',
    audiences: 'benefit_audience_segments',
    situations: 'benefit_life_situations',
    serviceCats: 'benefit_service_categories',
    pathways: 'benefit_pathways',
  },
  campaign: {
    idCol: 'campaign_id',
    focus: 'campaign_focus_areas',
    sdgs: 'campaign_sdgs',
    audiences: 'campaign_audience_segments',
    situations: '',
    serviceCats: '',
    pathways: 'campaign_pathways',
  },
  ballot_item: {
    idCol: 'item_id',
    focus: 'ballot_item_focus_areas',
    sdgs: 'ballot_item_sdgs',
    audiences: 'ballot_item_audience_segments',
    situations: '',
    serviceCats: '',
    pathways: 'ballot_item_pathways',
  },
}

export async function populateAllJunctions(
  entityType: EntityType,
  entityId: string,
  classification: EnrichedClassification,
  supabaseUrl: string,
  supabaseKey: string,
): Promise<void> {
  const config = JUNCTION_CONFIG[entityType]
  if (!config) return

  const idCol = config.idCol
  const insert = (table: string, rows: Record<string, unknown>[]) => {
    if (!table || !rows.length) return Promise.resolve()
    return supaFetch('POST', supabaseUrl, supabaseKey, table, rows)
      .catch(() => {}) // Ignore duplicates
  }

  // Delete existing junctions first (idempotent re-classification)
  const deleteTables = [config.focus, config.sdgs, config.audiences, config.situations, config.serviceCats, config.pathways, config.actionTypes].filter(Boolean)
  await Promise.allSettled(
    deleteTables.map(table =>
      supaFetch('DELETE', supabaseUrl, supabaseKey, `${table}?${idCol}=eq.${entityId}`)
        .catch(() => {})
    )
  )

  // Build rows for each junction
  const focusRows = (classification.focus_area_ids || []).map(fid => ({ [idCol]: entityId, focus_id: fid }))
  const sdgRows = (classification.sdg_ids || []).map(sid => ({ [idCol]: entityId, sdg_id: sid }))
  const audienceRows = (classification.audience_segment_ids || []).map(aid => ({ [idCol]: entityId, segment_id: aid }))
  const situationRows = (classification.life_situation_ids || []).map(lid => ({ [idCol]: entityId, situation_id: lid }))
  const serviceCatRows = (classification.service_cat_ids || []).map(scid => ({ [idCol]: entityId, service_cat_id: scid }))

  // Pathway rows (primary + secondary)
  const pathwayRows: Record<string, unknown>[] = []
  if (classification.theme_primary) {
    pathwayRows.push({ [idCol]: entityId, theme_id: classification.theme_primary, is_primary: true })
  }
  for (const themeId of (classification.theme_secondary || [])) {
    pathwayRows.push({ [idCol]: entityId, theme_id: themeId, is_primary: false })
  }

  // Action type rows (opportunities, campaigns)
  const actionTypeRows = (classification.action_type_ids || []).map(atid => ({ [idCol]: entityId, action_type_id: atid }))

  // Insert all in parallel
  await Promise.allSettled([
    insert(config.focus, focusRows),
    insert(config.sdgs, sdgRows),
    insert(config.audiences, audienceRows),
    insert(config.situations, situationRows),
    insert(config.serviceCats, serviceCatRows),
    insert(config.pathways, pathwayRows),
    config.actionTypes ? insert(config.actionTypes, actionTypeRows) : Promise.resolve(),
  ])
}

// ── Build user prompt for entity classification ──────────────────────

export function buildUserPrompt(entityType: EntityType, data: {
  name: string
  description?: string
  context?: string
  fullText?: string
  url?: string
  source?: string
}): string {
  const spec = DIMENSION_MATRIX[entityType]
  const entityLabel = entityType.replace(/_/g, ' ')

  let prompt = `Entity type: ${entityLabel}\nName: ${data.name}\n`
  if (data.description) prompt += `Description: ${data.description}\n`
  if (data.context) prompt += `${data.context}\n`
  if (data.url) prompt += `URL: ${data.url}\n`
  if (data.source) prompt += `Source: ${data.source}\n`
  if (data.fullText) prompt += `\nFULL TEXT (${data.fullText.length} chars):\n${data.fullText.substring(0, 6000)}\n`

  prompt += '\nIMPORTANT: Write title_6th_grade and summary_6th_grade so a 6th-grader can understand. Use asset-based language — focus on strengths, opportunities, and what is available. Keep summary_6th_grade to 2-3 clear sentences. Avoid jargon, acronyms, and bureaucratic language.\n'
  if (entityType === 'policy') {
    prompt += 'For impact_statement, write 2-3 sentences explaining how this policy connects to daily life. Focus on opportunities, protections, or resources it provides. Use "you" and "your family".\n'
  }

  prompt += `\nClassify this ${entityLabel}. Return JSON:\n{\n`
  prompt += `  "theme_primary": "THEME_XX",\n  "theme_secondary": [],\n`
  prompt += `  "focus_area_ids": ["FA_XXX"],\n`
  prompt += `  "sdg_ids": ["SDG_XX"],\n  "sdoh_code": "SDOH_XX or null",\n`
  prompt += `  "ntee_codes": ["X"],\n  "airs_codes": ["X"],\n`
  prompt += `  "center": "Learning|Action|Resource|Accountability",\n`
  prompt += `  "resource_type_id": "RTYPE_XX",\n`
  prompt += `  "audience_segment_ids": ["SEG_XX"],\n`
  prompt += `  "life_situation_ids": ["SIT_XXX"],\n`
  prompt += `  "service_cat_ids": ["SCAT_XX"],\n`

  if (spec.skills !== '-') prompt += `  "skill_ids": ["SKILL_XX"],\n`
  if (spec.timeCommitment) prompt += `  "time_commitment_id": "TIME_XX or null",\n`
  if (spec.actionTypes !== '-') prompt += `  "action_type_ids": ["ATYPE_XX"],\n`
  if (spec.govLevels !== '-') prompt += `  "gov_level_id": "GOV_XX or null",\n`
  if (spec.contentType) prompt += `  "content_type": "article|event|report|video|opportunity|guide|course|announcement|campaign|tool",\n`

  prompt += `  "keywords": ["keyword1","keyword2"],\n`
  prompt += `  "geographic_scope": "Houston|Harris County|Texas|National|Global",\n`
  prompt += `  "title_6th_grade": "...",\n  "summary_6th_grade": "...",\n`

  if (entityType === 'policy') prompt += `  "impact_statement": "...",\n`

  prompt += `  "confidence": 0.0,\n  "reasoning": "..."\n}`

  return prompt
}

// ── Table configs for entity enrichment ──────────────────────────────

export const TABLE_CONFIGS: Record<string, {
  tableName: string
  idCol: string
  nameCol: string
  descCol: string
  contextCols: string[]
  entityType: EntityType
  hasClassificationV2?: boolean
}> = {
  elected_officials: {
    tableName: 'elected_officials',
    idCol: 'official_id',
    nameCol: 'official_name',
    descCol: 'description_5th_grade',
    contextCols: ['title', 'party', 'level', 'jurisdiction', 'district_type', 'website', 'counties_served'],
    entityType: 'elected_official',
  },
  policies: {
    tableName: 'policies',
    idCol: 'policy_id',
    nameCol: 'policy_name',
    descCol: 'summary_5th_grade',
    contextCols: ['bill_number', 'policy_type', 'level', 'status', 'source_url', 'official_ids'],
    entityType: 'policy',
  },
  organizations: {
    tableName: 'organizations',
    idCol: 'org_id',
    nameCol: 'org_name',
    descCol: 'description_5th_grade',
    contextCols: ['website', 'data_source', 'mission_statement'],
    entityType: 'organization',
  },
  services_211: {
    tableName: 'services_211',
    idCol: 'service_id',
    nameCol: 'service_name',
    descCol: 'description_5th_grade',
    contextCols: ['org_id', 'phone', 'address', 'city', 'state', 'zip_code', 'website'],
    entityType: 'service',
  },
  opportunities: {
    tableName: 'opportunities',
    idCol: 'opportunity_id',
    nameCol: 'opportunity_name',
    descCol: 'description_5th_grade',
    contextCols: ['org_id', 'address', 'city', 'state', 'zip_code', 'registration_url'],
    entityType: 'opportunity',
  },
  agencies: {
    tableName: 'agencies',
    idCol: 'agency_id',
    nameCol: 'agency_name',
    descCol: 'description_5th_grade',
    contextCols: ['website', 'jurisdiction'],
    entityType: 'agency',
    hasClassificationV2: false,
  },
  benefit_programs: {
    tableName: 'benefit_programs',
    idCol: 'benefit_id',
    nameCol: 'benefit_name',
    descCol: 'description_5th_grade',
    contextCols: ['eligibility_summary', 'application_url', 'agency_id'],
    entityType: 'benefit_program',
    hasClassificationV2: false,
  },
  campaigns: {
    tableName: 'campaigns',
    idCol: 'campaign_id',
    nameCol: 'campaign_name',
    descCol: 'description_5th_grade',
    contextCols: ['org_id', 'start_date', 'end_date'],
    entityType: 'campaign',
    hasClassificationV2: false,
  },
  ballot_items: {
    tableName: 'ballot_items',
    idCol: 'item_id',
    nameCol: 'item_name',
    descCol: 'description_5th_grade',
    contextCols: ['election_id', 'item_type', 'jurisdiction'],
    entityType: 'ballot_item',
  },
}
