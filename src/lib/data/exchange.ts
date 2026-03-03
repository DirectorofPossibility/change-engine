/**
 * @fileoverview Data-fetching layer for the public exchange site (/(exchange)/*).
 *
 * All functions run server-side (RSC or server actions) and use the Supabase
 * server client. They are organized into sections:
 *
 *   1. Language / Translation helpers
 *   2. Homepage data (stats, center counts, pathway counts, latest content)
 *   3. Entity queries (officials, services, learning paths, situations)
 *   4. Pathway + center content filtering
 *   5. Taxonomy lookups (focus areas, SDGs, SDOH)
 *   6. Geographic data (neighborhoods, super neighborhoods, ZIP lookups)
 *   7. Map marker data (services, voting locations, orgs, distribution sites with coords)
 *
 * Most pages use ISR (`export const revalidate = N`) so these queries are cached
 * at the edge and only re-run every N seconds.
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LANGUAGES } from '@/lib/constants'
import type { ExchangeStats, ServiceWithOrg, TranslationMap, FocusArea, SDG, SDOHDomain, DistributionSite, SuperNeighborhood } from '@/lib/types/exchange'

/**
 * Read language preference from cookie and return the LANG-XX id.
 * Returns null for English (no translations needed).
 */
export async function getLangId(): Promise<string | null> {
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })
  return langConfig?.langId ?? null
}

// ── Homepage data ──────────────────────────────────────────────────────

/** Aggregate counts for the stats bar at the bottom of the homepage. */
export async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = await createClient()
  const [resources, services, officials, paths, orgs, policies] = await Promise.all([
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('path_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }),
  ])
  return {
    resources: resources.count ?? 0,
    services: services.count ?? 0,
    officials: officials.count ?? 0,
    learningPaths: paths.count ?? 0,
    organizations: orgs.count ?? 0,
    policies: policies.count ?? 0,
  }
}

/** Count published content per center (Learning/Action/Resource/Accountability) for homepage cards. */
export async function getCenterCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}

/** Most recently published content for the "Latest Resources" homepage section. */
export async function getLatestContent(limit = 6) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Life situations ("Available Resources") ───────────────────────────

/** All life situations, ordered for display. Featured/critical ones show on the homepage. */
export async function getLifeSituations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .order('display_order', { ascending: true })
  return data ?? []
}

export async function getLifeSituation(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .eq('situation_slug', slug)
    .single()
  return data
}

/**
 * Fetch content + services relevant to a life situation.
 * Matches via focus_area_ids overlap (content) and service_cat_id (services).
 * Services are enriched with their parent organization name.
 * When zipCode is provided, services are additionally filtered by geography.
 */
export async function getLifeSituationContent(focusAreaIds: string, serviceCatIds: string | null, zipCode?: string) {
  const supabase = await createClient()
  // focus_area_ids is comma-separated TEXT in life_situations
  const focusIds = focusAreaIds.split(',').map(s => s.trim()).filter(Boolean)

  const { data: content } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .overlaps('focus_area_ids', focusIds)
    .order('published_at', { ascending: false })
    .limit(20)

  let services: ServiceWithOrg[] = []
  if (serviceCatIds) {
    const catIds = serviceCatIds.split(',').map(s => s.trim()).filter(Boolean)
    let svcQuery = supabase
      .from('services_211')
      .select('*')
      .eq('is_active', 'Yes')
      .in('service_cat_id', catIds)
    if (zipCode) {
      svcQuery = svcQuery.eq('zip_code', zipCode)
    }
    const { data: svcData } = await svcQuery.limit(20)
    if (svcData) {
      // Join with organizations
      const orgIds = Array.from(new Set(svcData.map(s => s.org_id).filter(Boolean)))
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('org_id, org_name')
          .in('org_id', orgIds as string[])
        const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
        services = svcData.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
      } else {
        services = svcData
      }
    }
  }

  return { content: content ?? [], services }
}

// ── Entity queries ─────────────────────────────────────────────────────

