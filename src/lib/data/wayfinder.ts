import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
/**
 * Newsfeed for a specific pathway, optionally filtered by engagement level (center).
 * Returns news items (articles, videos, research, reports, courses) — not community resources.
 */
export async function getPathwayContent(themeId: string, center?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
    .not('content_type', 'in', '("article","report","announcement","event")')
    .order('published_at', { ascending: false })

  if (center) {
    query = query.eq('center', center)
  }

  const { data } = await query.limit(50)
  return data ?? []
}

/** Count newsfeed items per pathway (THEME_01..THEME_07) for homepage pills. */

/**
 * Get the full mesh path: situation → focus_areas → orgs → neighborhoods.
 * Returns organizations that address the given life situation and serve the given neighborhood.
 */
export async function getMeshPath(situationId: string, neighborhoodId: string) {
  const supabase = await createClient()

  // Get focus areas for the situation
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situationId)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)
  if (focusIds.length === 0) return []

  // Get orgs that address these focus areas
  const { data: orgFocusJunctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusIds)
  const focusOrgIds = new Set((orgFocusJunctions ?? []).map(j => j.org_id))

  // Get orgs in the neighborhood
  const { data: orgHoodJunctions } = await supabase
    .from('organization_neighborhoods')
    .select('org_id')
    .eq('neighborhood_id', neighborhoodId)
  const hoodOrgIds = new Set((orgHoodJunctions ?? []).map(j => j.org_id))

  // Intersection: orgs that both address the situation AND serve the neighborhood
  const matchingOrgIds = Array.from(focusOrgIds).filter(id => hoodOrgIds.has(id))
  if (matchingOrgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .in('org_id', matchingOrgIds)
    .limit(50)
  return data ?? []
}

/** Get ZIP codes for a neighborhood from the junction table. */

/**
 * Fetch all entity types connected to a pathway via focus areas.
 * Returns content, officials, policies, and services that share focus areas
 * belonging to the given theme. This powers the braided feed.
 *
 * @param themeId - Pathway ID (THEME_01..THEME_07)
 * @param zipCode - Optional ZIP for geographic filtering of services
 */
export async function getPathwayBraidedFeed(themeId: string, zipCode?: string) {
  const supabase = await createClient()

  // Get focus areas for this pathway
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name')
    .eq('theme_id', themeId)
  const focusIds = (focusAreas ?? []).map(f => f.focus_id)

  if (focusIds.length === 0) {
    return { content: [], officials: [], policies: [], services: [], focusAreas: [] }
  }

  // Parallel fetch: all entity types connected to these focus areas
  const [contentJunctions, officialJunctions, policyJunctions, serviceJunctions] = await Promise.all([
    supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds),
    supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds),
    supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds),
    supabase.from('service_focus_areas').select('service_id').in('focus_id', focusIds),
  ])

  const contentIds = Array.from(new Set((contentJunctions.data ?? []).map(j => j.content_id)))
  const officialIds = Array.from(new Set((officialJunctions.data ?? []).map(j => j.official_id)))
  const policyIds = Array.from(new Set((policyJunctions.data ?? []).map(j => j.policy_id)))
  const serviceIds = Array.from(new Set((serviceJunctions.data ?? []).map(j => j.service_id)))

  // Fetch actual entities in parallel
  const [content, officials, policies, services] = await Promise.all([
    contentIds.length > 0
      ? supabase
          .from('content_published')
          .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_domain, published_at, image_url')
          .eq('is_active', true)
          .in('id', contentIds.slice(0, 50))
          .order('published_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    officialIds.length > 0
      ? supabase
          .from('elected_officials')
          .select('official_id, official_name, title, party, level, jurisdiction, description_5th_grade')
          .in('official_id', officialIds.slice(0, 50))
          .limit(10)
      : Promise.resolve({ data: [] }),
    policyIds.length > 0
      ? supabase
          .from('policies')
          .select('policy_id, policy_name, summary_5th_grade, policy_type, level, status, bill_number')
          .in('policy_id', policyIds.slice(0, 50))
          .limit(10)
      : Promise.resolve({ data: [] }),
    serviceIds.length > 0
      ? supabase
          .from('services_211')
          .select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website')
          .eq('is_active', 'Yes')
          .in('service_id', serviceIds.slice(0, 100))
          .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  // If zipCode provided, filter services to that zip
  let filteredServices = services.data ?? []
  if (zipCode) {
    filteredServices = filteredServices.filter(s => s.zip_code === zipCode)
  }

  return {
    content: content.data ?? [],
    officials: officials.data ?? [],
    policies: policies.data ?? [],
    services: filteredServices,
    focusAreas: focusAreas ?? [],
  }
}

/**
 * Get pathway bridge connections: count of shared focus areas between pathways.
 * Used to render connection lines between pathway circles.
 */
export async function getPathwayBridges(): Promise<Array<[string, string, number]>> {
  const supabase = await createClient()
  const [{ data: focusAreas }, { data: contentPathways }] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, theme_id'),
    supabase.from('content_pathways').select('content_id, theme_id'),
  ])

  if (!focusAreas || !contentPathways) return []

  // Build focus_id → theme_id map
  const focusToTheme: Record<string, string> = {}
  focusAreas.forEach(fa => { if (fa.theme_id) focusToTheme[fa.focus_id] = fa.theme_id })

  // Count shared content between theme pairs
  const contentThemes: Record<string, Set<string>> = {}
  contentPathways.forEach(cp => {
    if (!contentThemes[cp.content_id]) contentThemes[cp.content_id] = new Set()
    contentThemes[cp.content_id].add(cp.theme_id)
  })

  const pairCounts: Record<string, number> = {}
  Object.values(contentThemes).forEach(themes => {
    const themeArr = Array.from(themes)
    for (let i = 0; i < themeArr.length; i++) {
      for (let j = i + 1; j < themeArr.length; j++) {
        const key = [themeArr[i], themeArr[j]].sort().join('|')
        pairCounts[key] = (pairCounts[key] || 0) + 1
      }
    }
  })

  return Object.entries(pairCounts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const [a, b] = key.split('|')
      return [a, b, count] as [string, string, number]
    })
    .sort((a, b) => b[2] - a[2])
}

