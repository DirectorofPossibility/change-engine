/**
 * @fileoverview Address geocoding + district resolution API.
 *
 * Accepts an address string, geocodes it via the US Census Bureau geocoder,
 * then runs server-side point-in-polygon against local GeoJSON boundary files
 * to resolve the exact council district, congressional district, state house/
 * senate districts, and super neighborhood.
 *
 * @route POST /api/geocode
 * @body { address: string }
 * @returns { zip, lat, lng, districts, formattedAddress }
 */

import { NextRequest, NextResponse } from 'next/server'
import { resolveAllDistricts } from '@/lib/geo-lookup'

interface CensusResult {
  addressMatches: Array<{
    matchedAddress: string
    coordinates: { x: number; y: number }
    addressComponents: {
      zip: string
      city: string
      state: string
    }
  }>
}

interface CensusResponse {
  result: CensusResult
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const address = body.address

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // Call Census Bureau geocoder (free, no API key needed)
    const censusUrl = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
    censusUrl.searchParams.set('address', address.trim())
    censusUrl.searchParams.set('benchmark', 'Public_AR_Current')
    censusUrl.searchParams.set('format', 'json')

    const censusRes = await fetch(censusUrl.toString(), {
      headers: { 'Accept': 'application/json' },
    })

    if (!censusRes.ok) {
      return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 502 })
    }

    const censusData: CensusResponse = await censusRes.json()
    const matches = censusData.result?.addressMatches

    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }

    const match = matches[0]
    const lng = match.coordinates.x
    const lat = match.coordinates.y
    const zip = match.addressComponents.zip
    const formattedAddress = match.matchedAddress

    // Resolve all districts via point-in-polygon
    const districts = resolveAllDistricts(lng, lat)

    return NextResponse.json({
      zip,
      lat,
      lng,
      formattedAddress,
      districts,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