/** All elected officials with their government levels (for sorting/grouping). */
export async function getOfficials() {
  const supabase = await createClient()
  const [{ data: officials }, { data: levels }] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('government_levels').select('*').order('level_order'),
  ])
  return { officials: officials ?? [], levels: levels ?? [] }
}

/** All active 211 services, enriched with parent org names. */
export async function getServices(): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')
    .order('service_name')

  if (!services || services.length === 0) return []

  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  if (orgIds.length === 0) return services

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .in('org_id', orgIds as string[])

  const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
  return services.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
}

export async function getLearningPaths() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', 'Yes')
    .order('display_order', { ascending: true })
  return data ?? []
}

// ── Pathway + center content ───────────────────────────────────────────

/** Published content for a specific pathway, optionally filtered by center. */
export async function getPathwayContent(themeId: string, center?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
    .order('published_at', { ascending: false })

  if (center) {
    query = query.eq('center', center)
  }

  const { data } = await query.limit(50)
  return data ?? []
}

/** Count published content per pathway (THEME_01..THEME_07) for homepage pills. */
export async function getPathwayCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('pathway_primary')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.pathway_primary) {
      counts[item.pathway_primary] = (counts[item.pathway_primary] || 0) + 1
    }
  })
  return counts
}

export async function getCenterContentForPathway(themeId: string): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}

// ── Taxonomy lookups ───────────────────────────────────────────────────

/** All focus areas (specific topics like "Mental Health" under a pathway). */
export async function getFocusAreas(): Promise<FocusArea[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*')
  return data ?? []
}

/** Quick lookup: focus_id → focus_area_name. Used for rendering focus area labels. */
export async function getFocusAreaMap(): Promise<Record<string, string>> {
  const areas = await getFocusAreas()
  const map: Record<string, string> = {}
  areas.forEach(function (a) { map[a.focus_id] = a.focus_area_name })
  return map
}

export async function getSDGs(): Promise<SDG[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdgs').select('*').order('sdg_number')
  return data ?? []
}

export async function getSDGMap(): Promise<Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>> {
  const sdgs = await getSDGs()
  const map: Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }> = {}
  sdgs.forEach(function (s) { map[s.sdg_id] = { sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })
  return map
}

export async function getSDOHDomains(): Promise<SDOHDomain[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdoh_domains').select('*')
  return data ?? []
}

export async function getSDOHMap(): Promise<Record<string, { sdoh_name: string; sdoh_description: string | null }>> {
  const domains = await getSDOHDomains()
  const map: Record<string, { sdoh_name: string; sdoh_description: string | null }> = {}
  domains.forEach(function (d) { map[d.sdoh_code] = { sdoh_name: d.sdoh_name, sdoh_description: d.sdoh_description } })
  return map
}

export async function getFocusAreasByIds(ids: string[]): Promise<FocusArea[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*').in('focus_id', ids)
  return data ?? []
}

export async function getContentByFocusArea(focusId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .contains('focus_area_ids', [focusId])
    .order('published_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function getRelatedOpportunities(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  // focus_area_ids is comma-separated TEXT — use .or() with .ilike() per ID
  const filters = focusAreaIds.map(function (id) {
    return 'focus_area_ids.ilike.%' + id + '%'
  }).join(',')
  const { data } = await supabase
    .from('opportunities')
    .select('*')
    .or(filters)
    .eq('is_active', 'Yes')
    .limit(10)
  return data ?? []
}

export async function getRelatedPolicies(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const filters = focusAreaIds.map(function (id) {
    return 'focus_area_ids.ilike.%' + id + '%'
  }).join(',')
  const { data } = await supabase
    .from('policies')
    .select('*')
    .or(filters)
    .limit(10)
  return data ?? []
}

/**
 * Fetch translations for any table type.
 * Returns a map keyed by content_id with translated title/summary.
 * Handles both 'title'/'summary' and 'title_6th_grade'/'summary_6th_grade' field_name formats.
 */
export async function fetchTranslationsForTable(
  contentType: string,
  ids: string[],
  langId: string
): Promise<TranslationMap> {
  if (ids.length === 0 || !langId) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('translations')
    .select('content_id, field_name, translated_text')
    .eq('content_type', contentType)
    .in('content_id', ids)
    .eq('language_id', langId)
  const map: TranslationMap = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id) return
      if (!map[t.content_id]) map[t.content_id] = {}
      if (t.field_name === 'title' || t.field_name === 'title_6th_grade') {
        map[t.content_id].title = t.translated_text ?? undefined
      }
      if (t.field_name === 'summary' || t.field_name === 'summary_6th_grade') {
        map[t.content_id].summary = t.translated_text ?? undefined
      }
    })
  }
  return map
}

