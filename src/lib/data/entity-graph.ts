/**
 * Unified entity graph queries — geography-anchored.
 *
 * Every query accepts an optional ZIP code. When provided, entities
 * are filtered to the user's geography:
 *   - Services: by zip_code column
 *   - Organizations: by zip_code column
 *   - Officials: by district IDs resolved from zip_codes table
 *   - Policies: by policy_geography junction (district + zip)
 *   - Content: by content_zip_codes junction (with fallback to all)
 *   - Opportunities: by city match
 *
 * Without a ZIP, returns Houston-wide results (fallback).
 *
 * Used by journey pages, center pages, pathway pages, homepage —
 * anywhere the guide needs the full picture of what exists on a
 * pathway, in a center, for a user.
 */

import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────

export interface PathwayEntities {
  content: any[]
  services: any[]
  organizations: any[]
  policies: any[]
  officials: any[]
  opportunities: any[]
  counts: {
    content: number
    services: number
    organizations: number
    policies: number
    officials: number
    opportunities: number
    total: number
  }
  /** The resolved geography context, if a ZIP was provided */
  geo?: UserGeo | null
}

export interface UserGeo {
  zip: string
  neighborhoodId: string | null
  neighborhoodName: string | null
  superNeighborhoodId: string | null
  superNeighborhoodName: string | null
  councilDistrict: string | null
  congressionalDistrict: string | null
  stateHouseDistrict: string | null
  stateSenateDistrict: string | null
  countyId: string | null
}

// ── Geography Resolution ───────────────────────────────────────────────

/**
 * Resolve a ZIP code into all geographic filter keys.
 * One lookup, used by every entity graph query.
 */
export async function resolveUserGeo(zip: string): Promise<UserGeo | null> {
  const supabase = await createClient()

  // zip_codes table is the master geography engine
  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipData) return null

  // Resolve neighborhood from junction table
  const { data: hoodJunction } = await supabase
    .from('neighborhood_zip_codes')
    .select('neighborhood_id')
    .eq('zip_code', zip)
    .limit(1)

  let neighborhoodId: string | null = null
  let neighborhoodName: string | null = null
  let superNeighborhoodId: string | null = null
  let superNeighborhoodName: string | null = null
  let councilDistrict: string | null = null

  if (hoodJunction && hoodJunction.length > 0) {
    neighborhoodId = hoodJunction[0].neighborhood_id
    const { data: hood } = await supabase
      .from('neighborhoods')
      .select('neighborhood_name, super_neighborhood_id, council_district')
      .eq('neighborhood_id', neighborhoodId)
      .single()
    if (hood) {
      neighborhoodName = hood.neighborhood_name
      superNeighborhoodId = hood.super_neighborhood_id
      councilDistrict = hood.council_district || null
    }
    if (superNeighborhoodId) {
      const { data: sn } = await supabase
        .from('super_neighborhoods')
        .select('sn_name')
        .eq('sn_id', superNeighborhoodId)
        .single()
      if (sn) superNeighborhoodName = sn.sn_name
    }
  }

  return {
    zip,
    neighborhoodId,
    neighborhoodName,
    superNeighborhoodId,
    superNeighborhoodName,
    councilDistrict,
    congressionalDistrict: zipData.congressional_district || null,
    stateHouseDistrict: zipData.state_house_district || null,
    stateSenateDistrict: zipData.state_senate_district || null,
    countyId: zipData.county_id || null,
  }
}

// ── Core Entity Graph Query ────────────────────────────────────────────

/**
 * Fetch all entity types for a set of pathway theme IDs,
 * optionally anchored to a user's geography.
 *
 * When zip is provided:
 *   - Services filtered to user's zip
 *   - Orgs filtered to user's zip
 *   - Officials filtered to user's districts
 *   - Policies filtered via policy_geography junction
 *   - Content filtered via content_zip_codes (with pathway fallback)
 *   - Opportunities filtered by city
 */
