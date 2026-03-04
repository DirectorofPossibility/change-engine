/**
 * @fileoverview POST /api/cron/sync-state-texas — Daily cron for Texas Legislature sync.
 *
 * Calls the Supabase Edge Function `sync-state-texas` which pulls from
 * TLO RSS feeds (daily filings/passages) and Open States API (officials + backfill).
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Daily at 9 AM CT.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-state-texas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'recent', trigger_classify: true, source: 'both' }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Texas sync failed (${res.status}): ${errText}` },
        { status: 500 },
      )
    }

    const result = await res.json()
    return NextResponse.json({ triggered: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
