/**
 * @fileoverview POST /api/cron/sync-state-texas — Daily cron for Texas Legislature sync.
 *
 * Calls the Supabase Edge Function `sync-state-texas` which pulls from
 * TLO RSS feeds (daily filings/passages) and Open States API (officials + backfill).
 * Classification is done server-side AFTER sync to avoid edge function timeouts.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Daily at 9 AM CT.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const CRON_SECRET = process.env.CRON_SECRET

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(55000) })
      if (res.status === 429 || res.status >= 500) {
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
          continue
        }
      }
      return res
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // Phase 1: Sync data (no inline classification — avoids edge function timeout)
  try {
    const res = await fetchWithRetry(`${SUPABASE_URL}/functions/v1/sync-state-texas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'recent', trigger_classify: false, source: 'both' }),
    })

    if (!res.ok) {
      const errText = await res.text()
      results.sync = { error: `Texas sync failed (${res.status}): ${errText}` }
    } else {
      results.sync = await res.json()
    }
  } catch (err) {
    results.sync = { error: (err as Error).message }
  }

  // Phase 2: Classify new entities server-side (no 60s timeout limit)
  for (const table of ['elected_officials', 'policies']) {
    try {
      const baseUrl = req.nextUrl.origin
      const classifyRes = await fetch(`${baseUrl}/api/enrich-entity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({ table, limit: 10, force: false }),
      })
      if (classifyRes.ok) {
        results[`classify_${table}`] = await classifyRes.json()
      } else {
        results[`classify_${table}`] = { error: `HTTP ${classifyRes.status}` }
      }
    } catch (err) {
      results[`classify_${table}`] = { error: (err as Error).message }
    }
  }

  return NextResponse.json({ triggered: true, ...results })
}
