/**
 * @fileoverview POST /api/cron/sync-officials — Daily cron for federal/state official sync.
 *
 * Calls the Supabase Edge Function `sync-officials` which:
 *   1. Maps ZIP codes to congressional/state districts via Google Civic API
 *   2. Fetches federal officials from Congress.gov API
 *   3. Classifies all new officials across 16 taxonomy dimensions
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Daily at 8 AM CT (after Houston sync, before Texas sync).
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
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-officials`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'recent', trigger_classify: true, batch_size: 25 }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Officials sync failed (${res.status}): ${errText}` },
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