/**
 * Get bridge connections for a single pathway.
 * Filters the global bridge data and maps to theme names/colors/slugs.
 */
export async function getBridgesForPathway(themeId: string): Promise<Array<{ targetThemeId: string; targetName: string; targetColor: string; targetSlug: string; sharedCount: number }>> {
  const { THEMES } = await import('@/lib/constants')
  const allBridges = await getPathwayBridges()
  const relevant = allBridges.filter(function (b) { return b[0] === themeId || b[1] === themeId })
  return relevant
    .map(function (b) {
      const otherId = b[0] === themeId ? b[1] : b[0]
      const otherTheme = THEMES[otherId as keyof typeof THEMES]
      if (!otherTheme) return null
      return {
        targetThemeId: otherId,
        targetName: otherTheme.name,
        targetColor: otherTheme.color,
        targetSlug: otherTheme.slug,
        sharedCount: b[2],
      }
    })
    .filter(function (b): b is NonNullable<typeof b> { return b !== null })
    .sort(function (a, b) { return b.sharedCount - a.sharedCount })
}

/**
 * Get the full entity profile with mesh connections for the wayfinder panel.
 * Used by EntityMesh component for simpler 5-type entity profiles.
 */
export async function getEntityMeshProfile(entityType: string, entityId: string) {
  const supabase = await createClient()

  const emptyResult = { focusAreas: [] as Array<{ focus_id: string; focus_area_name: string; theme_id: string | null }>, relatedContent: [] as Array<{ id: string; title_6th_grade: string | null; center: string | null }>, relatedOfficials: [] as Array<{ official_id: string; official_name: string; title: string | null; level: string | null }>, relatedPolicies: [] as Array<{ policy_id: string; policy_name: string; status: string | null }>, relatedServices: [] as Array<{ service_id: string; service_name: string; org_id: string | null }> }

  const focusIds = await getFocusIds(supabase, entityType, entityId)
  if (focusIds.length === 0) return emptyResult

  // Get focus area names
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  // Find related entities through shared focus areas (excluding self)
  const [contentJ, officialJ, policyJ, serviceJ] = await Promise.all([
    entityType !== 'content'
      ? supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'official'
      ? supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'policy'
      ? supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'service'
      ? supabase.from('service_focus_areas').select('service_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
  ])

  const relContentIds = rankByOverlap(contentJ.data ?? [], 'content_id', entityId, 5)
  const relOfficialIds = rankByOverlap(officialJ.data ?? [], 'official_id', entityId, 5)
  const relPolicyIds = rankByOverlap(policyJ.data ?? [], 'policy_id', entityId, 5)
  const relServiceIds = rankByOverlap(serviceJ.data ?? [], 'service_id', entityId, 5)

  const [relContent, relOfficials, relPolicies, relServices] = await Promise.all([
    relContentIds.length > 0
      ? supabase.from('content_published').select('id, title_6th_grade, center').eq('is_active', true).in('id', relContentIds)
      : Promise.resolve({ data: [] }),
    relOfficialIds.length > 0
      ? supabase.from('elected_officials').select('official_id, official_name, title, level').in('official_id', relOfficialIds)
      : Promise.resolve({ data: [] }),
    relPolicyIds.length > 0
      ? supabase.from('policies').select('policy_id, policy_name, status').in('policy_id', relPolicyIds)
      : Promise.resolve({ data: [] }),
    relServiceIds.length > 0
      ? supabase.from('services_211').select('service_id, service_name, org_id').eq('is_active', 'Yes').in('service_id', relServiceIds)
      : Promise.resolve({ data: [] }),
  ])

  return {
    focusAreas: focusAreas ?? [],
    relatedContent: relContent.data ?? [],
    relatedOfficials: relOfficials.data ?? [],
    relatedPolicies: relPolicies.data ?? [],
    relatedServices: relServices.data ?? [],
  }
}

// ── Config-driven focus area resolution ──────────────────────────────────────

type FocusConfig = { table: string; idCol: string; mode: 'junction' | 'inline' }

const FOCUS_MAP: Record<string, FocusConfig> = {
  content:            { table: 'content_focus_areas',           idCol: 'content_id',           mode: 'junction' },
  official:           { table: 'official_focus_areas',          idCol: 'official_id',          mode: 'junction' },
  policy:             { table: 'policy_focus_areas',            idCol: 'policy_id',            mode: 'junction' },
  service:            { table: 'service_focus_areas',           idCol: 'service_id',           mode: 'junction' },
  organization:       { table: 'organization_focus_areas',      idCol: 'org_id',               mode: 'junction' },
  foundation:         { table: 'foundation_focus_areas',        idCol: 'foundation_id',        mode: 'junction' },
  candidate:          { table: 'candidate_focus_areas',         idCol: 'candidate_id',         mode: 'junction' },
  municipal_service:  { table: 'municipal_service_focus_areas', idCol: 'municipal_service_id', mode: 'junction' },
  life_situation:     { table: 'life_situation_focus_areas',    idCol: 'situation_id',         mode: 'junction' },
  opportunity:        { table: 'opportunity_focus_areas',       idCol: 'opportunity_id',       mode: 'junction' },
  guide:              { table: 'guides',              idCol: 'guide_id',        mode: 'inline' },
  kb_document:        { table: 'kb_documents',        idCol: 'id',              mode: 'inline' },
  learning_path:      { table: 'learning_paths',      idCol: 'path_id',         mode: 'inline' },
  campaign:           { table: 'campaigns',           idCol: 'campaign_id',     mode: 'inline' },
  benefit:            { table: 'benefit_programs',    idCol: 'benefit_id',      mode: 'inline' },
  agency:             { table: 'agencies',            idCol: 'agency_id',       mode: 'inline' },
  event:              { table: 'events',              idCol: 'event_id',        mode: 'inline' },
  ballot_item:        { table: 'ballot_items',        idCol: 'item_id',         mode: 'inline' },
  neighborhood:       { table: 'neighborhoods',       idCol: 'neighborhood_id', mode: 'inline' },
  super_neighborhood: { table: 'super_neighborhoods', idCol: 'sn_id',           mode: 'inline' },
  story:              { table: 'success_stories',     idCol: 'story_id',        mode: 'inline' },
  collection:         { table: 'featured_collections', idCol: 'collection_id',  mode: 'inline' },
}

/** Resolve focus area IDs for any entity type via config-driven lookup. */
async function getFocusIds(supabase: any, entityType: string, entityId: string): Promise<string[]> {
  // Elections aggregate focus areas from their candidates
  if (entityType === 'election') {
    const { data: cands } = await supabase.from('candidates').select('candidate_id').eq('election_id', entityId)
    if (!cands?.length) return []
    const { data: cfa } = await supabase.from('candidate_focus_areas').select('focus_id').in('candidate_id', cands.map((c: any) => c.candidate_id))
    return Array.from(new Set((cfa ?? []).map((j: any) => j.focus_id)))
  }

  const config = FOCUS_MAP[entityType]
  if (!config) return []

  if (config.mode === 'junction') {
    const { data } = await supabase.from(config.table).select('focus_id').eq(config.idCol, entityId)
    return (data ?? []).map((j: any) => j.focus_id)
  }

  // Inline mode: focus_area_ids stored as array column on the entity row
  let query = supabase.from(config.table).select('focus_area_ids')
  if (entityType === 'story' || entityType === 'collection') {
    query = query.or(`${config.idCol}.eq.${entityId},id.eq.${entityId}`)
  } else {
    query = query.eq(config.idCol, entityId)
  }
  const { data } = await query.single()
  const raw = data?.focus_area_ids
  return Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
}

/** Rank entity IDs by focus area overlap count — more shared focus areas = more relevant. */
function rankByOverlap(junctions: any[] | null, idField: string, excludeId: string, limit: number): string[] {
  const counts: Record<string, number> = {}
  for (const j of junctions ?? []) {
    const id = String(j[idField])
    if (id !== excludeId) counts[id] = (counts[id] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}

// ── Taxonomy resolution ──────────────────────────────────────────────────────

const SDG_MAP: Record<string, { table: string; idCol: string }> = {
  content:      { table: 'content_sdgs',      idCol: 'content_id' },
  official:     { table: 'official_sdgs',     idCol: 'official_id' },
  service:      { table: 'service_sdgs',      idCol: 'service_id' },
  organization: { table: 'organization_sdgs', idCol: 'org_id' },
  ballot_item:  { table: 'ballot_item_sdgs',  idCol: 'item_id' },
}

/** Resolve taxonomy metadata for an entity. Content has the richest taxonomy; others have SDGs + extras. */
async function resolveTaxonomy(
  supabase: any,
  entityType: string,
  entityId: string,
): Promise<import('@/lib/types/exchange').WayfinderData['taxonomy']> {
  const empty = { sdgs: [] as any[], sdohDomain: null, actionTypes: [] as any[], govLevel: null, timeCommitment: null, ntee_codes: [] as string[], airs_codes: [] as string[] }

  // Content has the richest taxonomy — SDGs, SDOH, action types, gov levels, time commitment, NTEE/AIRS
  if (entityType === 'content') {
    const [sdgJ, contentRow, actionTypeJ, govLevelJ] = await Promise.all([
      supabase.from('content_sdgs').select('sdg_id').eq('content_id', entityId),
      supabase.from('content_published').select('sdoh_domain, time_commitment_id, gov_level_id').eq('id', entityId).single(),
      (supabase as any).from('content_action_types').select('action_type_id').eq('content_id', entityId),
      (supabase as any).from('content_government_levels').select('gov_level_id').eq('content_id', entityId),
    ])

    const sdgIds = (sdgJ.data ?? []).map((j: any) => j.sdg_id)
    const atIds = (actionTypeJ.data ?? []).map((j: any) => j.action_type_id)
    const glIds = (govLevelJ.data ?? []).map((j: any) => j.gov_level_id)
    const pub = contentRow.data as any

    const [sdgRows, sdohRow, atRows, glRow, tcRow, reviewRow] = await Promise.all([
      sdgIds.length > 0 ? supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name, sdg_color').in('sdg_id', sdgIds) : Promise.resolve({ data: [] }),
      pub?.sdoh_domain ? supabase.from('sdoh_domains').select('sdoh_code, sdoh_name, sdoh_description').eq('sdoh_code', pub.sdoh_domain).single() : Promise.resolve({ data: null }),
      atIds.length > 0 ? supabase.from('action_types').select('action_type_id, action_type_name, category').in('action_type_id', atIds) : Promise.resolve({ data: [] }),
      glIds.length > 0 ? supabase.from('government_levels').select('gov_level_id, gov_level_name').in('gov_level_id', glIds).limit(1) : Promise.resolve({ data: [] }),
      pub?.time_commitment_id ? supabase.from('time_commitments').select('time_id, time_name').eq('time_id', pub.time_commitment_id).single() : Promise.resolve({ data: null }),
      supabase.from('content_review_queue').select('ai_classification').eq('inbox_id', entityId).single(),
    ])

    let ntee_codes: string[] = []
    let airs_codes: string[] = []
    if (reviewRow.data?.ai_classification) {
      const cls = typeof reviewRow.data.ai_classification === 'string' ? JSON.parse(reviewRow.data.ai_classification) : reviewRow.data.ai_classification
      ntee_codes = cls.ntee_codes || []
      airs_codes = cls.airs_codes || []
    }

    return {
      sdgs: (sdgRows.data ?? []) as any[],
      sdohDomain: sdohRow.data as any,
      actionTypes: (atRows.data ?? []) as any[],
      govLevel: (glRow.data as any)?.[0] || null,
      timeCommitment: tcRow.data as any,
      ntee_codes,
      airs_codes,
    }
  }

  // For types with SDG junction tables
  const sdgConfig = SDG_MAP[entityType]
  if (!sdgConfig) return empty

  const { data: sdgJ } = await supabase.from(sdgConfig.table).select('sdg_id').eq(sdgConfig.idCol, entityId)
  const sdgIds = (sdgJ ?? []).map((j: any) => j.sdg_id)
  const sdgs = sdgIds.length > 0
    ? ((await supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name, sdg_color').in('sdg_id', sdgIds)).data ?? []) as any[]
    : []

  // Official: also has gov level
  if (entityType === 'official') {
    const { data: row } = await supabase.from('elected_officials').select('gov_level_id').eq('official_id', entityId).single()
    let govLevel = null
    if ((row as any)?.gov_level_id) {
      const { data } = await supabase.from('government_levels').select('gov_level_id, gov_level_name').eq('gov_level_id', (row as any).gov_level_id).single()
      govLevel = data
    }
    return { ...empty, sdgs, govLevel }
  }

  // Organization: also has NTEE code
  if (entityType === 'organization') {
    const { data: row } = await supabase.from('organizations').select('ntee_code').eq('org_id', entityId).single()
    return { ...empty, sdgs, ntee_codes: (row as any)?.ntee_code ? [(row as any).ntee_code] : [] }
  }

  // Ballot item: jurisdiction → gov level
  if (entityType === 'ballot_item') {
    const { data: row } = await (supabase as any).from('ballot_items').select('jurisdiction').eq('item_id', entityId).single()
    let govLevel = null
    if (row?.jurisdiction) {
      const { data: gl } = await supabase.from('government_levels').select('gov_level_id, gov_level_name').ilike('gov_level_name', `%${row.jurisdiction}%`).limit(1)
      if (gl?.length) govLevel = gl[0]
    }
    return { ...empty, sdgs, govLevel }
  }

  return { ...empty, sdgs }
}

// ── Universal Wayfinder context ──────────────────────────────────────────────

/**
 * Surfaces ALL related entities through shared focus areas.
 * Config-driven Hop 1 + relevance-ranked Hop 2 + parallel Hop 3.
 */
export async function getWayfinderContext(
  entityType: string,
  entityId: string,
  userRole?: string,
): Promise<import('@/lib/types/exchange').WayfinderData> {
  const { getLibraryNuggets } = await import('@/lib/data/library')
  const supabase = await createClient()

  const empty: import('@/lib/types/exchange').WayfinderData = {
    focusAreas: [], themes: [], content: [], libraryNuggets: [],
    opportunities: [], services: [], officials: [], policies: [],
    foundations: [], organizations: [],
  }

  // ── Hop 1: Config-driven focus area resolution ──
  const focusIds = await getFocusIds(supabase, entityType, entityId)
  if (focusIds.length === 0) return empty

  // Get focus area details + derive themes
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  const faList = focusAreas ?? []
  const themes = Array.from(new Set(faList.map(fa => fa.theme_id).filter(Boolean))) as string[]
  const faNames = faList.map(fa => fa.focus_area_name)

  // ── Hop 2: Fan out through focus areas ──
  const [contentJ, officialJ, policyJ, serviceJ, orgJ, oppJ, foundationJ] = await Promise.all([
    entityType !== 'content'
      ? supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds),
    supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds),
    (supabase as any).from('service_focus_areas').select('service_id').in('focus_id', focusIds),
    supabase.from('organization_focus_areas').select('org_id').in('focus_id', focusIds),
    supabase.from('opportunity_focus_areas').select('opportunity_id').in('focus_id', focusIds),
    faNames.length > 0
      ? (supabase as any).from('foundation_focus_areas').select('foundation_id').in('focus_area', faNames)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Rank by relevance — entities sharing more focus areas rank higher
  const relContentIds = rankByOverlap(contentJ.data, 'content_id', entityId, 6)
  const relOfficialIds = rankByOverlap(officialJ.data, 'official_id', entityId, 4)
  const relPolicyIds = rankByOverlap(policyJ.data, 'policy_id', entityId, 4)
  const relServiceIds = rankByOverlap(serviceJ.data, 'service_id', entityId, 6)
  const relOrgIds = rankByOverlap(orgJ.data, 'org_id', entityId, 4)
  const relOppIds = rankByOverlap(oppJ.data, 'opportunity_id', entityId, 4)
  const relFoundationIds = Array.from<string>(new Set((foundationJ.data ?? []).map((j: any) => String(j.foundation_id)))).slice(0, 3)

  // ── Hop 3: Fetch enriched details + library nuggets + taxonomy in parallel ──
  const [relContent, relOfficials, relPolicies, relServices, relOrgs, relOpps, nuggets, relFoundations, taxonomy] = await Promise.all([
    relContentIds.length > 0
      ? supabase.from('content_published')
          .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, inbox_id, content_type')
          .eq('is_active', true).in('id', relContentIds)
      : Promise.resolve({ data: [] }),
    relOfficialIds.length > 0
      ? supabase.from('elected_officials')
          .select('official_id, official_name, title, level, party, photo_url')
          .in('official_id', relOfficialIds)
      : Promise.resolve({ data: [] }),
    relPolicyIds.length > 0
      ? supabase.from('policies')
          .select('policy_id, policy_name, title_6th_grade, bill_number, status, level')
          .in('policy_id', relPolicyIds)
      : Promise.resolve({ data: [] }),
    relServiceIds.length > 0
      ? supabase.from('services_211')
          .select('service_id, service_name, description_5th_grade, phone, address, city, zip_code, org_id')
          .eq('is_active', 'Yes').in('service_id', relServiceIds)
      : Promise.resolve({ data: [] }),
    relOrgIds.length > 0
      ? supabase.from('organizations')
          .select('org_id, org_name, description_5th_grade, logo_url, website, phone, donate_url, volunteer_url, newsletter_url, org_type, city, state')
          .not('org_type', 'eq', 'Foundation/Grantmaker')
          .in('org_id', relOrgIds)
      : Promise.resolve({ data: [] }),
    relOppIds.length > 0
      ? supabase.from('opportunities')
          .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, time_commitment, is_virtual, registration_url, org_id')
          .eq('is_active', 'Yes').in('opportunity_id', relOppIds)
      : Promise.resolve({ data: [] }),
    getLibraryNuggets(themes, focusIds, 2),
    relFoundationIds.length > 0
      ? (supabase as any).from('foundations').select('id, name, mission, website_url').in('id', relFoundationIds)
      : Promise.resolve({ data: [] }),
    resolveTaxonomy(supabase, entityType, entityId),
  ])

  return {
    focusAreas: faList,
    themes,
    content: (relContent.data ?? []) as any[],
    libraryNuggets: nuggets as any,
    opportunities: (relOpps.data ?? []) as any[],
    services: (relServices.data ?? []) as any[],
    officials: (relOfficials.data ?? []) as any[],
    policies: (relPolicies.data ?? []) as any[],
    foundations: ((relFoundations.data ?? []) as any[]).map((f: any) => ({
      foundation_id: f.id, name: f.name, description: f.mission || null, website: f.website_url || null,
    })),
    organizations: ((relOrgs.data ?? []) as any[]).sort((a: any, b: any) => {
      // Local orgs (TX) first, then orgs with any location, then no-location orgs last
      const aLocal = a.state === 'TX' ? 2 : (a.city || a.state) ? 1 : 0
      const bLocal = b.state === 'TX' ? 2 : (b.city || b.state) ? 1 : 0
      return bLocal - aLocal
    }),
    taxonomy,
  }
}

/**
 * Get topics (focus area names) for a pathway, used in sidebar topic pills.
 */
