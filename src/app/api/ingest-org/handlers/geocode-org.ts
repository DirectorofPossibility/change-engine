/**
 * @fileoverview Geocode an organization's street address and resolve all districts.
 *
 * Pipeline:
 *   1. Extract address from scraped HTML (schema.org, footer, contact page)
 *   2. Geocode via Census Bureau API (free, no key)
 *   3. Resolve ZIP → all district IDs via zip_codes table
 *   4. Resolve ZIP → neighborhood → super neighborhood
 *   5. Cache district_data JSONB on org record
 *   6. Populate organization_neighborhoods junction
 *
 * The org's address becomes the root of all geographic connections.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Address extraction from HTML ──────────────────────────────────────

/**
 * Try to extract a street address from page HTML.
 * Looks for schema.org markup, common footer patterns, and structured data.
 */
export function extractAddress(html: string): {
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
} | null {
  const result: Record<string, string> = {}

  // 1. Schema.org JSON-LD (most reliable)
  const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonLdMatches) {
    const jsonText = block.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim()
    try {
      const data = JSON.parse(jsonText)
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const addr = item.address || item.location?.address
        if (addr) {
          if (typeof addr === 'string') {
            result.address = addr
          } else {
            if (addr.streetAddress) result.address = addr.streetAddress
            if (addr.addressLocality) result.city = addr.addressLocality
            if (addr.addressRegion) result.state = addr.addressRegion
            if (addr.postalCode) result.zip = addr.postalCode
          }
        }
        if (item.telephone) result.phone = item.telephone
        if (item.email) result.email = item.email
      }
    } catch { /* invalid JSON-LD, skip */ }
  }

  // 2. Schema.org microdata (itemprop attributes)
  const streetMatch = html.match(/itemprop="streetAddress"[^>]*>([^<]+)/i)
    || html.match(/itemprop="address"[^>]*>([^<]+)/i)
  if (streetMatch && !result.address) result.address = streetMatch[1].trim()

  const cityMatch = html.match(/itemprop="addressLocality"[^>]*>([^<]+)/i)
  if (cityMatch && !result.city) result.city = cityMatch[1].trim()

  const stateMatch = html.match(/itemprop="addressRegion"[^>]*>([^<]+)/i)
  if (stateMatch && !result.state) result.state = stateMatch[1].trim()

  const zipMatch = html.match(/itemprop="postalCode"[^>]*>([^<]+)/i)
  if (zipMatch && !result.zip) result.zip = zipMatch[1].trim()

  const phoneMatch = html.match(/itemprop="telephone"[^>]*>([^<]+)/i)
    || html.match(/href="tel:([^"]+)"/i)
  if (phoneMatch && !result.phone) result.phone = phoneMatch[1].trim()

  const emailMatch = html.match(/itemprop="email"[^>]*>([^<]+)/i)
    || html.match(/href="mailto:([^"]+)"/i)
  if (emailMatch && !result.email) result.email = emailMatch[1].replace(/\?.*$/, '').trim()

  // 3. Common address patterns in text (fallback)
  if (!result.address) {
    // Look for "123 Main St" style addresses near city/state/zip
    const addrPattern = /(\d{2,5}\s+[A-Z][a-zA-Z\s.]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Ln|Lane|Way|Pkwy|Parkway|Ct|Court|Pl|Place|Hwy|Highway|Loop|Circle|Cir)[.,]?\s*(?:(?:Suite|Ste|Apt|#|Unit)\s*\d+[A-Za-z]?)?)/i
    const addrMatch = html.match(addrPattern)
    if (addrMatch) result.address = addrMatch[1].trim()
  }

  // 4. ZIP code from text (common Houston patterns)
  if (!result.zip) {
    const zipPattern = /\b(7[0-9]{4})\b/  // Houston ZIPs start with 77
    const zipTextMatch = html.match(zipPattern)
    if (zipTextMatch) result.zip = zipTextMatch[1]
  }

  // 5. Phone from text
  if (!result.phone) {
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    const phoneTextMatch = html.match(phonePattern)
    if (phoneTextMatch) result.phone = phoneTextMatch[0]
  }

  return Object.keys(result).length > 0 ? result : null
}

// ── Census Bureau geocoding ───────────────────────────────────────────

interface GeocodeResult {
  lat: number
  lng: number
  zip: string
  formattedAddress: string
}

/**
 * Geocode a street address via US Census Bureau API (free, no key needed).
 */
export async function geocodeAddress(address: string, city?: string, state?: string, zip?: string): Promise<GeocodeResult | null> {
  const fullAddress = [address, city, state, zip].filter(Boolean).join(', ')
  if (!fullAddress || fullAddress.length < 10) return null

  const censusUrl = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
  censusUrl.searchParams.set('address', fullAddress)
  censusUrl.searchParams.set('benchmark', 'Public_AR_Current')
  censusUrl.searchParams.set('format', 'json')

  try {
    const res = await fetch(censusUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const data = await res.json()
    const matches = data.result?.addressMatches
    if (!matches || matches.length === 0) return null

    const match = matches[0]
    return {
      lat: match.coordinates.y,
      lng: match.coordinates.x,
      zip: match.addressComponents.zip,
      formattedAddress: match.matchedAddress,
    }
  } catch {
    return null
  }
}

// ── District resolution from ZIP ──────────────────────────────────────

export interface OrgGeo {
  zip: string
  lat: number
  lng: number
  formattedAddress: string
  neighborhoodId: string | null
  neighborhoodName: string | null
  superNeighborhoodId: string | null
  superNeighborhoodName: string | null
  councilDistrict: string | null
  congressionalDistrict: string | null
  stateHouseDistrict: string | null
  stateSenateDistrict: string | null
  countyId: string | null
}

/**
 * Resolve a ZIP code to all district IDs using the zip_codes table
 * and neighborhood junction tables.
 */
async function resolveDistricts(zip: string): Promise<Omit<OrgGeo, 'lat' | 'lng' | 'formattedAddress'> | null> {
  // Look up zip_codes table
  const zipData = await supaRest('GET', `zip_codes?zip_code=eq.${zip}&select=*&limit=1`).catch(() => [])
  if (!zipData || zipData.length === 0) return null

  const zd = zipData[0]

  // Look up neighborhood
  const hoodJunction = await supaRest('GET', `neighborhood_zip_codes?zip_code=eq.${zip}&select=neighborhood_id&limit=1`).catch(() => [])

  let neighborhoodId: string | null = null
  let neighborhoodName: string | null = null
  let superNeighborhoodId: string | null = null
  let superNeighborhoodName: string | null = null
  let councilDistrict: string | null = null

  if (hoodJunction && hoodJunction.length > 0) {
    neighborhoodId = hoodJunction[0].neighborhood_id
    const hood = await supaRest('GET', `neighborhoods?neighborhood_id=eq.${encodeURIComponent(neighborhoodId!)}&select=neighborhood_name,super_neighborhood_id,council_district&limit=1`).catch(() => [])
    if (hood && hood.length > 0) {
      neighborhoodName = hood[0].neighborhood_name
      superNeighborhoodId = hood[0].super_neighborhood_id
      councilDistrict = hood[0].council_district || null
    }
    if (superNeighborhoodId) {
      const sn = await supaRest('GET', `super_neighborhoods?sn_id=eq.${encodeURIComponent(superNeighborhoodId)}&select=sn_name&limit=1`).catch(() => [])
      if (sn && sn.length > 0) superNeighborhoodName = sn[0].sn_name
    }
  }

  return {
    zip,
    neighborhoodId,
    neighborhoodName,
    superNeighborhoodId,
    superNeighborhoodName,
    councilDistrict,
    congressionalDistrict: zd.congressional_district || null,
    stateHouseDistrict: zd.state_house_district || null,
    stateSenateDistrict: zd.state_senate_district || null,
    countyId: zd.county_id || null,
  }
}

// ── Main geocode + resolve pipeline ───────────────────────────────────

/**
 * Full org geocoding pipeline:
 *   1. Extract address from HTML
 *   2. Geocode to lat/lng + ZIP
 *   3. Resolve ZIP to all districts
 *   4. Update org record with address, lat/lng, district_data
 *   5. Populate organization_neighborhoods junction
 *
 * Returns the full OrgGeo or null if address couldn't be resolved.
 */
export async function geocodeOrg(
  orgId: string,
  html: string,
  existingAddress?: { address?: string; city?: string; state?: string; zip_code?: string },
): Promise<OrgGeo | null> {

  // Try existing address first, then extract from HTML
  let addr = existingAddress?.address ? existingAddress : null
  if (!addr || !addr.address) {
    const extracted = extractAddress(html)
    if (extracted) {
      addr = {
        address: extracted.address,
        city: extracted.city,
        state: extracted.state,
        zip_code: extracted.zip,
      }
    }
  }

  if (!addr || !addr.address) return null

  // Geocode
  const geocoded = await geocodeAddress(addr.address, addr.city, addr.state, addr.zip_code)
  if (!geocoded) return null

  // Resolve districts from ZIP
  const districts = await resolveDistricts(geocoded.zip)
  if (!districts) return null

  const orgGeo: OrgGeo = {
    ...districts,
    lat: geocoded.lat,
    lng: geocoded.lng,
    formattedAddress: geocoded.formattedAddress,
  }

  // Update org record
  const orgUpdate: Record<string, unknown> = {
    address: addr.address,
    city: addr.city || geocoded.formattedAddress.split(',').slice(-3, -2)[0]?.trim(),
    state: addr.state || 'TX',
    zip_code: geocoded.zip,
    latitude: geocoded.lat,
    longitude: geocoded.lng,
    geocoded_at: new Date().toISOString(),
    district_data: {
      zip: orgGeo.zip,
      neighborhoodId: orgGeo.neighborhoodId,
      neighborhoodName: orgGeo.neighborhoodName,
      superNeighborhoodId: orgGeo.superNeighborhoodId,
      superNeighborhoodName: orgGeo.superNeighborhoodName,
      councilDistrict: orgGeo.councilDistrict,
      congressionalDistrict: orgGeo.congressionalDistrict,
      stateHouseDistrict: orgGeo.stateHouseDistrict,
      stateSenateDistrict: orgGeo.stateSenateDistrict,
      countyId: orgGeo.countyId,
    },
  }

  await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(orgId)}`, orgUpdate).catch(e => {
    console.error('Failed to update org with geo data:', (e as Error).message)
  })

  // Populate organization_neighborhoods junction
  if (orgGeo.neighborhoodId) {
    await fetch(`${SUPABASE_URL}/rest/v1/organization_neighborhoods`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=minimal',
      },
      body: JSON.stringify({ org_id: orgId, neighborhood_id: orgGeo.neighborhoodId }),
    }).catch(() => {})
  }

  // Also update phone/email if extracted
  const extracted = extractAddress(html)
  if (extracted) {
    const contactUpdate: Record<string, unknown> = {}
    if (extracted.phone) contactUpdate.phone = extracted.phone
    if (extracted.email) contactUpdate.email = extracted.email
    if (Object.keys(contactUpdate).length > 0) {
      await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(orgId)}`, contactUpdate).catch(() => {})
    }
  }

  return orgGeo
}

// ── Profile completeness score ────────────────────────────────────────

/**
 * Calculate a 0-100 profile completeness score for an org.
 */
export function calculateProfileCompleteness(org: Record<string, any>): number {
  let score = 0
  if (org.address) score += 20
  if (org.latitude && org.longitude) score += 10
  if (org.district_data) score += 10
  if (org.classification_v2 || org.focus_area_ids) score += 15
  if (org.org_type) score += 5
  if (org.description_5th_grade || org.description_full) score += 5
  if ((org.objects_cataloged || 0) >= 1) score += 10
  if ((org.objects_cataloged || 0) >= 5) score += 10
  if (org.phone || org.email) score += 5
  if (org.logo_url || org.hero_image_url) score += 5
  if (org.mission_statement) score += 5
  return Math.min(score, 100)
}
