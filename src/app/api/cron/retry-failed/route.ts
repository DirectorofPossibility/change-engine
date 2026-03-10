/**
 * @fileoverview POST /api/cron/retry-failed — Retry flagged content ingestions.
 *
 * Picks up content_inbox items with status='flagged' and retry_count < 3,
 * re-runs classification (the most common failure point), and updates status.
 * Uses exponential backoff: items are only retried if enough time has passed
 * since last_retry_at (1h, 4h, 12h).
 *
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Daily at 2 AM UTC (between batch-translate and poll-rss).
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

// Backoff intervals in hours for retry 1, 2, 3
const BACKOFF_HOURS = [1, 4, 12]

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
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
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  // Fetch flagged items that haven't exceeded max retries (limit 10 per run)
  const flagged = await supaRest(
    'GET',
    'content_inbox?status=eq.flagged&retry_count=lt.3&select=id,source_url,source_domain,title,description,extracted_text,retry_count,last_retry_at,image_url,content_type,org_id&order=retry_count.asc,created_at.asc&limit=10',
  )

  if (!flagged || flagged.length === 0) {
    return NextResponse.json({ success: true, message: 'No flagged items to retry', retried: 0 })
  }

  const now = new Date()
  const results: Array<{ id: string; url: string; status: string; error?: string }> = []
  let retried = 0
  let recovered = 0

  for (const item of flagged) {
    // Check backoff: skip if not enough time has passed
    if (item.last_retry_at) {
      const lastRetry = new Date(item.last_retry_at)
      const hoursNeeded = BACKOFF_HOURS[item.retry_count] || 12
      const hoursSince = (now.getTime() - lastRetry.getTime()) / (1000 * 60 * 60)
      if (hoursSince < hoursNeeded) {
        results.push({ id: item.id, url: item.source_url, status: 'skipped_backoff' })
        continue
      }
    }

    // Re-classify this item by calling the internal ingest API
    // But since the content is already scraped, we use the existing extracted_text
    try {
      const baseUrl = req.nextUrl.origin
      const res = await fetch(`${baseUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({ url: item.source_url }),
      })

      const data = await res.json()

      if (data.results?.[0]?.success) {
        // Success — the new ingest created a fresh inbox entry.
        // Mark the old flagged one as superseded so it's not retried again.
        await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, {
          status: 'superseded',
          retry_count: item.retry_count + 1,
          last_retry_at: now.toISOString(),
          last_error: null,
        })
        results.push({ id: item.id, url: item.source_url, status: 'recovered' })
        recovered++
      } else if (data.results?.[0]?.stage === 'dedup') {
        // Already ingested via a different path — mark as superseded
        await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, {
          status: 'superseded',
          retry_count: item.retry_count + 1,
          last_retry_at: now.toISOString(),
          last_error: 'Already ingested (dedup)',
        })
        results.push({ id: item.id, url: item.source_url, status: 'dedup_resolved' })
        recovered++
      } else {
        // Still failing
        const error = data.results?.[0]?.error || data.error || 'Unknown error'
        await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, {
          retry_count: item.retry_count + 1,
          last_retry_at: now.toISOString(),
          last_error: error.substring(0, 500),
        })
        results.push({ id: item.id, url: item.source_url, status: 'still_failing', error })
      }

      retried++

      // Rate limit between retries
      if (retried < flagged.length) {
        await new Promise(r => setTimeout(r, 2000))
      }
    } catch (err) {
      const error = (err as Error).message
      await supaRest('PATCH', `content_inbox?id=eq.${item.id}`, {
        retry_count: item.retry_count + 1,
        last_retry_at: now.toISOString(),
        last_error: error.substring(0, 500),
      }).catch(() => {})
      results.push({ id: item.id, url: item.source_url, status: 'error', error })
      retried++
    }
  }

  // Log
  try {
    await supaRest('POST', 'ingestion_log', {
      event_type: 'retry_failed',
      source: 'cron',
      status: recovered > 0 ? 'success' : 'partial',
      message: `Retried ${retried}/${flagged.length} flagged items, recovered ${recovered}`,
      item_count: retried,
    })
  } catch (_) { /* non-critical */ }

  return NextResponse.json({
    success: true,
    total_flagged: flagged.length,
    retried,
    recovered,
    results,
  })
}