export async function getEntitiesByPathways(
  themeIds: string[],
  limits: { content?: number; services?: number; orgs?: number; policies?: number; officials?: number; opportunities?: number } = {},
  zip?: string | null,
): Promise<PathwayEntities> {
  const supabase = await createClient()

  const contentLimit = limits.content ?? 8
  const serviceLimit = limits.services ?? 8
  const orgLimit = limits.orgs ?? 8
  const policyLimit = limits.policies ?? 6
  const officialLimit = limits.officials ?? 12
  const oppLimit = limits.opportunities ?? 6

  // Resolve geography if zip provided
  const geo = zip ? await resolveUserGeo(zip) : null

  // ── Build queries ──

  // CONTENT — pathway filter, geo-prioritized
  const contentQuery = supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, source_domain, pathway_primary, content_type, org_id, slug, video_url, center')
    .eq('is_active', true)
    .in('pathway_primary', themeIds)
    .order('published_at', { ascending: false })
    .limit(contentLimit)

  const contentCountQuery = supabase
    .from('content_published')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .in('pathway_primary', themeIds)

  // SERVICES — pathway + zip filter
  let serviceQuery = supabase
    .from('services_211')
    .select('service_id, service_name, description_5th_grade, phone, city, org_id, website, zip_code')
    .eq('is_active', 'Yes')
  let serviceCountQuery = supabase
    .from('services_211')
    .select('service_id', { count: 'exact', head: true })
    .eq('is_active', 'Yes')

  if (geo) {
    // ZIP-first: services in user's zip, still on pathway
    serviceQuery = serviceQuery.eq('zip_code', geo.zip)
    serviceCountQuery = serviceCountQuery.eq('zip_code', geo.zip)
  }
  // Always add pathway filter
  serviceQuery = serviceQuery
    .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
    .limit(serviceLimit)
  serviceCountQuery = serviceCountQuery
    .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))

  // ORGANIZATIONS — pathway + zip filter
  let orgQuery = supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, logo_url, city, website, theme_id, zip_code')
    .in('theme_id', themeIds)
    .order('org_name')
  let orgCountQuery = supabase
    .from('organizations')
    .select('org_id', { count: 'exact', head: true })
    .in('theme_id', themeIds)

  if (geo) {
    orgQuery = orgQuery.eq('zip_code', geo.zip)
    orgCountQuery = orgCountQuery.eq('zip_code', geo.zip)
  }
  orgQuery = orgQuery.limit(orgLimit)

  // OFFICIALS — by user's districts (ignores pathway when geo is set)
  let officialQuery: any
  let officialCountQuery: any
  if (geo) {
    const districtFilters = buildOfficialDistrictFilter(geo)
    officialQuery = supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .or(districtFilters)
      .limit(officialLimit)
    officialCountQuery = supabase
      .from('elected_officials')
      .select('official_id', { count: 'exact', head: true })
      .or(districtFilters)
  } else {
    officialQuery = supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(officialLimit)
    officialCountQuery = supabase
      .from('elected_officials')
      .select('official_id', { count: 'exact', head: true })
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
  }

  // POLICIES — by user's districts via policy_geography (ignores pathway when geo is set)
  let policyPromise: PromiseLike<any>
  let policyCountPromise: PromiseLike<any>
  if (geo) {
    policyPromise = getPoliciesByGeo(supabase, geo, policyLimit)
    policyCountPromise = getPoliciesByGeoCount(supabase, geo)
  } else {
    policyPromise = supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, summary_6th_grade, level, status, bill_number, authoring_body, source_url')
      .eq('is_published', true)
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .order('last_action_date', { ascending: false })
      .limit(policyLimit)
    policyCountPromise = supabase
      .from('policies')
      .select('policy_id', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
  }

  // OPPORTUNITIES — pathway + city filter
  let oppQuery = (supabase as any)
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, city, is_virtual, org_id, registration_url')
    .eq('is_active', 'Yes')
    .gte('end_date', new Date().toISOString())
    .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
    .order('start_date', { ascending: true })
    .limit(oppLimit)

  let oppCountQuery = (supabase as any)
    .from('opportunities')
    .select('opportunity_id', { count: 'exact', head: true })
    .eq('is_active', 'Yes')
    .gte('end_date', new Date().toISOString())
    .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))

  // ── Execute all in parallel ──

  const [
    contentResult, contentCountResult,
    serviceResult, serviceCountResult,
    orgResult, orgCountResult,
    policyResult, policyCountResult,
    officialResult, officialCountResult,
    oppResult, oppCountResult,
  ] = await Promise.all([
    contentQuery, contentCountQuery,
    serviceQuery, serviceCountQuery,
    orgQuery, orgCountQuery,
    policyPromise, policyCountPromise,
    officialQuery, officialCountQuery,
    oppQuery, oppCountQuery,
  ])

  // For geo-filtered services/orgs that returned 0 results, fall back to pathway-wide
  let services = serviceResult.data || []
  let serviceCount = serviceCountResult.count ?? 0
  let organizations = orgResult.data || []
  let orgCount = orgCountResult.count ?? 0

  if (geo && services.length === 0) {
    const fallback = await supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, city, org_id, website, zip_code')
      .eq('is_active', 'Yes')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(serviceLimit)
    services = fallback.data || []
    const fallbackCount = await supabase
      .from('services_211')
      .select('service_id', { count: 'exact', head: true })
      .eq('is_active', 'Yes')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
    serviceCount = fallbackCount.count ?? 0
  }

  if (geo && organizations.length === 0) {
    const fallback = await supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, city, website, theme_id, zip_code')
      .in('theme_id', themeIds)
      .order('org_name')
      .limit(orgLimit)
    organizations = fallback.data || []
    const fallbackCount = await supabase
      .from('organizations')
      .select('org_id', { count: 'exact', head: true })
      .in('theme_id', themeIds)
    orgCount = fallbackCount.count ?? 0
  }

  // Extract policy data depending on whether geo was used
  const policies = geo ? (policyResult as any[]) : (policyResult.data || [])
  const policiesCount = geo ? (policyCountResult as number) : (policyCountResult.count ?? 0)

  return {
    content: contentResult.data || [],
    services,
    organizations,
    policies,
    officials: officialResult.data || [],
    opportunities: oppResult.data || [],
    counts: {
      content: contentCountResult.count ?? 0,
      services: serviceCount,
      organizations: orgCount,
      policies: policiesCount,
      officials: officialCountResult.count ?? 0,
      opportunities: oppCountResult.count ?? 0,
      total: (contentCountResult.count ?? 0) + serviceCount +
        orgCount + policiesCount +
        (officialCountResult.count ?? 0) + (oppCountResult.count ?? 0),
    },
    geo,
  }
}