/** Check which languages each content item has been translated into. Returns { inboxId: ['LANG-ES', 'LANG-VI'] }. */
export async function getTranslationAvailability(inboxIds: string[]): Promise<Record<string, string[]>> {
  const supabase = await createClient()
  if (inboxIds.length === 0) return {}
  const { data } = await supabase
    .from('translations')
    .select('content_id, language_id')
    .in('content_id', inboxIds)
  const avail: Record<string, string[]> = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id || !t.language_id) return
      if (!avail[t.content_id]) avail[t.content_id] = []
      if (avail[t.content_id].indexOf(t.language_id) === -1) {
        avail[t.content_id].push(t.language_id)
      }
    })
  }
  return avail
}

// ── Geographic lookups ─────────────────────────────────────────────────

/**
 * Find the neighborhood that contains a given ZIP code.
 * ZIP codes are stored as comma-separated text, so we use ilike + JS validation
 * to avoid false substring matches (e.g. "7700" matching "77001").
 */
export async function getNeighborhoodByZip(zip: string) {
  const supabase = await createClient()
  // zip_codes is comma-separated TEXT — use ilike to find matching ZIP
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .ilike('zip_codes', '%' + zip + '%')
  if (!data || data.length === 0) return null
  // Validate in JS that the ZIP actually matches (not just a substring)
  var match = data.find(function (n) {
    if (!n.zip_codes) return false
    var zips = n.zip_codes.split(',').map(function (z) { return z.trim() })
    return zips.indexOf(zip) !== -1
  })
  return match ?? null
}

export async function getOfficialsForDistrict(districtId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('elected_officials')
    .select('*')
    .eq('district_id', districtId)
  return data ?? []
}

export async function getGuides() {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('is_active', true).order('display_order')
  return data ?? []
}

export async function getGuideBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('slug', slug).eq('is_active', true).single()
  return data
}

export async function getServicesByZip(zip: string): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')
    .eq('zip_code', zip)
    .limit(20)
  if (!services || services.length === 0) return []
  const orgIds = Array.from(new Set(services.map(function (s) { return s.org_id }).filter(Boolean)))
  if (orgIds.length === 0) return services
  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .in('org_id', orgIds as string[])
  const orgMap = new Map(orgs?.map(function (o) { return [o.org_id, o.org_name] as [string, string] }) ?? [])
  return services.map(function (s) { return Object.assign({}, s, { org_name: orgMap.get(s.org_id!) ?? undefined }) })
}

// ── Super Neighborhoods ────────────────────────────────────────────────
// Houston has 88 "super neighborhoods" — city-defined groupings of smaller neighborhoods.
// Each has demographics, ZIP codes, and associated services/organizations.

/** All super neighborhoods, alphabetically. Used for the listing page. */
export async function getSuperNeighborhoods(): Promise<SuperNeighborhood[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('*')
    .order('sn_name')
  return data ?? []
}

export async function getSuperNeighborhood(snId: string): Promise<SuperNeighborhood | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('*')
    .eq('sn_id', snId)
    .single()
  return data ?? null
}

export async function getNeighborhoodsBySuperNeighborhood(snId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('super_neighborhood_id', snId)
    .order('neighborhood_name')
  return data ?? []
}

/**
 * Gather all map markers (services, voting, distribution, orgs) for a super neighborhood.
 * Aggregates ZIP codes from child neighborhoods, then queries each marker type by ZIP.
 * Falls back to the super neighborhood's own zip_codes if no child neighborhoods exist.
 */
