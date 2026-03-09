import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import type { ServiceWithOrg, MapMarkerData } from '@/lib/types/exchange'

type MunicipalServiceRow = Database['public']['Tables']['municipal_services']['Row']

export interface MunicipalServicesResult {
  emergency: MunicipalServiceRow[]
  police: MunicipalServiceRow[]
  fire: MunicipalServiceRow[]
  medical: MunicipalServiceRow[]
  parks: MunicipalServiceRow[]
  library: MunicipalServiceRow[]
  utilities: MunicipalServiceRow[]
}

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

/** All active 211 services, enriched with parent org names. */
export const getServices = cache(async function getServices(): Promise<ServiceWithOrg[]> {
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
})


/** Fetch services sharing any of the given focus areas via junction table. */
export async function getRelatedServices(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('service_focus_areas')
    .select('service_id')
    .in('focus_id', focusAreaIds)
  const serviceIds = Array.from(new Set((junctions ?? []).map(j => j.service_id)))
  if (serviceIds.length === 0) return []
  const { data } = await supabase
    .from('services_211')
    .select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website')
    .in('service_id', serviceIds.slice(0, 100))
    .limit(20)
  return data ?? []
}

/** Fetch officials sharing any of the given focus areas via junction table. */

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

  // Fetch org names and geocode coords in parallel (both independent of each other)
  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  const addressedServices = services.filter(s => s.address)

  const [orgResult, coordResult] = await Promise.all([
    orgIds.length > 0
      ? supabase.from('organizations').select('org_id, org_name').in('org_id', orgIds as string[])
      : Promise.resolve({ data: [] as any[] }),
    addressedServices.length > 0
      ? supabase.from('geocode_cache').select('raw_address, latitude, longitude').not('latitude', 'is', null).not('longitude', 'is', null).limit(1000)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const orgMap = new Map((orgResult.data ?? []).map((o: any) => [o.org_id, o.org_name]))
  const coordMap = new Map<string, { latitude: number; longitude: number }>()
  if (coordResult.data) {
    coordResult.data.forEach((c: any) => {
      if (c.raw_address && c.latitude != null && c.longitude != null) {
        coordMap.set(c.raw_address.toLowerCase().trim(), { latitude: c.latitude, longitude: c.longitude })
      }
    })
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

/**
 * Fetch services available in a super neighborhood by aggregating ZIP codes
 * from the neighborhood_zip_codes junction table. Joins with organizations for parent org names.
 */
export async function getServicesByNeighborhood(neighborhoodId: string): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()

  // Get child neighborhoods of this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', neighborhoodId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)
  if (hoodIds.length === 0) return []

  // Get ZIP codes from junction table
  const { data: zipJunctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .in('neighborhood_id', hoodIds)

  const allZips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  if (allZips.length === 0) return []
  return getServicesWithCoords(allZips)
}

/**
 * Fetch organizations located in a super neighborhood using the
 * organization_neighborhoods junction table. Returns organizations with coordinates for map rendering.
 */

export async function getMunicipalServices(zip: string): Promise<MunicipalServicesResult> {
  const supabase = await createClient()

  // Get zip_code row for county_id and city
  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('county_id, city')
    .eq('zip_code', parseInt(zip))
    .single()

  const countyId = zipData?.county_id ?? null
  const city = zipData?.city ?? 'Houston'

  // Build OR filter: match county, city, or citywide coverage
  const filters: string[] = ['coverage_area.eq.citywide']
  if (countyId) filters.push('county_id.eq.' + countyId)
  if (city) filters.push('city.eq.' + city)

  const { data: services } = await supabase
    .from('municipal_services')
    .select('*')
    .or(filters.join(','))
    .order('display_order')

  const all = services || []

  return {
    emergency: all.filter(s => s.service_type === 'emergency'),
    police: all.filter(s => s.service_type === 'police'),
    fire: all.filter(s => s.service_type === 'fire'),
    medical: all.filter(s => s.service_type === 'medical'),
    parks: all.filter(s => s.service_type === 'parks'),
    library: all.filter(s => s.service_type === 'library'),
    utilities: all.filter(s => s.service_type === 'utilities'),
  }
}

// ── Policy geography queries ──────────────────────────────────────────

/** Get published policies affecting a ZIP code's districts. */

/** Get municipal services as map markers (only those with lat/lng). */
export async function getMunicipalServiceMarkers(): Promise<MapMarkerData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('municipal_services')
    .select('id, service_name, service_type, address, city, phone, website, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('display_order')
  return (data ?? []).map(function (s) {
    return {
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      title: s.service_name,
      type: SERVICE_TYPE_TO_MARKER[s.service_type] || 'service',
      address: s.address ? (s.address + (s.city ? ', ' + s.city : '')) : null,
      phone: s.phone,
      link: s.website,
    }
  })
}

/** Fetch everything the geography page needs. */