// ── Center-based query ─────────────────────────────────────────────────

/**
 * Fetch entities for a center page, optionally anchored to geography.
 */
export async function getEntitiesByCenter(
  centerName: string,
  limits: { content?: number; services?: number; orgs?: number; policies?: number; officials?: number; opportunities?: number } = {},
  zip?: string | null,
): Promise<PathwayEntities & { contentByType: Record<string, any[]>; topPathways: string[] }> {
  const supabase = await createClient()

  const contentLimit = limits.content ?? 30

  // Step 1: Get content for this center
  const [contentResult, contentCountResult] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, source_domain, pathway_primary, content_type, org_id, slug, video_url, center, inbox_id, published_at')
      .eq('is_active', true)
      .eq('center', centerName)
      .order('published_at', { ascending: false })
      .limit(contentLimit),
    supabase
      .from('content_published')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('center', centerName),
  ])

  const content = contentResult.data || []

  // Group content by type for display
  const contentByType: Record<string, any[]> = {}
  for (const item of content) {
    const ct = item.content_type || 'article'
    if (!contentByType[ct]) contentByType[ct] = []
    contentByType[ct].push(item)
  }

  // Find top pathways in this center's content
  const pathwayCounts: Record<string, number> = {}
  for (const item of content) {
    if (item.pathway_primary) {
      pathwayCounts[item.pathway_primary] = (pathwayCounts[item.pathway_primary] || 0) + 1
    }
  }
  const topPathways = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  if (topPathways.length === 0) {
    return {
      content,
      services: [], organizations: [], policies: [], officials: [], opportunities: [],
      counts: {
        content: contentCountResult.count ?? 0,
        services: 0, organizations: 0, policies: 0, officials: 0, opportunities: 0,
        total: contentCountResult.count ?? 0,
      },
      contentByType,
      topPathways,
    }
  }

  // Step 2: Fetch entities using the pathway query with geography
  const entities = await getEntitiesByPathways(topPathways, limits, zip)

  return {
    content,
    services: entities.services,
    organizations: entities.organizations,
    policies: entities.policies,
    officials: entities.officials,
    opportunities: entities.opportunities,
    counts: {
      content: contentCountResult.count ?? 0,
      services: entities.counts.services,
      organizations: entities.counts.organizations,
      policies: entities.counts.policies,
      officials: entities.counts.officials,
      opportunities: entities.counts.opportunities,
      total: (contentCountResult.count ?? 0) + entities.counts.services +
        entities.counts.organizations + entities.counts.policies +
        entities.counts.officials + entities.counts.opportunities,
    },
    contentByType,
    topPathways,
    geo: entities.geo,
  }
}

