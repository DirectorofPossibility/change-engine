/**
 * POST /api/cron/sync-elections — Sync election data from Google Civic API.
 *
 * Discovers active elections, fetches contests (races + candidates) and
 * referendums (ballot items) for Houston-area ZIP codes, upserts to DB,
 * and enriches with plain-language summaries via Claude.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Weekly on Mondays at 5:30 AM CT (alongside federal spending sync).
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
    // Call the edge function with full mode
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-elections`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'full',
        enrich: true,
      }),
      signal: AbortSignal.timeout(55000), // 55s to stay within Vercel's 60s limit
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Edge function failed (${res.status}): ${errText}` },
        { status: 500 },
      )
    }

    const result = await res.json()

    return NextResponse.json({
      triggered: true,
      ...result,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
