import { createClient } from '@/lib/supabase/server'
import type { FocusArea } from '@/lib/types/exchange'
/** Fetch policies sharing any of the given focus areas via junction table. */
export async function getRelatedPolicies(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('policy_focus_areas')
    .select('policy_id')
    .in('focus_id', focusAreaIds)
  const policyIds = Array.from(new Set((junctions ?? []).map(j => j.policy_id)))
  if (policyIds.length === 0) return []
  const { data } = await supabase
    .from('policies')
    .select('*')
    .in('policy_id', policyIds)
    .limit(10)
  return data ?? []
}

/** Fetch services sharing any of the given focus areas via junction table. */

/** Get official IDs for a policy from the junction table. */
export async function getPolicyOfficialIds(policyId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policy_officials')
    .select('official_id')
    .eq('policy_id', policyId)
  return (data ?? []).map(j => j.official_id)
}

/** Get life situation IDs linked to content from the junction table. */

/** Get published policies affecting a ZIP code's districts. */
export async function getPoliciesByZip(zip: string) {
  const supabase = await createClient()

  // Look up the ZIP's district assignments
  const { data: zipDataRaw } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipDataRaw) return { federal: [], state: [], city: [] }
  const zipData = zipDataRaw as any

  // Build geo filters from district assignments
  const geoFilters: string[] = []
  geoFilters.push(`and(geo_type.eq.zip_code,geo_id.eq.${zip})`)
  if (zipData.congressional_district) geoFilters.push(`and(geo_type.eq.congressional,geo_id.eq.${zipData.congressional_district})`)
  if (zipData.state_senate_district) geoFilters.push(`and(geo_type.eq.state_senate,geo_id.eq.${zipData.state_senate_district})`)
  if (zipData.state_house_district) geoFilters.push(`and(geo_type.eq.state_house,geo_id.eq.${zipData.state_house_district})`)
  if (zipData.council_district) geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${zipData.council_district})`)

  if (geoFilters.length === 0) return { federal: [], state: [], city: [] }

  // Get policy IDs from policy_geography
  const { data: geoRows } = await (supabase as any)
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds: string[] = Array.from(new Set(((geoRows || []) as any[]).map((r: any) => r.policy_id as string)))
  if (policyIds.length === 0) return { federal: [], state: [], city: [] }

  // Fetch published policies
  const { data: policies } = await (supabase as any)
    .from('policies')
    .select('*')
    .in('policy_id', policyIds)
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })

  const all: any[] = policies || []
  return {
    federal: all.filter(function (p: any) { return p.level === 'Federal' }),
    state: all.filter(function (p: any) { return p.level === 'State' }),
    city: all.filter(function (p: any) { return p.level === 'City' }),
  }
}

/** Get published policies for a super neighborhood via its ZIP codes. */

/** Get published policies for a super neighborhood via its ZIP codes. */
export async function getPoliciesForNeighborhood(snId: string) {
  const supabase = await createClient()

  // Get ZIP codes that belong to this super neighborhood
  const { data: zipRows } = await (supabase as any)
    .from('zip_codes')
    .select('zip_code, council_district')
    .eq('neighborhood_id', parseInt(snId) || 0)

  if (!zipRows || zipRows.length === 0) return []

  // Get council districts for this SN
  const councilDistricts = Array.from(new Set(zipRows.map(function (z: any) { return z.council_district }).filter(Boolean)))

  // Query policy_geography for council district matches
  const geoFilters: string[] = []
  for (const cd of councilDistricts) {
    geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${cd})`)
  }

  if (geoFilters.length === 0) return []

  const { data: geoRows } = await (supabase as any)
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds = (geoRows || []).map(function (r: any) { return r.policy_id as string })
  const uniquePolicyIds = Array.from(new Set(policyIds)) as string[]
  if (uniquePolicyIds.length === 0) return []

  const { data: policies } = await (supabase as any)
    .from('policies')
    .select('*')
    .in('policy_id', uniquePolicyIds)
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })
    .limit(20)

  return (policies || []) as any[]
}

/** Combined civic profile: officials + policies + geographic context for a ZIP. */

/** Get focus areas linked to a policy via policy_focus_areas. */
export async function getPolicyFocusAreas(policyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policy_focus_areas')
    .select('focus_id')
    .eq('policy_id', policyId)

  if (!data || data.length === 0) return []

  const focusIds = data.map(r => r.focus_id)
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  return focusAreas || []
}

/**
 * Get active theme/pathway IDs for a ZIP code.
 * Queries service and content focus-area junctions to find which themes are
 * represented in the user's area. Returns unique THEME_xx keys.
 */

/**
 * Get active theme/pathway IDs for a ZIP code.
 * Queries service and content focus-area junctions to find which themes are
 * represented in the user's area. Returns unique THEME_xx keys.
 */
export async function getActivePathwaysForZip(zip: string): Promise<string[]> {
  const supabase = await createClient()

  // Get services in this ZIP
  const { data: services } = await supabase
    .from('services_211')
    .select('service_id')
    .eq('zip_code', zip)
    .eq('is_active', 'Yes')
    .limit(50)

  if (!services || services.length === 0) return []

  const serviceIds = services.map(s => s.service_id)
  const { data: junctions } = await supabase
    .from('service_focus_areas')
    .select('focus_id')
    .in('service_id', serviceIds)

  if (!junctions || junctions.length === 0) return []

  const focusIds = Array.from(new Set(junctions.map(j => j.focus_id)))
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('theme_id')
    .in('focus_id', focusIds)

  if (!focusAreas) return []

  return Array.from(new Set(focusAreas.map(fa => fa.theme_id).filter(Boolean))) as string[]
}

// ── Geography page data ───────────────────────────────────────────────

/** Map municipal service_type to marker type for the geography map. */
const SERVICE_TYPE_TO_MARKER: Record<string, string> = {
  emergency: 'fire',
  police: 'police',
  fire: 'fire',
  medical: 'medical',
  parks: 'park',
  library: 'library',
  utilities: 'service',
}

/** Get municipal services as map markers (only those with lat/lng). */

/** Get geography rows for a policy. */
export async function getPolicyGeography(policyId: string): Promise<Array<{ geo_type: string; geo_id: string }>> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('policy_geography')
    .select('geo_type, geo_id')
    .eq('policy_id', policyId)
  return (data || []).map(function (row: any) {
    return { geo_type: row.geo_type, geo_id: row.geo_id }
  })
}

// ── Quotes ──────────────────────────────────────────────────────────────


/** Get policies that affect a TIRZ zone's geography. */
export async function getPoliciesForTirz(tirzId: string) {
  const supabase = await createClient()
  // Get policies at city level that might affect TIRZ areas
  const { data } = await supabase
    .from('policies')
    .select('*')
    .in('level', ['City', 'County'])
    .order('updated_at', { ascending: false })
    .limit(12)
  return data ?? []
}

