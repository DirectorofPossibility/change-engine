import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

/**
 * POST /api/enrich-entity
 *
 * Enriches any knowledge graph entity through the full classification matrix.
 * Works with: elected_officials, policies, organizations
 *
 * Body:
 *   { "table": "elected_officials", "limit": 10, "ids": ["OFFICIAL_001"] }
 *   { "table": "policies", "limit": 10, "force": true }
 *
 * Reads the entity's name + description, classifies through the full taxonomy,
 * and writes enriched classification_v2 with inherited SDGs, NTEE, AIRS, SDOH.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// ── Supabase REST helper ──────────────────────────────────────────────

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

// ── Table configs ─────────────────────────────────────────────────────

const TABLE_CONFIGS: Record<string, {
  idCol: string
  nameCol: string
  descCol: string
  contextCols: string[] // extra columns for richer classification
  entityType: string
}> = {
  elected_officials: {
    idCol: 'official_id',
    nameCol: 'official_name',
    descCol: 'description_5th_grade',
    contextCols: ['title', 'party', 'level', 'jurisdiction', 'district_type', 'website', 'counties_served'],
    entityType: 'elected_official',
  },
  policies: {
    idCol: 'policy_id',
    nameCol: 'policy_name',
    descCol: 'summary_5th_grade',
    contextCols: ['bill_number', 'policy_type', 'level', 'status', 'source_url', 'official_ids'],
    entityType: 'policy',
  },
  organizations: {
    idCol: 'org_id',
    nameCol: 'org_name',
    descCol: 'description_5th_grade',
    contextCols: ['website', 'data_source'],
    entityType: 'organization',
  },
}

// ── Taxonomy ──────────────────────────────────────────────────────────

async function fetchTaxonomy() {
  const get = (table: string, select = '*') =>
    supaRest('GET', `${table}?select=${select}&limit=500`)

  const [themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills] = await Promise.all([
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
  ])

  return { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills }
}

function buildTaxonomyPrompt(tax: Awaited<ReturnType<typeof fetchTaxonomy>>): string {
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

  const segList = tax.segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const sitList = tax.situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rtList = tax.resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')

  return `THEMES (pick 1 primary + 0-2 secondary):\n${themeList}\n\nFOCUS AREAS (pick 1-5 by ID):\n${faText}\n\nAUDIENCE SEGMENTS (pick 1-3):\n${segList}\n\nLIFE SITUATIONS (pick 0-3):\n${sitList}\n\nRESOURCE TYPES (pick 1):\n${rtList}\n\nCENTERS (pick 1): Learning | Action | Resource | Accountability`
}

// ── Claude ─────────────────────────────────────────────────────────────

function parseClaudeJson(raw: string): any {
  let text = raw.trim()
  if (text.startsWith('```json')) text = text.slice(7)
  else if (text.startsWith('```')) text = text.slice(3)
  if (text.endsWith('```')) text = text.slice(0, -3)
  text = text.trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(text.substring(start, end + 1))
}

async function callClaude(system: string, user: string, maxTokens = 2000): Promise<string> {
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
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: user }],
        }),
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
  throw new Error('Max retries')
}

// ── Enrich a single entity ────────────────────────────────────────────

async function enrichEntity(
  row: any,
  config: typeof TABLE_CONFIGS[string],
  taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>,
  taxonomyPrompt: string,
) {
  const validFocusIds = new Set(taxonomy.focusAreas.map((f: any) => f.focus_id))

  const entityId = row[config.idCol]
  const name = row[config.nameCol] || ''
  const desc = row[config.descCol] || ''

  // Build context from extra columns
  const context = config.contextCols
    .map(col => row[col] ? `${col}: ${row[col]}` : '')
    .filter(Boolean)
    .join('\n')

  if (!name) return { success: false, error: 'No name', id: entityId }

  const systemPrompt = `You are the Change Engine v2 classifier for Houston, Texas civic data.
You are classifying a ${config.entityType}. Map it onto the knowledge graph taxonomy.
Return ONLY valid taxonomy IDs. Respond with a single JSON object, no markdown.

${taxonomyPrompt}`

  const userPrompt = `Entity type: ${config.entityType}
Name: ${name}
Description: ${desc}
${context}

Classify this ${config.entityType} into the knowledge graph. Return JSON:
{
  "theme_primary": "THEME_XX",
  "theme_secondary": [],
  "focus_area_ids": ["FA_XXX"],
  "sdg_ids": ["SDG_XX"],
  "sdoh_code": "SDOH_XX or null",
  "ntee_codes": ["X"],
  "airs_codes": ["X"],
  "center": "Learning|Action|Resource|Accountability",
  "resource_type_id": "RTYPE_XX",
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["SIT_XXX"],
  "keywords": ["keyword1", "keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

  const rawResponse = await callClaude(systemPrompt, userPrompt)
  const classification = parseClaudeJson(rawResponse)

  // Validate + enrich focus areas with inherited codes
  const enrichedFocusAreas: any[] = []
  const inheritedSdgs = new Set<string>()
  const inheritedNtee = new Set<string>()
  const inheritedAirs = new Set<string>()
  let inheritedSdoh = ''

  for (const faId of (classification.focus_area_ids || [])) {
    if (validFocusIds.has(faId)) {
      const fa = taxonomy.focusAreas.find((f: any) => f.focus_id === faId)
      if (fa) {
        enrichedFocusAreas.push(fa)
        if (fa.sdg_id) inheritedSdgs.add(fa.sdg_id)
        if (fa.ntee_code) inheritedNtee.add(fa.ntee_code)
        if (fa.airs_code) inheritedAirs.add(fa.airs_code)
        if (fa.sdoh_code && !inheritedSdoh) inheritedSdoh = fa.sdoh_code
      }
    }
  }

  const validFocusAreaIds = enrichedFocusAreas.map((fa: any) => fa.focus_id)
  const allSdgIds = Array.from(new Set([...Array.from(inheritedSdgs), ...(classification.sdg_ids || [])]))
  const sdohCode = classification.sdoh_code || inheritedSdoh

  const enrichedClassification = {
    ...classification,
    sdg_ids: allSdgIds,
    ntee_codes: Array.from(new Set([...Array.from(inheritedNtee), ...(classification.ntee_codes || [])])),
    airs_codes: Array.from(new Set([...Array.from(inheritedAirs), ...(classification.airs_codes || [])])),
    sdoh_code: sdohCode,
    _enriched_focus_areas: enrichedFocusAreas.map((fa: any) => ({
      id: fa.focus_id, name: fa.focus_area_name, theme: fa.theme_id,
      sdg: fa.sdg_id, ntee: fa.ntee_code, airs: fa.airs_code, sdoh: fa.sdoh_code, bridging: fa.is_bridging,
    })),
    _keywords: classification.keywords || [],
    _version: 'v3-entity-enrich',
  }

  // Update the entity
  const updateData: any = {
    classification_v2: enrichedClassification,
    focus_area_ids: validFocusAreaIds.join(','),
  }

  // Map entity type to table name
  const tableMap: Record<string, string> = {
    elected_official: 'elected_officials',
    policy: 'policies',
    organization: 'organizations',
  }
  const tblName = tableMap[config.entityType] || config.entityType + 's'
  await supaRest('PATCH', `${tblName}?${config.idCol}=eq.${entityId}`, updateData)

  return {
    success: true,
    id: entityId,
    name,
    focus_areas: validFocusAreaIds,
    sdgs: allSdgIds,
    center: classification.center,
    theme: classification.theme_primary,
    confidence: classification.confidence,
    keywords: classification.keywords || [],
  }
}

// ── Route handler ────────────────────────────────────────────────────

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

  // Fetch taxonomy once
  const taxonomy = await fetchTaxonomy()
  const taxonomyPrompt = buildTaxonomyPrompt(taxonomy)

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
    // Skip if already enriched (v3) unless force
    if (!force && row.classification_v2?._version === 'v3-entity-enrich') {
      skipped++
      continue
    }

    try {
      const result = await enrichEntity(row, config, taxonomy, taxonomyPrompt)
      results.push(result)
      if (result.success) succeeded++
      else failed++
    } catch (err) {
      results.push({ id: row[config.idCol], success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }

  return NextResponse.json({
    table: tableName,
    processed: succeeded + failed,
    succeeded,
    failed,
    skipped,
    results,
  })
}
