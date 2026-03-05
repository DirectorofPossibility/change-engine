/**
 * @fileoverview Direct entity enrichment logic for the fidelity dashboard.
 *
 * Extracted from the API routes to avoid self-fetch issues on Vercel.
 * Called directly by the server action in edge-functions.ts.
 *
 * Handles two enrichment paths:
 *  1. organization / official → classify via Claude, update row + junctions
 *  2. content → deep enrich via Claude with full text, update published + review queue
 */

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

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

// ── Entity enrichment (organizations, officials, etc.) ────────────────

export interface EnrichResult {
  processed: number
  succeeded: number
  failed: number
  skipped: number
  results: any[]
}

export async function enrichEntityDirect(
  tableName: string,
  entityIds: string[],
  force = true,
): Promise<EnrichResult> {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  const config = TABLE_CONFIGS[tableName]
  if (!config) throw new Error(`Unknown table: ${tableName}`)

  const taxonomy = await fetchFullTaxonomy(SUPABASE_URL, SUPABASE_KEY)
  const systemPrompt = buildPromptForEntity(taxonomy, config.entityType)

  const selectCols = [config.idCol, config.nameCol, config.descCol, 'classification_v2', 'focus_area_ids', ...config.contextCols].join(',')

  let rows: any[]
  if (entityIds.length > 0) {
    const idFilter = entityIds.map(id => `"${id}"`).join(',')
    rows = await supaRest('GET', `${tableName}?${config.idCol}=in.(${idFilter})&select=${selectCols}`)
  } else {
    rows = await supaRest('GET', `${tableName}?select=${selectCols}&limit=10&order=${config.idCol}.asc`)
  }

  if (!rows || rows.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0, results: [] }
  }

  const results: any[] = []
  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const row of rows) {
    const entityId = row[config.idCol]

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

      const updateData: Record<string, unknown> = {
        classification_v2: enriched,
        focus_area_ids: enriched.focus_area_ids.join(','),
      }
      if (enriched.theme_primary) updateData.theme_id = enriched.theme_primary
      if (enriched.center) updateData.engagement_level = enriched.center
      if (enriched.title_6th_grade) updateData.title_6th_grade = enriched.title_6th_grade
      if (enriched.summary_6th_grade) updateData.summary_6th_grade = enriched.summary_6th_grade
      if (config.entityType === 'policy' && enriched.impact_statement) {
        updateData.impact_statement = enriched.impact_statement
      }

      await supaRest('PATCH', `${tableName}?${config.idCol}=eq.${entityId}`, updateData)
      await populateAllJunctions(config.entityType, entityId, enriched, SUPABASE_URL, SUPABASE_KEY)

      results.push({
        success: true,
        id: entityId,
        name,
        focus_areas: enriched.focus_area_ids,
        center: enriched.center,
        theme: enriched.theme_primary,
        confidence: enriched.confidence,
      })
      succeeded++
    } catch (err) {
      results.push({ id: entityId, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit between Claude calls
    await new Promise(r => setTimeout(r, 1000))
  }

  return { processed: succeeded + failed, succeeded, failed, skipped, results }
}

// ── Content enrichment (content_published via inbox) ──────────────────

export async function enrichContentDirect(inboxIds: string[]): Promise<EnrichResult> {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  // Fetch taxonomy
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

  const taxonomy = { themes, focusAreas, sdgs, sdoh, ntee, airs, segments, situations, resourceTypes, serviceCats, skills }
  const validFocusIds = new Set(focusAreas.map((f: any) => f.focus_id))

  // Build taxonomy prompt
  const themeList = themes.map((t: any) => `${t.theme_id}: ${t.theme_name}`).join('\n')
  const faByTheme: Record<string, string[]> = {}
  for (const fa of focusAreas) {
    const key = fa.theme_id || 'NONE'
    if (!faByTheme[key]) faByTheme[key] = []
    faByTheme[key].push(`${fa.focus_id}|${fa.focus_area_name}|sdg:${fa.sdg_id}|ntee:${fa.ntee_code}|airs:${fa.airs_code}|sdoh:${fa.sdoh_code}${fa.is_bridging ? '|BRIDGING' : ''}`)
  }
  let faText = ''
  for (const [themeId, fas] of Object.entries(faByTheme)) {
    const themeName = themes.find((t: any) => t.theme_id === themeId)?.theme_name || themeId
    faText += `\n[${themeName}]\n${fas.join('\n')}\n`
  }
  const segList = segments.map((s: any) => `${s.segment_id}: ${s.segment_name}`).join('\n')
  const sitList = situations.map((s: any) => `${s.situation_id}: "${s.situation_name}" [${s.urgency_level}]`).join('\n')
  const rtList = resourceTypes.map((r: any) => `${r.resource_type_id}: ${r.resource_type_name} (${r.center})`).join('\n')
  const scList = serviceCats.map((s: any) => `${s.service_cat_id}: ${s.service_cat_name}`).join('\n')
  const skillList = skills.map((s: any) => `${s.skill_id}: ${s.skill_name}`).join('\n')
  const taxonomyPrompt = `THEMES (pick 1 primary + 0-2 secondary):\n${themeList}\n\nFOCUS AREAS (pick 1-4 by ID):\n${faText}\n\nAUDIENCE SEGMENTS (pick 1-3):\n${segList}\n\nLIFE SITUATIONS (pick 0-3):\n${sitList}\n\nRESOURCE TYPES (pick 1):\n${rtList}\n\nSERVICE CATEGORIES (pick 0-2):\n${scList}\n\nSKILLS (pick 0-3):\n${skillList}\n\nCENTERS (pick 1): Learning | Action | Resource | Accountability`

  // Fetch inbox items
  const idFilter = inboxIds.map(id => `"${id}"`).join(',')
  const inboxItems = await supaRest('GET', `content_inbox?id=in.(${idFilter})&select=*`)

  if (!inboxItems || inboxItems.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0, results: [] }
  }

  const results: any[] = []
  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const inboxItem of inboxItems) {
    // Get published item
    const pubItems = await supaRest('GET', `content_published?inbox_id=eq.${inboxItem.id}&select=*`)
    if (!pubItems || pubItems.length === 0) {
      results.push({ inbox_id: inboxItem.id, success: false, error: 'Not published' })
      skipped++
      continue
    }
    const publishedItem = pubItems[0]

    // Parse extracted text
    let extracted: any = {}
    try {
      extracted = typeof inboxItem.extracted_text === 'string'
        ? JSON.parse(inboxItem.extracted_text)
        : inboxItem.extracted_text || {}
    } catch {
      extracted = { full_text: inboxItem.extracted_text || '' }
    }

    const fullText = extracted.full_text || inboxItem.description || ''
    const sourceTags = extracted.tags || []
    const externalLinks = extracted.external_links || []
    const pageTitle = inboxItem.title || ''

    if (!pageTitle && fullText.length < 50) {
      results.push({ inbox_id: inboxItem.id, success: false, error: 'Insufficient content' })
      failed++
      continue
    }

    try {
      const systemPrompt = `You are the Change Engine v2 knowledge graph enricher for Houston, Texas civic content.
You have the FULL article text (not just a summary). Your job is to:
1. Write a clear, engaging title at 6th-grade reading level (max 80 chars)
2. Write a comprehensive summary at 6th-grade reading level (150-300 words)
3. Classify against the EXACT taxonomy below using valid IDs only
4. Extract keywords that describe the content

${taxonomyPrompt}`

      const userPrompt = `Original Title: ${pageTitle}
URL: ${inboxItem.source_url}
Source Tags: ${sourceTags.join(', ')}

FULL ARTICLE TEXT (${fullText.length} chars):
${fullText.substring(0, 6000)}

EXTERNAL LINKS:
${externalLinks.map((l: any) => `[${l.anchor_text}] → ${l.url}`).join('\n')}

Return a single JSON object:
{
  "title_6th_grade": "Clear engaging title (max 80 chars)",
  "summary_6th_grade": "150-300 word summary at 6th-grade level",
  "theme_primary": "THEME_XX",
  "theme_secondary": [],
  "focus_area_ids": ["FA_XXX"],
  "sdg_ids": ["SDG_XX"],
  "sdoh_code": "SDOH_XX",
  "ntee_codes": ["X"],
  "airs_codes": ["X"],
  "center": "Learning|Action|Resource|Accountability",
  "resource_type_id": "RTYPE_XX",
  "audience_segment_ids": ["SEG_XX"],
  "life_situation_ids": ["SIT_XXX"],
  "service_cat_ids": ["SCAT_XX"],
  "skill_ids": ["SKILL_XX"],
  "keywords": ["keyword1", "keyword2"],
  "geographic_scope": "Houston|National|Texas|Global",
  "confidence": 0.0,
  "reasoning": "..."
}`

      const rawResponse = await classifyEntity(systemPrompt, userPrompt, ANTHROPIC_KEY, 3000)
      const classification = parseClaudeJson(rawResponse)

      // Validate focus areas and inherit taxonomy
      const enrichedFocusAreas: any[] = []
      const inheritedSdgs = new Set<string>()
      const inheritedNtee = new Set<string>()
      const inheritedAirs = new Set<string>()
      let inheritedSdoh = ''

      for (const faId of (classification.focus_area_ids || [])) {
        if (validFocusIds.has(faId)) {
          const fa = focusAreas.find((f: any) => f.focus_id === faId)
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
      const confidence = classification.confidence ?? 0.85

      // Update content_published
      const publishUpdate: any = {
        title_6th_grade: classification.title_6th_grade || publishedItem.title_6th_grade,
        summary_6th_grade: classification.summary_6th_grade || publishedItem.summary_6th_grade,
        pathway_primary: classification.theme_primary || publishedItem.pathway_primary,
        pathway_secondary: classification.theme_secondary || publishedItem.pathway_secondary || [],
        focus_area_ids: validFocusAreaIds.length > 0 ? validFocusAreaIds : publishedItem.focus_area_ids,
        center: classification.center || publishedItem.center,
        sdg_ids: allSdgIds,
        sdoh_domain: sdohCode || publishedItem.sdoh_domain,
        audience_segments: classification.audience_segment_ids || publishedItem.audience_segments || [],
        life_situations: classification.life_situation_ids || publishedItem.life_situations || [],
        resource_type: classification.resource_type_id || publishedItem.resource_type,
        geographic_scope: classification.geographic_scope || publishedItem.geographic_scope,
        confidence,
        classification_reasoning: classification.reasoning || '',
      }

      await supaRest('PATCH', `content_published?inbox_id=eq.${inboxItem.id}`, publishUpdate)

      results.push({
        success: true,
        inbox_id: inboxItem.id,
        title: classification.title_6th_grade,
        focus_areas: validFocusAreaIds,
        center: classification.center,
        confidence,
      })
      succeeded++
    } catch (err) {
      results.push({ inbox_id: inboxItem.id, success: false, error: (err as Error).message })
      failed++
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 1500))
  }

  return { processed: succeeded + failed, succeeded, failed, skipped, results }
}
