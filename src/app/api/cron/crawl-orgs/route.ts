/**
 * @fileoverview POST /api/cron/crawl-orgs — Re-crawl stale organizations.
 *
 * Finds organizations that haven't been crawled recently (based on
 * crawl_frequency_days) and triggers a re-crawl for each. Also detects
 * dead pages (404s) and marks child entities as inactive.
 *
 * The re-crawl uses deterministic entity IDs, so existing entities get
 * updated and new pages become new entities — no duplicates.
 *
 * Processes up to 3 orgs per run to stay within Vercel's 60s timeout.
 *
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Weekly on Sundays at 4 AM CT.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET

const MAX_ORGS_PER_RUN = 3

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{
    org_id: string
    org_name: string
    website: string
    status: string
    entities_created?: number
    stale_deactivated?: number
    error?: string
  }> = []

  try {
    // Find orgs that are due for re-crawl:
    // 1. data_source = 'org_crawl' (were previously crawled)
    // 2. crawl_status is not 'disabled'
    // 3. last_crawled_at is null OR older than crawl_frequency_days
    // Order by oldest crawl first
    const staleOrgs = await supaRest(
      'GET',
      `organizations?data_source=eq.org_crawl&crawl_status=not.eq.disabled&select=org_id,org_name,website,last_crawled_at,crawl_frequency_days&order=last_crawled_at.asc.nullsfirst&limit=${MAX_ORGS_PER_RUN}`,
    )

    if (!staleOrgs || staleOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations due for re-crawl',
        processed: 0,
      })
    }

    // Filter to only those actually due (last_crawled_at + frequency_days < now)
    const now = Date.now()
    const dueOrgs = staleOrgs.filter((org: any) => {
      if (!org.last_crawled_at) return true // never crawled
      const lastCrawl = new Date(org.last_crawled_at).getTime()
      const frequencyMs = (org.crawl_frequency_days || 30) * 24 * 60 * 60 * 1000
      return (now - lastCrawl) > frequencyMs
    })

    if (dueOrgs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No organizations due for re-crawl',
        processed: 0,
      })
    }

    for (const org of dueOrgs) {
      try {
        // Mark as actively crawling
        await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(org.org_id)}`, {
          crawl_status: 'active',
        })

        // Step 1: Check for dead child entities (pages that now 404)
        const staleDeactivated = await checkForDeadPages(org.org_id)

        // Step 2: Trigger re-crawl via internal API
        const baseUrl = req.nextUrl.origin
        const crawlRes = await fetch(`${baseUrl}/api/ingest-org`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({
            url: org.website,
            org_name: org.org_name,
            max_pages: 30,
          }),
          signal: AbortSignal.timeout(50000), // 50s timeout per org
        })

        if (!crawlRes.ok) {
          const errText = await crawlRes.text()
          throw new Error(`Crawl failed: ${crawlRes.status} ${errText}`)
        }

        const crawlData = await crawlRes.json()

        // Update org tracking
        await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(org.org_id)}`, {
          last_crawled_at: new Date().toISOString(),
          crawl_status: 'completed',
          pages_found: crawlData.pages_discovered || 0,
          entities_found: crawlData.entities_created || 0,
        })

        results.push({
          org_id: org.org_id,
          org_name: org.org_name,
          website: org.website,
          status: 'success',
          entities_created: crawlData.entities_created || 0,
          stale_deactivated: staleDeactivated,
        })
      } catch (e) {
        // Mark as failed
        await supaRest('PATCH', `organizations?org_id=eq.${encodeURIComponent(org.org_id)}`, {
          crawl_status: 'failed',
        }).catch(() => {})

        results.push({
          org_id: org.org_id,
          org_name: org.org_name,
          website: org.website,
          status: 'error',
          error: (e as Error).message,
        })
      }
    }

    // Log summary
    const succeeded = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length
    const totalEntities = results.reduce((sum, r) => sum + (r.entities_created || 0), 0)

    await supaRest('POST', 'ingestion_log', {
      event_type: 'cron_crawl_orgs',
      source: 'cron',
      status: failed === 0 ? 'success' : 'partial',
      message: `Re-crawled ${succeeded}/${results.length} orgs, ${totalEntities} entities created, ${failed} failed`,
      item_count: totalEntities,
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      processed: results.length,
      succeeded,
      failed,
      total_entities_created: totalEntities,
      results,
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

/**
 * Check child entities for dead pages (404s).
 * If a service/event/opportunity's source URL returns 404,
 * mark it as inactive so it stops showing up in results.
 */
async function checkForDeadPages(orgId: string): Promise<number> {
  let deactivated = 0

  // Check services linked to this org
  const services = await supaRest(
    'GET',
    `services_211?org_id=eq.${encodeURIComponent(orgId)}&is_active=eq.Yes&select=service_id,website&limit=50`,
  ).catch(() => [])

  // Check events
  const events = await supaRest(
    'GET',
    `events?org_id=eq.${encodeURIComponent(orgId)}&is_active=eq.Yes&select=event_id,registration_url&limit=50`,
  ).catch(() => [])

  // Check opportunities
  const opportunities = await supaRest(
    'GET',
    `opportunities?org_id=eq.${encodeURIComponent(orgId)}&is_active=eq.Yes&select=opportunity_id,registration_url&limit=50`,
  ).catch(() => [])

  // Spot-check up to 10 URLs total to stay within time limits
  const urlChecks: Array<{ table: string; idCol: string; id: string; url: string }> = []

  for (const s of (services || []).slice(0, 4)) {
    if (s.website) urlChecks.push({ table: 'services_211', idCol: 'service_id', id: s.service_id, url: s.website })
  }
  for (const e of (events || []).slice(0, 3)) {
    if (e.registration_url) urlChecks.push({ table: 'events', idCol: 'event_id', id: e.event_id, url: e.registration_url })
  }
  for (const o of (opportunities || []).slice(0, 3)) {
    if (o.registration_url) urlChecks.push({ table: 'opportunities', idCol: 'opportunity_id', id: o.opportunity_id, url: o.registration_url })
  }

  for (const check of urlChecks) {
    try {
      const res = await fetch(check.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChangeEngine/1.0; +https://changeengine.us)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      })

      if (res.status === 404 || res.status === 410) {
        // Page is gone — deactivate the entity
        await supaRest(
          'PATCH',
          `${check.table}?${check.idCol}=eq.${encodeURIComponent(check.id)}`,
          { is_active: 'No', last_updated: new Date().toISOString() },
        ).catch(() => {})
        deactivated++
      }
    } catch {
      // Timeout or network error — don't deactivate, might be temporary
    }
  }

  return deactivated
}

export async function GET() {
  return NextResponse.json({
    service: 'Change Engine Org Re-crawl Cron',
    description: 'Re-crawls stale organizations to keep entity data fresh and detect dead pages',
    schedule: 'Weekly on Sundays at 4 AM CT',
    max_orgs_per_run: MAX_ORGS_PER_RUN,
  })
}
