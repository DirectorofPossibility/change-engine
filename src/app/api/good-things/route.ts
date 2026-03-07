/**
 * @fileoverview API for "Three Good Things" submissions.
 *
 * POST /api/good-things  — submit a new entry (geocodes ZIP to lat/lng)
 * GET  /api/good-things   — fetch recent entries for the map
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ZIP → lat/lng: try Census geocoder, then fall back to Zippopotam.us
async function geocodeZip(zip: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  // Try Census geocoder first
  try {
    const url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=' +
      encodeURIComponent(zip + ', USA') + '&benchmark=Public_AR_Current&format=json'
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      const match = data.result?.addressMatches?.[0]
      if (match) {
        return {
          lat: match.coordinates.y,
          lng: match.coordinates.x,
          city: match.addressComponents?.city || '',
          state: match.addressComponents?.state || '',
        }
      }
    }
  } catch { /* fall through */ }

  // Fallback: Zippopotam.us (free, no key needed)
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip, { signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      const data = await res.json()
      const place = data.places?.[0]
      if (place) {
        return {
          lat: parseFloat(place.latitude),
          lng: parseFloat(place.longitude),
          city: place['place name'] || '',
          state: place['state abbreviation'] || '',
        }
      }
    }
  } catch { /* fall through */ }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { thing_1, thing_2, thing_3, zip_code, email, display_name } = body

    if (!thing_1?.trim() || !thing_2?.trim() || !thing_3?.trim()) {
      return NextResponse.json({ error: 'All three good things are required' }, { status: 400 })
    }
    if (!zip_code?.trim() || !/^\d{5}$/.test(zip_code.trim())) {
      return NextResponse.json({ error: 'Valid 5-digit ZIP code required' }, { status: 400 })
    }

    // Geocode the ZIP
    const geo = await geocodeZip(zip_code.trim())

    const supabase = await createClient()
    const { data, error } = await (supabase as any)
      .from('good_things')
      .insert({
        thing_1: thing_1.trim(),
        thing_2: thing_2.trim(),
        thing_3: thing_3.trim(),
        zip_code: zip_code.trim(),
        display_name: display_name?.trim() || null,
        email: email?.trim() || null,
        latitude: geo?.lat || null,
        longitude: geo?.lng || null,
        city: geo?.city || null,
        state: geo?.state || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(
      url + '/rest/v1/good_things?select=id,thing_1,thing_2,thing_3,zip_code,city,state,latitude,longitude,display_name,created_at&order=created_at.desc&limit=500',
      {
        headers: { apikey: key, Authorization: 'Bearer ' + key },
        next: { revalidate: 0 },
      }
    )
    if (!res.ok) return NextResponse.json({ entries: [] })

    const entries = await res.json()
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ entries: [] })
  }
}
