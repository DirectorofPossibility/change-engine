/**
 * @fileoverview POST /api/cron/poll-rss — Cron job for RSS feed ingestion.
 *
 * Calls the Supabase Edge Function `rss-proxy` in poll_all mode,
 * which scans all active RSS feeds and submits new items for classification.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Runs every 4 hours to keep content fresh.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  // Verify cron secret
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/rss-proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'poll_all' }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `RSS poll failed (${res.status}): ${errText}` },
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
