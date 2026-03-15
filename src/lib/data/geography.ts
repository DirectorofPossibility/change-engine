import { createClient } from '@/lib/supabase/server'
import type { DistributionSite, SuperNeighborhood, GeographyData, MapMarkerData, ContentPreview, TirzZone } from '@/lib/types/exchange'
import { getOrganizationsWithCoords } from './organizations'
import { getMunicipalServiceMarkers, getServicesWithCoords } from './services'
/**
 * Find the neighborhood that contains a given ZIP code.
 * Uses the neighborhood_zip_codes junction table for exact matching.
 */
export async function getNeighborhoodByZip(zip: string) {
  const supabase = await createClient()
  const { data: junctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('neighborhood_id')
    .eq('zip_code', zip)
    .limit(1)
  if (!junctions || junctions.length === 0) return null
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('neighborhood_id', junctions[0].neighborhood_id)
    .single()
  return data ?? null
}


/** All super neighborhoods, alphabetically. Used for the listing page. */
export async function getSuperNeighborhoods(): Promise<SuperNeighborhood[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('*')
    .order('sn_name')
  return data ?? []
}

/** Lightweight super neighborhoods list for dropdowns (id + name only). */

/** Lightweight super neighborhoods list for dropdowns (id + name only). */
export async function getSuperNeighborhoodsList(citySlug?: string): Promise<Array<{ sn_id: string; sn_name: string }>> {
  const supabase = await createClient()
  let query = supabase
    .from('super_neighborhoods')
    .select('sn_id, sn_name')
    .order('sn_name')
  if (citySlug) {
    query = query.eq('city_slug', citySlug)
  }
  const { data } = await query
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
 * Aggregates ZIP codes from child neighborhoods via neighborhood_zip_codes junction,
 * then queries each marker type by ZIP.
 */

/**
 * Gather all map markers (services, voting, distribution, orgs) for a super neighborhood.
 * Aggregates ZIP codes from child neighborhoods via neighborhood_zip_codes junction,
 * then queries each marker type by ZIP.
 */
export async function getMapMarkersForSuperNeighborhood(snId: string) {
  const supabase = await createClient()

  // Get all neighborhoods in this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', snId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)

  // Get ZIP codes from junction table
  let allZips: string[] = []
  if (hoodIds.length > 0) {
    const { data: zipJunctions } = await supabase
      .from('neighborhood_zip_codes')
      .select('zip_code')
      .in('neighborhood_id', hoodIds)
    allZips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  }

  if (allZips.length === 0) return { services: [], votingLocations: [], distributionSites: [], organizations: [], municipalServices: [] }

  const [services, votingLocations, distributionSites, organizations, municipalServices] = await Promise.all([
    getServicesWithCoords(allZips),
    getVotingLocationsWithCoords(allZips),
    getDistributionSitesWithCoords(allZips),
    getOrganizationsWithCoords(),
    getMunicipalServiceMarkers(),
  ])

  return { services, votingLocations, distributionSites, organizations, municipalServices }
}

// ── Map marker data ────────────────────────────────────────────────────
// These functions return entities with lat/lng for rendering on Leaflet maps.
// Coordinates come from the entity table or fall back to geocode_cache.

/**
 * Services with coordinates for map markers.
 * Joins with organizations for names and geocode_cache for lat/lng.
 * Optionally filtered by ZIP codes.
 */

/** Voting locations with coordinates, optionally filtered by ZIP code. */
export async function getVotingLocationsWithCoords(zipCodes?: string | string[]) {
  const supabase = await createClient()
  let query = supabase
    .from('voting_locations')
    .select('*')
    .eq('is_active', 'Yes')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCodes) {
    const zips = Array.isArray(zipCodes) ? zipCodes : [zipCodes]
    query = query.in('zip_code', zips.map(z => parseInt(z)))
  }

  const { data } = await query.limit(200)
  return data ?? []
}

/** Organizations with coordinates, optionally filtered by ZIP code. Selects only marker-needed fields. */

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

/** Gather all map markers for a neighborhood using the neighborhood_zip_codes junction. */

/** Gather all map markers for a neighborhood using the neighborhood_zip_codes junction. */
export async function getMapMarkersForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  // Get ZIP codes from junction table
  const { data: zipJunctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .eq('neighborhood_id', neighborhoodId)

  const zips = (zipJunctions ?? []).map(j => j.zip_code)
  if (zips.length === 0) return { services: [], votingLocations: [], distributionSites: [], organizations: [], municipalServices: [] }

  const [services, votingLocations, distributionSites, organizations, municipalServices] = await Promise.all([
    getServicesWithCoords(zips),
    getVotingLocationsWithCoords(zips),
    getDistributionSitesWithCoords(zips),
    getOrganizationsWithCoords(),
    getMunicipalServiceMarkers(),
  ])

  return { services, votingLocations, distributionSites, organizations, municipalServices }
}

// ── Service-Org-Geography connectivity ───────────────────────────────
// Functions that connect the service layer to organizations and geography,
// enabling queries like "what services are in this neighborhood?"

/**
 * Fetch services available in a super neighborhood by aggregating ZIP codes
 * from the neighborhood_zip_codes junction table. Joins with organizations for parent org names.
 */

/** Get ZIP codes for a neighborhood from the junction table. */
export async function getNeighborhoodZipCodes(neighborhoodId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .eq('neighborhood_id', neighborhoodId)
  return (data ?? []).map(j => j.zip_code)
}

/** Get focus area IDs for an official from the junction table. */

/** Fetch everything the geography page needs. */
export async function getGeographyData(zip?: string, superNeighborhoodId?: string): Promise<GeographyData> {
  const supabase = await createClient()

  // Parallel base queries
  const [snResult, hoodResult, svcMarkers, orgResult] = await Promise.all([
    supabase.from('super_neighborhoods').select('*').order('sn_name'),
    supabase.from('neighborhoods').select('neighborhood_id, neighborhood_name, super_neighborhood_id').order('neighborhood_name'),
    getMunicipalServiceMarkers(),
    supabase.from('organizations')
      .select('org_id, org_name, address, city, latitude, longitude, website, phone')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200),
  ])

  const orgMarkers: MapMarkerData[] = (orgResult.data ?? []).map(function (o: any) {
    return {
      id: o.org_id,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      title: o.org_name || 'Organization',
      type: 'organization',
      address: o.address ? (o.address + (o.city ? ', ' + o.city : '')) : null,
      phone: o.phone,
      link: '/services?org=' + o.org_id,
    }
  })

  // Officials + policies if ZIP provided
  let officials: GeographyData['officials'] = []
  let policies: GeographyData['policies'] = []

  if (zip) {
    const { data: zipData } = await supabase
      .from('zip_codes')
      .select('*')
      .eq('zip_code', parseInt(zip))
      .single()

    if (zipData) {
      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        zipData.state_code || 'TX',
      ].filter(Boolean)

      // Look up council district from neighborhoods
      const { data: hoodRows2 } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + zip + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDist = hoodRows2?.[0]?.council_district || null

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      if (councilDist) {
        filterParts += ',district_id.eq.' + councilDist
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: officialData } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, level, party, email, office_phone, website')
        .or(filterParts)
      officials = (officialData || []).map(function (o) {
        return { ...o, photo_url: null as string | null }
      })

      // Policies
      const { data: policyData } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, status, level, source_url')
        .limit(30)
      policies = (policyData || []).map(function (p) {
        return { policy_id: p.policy_id, policy_name: p.policy_name, title_6th_grade: p.title_6th_grade, status: p.status, level: p.level, source_url: p.source_url }
      })
    }
  }

  return {
    superNeighborhoods: (snResult.data ?? []) as SuperNeighborhood[],
    neighborhoods: hoodResult.data ?? [],
    serviceMarkers: svcMarkers,
    organizationMarkers: orgMarkers,
    officials,
    policies,
  }
}

// ── Compass ──────────────────────────────────────────────────────────

/**
 * Fetch content previews for the Compass grid: up to 3 items per pathway×center cell.
 * Returns a nested record keyed by pathway_primary → center → ContentPreview[].
 */

// ── TIRZ Zones ─────────────────────────────────────────────────────────

export async function getTirzZones(): Promise<TirzZone[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('tirz_zones')
    .select('*')
    .order('site_number')
  return (data ?? []) as TirzZone[]
}


export async function getTirzZone(tirzId: string): Promise<TirzZone | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tirz_zones')
    .select('*')
    .eq('tirz_id', tirzId)
    .single()
  return (data as unknown as TirzZone) ?? null
}

/** Get officials whose council districts overlap a TIRZ zone. */
