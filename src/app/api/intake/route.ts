/**
 * @fileoverview POST /api/intake — Unified data intake for The Change Engine.
 *
 * Single entry point for ALL data flowing into the platform. Accepts any
 * entity type, routes to the correct handler, and ensures everything gets
 * classified across all 16 taxonomy dimensions with junction tables populated.
 *
 * Supported intake modes:
 *   1. Content URLs:     { "type": "content", "urls": ["..."] }
 *   2. Entity records:   { "type": "officials"|"policies"|"services"|"organizations"|"opportunities", "items": [...] }
 *   3. RSS feed add:     { "type": "rss_feed", "feed_url": "...", "feed_name": "..." }
 *   4. Sync trigger:     { "type": "sync", "source": "google_civic"|"congress"|"legistar"|"texas"|"rss"|"all" }
 *   5. Classify sweep:   { "type": "classify", "table": "...", "limit": 10 }
 *
 * Every path ends with: data in table → classified → junction tables populated → logged.
 *
 * Auth: API key (x-api-key header) or CRON_SECRET bearer token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateApiRequest } from '@/lib/api-auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Edge function ${name}: ${res.status} ${errText}`)
  }
  return res.json()
}

async function callInternalApi(path: string, body: Record<string, unknown>, req: NextRequest) {
  const baseUrl = req.nextUrl.origin
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.headers.get('x-api-key') || '',
      'Authorization': req.headers.get('authorization') || '',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Internal API ${path}: ${res.status} ${errText}`)
  }
  return res.json()
}

async function log(eventType: string, source: string, status: string, message: string, itemCount?: number) {
  try {
    await supaRest('POST', 'ingestion_log', {
      event_type: eventType,
      source,
      status,
      message,
      item_count: itemCount || 0,
    })
  } catch (e) {
    console.error('Failed to log:', e)
  }
}

// ── Handler: Content URLs ──────────────────────────────────────────────
async function handleContentUrls(urls: string[], req: NextRequest) {
  const result = await callInternalApi('/api/ingest', { urls }, req)
  await log('intake_content', 'api', 'success', `Ingested ${urls.length} URLs`, urls.length)
  return result
}

// ── Handler: Entity records (upsert + classify) ────────────────────────
async function handleEntityRecords(
  entityType: string,
  items: Record<string, unknown>[],
  req: NextRequest,
) {
  const TABLE_MAP: Record<string, { table: string; idCol: string }> = {
    officials: { table: 'elected_officials', idCol: 'official_id' },
    policies: { table: 'policies', idCol: 'policy_id' },
    services: { table: 'services_211', idCol: 'service_id' },
    organizations: { table: 'organizations', idCol: 'org_id' },
    opportunities: { table: 'opportunities', idCol: 'opportunity_id' },
    agencies: { table: 'agencies', idCol: 'agency_id' },
    campaigns: { table: 'campaigns', idCol: 'campaign_id' },
    benefit_programs: { table: 'benefit_programs', idCol: 'benefit_id' },
  }

  const config = TABLE_MAP[entityType]
  if (!config) {
    return { error: `Unknown entity type: ${entityType}. Supported: ${Object.keys(TABLE_MAP).join(', ')}` }
  }

  // Upsert records
  const upserted = await supaRest(
    'POST',
    `${config.table}?on_conflict=${config.idCol}`,
    items,
  )
  const count = Array.isArray(upserted) ? upserted.length : 0

  // Trigger classification for upserted items
  const ids = items.map(i => i[config.idCol]).filter(Boolean) as string[]
  let classifyResult = null
  if (ids.length > 0 && ANTHROPIC_KEY) {
    try {
      classifyResult = await callInternalApi('/api/enrich-entity', {
        table: config.table,
        ids,
        force: false,
      }, req)
    } catch (err) {
      console.error(`Classification failed for ${entityType}:`, (err as Error).message)
    }
  }

  await log('intake_entity', entityType, 'success',
    `Upserted ${count} ${entityType}, classified ${classifyResult?.succeeded || 0}`,
    count)

  return {
    entity_type: entityType,
    table: config.table,
    upserted: count,
    classification: classifyResult ? {
      succeeded: classifyResult.succeeded,
      failed: classifyResult.failed,
      skipped: classifyResult.skipped,
    } : null,
  }
}

// ── Handler: Add RSS feed ──────────────────────────────────────────────
async function handleRssFeed(feedUrl: string, feedName: string) {
  const result = await supaRest('POST', 'rss_feeds?on_conflict=feed_url', {
    feed_url: feedUrl,
    feed_name: feedName || new URL(feedUrl).hostname,
    is_active: true,
  })

  // Immediately poll this feed
  let pollResult = null
  try {
    pollResult = await callEdgeFunction('rss-proxy', {
      mode: 'poll_single',
      feed_url: feedUrl,
    })
  } catch (err) {
    // poll_single may not be supported, try poll_all
    console.error('Single feed poll failed, will be picked up on next cron:', (err as Error).message)
  }

  await log('intake_rss', feedUrl, 'success', `Added RSS feed: ${feedName || feedUrl}`, 1)
  return { feed_added: true, feed_url: feedUrl, immediate_poll: pollResult }
}

// ── Handler: Sync trigger ──────────────────────────────────────────────
async function handleSync(source: string) {
  const results: Record<string, unknown> = {}

  const sources = source === 'all'
    ? ['google_civic', 'legistar', 'texas', 'rss']
    : [source]

  for (const src of sources) {
    try {
      switch (src) {
        case 'google_civic':
        case 'congress':
          results[src] = await callEdgeFunction('sync-officials', {
            mode: 'full',
            trigger_classify: true,
          })
          break
        case 'legistar':
          results[src] = await callEdgeFunction('sync-city-houston', {
            mode: 'recent',
            trigger_classify: true,
          })
          break
        case 'texas':
          results[src] = await callEdgeFunction('sync-state-texas', {
            mode: 'recent',
            trigger_classify: true,
            source: 'both',
          })
          break
        case 'rss':
          results[src] = await callEdgeFunction('rss-proxy', {
            mode: 'poll_all',
          })
          break
        default:
          results[src] = { error: `Unknown sync source: ${src}` }
      }
    } catch (err) {
      results[src] = { error: (err as Error).message }
    }
  }

  await log('intake_sync', source, 'success', `Triggered sync: ${sources.join(', ')}`)
  return { syncs_triggered: sources, results }
}

// ── Handler: Classify sweep ────────────────────────────────────────────
async function handleClassifySweep(table: string, limit: number, req: NextRequest) {
  const result = await callInternalApi('/api/enrich-entity', {
    table,
    limit,
    force: false,
  }, req)
  await log('intake_classify', table, 'success',
    `Classified ${result.succeeded}/${result.processed} in ${table}`,
    result.processed)
  return result
}

// ── Main route ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authError = await validateApiRequest(req)
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const intakeType: string = body.type || 'content'

  try {
    let result: unknown

    switch (intakeType) {
      case 'content': {
        const urls = body.urls || (body.url ? [body.url] : [])
        if (urls.length === 0) {
          return NextResponse.json({ error: 'No URLs provided. Use { "type": "content", "urls": ["..."] }' }, { status: 400 })
        }
        if (urls.length > 50) {
          return NextResponse.json({ error: `Too many URLs (${urls.length}). Maximum 50 per request.` }, { status: 400 })
        }
        result = await handleContentUrls(urls, req)
        break
      }

      case 'officials':
      case 'policies':
      case 'services':
      case 'organizations':
      case 'opportunities':
      case 'agencies':
      case 'campaigns':
      case 'benefit_programs': {
        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
          return NextResponse.json({ error: `No items provided. Use { "type": "${intakeType}", "items": [...] }` }, { status: 400 })
        }
        if (body.items.length > 500) {
          return NextResponse.json({ error: `Too many items (${body.items.length}). Maximum 500 per request.` }, { status: 400 })
        }
        result = await handleEntityRecords(intakeType, body.items, req)
        break
      }

      case 'rss_feed': {
        if (!body.feed_url) {
          return NextResponse.json({ error: 'No feed_url provided. Use { "type": "rss_feed", "feed_url": "..." }' }, { status: 400 })
        }
        result = await handleRssFeed(body.feed_url, body.feed_name || '')
        break
      }

      case 'sync': {
        if (!body.source) {
          return NextResponse.json({ error: 'No source provided. Use { "type": "sync", "source": "google_civic"|"legistar"|"texas"|"rss"|"all" }' }, { status: 400 })
        }
        result = await handleSync(body.source)
        break
      }

      case 'classify': {
        const table = body.table || 'elected_officials'
        const limit = Math.min(body.limit || 10, 50)
        result = await handleClassifySweep(table, limit, req)
        break
      }

      default:
        return NextResponse.json({
          error: `Unknown intake type: ${intakeType}`,
          supported: ['content', 'officials', 'policies', 'services', 'organizations', 'opportunities', 'agencies', 'campaigns', 'benefit_programs', 'rss_feed', 'sync', 'classify'],
        }, { status: 400 })
    }

    return NextResponse.json({ success: true, type: intakeType, ...result as Record<string, unknown> })
  } catch (err) {
    await log('intake_error', intakeType, 'error', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// Support GET for health check
export async function GET() {
  return NextResponse.json({
    service: 'Change Engine Unified Intake',
    version: '1.0',
    supported_types: [
      'content — Ingest URLs through classification pipeline',
      'officials|policies|services|organizations|opportunities|agencies|campaigns|benefit_programs — Upsert entities + auto-classify',
      'rss_feed — Add RSS feed and trigger immediate poll',
      'sync — Trigger data sync (google_civic, legistar, texas, rss, all)',
      'classify — Sweep unclassified entities in any table',
    ],
  })
}