// ── Counts ──────────────────────────────────────────────────────────────

/**
 * Get cross-entity counts per center (for centers index page).
 */
export async function getCenterEntityCounts(): Promise<Record<string, { content: number; services: number; orgs: number; total: number }>> {
  const supabase = await createClient()

  const [contentResult, serviceResult, orgResult] = await Promise.all([
    supabase.from('content_published').select('center').eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
  ])

  const contentByCenter: Record<string, number> = {}
  for (const item of (contentResult.data || [])) {
    const c = (item.center as string) || 'Learning'
    contentByCenter[c] = (contentByCenter[c] || 0) + 1
  }

  const serviceCount = serviceResult.count ?? 0
  const orgCount = orgResult.count ?? 0

  return {
    Learning: { content: contentByCenter['Learning'] || 0, services: 0, orgs: 0, total: contentByCenter['Learning'] || 0 },
    Resource: { content: contentByCenter['Resource'] || 0, services: serviceCount, orgs: orgCount, total: (contentByCenter['Resource'] || 0) + serviceCount + orgCount },
    Action: { content: contentByCenter['Action'] || 0, services: 0, orgs: 0, total: contentByCenter['Action'] || 0 },
    Accountability: { content: contentByCenter['Accountability'] || 0, services: 0, orgs: 0, total: contentByCenter['Accountability'] || 0 },
  }
}

/**
 * Get entity counts for ALL pathways at once (for overview pages).
 */
