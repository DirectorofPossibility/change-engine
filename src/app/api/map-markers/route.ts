/**
 * @fileoverview Dynamic map marker + content API for the Map View page.
 *
 * Resolves a region (ZIP, super neighborhood, council district, etc.) to ZIP
 * codes, then fetches all content types in parallel: services, organizations,
 * voting locations, municipal services, officials, and foundations.
 *
 * GET /api/map-markers?type=zip&id=77001
 * GET /api/map-markers?type=superNeighborhood&id=SN-01
 * GET /api/map-markers?type=councilDistrict&id=C
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
      // neighborhoods WHERE super_neighborhood_id = id → neighborhood_zip_codes → zip_codes
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as RegionType | null
  const id = searchParams.get('id')

  if (!type || !id || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: 'Missing or invalid type/id. Valid types: ' + VALID_TYPES.join(', ') },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 1. Resolve region → ZIP codes
  const zips = await resolveZipCodes(supabase, type, id)

  // 2. Fetch all content in parallel
  const [services, municipalMarkers, officials, foundations] = await Promise.all([
    // Services with coords filtered by ZIP
    getServicesWithCoords(zips.length > 0 ? zips : undefined),

    // Municipal services (citywide, no ZIP filter)
    getMunicipalServiceMarkers(),

    // Officials — query by district assignments from the resolved ZIP
    (async function () {
      if (zips.length === 0) return []
      // Get district info from first ZIP
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

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      filterParts += ',level.eq.City'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, level, party, email, office_phone, website, photo_url')
        .or(filterParts)
      return data ?? []
    })(),

    // Foundations via foundation_zip_coverage (REST API — table not in generated types)
    (async function () {
      if (zips.length === 0) return []
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const hd = { apikey: key, Authorization: 'Bearer ' + key }
      const zipParams = zips.slice(0, 20).join(',')
      const covRes = await fetch(
        url + '/rest/v1/foundation_zip_coverage?zip_code=in.(' + zipParams + ')&select=foundation_id',
        { headers: hd }
      )
      const coverage: Array<{ foundation_id: string }> = covRes.ok ? await covRes.json() : []
      const foundationIds = Array.from(new Set(coverage.map(function (c) { return c.foundation_id })))
      if (foundationIds.length === 0) return []
      const fRes = await fetch(
        url + '/rest/v1/foundations?id=in.(' + foundationIds.join(',') + ')&select=id,name,mission,assets,website_url&order=name&limit=50',
        { headers: hd }
      )
      return fRes.ok ? fRes.json() : []
    })(),
  ])

  // 3. Fetch orgs + voting per-ZIP in parallel
  const orgResults = await Promise.all(
    zips.slice(0, 10).map(function (z) { return getOrganizationsWithCoords(z) })
  )
  const votingResults = await Promise.all(
    zips.slice(0, 10).map(function (z) { return getVotingLocationsWithCoords(z) })
  )

  // 4. Build markers array
  const markers: MarkerData[] = []

  // Service markers from services_211
  services.forEach(function (s) {
    if (s.latitude && s.longitude) {
      markers.push({
        id: s.service_id || s.org_id || ('svc-' + markers.length),
        lat: Number(s.latitude),
        lng: Number(s.longitude),
        title: s.service_name || s.org_name || 'Service',
        type: 'service',
        address: [s.address, s.city].filter(Boolean).join(', ') || null,
        phone: s.phone || null,
        link: s.org_id ? '/services?org=' + s.org_id : null,
      })
    }
  })

  // Municipal service markers
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

  // Organization markers
  const seenOrgIds = new Set<string>()
  orgResults.flat().forEach(function (o) {
    if (seenOrgIds.has(o.org_id)) return
    seenOrgIds.add(o.org_id)
    markers.push({
      id: o.org_id,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      title: o.org_name || 'Organization',
      type: 'organization',
      address: [o.address, o.city].filter(Boolean).join(', ') || null,
      phone: null,
      link: '/services?org=' + o.org_id,
    })
  })

  // Voting location markers
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
  })

  return NextResponse.json({
    markers,
    officials,
    foundations,
  })
}
