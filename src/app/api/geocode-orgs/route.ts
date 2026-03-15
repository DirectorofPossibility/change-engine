/**
 * @fileoverview POST /api/geocode-orgs — Batch geocode organizations missing coordinates.
 *
 * Scrapes each org's website to extract address, geocodes via Census Bureau API,
 * resolves districts, and updates the org record.
 *
 * Auth: API key or CRON_SECRET bearer token.
 *
 * Request: { limit?: number, service_area?: string }
 * Response: { processed, geocoded, failed, results[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'
import { geocodeOrg, extractAddress } from '@/app/api/ingest-org/handlers/geocode-org'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

async function supaRest(method: string, path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) return []
  return res.json()
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChangeEngine/1.0; +https://www.changeengine.us)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html')) return null
    return res.text()
  } catch {
    return null
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const limit = Math.min(body.limit || 20, 50)
  const serviceArea = body.service_area || 'Greater Houston'

  // Get orgs missing coordinates
  const orgs = await supaRest(
    'GET',
    `organizations?latitude=is.null&service_area=eq.${encodeURIComponent(serviceArea)}&select=org_id,org_name,website,address,city,state,zip_code&limit=${limit}&order=org_name`
  )

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ message: 'No orgs need geocoding', processed: 0, geocoded: 0, failed: 0, results: [] })
  }

  const results: Array<{ org_id: string; org_name: string; status: string; address?: string; lat?: number; lng?: number }> = []
  let geocoded = 0
  let failed = 0

  for (const org of orgs) {
    // Rate limit: 1 request per second (Census Bureau + website scraping)
    if (results.length > 0) {
      await new Promise(function (resolve) { setTimeout(resolve, 1200) })
    }

    try {
      // Try to scrape the website for address
      let html = ''
      if (org.website) {
        const fetched = await fetchHtml(org.website)
        if (fetched) html = fetched

        // Also try /contact page
        if (!html || !extractAddress(html)?.address) {
          const contactUrl = org.website.replace(/\/$/, '') + '/contact'
          const contactHtml = await fetchHtml(contactUrl)
          if (contactHtml) {
            const contactAddr = extractAddress(contactHtml)
            if (contactAddr?.address) html = contactHtml
          }
        }

        // Also try /about page
        if (!html || !extractAddress(html)?.address) {
          const aboutUrl = org.website.replace(/\/$/, '') + '/about'
          const aboutHtml = await fetchHtml(aboutUrl)
          if (aboutHtml) {
            const aboutAddr = extractAddress(aboutHtml)
            if (aboutAddr?.address) html = aboutHtml
          }
        }
      }

      const geo = await geocodeOrg(
        org.org_id,
        html || '',
        { address: org.address, city: org.city, state: org.state, zip_code: org.zip_code }
      )

      if (geo) {
        geocoded++
        results.push({
          org_id: org.org_id,
          org_name: org.org_name,
          status: 'geocoded',
          address: geo.formattedAddress,
          lat: geo.lat,
          lng: geo.lng,
        })
      } else {
        failed++
        results.push({
          org_id: org.org_id,
          org_name: org.org_name,
          status: 'no_address_found',
        })
      }
    } catch (e) {
      failed++
      results.push({
        org_id: org.org_id,
        org_name: org.org_name,
        status: 'error: ' + (e as Error).message,
      })
    }
  }

  return NextResponse.json({
    processed: orgs.length,
    geocoded,
    failed,
    remaining: Math.max(0, (await supaRest('GET', `organizations?latitude=is.null&service_area=eq.${encodeURIComponent(serviceArea)}&select=org_id&limit=1000`)).length - orgs.length),
    results,
  })
}