export async function getMapMarkersForSuperNeighborhood(snId: string) {
  const supabase = await createClient()

  // Get all neighborhoods in this super neighborhood, then aggregate ZIP codes
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('zip_codes')
    .eq('super_neighborhood_id', snId)

  if (!hoods || hoods.length === 0) {
    // Fall back to super_neighborhoods.zip_codes
    const { data: sn } = await supabase
      .from('super_neighborhoods')
      .select('zip_codes')
      .eq('sn_id', snId)
      .single()
    if (!sn?.zip_codes) return { services: [], votingLocations: [], distributionSites: [], organizations: [] }
    const zips = sn.zip_codes.split(',').map(s => s.trim()).filter(Boolean)
    const [services, votingLocations, distributionSites, organizations] = await Promise.all([
      getServicesWithCoords(zips),
      (async () => {
        const results: Awaited<ReturnType<typeof getVotingLocationsWithCoords>> = []
        for (const z of zips) {
          const locs = await getVotingLocationsWithCoords(z)
          results.push(...locs)
        }
        return results
      })(),
      getDistributionSitesWithCoords(zips),
      getOrganizationsWithCoords(),
    ])
    return { services, votingLocations, distributionSites, organizations }
  }

  const allZips = Array.from(new Set(
    hoods
      .flatMap(h => (h.zip_codes || '').split(','))
      .map(z => z.trim())
      .filter(Boolean)
  ))

  if (allZips.length === 0) return { services: [], votingLocations: [], distributionSites: [], organizations: [] }

  const [services, votingLocations, distributionSites, organizations] = await Promise.all([
    getServicesWithCoords(allZips),
    (async () => {
      const results: Awaited<ReturnType<typeof getVotingLocationsWithCoords>> = []
      for (const z of allZips) {
        const locs = await getVotingLocationsWithCoords(z)
        results.push(...locs)
      }
      return results
    })(),
    getDistributionSitesWithCoords(allZips),
    getOrganizationsWithCoords(),
  ])

  return { services, votingLocations, distributionSites, organizations }
}

// ── Map marker data ────────────────────────────────────────────────────
// These functions return entities with lat/lng for rendering on Leaflet maps.
// Coordinates come from the entity table or fall back to geocode_cache.

/**
 * Services with coordinates for map markers.
 * Joins with organizations for names and geocode_cache for lat/lng.
 * Optionally filtered by ZIP codes.
 */
export async function getServicesWithCoords(zipCodes?: string[]): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()

  // services_211 may or may not have latitude/longitude columns yet.
  // Fetch services and join with geocode_cache by address hash if lat/lng not on table.
  let query = supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')

  if (zipCodes && zipCodes.length > 0) {
    query = query.in('zip_code', zipCodes)
  }

  const { data: services } = await query.limit(200)
  if (!services || services.length === 0) return []

  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  let orgMap = new Map<string, string>()
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('org_id, org_name')
      .in('org_id', orgIds as string[])
    orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
  }

  // Try to get coords from geocode_cache for services that have addresses
  let coordMap = new Map<string, { latitude: number; longitude: number }>()
  const addressedServices = services.filter(s => s.address)
  if (addressedServices.length > 0) {
    const { data: cached } = await supabase
      .from('geocode_cache')
      .select('raw_address, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(1000)
    if (cached) {
      cached.forEach(c => {
        if (c.raw_address && c.latitude != null && c.longitude != null) {
          coordMap.set(c.raw_address.toLowerCase().trim(), { latitude: c.latitude, longitude: c.longitude })
        }
      })
    }
  }

  return services.map(s => {
    const fullAddr = [s.address, s.city, s.state, s.zip_code].filter(Boolean).join(', ').toLowerCase().trim()
    const coords = coordMap.get(fullAddr)
    return {
      ...s,
      org_name: orgMap.get(s.org_id!) ?? undefined,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    }
  })
}

