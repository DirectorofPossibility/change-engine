import { CORS, corsResponse } from '../_shared/cors.ts'
import { getCallerRole, requireRole } from '../_shared/auth.ts'

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  // Only service_role or partner can geocode
  const caller = await getCallerRole(req)
  const forbidden = requireRole(caller, ['service_role', 'partner'])
  if (forbidden) return forbidden

  try {
    const { address, city, state, zip } = await req.json()
    if (!address && !zip) {
      return corsResponse({ error: 'address or zip is required' }, 400)
    }

    const fullAddress = [address, city, state, zip].filter(Boolean).join(', ')
    const addressHash = await sha256(fullAddress.toLowerCase().trim())

    // Check cache
    const cacheRes = await fetch(
      `${SUPABASE_URL}/rest/v1/geocode_cache?address_hash=eq.${addressHash}&select=latitude,longitude&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
        },
      }
    )
    const cached = await cacheRes.json()

    if (cached && cached.length > 0) {
      return corsResponse({
        latitude: cached[0].latitude,
        longitude: cached[0].longitude,
        cached: true,
      })
    }

    // Call Google Geocoding API
    const encoded = encodeURIComponent(fullAddress)
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${GOOGLE_MAPS_API_KEY}`
    )
    const geoData = await geoRes.json()

    if (geoData.status !== 'OK' || !geoData.results?.[0]) {
      return corsResponse({ error: 'Geocoding failed', status: geoData.status }, 404)
    }

    const location = geoData.results[0].geometry.location
    const lat = location.lat
    const lng = location.lng

    // Store in cache
    await fetch(`${SUPABASE_URL}/rest/v1/geocode_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        address_hash: addressHash,
        raw_address: fullAddress,
        latitude: lat,
        longitude: lng,
      }),
    })

    return corsResponse({ latitude: lat, longitude: lng, cached: false })
  } catch (err) {
    return corsResponse({ error: 'Internal error', detail: String(err) }, 500)
  }
})
