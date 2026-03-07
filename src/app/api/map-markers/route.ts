/**
 * @fileoverview Dynamic map marker + content API for the Map View page.
 *
 * Resolves a region (ZIP, super neighborhood, council district, etc.) to ZIP
 * codes, then fetches organizations, services, voting locations, municipal
 * services, and officials — optionally filtered by a pathway (THEME_XX).
 *
 * GET /api/map-markers?type=zip&id=77001
 * GET /api/map-markers?type=superNeighborhood&id=SN-01&pathway=THEME_01
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getServicesWithCoords,
  getOrganizationsWithCoords,
  getVotingLocationsWithCoords,
  getMunicipalServiceMarkers,
} from '@/lib/data/exchange'
import type { MarkerData } from '@/components/maps/MapMarker'

const VALID_TYPES = [
  'zip',
  'superNeighborhood',
  'councilDistrict',
  'congressional',
  'stateSenate',
  'stateHouse',
] as const

type RegionType = (typeof VALID_TYPES)[number]

/**
 * Resolve a region type + id into an array of ZIP code strings.
 */
async function resolveZipCodes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  type: RegionType,
  id: string
): Promise<string[]> {
  switch (type) {
    case 'zip':
      return [id]

    case 'superNeighborhood': {
      const { data: hoods } = await supabase
        .from('neighborhoods')
        .select('neighborhood_id')
        .eq('super_neighborhood_id', id)
      const hoodIds = (hoods ?? []).map(function (h) { return h.neighborhood_id })
      if (hoodIds.length === 0) return []
      const { data: junctions } = await supabase
        .from('neighborhood_zip_codes')
        .select('zip_code')
        .in('neighborhood_id', hoodIds)
      return Array.from(new Set((junctions ?? []).map(function (j) { return j.zip_code })))
    }

    case 'councilDistrict': {
      const { data } = await supabase
        .from('zip_codes')
        .select('zip_code')
        .eq('council_district', id)
      return (data ?? []).map(function (z) { return String(z.zip_code) })
    }

    case 'congressional': {
      const { data } = await supabase
        .from('zip_codes')
        .select('zip_code')
        .eq('congressional_district', id)
      return (data ?? []).map(function (z) { return String(z.zip_code) })
    }

    case 'stateSenate': {
      const { data } = await supabase
        .from('zip_codes')
        .select('zip_code')
        .eq('state_senate_district', id)
      return (data ?? []).map(function (z) { return String(z.zip_code) })
    }

    case 'stateHouse': {
      const { data } = await supabase
        .from('zip_codes')
        .select('zip_code')
        .eq('state_house_district', id)
      return (data ?? []).map(function (z) { return String(z.zip_code) })
    }

    default:
      return []
  }
}

/**
 * Fetch pathway classifications for a set of entity IDs from a junction table.
 * Returns a map of entityId → { primaryPathway, pathways }.
 */
async function fetchPathwaysForEntities(
  supabase: Awaited<ReturnType<typeof createClient>>,
  junctionTable: string,
  idColumn: string,
  entityIds: string[]
): Promise<Map<string, { primaryPathway: string | null; pathways: string[] }>> {
  const result = new Map<string, { primaryPathway: string | null; pathways: string[] }>()
  if (entityIds.length === 0) return result

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { apikey: key, Authorization: 'Bearer ' + key }

  // Use REST API for junction tables that may not be in generated types
  const idsParam = entityIds.slice(0, 200).join(',')
  const res = await fetch(
    url + '/rest/v1/' + junctionTable + '?' + idColumn + '=in.(' + idsParam + ')&select=' + idColumn + ',theme_id,is_primary',
    { headers }
  )
  if (!res.ok) return result

  const rows: Array<Record<string, string | boolean>> = await res.json()
  for (const row of rows) {
    const entityId = String(row[idColumn])
    const themeId = String(row.theme_id)
    const isPrimary = row.is_primary === true

    let entry = result.get(entityId)
    if (!entry) {
      entry = { primaryPathway: null, pathways: [] }
      result.set(entityId, entry)
    }
    if (!entry.pathways.includes(themeId)) {
      entry.pathways.push(themeId)
    }
    if (isPrimary) {
      entry.primaryPathway = themeId
    }
  }

  // For entities with pathways but no explicit primary, use first pathway
  Array.from(result.values()).forEach(function (entry) {
    if (!entry.primaryPathway && entry.pathways.length > 0) {
      entry.primaryPathway = entry.pathways[0]
    }
  })

  return result
}