/** Voting locations with coordinates, optionally filtered by ZIP code. */
export async function getVotingLocationsWithCoords(zipCode?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('voting_locations')
    .select('*')
    .eq('is_active', 'Yes')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCode) {
    query = query.eq('zip_code', parseInt(zipCode))
  }

  const { data } = await query.limit(200)
  return data ?? []
}

/** Organizations with coordinates, optionally filtered by ZIP code. Selects only marker-needed fields. */
export async function getOrganizationsWithCoords(zipCode?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, latitude, longitude, zip_code, address, city')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCode) {
    query = query.eq('zip_code', zipCode)
  }

  const { data } = await query.limit(200)
  return data ?? []
}

export async function getDistributionSitesWithCoords(zipCodes?: string[]): Promise<DistributionSite[]> {
  const supabase = await createClient()
  let query = supabase
    .from('distribution_sites')
    .select('*')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCodes && zipCodes.length > 0) {
    query = query.in('zip_code', zipCodes)
  }

  const { data } = await query.limit(200)
  return data ?? []
}

export async function getMapMarkersForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  // Get neighborhood ZIP codes
  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('zip_codes')
    .eq('neighborhood_id', neighborhoodId)
    .single()

  if (!hood?.zip_codes) return { services: [], votingLocations: [], distributionSites: [], organizations: [] }

  const zips = hood.zip_codes.split(',').map(s => s.trim()).filter(Boolean)

  const [services, votingLocations, distributionSites, organizations] = await Promise.all([
    getServicesWithCoords(zips),
    (async () => {
      // Voting locations use numeric zip_code
      const results: Awaited<ReturnType<typeof getVotingLocationsWithCoords>> = []
      for (const z of zips) {
        const locs = await getVotingLocationsWithCoords(z)
        results.push(...locs)
      }
      return results
    })(),
    getDistributionSitesWithCoords(zips),
    getOrganizationsWithCoords(),
  ])

  return { services, votingLocations, distributionSites, organizations }
}

// ── Service-Org-Geography connectivity ───────────────────────────────
// Functions that connect the service layer to organizations and geography,
// enabling queries like "what services are in this neighborhood?"

/**
 * Fetch services available in a super neighborhood by aggregating its ZIP codes.
 * Joins with organizations for parent org names.
 */
export async function getServicesByNeighborhood(neighborhoodId: string): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()

  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('zip_codes')
    .eq('super_neighborhood_id', neighborhoodId)

  if (!hoods || hoods.length === 0) {
    const { data: sn } = await supabase
      .from('super_neighborhoods')
      .select('zip_codes')
      .eq('sn_id', neighborhoodId)
      .single()
    if (!sn?.zip_codes) return []
    const zips = sn.zip_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
    return getServicesWithCoords(zips)
  }

  const allZips = Array.from(new Set(
    hoods
      .flatMap(h => (h.zip_codes || '').split(','))
      .map((z: string) => z.trim())
      .filter(Boolean)
  ))

  if (allZips.length === 0) return []
  return getServicesWithCoords(allZips)
}

/**
 * Fetch organizations located in a super neighborhood by aggregating its ZIP codes.
 * Returns organizations with coordinates for map rendering.
 */
export async function getOrganizationsByNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('zip_codes')
    .eq('super_neighborhood_id', neighborhoodId)

  let allZips: string[] = []

  if (!hoods || hoods.length === 0) {
    const { data: sn } = await supabase
      .from('super_neighborhoods')
      .select('zip_codes')
      .eq('sn_id', neighborhoodId)
      .single()
    if (!sn?.zip_codes) return []
    allZips = sn.zip_codes.split(',').map((s: string) => s.trim()).filter(Boolean)
  } else {
    allZips = Array.from(new Set(
      hoods
        .flatMap(h => (h.zip_codes || '').split(','))
        .map((z: string) => z.trim())
        .filter(Boolean)
    ))
  }

  if (allZips.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, latitude, longitude, zip_code, address, city')
    .in('zip_code', allZips)
    .limit(200)

  return data ?? []
}
