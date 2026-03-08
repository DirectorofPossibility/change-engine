import { createClient } from '@/lib/supabase/server'
/** All organizations — nonprofits, agencies, foundations, etc. */
export async function getOrganizations({ limit = 200, offset = 0 }: { limit?: number; offset?: number } = {}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, phone, address, city, zip_code, logo_url, org_type, mission_statement, service_area, focus_area_ids, ntee_code, is_verified')
    .order('org_name')
    .range(offset, offset + limit - 1)
  return data ?? []
}

/** All elected officials with their government levels and LinkedIn profiles. */

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


/**
 * Fetch organizations located in a super neighborhood using the
 * organization_neighborhoods junction table. Returns organizations with coordinates for map rendering.
 */
export async function getOrganizationsByNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  // Get child neighborhoods of this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', neighborhoodId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)
  if (hoodIds.length === 0) return []

  // Get org IDs from junction table
  const { data: orgJunctions } = await supabase
    .from('organization_neighborhoods')
    .select('org_id')
    .in('neighborhood_id', hoodIds)

  const orgIds = Array.from(new Set((orgJunctions ?? []).map(j => j.org_id)))
  if (orgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, latitude, longitude, zip_code, address, city')
    .in('org_id', orgIds)
    .limit(200)

  return data ?? []
}

// ── Mesh query functions (enabled by normalized junction tables) ──────

/**
 * Get all organizations addressing a specific SDOH domain.
 * Traverses: sdoh_domains → focus_areas → organization_focus_areas → organizations
 */

/**
 * Get all organizations addressing a specific SDOH domain.
 * Traverses: sdoh_domains → focus_areas → organization_focus_areas → organizations
 */
export async function getOrganizationsBySdoh(sdohCode: string) {
  const supabase = await createClient()
  // Get focus areas linked to this SDOH domain
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id')
    .eq('sdoh_code', sdohCode)
  const focusIds = (focusAreas ?? []).map(f => f.focus_id)
  if (focusIds.length === 0) return []

  // Get org IDs from junction
  const { data: orgJunctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusIds)
  const orgIds = Array.from(new Set((orgJunctions ?? []).map(j => j.org_id)))
  if (orgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .in('org_id', orgIds)
    .limit(50)
  return data ?? []
}

/**
 * Get newsfeed items for a neighborhood.
 * Traverses: neighborhood → organization_neighborhoods → organizations → content_published (news).
 * Returns news articles/videos/reports, not community resources.
 */

/** Related organizations matching focus area IDs. */
export async function getRelatedOrgsForGuide(focusAreaIds: string[]) {
  if (focusAreaIds.length === 0) return []
  const supabase = await createClient()
  const { data: junctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusAreaIds)
  const orgIds = Array.from(new Set((junctions ?? []).map((j: any) => j.org_id)))
  if (orgIds.length === 0) return []
  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, logo_url, org_type')
    .in('org_id', orgIds)
    .limit(8)
  return data ?? []
}

/** Related published content matching focus area IDs. */