/**
 * Get entity IDs that are classified under a specific pathway.
 */
async function getEntityIdsForPathway(
  junctionTable: string,
  idColumn: string,
  pathwayId: string
): Promise<Set<string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { apikey: key, Authorization: 'Bearer ' + key }

  const res = await fetch(
    url + '/rest/v1/' + junctionTable + '?theme_id=eq.' + pathwayId + '&select=' + idColumn,
    { headers }
  )
  if (!res.ok) return new Set()

  const rows: Array<Record<string, string>> = await res.json()
  return new Set(rows.map(function (r) { return String(r[idColumn]) }))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as RegionType | null
  const id = searchParams.get('id')
  const pathway = searchParams.get('pathway')

  if (!type || !id || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Missing or invalid type/id. Valid types: ' + VALID_TYPES.join(', ') },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 1. Resolve region → ZIP codes
  const zips = await resolveZipCodes(supabase, type, id)

  // 2. If pathway filter is active, pre-fetch allowed entity IDs
  let allowedOrgIds: Set<string> | null = null
  let allowedServiceIds: Set<string> | null = null
  let allowedOfficialIds: Set<string> | null = null

  if (pathway) {
    ;[allowedOrgIds, allowedServiceIds, allowedOfficialIds] = await Promise.all([
      getEntityIdsForPathway('organization_pathways', 'org_id', pathway),
      getEntityIdsForPathway('service_pathways', 'service_id', pathway),
      getEntityIdsForPathway('official_pathways', 'official_id', pathway),
    ])
  }

  // 3. Fetch all content in parallel
  const [services, municipalMarkers, officials] = await Promise.all([
    getServicesWithCoords(zips.length > 0 ? zips : undefined),
    getMunicipalServiceMarkers(),
    (async function () {
      if (zips.length === 0) return []
      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('*')
        .eq('zip_code', parseInt(zips[0]))
        .single()
      if (!zipData) return []

      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        'TX',
      ].filter(Boolean)

      // Look up council district from neighborhoods
      const { data: hoodRows } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + zips[0] + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDist = hoodRows?.[0]?.council_district || null

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      if (councilDist) {
        filterParts += ',district_id.eq.' + councilDist
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, level, party, email, office_phone, website, photo_url')
        .or(filterParts)
      return data ?? []
    })(),
  ])

  // 4. Fetch orgs + voting per-ZIP in parallel
  const orgResults = await Promise.all(
    zips.slice(0, 10).map(function (z) { return getOrganizationsWithCoords(z) })
  )
  const votingResults = await Promise.all(
    zips.slice(0, 10).map(function (z) { return getVotingLocationsWithCoords(z) })
  )

  // 5. Collect entity IDs for pathway lookup
  const allOrgIds: string[] = []
  const allServiceIds: string[] = []
  const allOfficialIds: string[] = []

  const seenOrgIds = new Set<string>()
  orgResults.flat().forEach(function (o) {
    if (!seenOrgIds.has(o.org_id)) {
      seenOrgIds.add(o.org_id)
      allOrgIds.push(o.org_id)
    }
  })

  services.forEach(function (s) {
    const serviceId = s.service_id || s.org_id
    if (serviceId) allServiceIds.push(serviceId)
  })

  const officialsList = officials as Array<{
    official_id: string; official_name: string; title: string | null
    level: string | null; party: string | null; email: string | null
    office_phone: string | null; website: string | null; photo_url: string | null
  }>
  officialsList.forEach(function (o) {
    allOfficialIds.push(o.official_id)
  })

  // 6. Fetch pathway data for all entities in parallel
  const [orgPathways, servicePathways, officialPathways] = await Promise.all([
    fetchPathwaysForEntities(supabase, 'organization_pathways', 'org_id', allOrgIds),
    fetchPathwaysForEntities(supabase, 'service_pathways', 'service_id', allServiceIds),
    fetchPathwaysForEntities(supabase, 'official_pathways', 'official_id', allOfficialIds),
  ])

  // 7. Build markers array
  const markers: MarkerData[] = []
  const entityCounts = { organizations: 0, services: 0, voting: 0, officials: 0 }

  // Service markers
  services.forEach(function (s) {
    if (s.latitude && s.longitude) {
      const serviceId = s.service_id || s.org_id || ('svc-' + markers.length)
      // Skip if pathway filter is active and this service isn't classified under it
      if (allowedServiceIds && !allowedServiceIds.has(serviceId)) return

      const pw = servicePathways.get(serviceId)
      markers.push({
        id: serviceId,
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        title: s.service_name || s.org_name || 'Service',
        type: 'service',
        address: [s.address, s.city].filter(Boolean).join(', ') || null,
        phone: s.phone || null,
        link: s.org_id ? '/services?org=' + s.org_id : null,
        primaryPathway: pw?.primaryPathway || null,
        pathways: pw?.pathways || [],
      })
      entityCounts.services++
    }
  })

  // Municipal service markers (not pathway-filtered — they're citywide infrastructure)
  if (!pathway) {
    municipalMarkers.forEach(function (m) {
      markers.push({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        type: m.type as MarkerData['type'],
        address: m.address,
        phone: m.phone,
        link: m.link,
      })
    })
  }

  // Organization markers
  const seenOrgIdsForMarkers = new Set<string>()
  orgResults.flat().forEach(function (o) {
    if (seenOrgIdsForMarkers.has(o.org_id)) return
    seenOrgIdsForMarkers.add(o.org_id)

    // Skip if pathway filter is active and this org isn't classified under it
    if (allowedOrgIds && !allowedOrgIds.has(o.org_id)) return

    const pw = orgPathways.get(o.org_id)
    markers.push({
      id: o.org_id,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      title: o.org_name || 'Organization',
      type: 'organization',
      address: [o.address, o.city].filter(Boolean).join(', ') || null,
      phone: null,
      link: '/services?org=' + o.org_id,
      primaryPathway: pw?.primaryPathway || null,
      pathways: pw?.pathways || [],
    })
    entityCounts.organizations++
  })

  // Voting location markers (not pathway-filtered)
  if (!pathway) {
    votingResults.flat().forEach(function (v) {
      markers.push({
        id: v.location_id || ('vote-' + markers.length),
        lat: Number(v.latitude),
        lng: Number(v.longitude),
        title: v.location_name || 'Voting Location',
        type: 'voting',
        address: [v.address, v.city].filter(Boolean).join(', ') || null,
        phone: null,
        link: '/elections',
      })
      entityCounts.voting++
    })
  }

  // Filter officials by pathway if active
  const filteredOfficials = pathway
    ? officialsList.filter(function (o) { return allowedOfficialIds!.has(o.official_id) })
    : officialsList

  // Enrich officials with pathway data
  const enrichedOfficials = filteredOfficials.map(function (o) {
    const pw = officialPathways.get(o.official_id)
    return {
      ...o,
      primaryPathway: pw?.primaryPathway || null,
      pathways: pw?.pathways || [],
    }
  })
  entityCounts.officials = enrichedOfficials.length

  return NextResponse.json({
    markers,
    officials: enrichedOfficials,
    entityCounts,
  })
}
