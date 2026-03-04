/**
 * @fileoverview POST /api/cron/sync-city-houston — Daily cron for Houston Legistar sync.
 *
 * Calls the Supabase Edge Function `sync-city-houston` in recent mode,
 * which pulls city council members and recent ordinances/resolutions.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Daily at 7 AM CT.
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
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-city-houston`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'recent', trigger_classify: true }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `Houston sync failed (${res.status}): ${errText}` },
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