export async function getPathwayCounts(): Promise<Record<string, { content: number; services: number; orgs: number; policies: number; total: number }>> {
  const supabase = await createClient()
  const themes = ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_04', 'THEME_05', 'THEME_06', 'THEME_07']

  const results: Record<string, { content: number; services: number; orgs: number; policies: number; total: number }> = {}

  const [contentCounts, orgCounts] = await Promise.all([
    supabase
      .from('content_published')
      .select('pathway_primary')
      .eq('is_active', true)
      .in('pathway_primary', themes),
    supabase
      .from('organizations')
      .select('theme_id')
      .in('theme_id', themes),
  ])

  const contentByTheme: Record<string, number> = {}
  const orgByTheme: Record<string, number> = {}
  for (const item of (contentCounts.data || [])) {
    const key = item.pathway_primary as string
    if (key) contentByTheme[key] = (contentByTheme[key] || 0) + 1
  }
  for (const item of (orgCounts.data || [])) {
    const key = item.theme_id as string
    if (key) orgByTheme[key] = (orgByTheme[key] || 0) + 1
  }

  for (const t of themes) {
    const c = contentByTheme[t] || 0
    const o = orgByTheme[t] || 0
    results[t] = { content: c, services: 0, orgs: o, policies: 0, total: c + o }
  }

  return results
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Build the .or() filter string for elected_officials by district.
 * Mirrors the proven pattern from getOfficialsByZip().
 */
function buildOfficialDistrictFilter(geo: UserGeo): string {
  const parts: string[] = []

  if (geo.congressionalDistrict) parts.push(`district_id.eq.${geo.congressionalDistrict}`)
  if (geo.stateSenateDistrict) parts.push(`district_id.eq.${geo.stateSenateDistrict}`)
  if (geo.stateHouseDistrict) parts.push(`district_id.eq.${geo.stateHouseDistrict}`)
  if (geo.councilDistrict) parts.push(`district_id.eq.${geo.councilDistrict}`)

  // TX Senators, At-Large council, Mayor
  parts.push('district_id.eq.TX-SEN')
  parts.push('district_id.like.AL%')
  parts.push('and(level.eq.City,district_id.is.null)')

  // County officials via counties_served
  if (geo.countyId) {
    parts.push(`counties_served.like.%${geo.countyId}%`)
  }

  return parts.join(',')
}

/**
 * Fetch policies that affect the user's geography via policy_geography junction.
 * Returns the policy rows directly (not a Supabase result).
 */
async function getPoliciesByGeo(supabase: any, geo: UserGeo, limit: number): Promise<any[]> {
  const geoFilters: string[] = []
  geoFilters.push(`and(geo_type.eq.zip_code,geo_id.eq.${geo.zip})`)
  if (geo.congressionalDistrict) geoFilters.push(`and(geo_type.eq.congressional,geo_id.eq.${geo.congressionalDistrict})`)
  if (geo.stateSenateDistrict) geoFilters.push(`and(geo_type.eq.state_senate,geo_id.eq.${geo.stateSenateDistrict})`)
  if (geo.stateHouseDistrict) geoFilters.push(`and(geo_type.eq.state_house,geo_id.eq.${geo.stateHouseDistrict})`)
  if (geo.councilDistrict) geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${geo.councilDistrict})`)

  if (geoFilters.length === 0) return []

  const { data: geoRows } = await supabase
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds: string[] = Array.from(new Set(((geoRows || []) as any[]).map((r: any) => r.policy_id as string)))
  if (policyIds.length === 0) return []

  const { data: policies } = await supabase
    .from('policies')
    .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, summary_6th_grade, level, status, bill_number, authoring_body, source_url')
    .in('policy_id', policyIds)
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })
    .limit(limit)

  return policies || []
}

/**
 * Count policies affecting the user's geography.
 */
async function getPoliciesByGeoCount(supabase: any, geo: UserGeo): Promise<number> {
  const geoFilters: string[] = []
  geoFilters.push(`and(geo_type.eq.zip_code,geo_id.eq.${geo.zip})`)
  if (geo.congressionalDistrict) geoFilters.push(`and(geo_type.eq.congressional,geo_id.eq.${geo.congressionalDistrict})`)
  if (geo.stateSenateDistrict) geoFilters.push(`and(geo_type.eq.state_senate,geo_id.eq.${geo.stateSenateDistrict})`)
  if (geo.stateHouseDistrict) geoFilters.push(`and(geo_type.eq.state_house,geo_id.eq.${geo.stateHouseDistrict})`)
  if (geo.councilDistrict) geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${geo.councilDistrict})`)

  if (geoFilters.length === 0) return 0

  const { data: geoRows } = await supabase
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds: string[] = Array.from(new Set(((geoRows || []) as any[]).map((r: any) => r.policy_id as string)))
  if (policyIds.length === 0) return 0

  const { count } = await supabase
    .from('policies')
    .select('policy_id', { count: 'exact', head: true })
    .in('policy_id', policyIds)
    .eq('is_published', true)

  return count ?? 0
}
