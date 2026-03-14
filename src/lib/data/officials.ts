import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { FocusArea } from '@/lib/types/exchange'
/** All elected officials with their government levels and LinkedIn profiles. */
export const getOfficials = cache(async function getOfficials({ limit = 200, offset = 0 }: { limit?: number; offset?: number } = {}) {
  const supabase = await createClient()
  const [{ data: officials }, { data: levels }, { data: profileRows }] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name').range(offset, offset + limit - 1),
    supabase.from('government_levels').select('*').order('level_order'),
    supabase.from('official_profiles' as any).select('official_id, social_linkedin, linkedin_status'),
  ])
  const profiles = ((profileRows ?? []) as unknown as Array<{ official_id: string; social_linkedin: string | null; linkedin_status: string | null }>)
    .reduce<Record<string, string>>(function (acc, p) {
      if (p.social_linkedin && (!p.linkedin_status || p.linkedin_status === 'verified')) acc[p.official_id] = p.social_linkedin
      return acc
    }, {})
  return { officials: officials ?? [], levels: levels ?? [], profiles }
})

/** Officials matching a ZIP code — looks up districts from zip_codes table, then finds matching officials. */

/** Officials matching a ZIP code — looks up districts from zip_codes table, then finds matching officials. */
export async function getOfficialsByZip(zip: string) {
  const supabase = await createClient()

  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipData) return null

  const districts = [
    zipData.congressional_district,
    zipData.state_senate_district,
    zipData.state_house_district,
  ].filter(Boolean)

  // Look up city council district from neighborhoods table
  const { data: hoodRows } = await supabase
    .from('neighborhoods')
    .select('council_district')
    .like('zip_codes', '%' + zip + '%')
    .not('council_district', 'is', null)
    .limit(1)

  const councilDistrict = hoodRows?.[0]?.council_district || null

  let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
  // TX Senators
  filterParts += ',district_id.eq.TX-SEN'
  if (councilDistrict) {
    filterParts += ',district_id.eq.' + councilDistrict
  }
  // At-Large council members + Mayor (null district = citywide)
  filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  // County officials + Governor via counties_served
  if (zipData.county_id) {
    filterParts += ',counties_served.like.%' + zipData.county_id + '%'
  }

  const { data: officials } = await supabase
    .from('elected_officials')
    .select('*')
    .or(filterParts)
    .order('official_name')

  const all = officials ?? []
  return {
    federal: all.filter(function (o) { return o.level === 'Federal' }),
    state: all.filter(function (o) { return o.level === 'State' }),
    county: all.filter(function (o) { return o.level === 'County' }),
    city: all.filter(function (o) { return o.level === 'City' }),
    zipData,
  }
}

/** Fetch all data for the Civic Hub: officials, policies, elections, government_levels. */

/** Fetch officials sharing any of the given focus areas via junction table. */
export async function getRelatedOfficials(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('official_focus_areas')
    .select('official_id')
    .in('focus_id', focusAreaIds)
  const officialIds = Array.from(new Set((junctions ?? []).map(j => j.official_id)))
  if (officialIds.length === 0) return []
  const { data } = await supabase
    .from('elected_officials')
    .select('official_id, official_name, title, party, level, email, office_phone, website')
    .in('official_id', officialIds.slice(0, 50))
    .limit(12)
  return data ?? []
}

/** Fetch all foundations for the index page, with spotlight ones first. */

export async function getOfficialsForDistrict(districtId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('elected_officials')
    .select('*')
    .eq('district_id', districtId)
  return data ?? []
}


/**
 * Get officials responsible for a neighborhood's districts.
 * Traverses: neighborhood → precinct_neighborhoods → precincts → elected_officials
 * Collects council, congressional, state house, and state senate district IDs.
 */
export async function getOfficialsForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()
  const { data: precinctJunctions } = await supabase
    .from('precinct_neighborhoods')
    .select('precinct_id')
    .eq('neighborhood_id', neighborhoodId)
  const precinctIds = (precinctJunctions ?? []).map(j => j.precinct_id)
  if (precinctIds.length === 0) return []

  const { data: precincts } = await supabase
    .from('precincts')
    .select('council_district, congressional_district, state_house_district, state_senate_district')
    .in('precinct_id', precinctIds)

  // Collect all unique district IDs across district types
  const districtIds = Array.from(new Set(
    (precincts ?? []).flatMap(p => [
      p.council_district,
      p.congressional_district,
      p.state_house_district,
      p.state_senate_district,
    ]).filter((d): d is string => d != null)
  ))
  if (districtIds.length === 0) return []

  const { data } = await supabase
    .from('elected_officials')
    .select('*')
    .in('district_id', districtIds)
  return data ?? []
}

/**
 * Get the full mesh path: situation → focus_areas → orgs → neighborhoods.
 * Returns organizations that address the given life situation and serve the given neighborhood.
 */

/** Get focus area IDs for an official from the junction table. */
export async function getOfficialFocusAreaIds(officialId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('official_focus_areas')
    .select('focus_id')
    .eq('official_id', officialId)
  return (data ?? []).map(j => j.focus_id)
}

/** Get official IDs for a policy from the junction table. */

/** Get officials whose council districts overlap a TIRZ zone. */
export async function getOfficialsForTirz(tirzId: string) {
  const supabase = await createClient()
  const { data: zone } = await supabase
    .from('tirz_zones')
    .select('council_districts')
    .eq('tirz_id', tirzId)
    .single() as { data: { council_districts: string | null } | null }

  if (!zone?.council_districts) {
    // Fall back to all city-level officials
    const { data: officials } = await supabase
      .from('elected_officials')
      .select('*')
      .eq('level', 'City')
      .order('official_name')
    return officials ?? []
  }

  const districts = zone.council_districts.split(',').map(function (d: string) { return d.trim() })
  const { data: officials } = await supabase
    .from('elected_officials')
    .select('*')
    .or(
      districts.map(function (d: string) { return 'district_id.eq.' + d }).join(',') +
      ',district_id.is.null,district_id.like.AL%'
    )
    .eq('level', 'City')
    .order('official_name')
  return officials ?? []
}

/** Get policies that affect a TIRZ zone's geography. */
