/**
 * @fileoverview POST /api/cron/sync-polling-places — Cron job for election data sync.
 *
 * Queries the `elections` table for upcoming elections (within 60 days),
 * then calls the Supabase Edge Function `sync-polling-places` to fetch
 * and upsert polling location data from election APIs.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Runs periodically to keep voting_locations table current.
 *
 * Safety: Only syncs future elections (election_date >= today) to avoid
 * re-processing past election data.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  // Fail fast if required env vars are missing
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  // Verify cron secret
  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find next upcoming election within 45 days
    const now = new Date()
    const todayISO = now.toISOString().split('T')[0]
    const cutoff = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
    const cutoffISO = cutoff.toISOString().split('T')[0]

    const electionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/elections?is_active=eq.Yes&election_date=gte.${todayISO}&election_date=lte.${cutoffISO}&select=election_id,election_name,election_date&order=election_date.asc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      },
    )

    if (!electionsRes.ok) {
      const err = await electionsRes.text()
      return NextResponse.json({ error: `Failed to query elections: ${err}` }, { status: 500 })
    }

    const elections = await electionsRes.json()
    if (!elections || elections.length === 0) {
      return NextResponse.json({
        skipped: true,
        message: 'No active election within 45 days',
      })
    }

    const election = elections[0]

    // Trigger the Supabase edge function with full mode
    const syncRes = await fetch(`${SUPABASE_URL}/functions/v1/sync-polling-places`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode: 'full' }),
    })

    if (!syncRes.ok) {
      const errText = await syncRes.text()
      return NextResponse.json({ error: `Sync function failed (${syncRes.status}): ${errText}` }, { status: 500 })
    }

    const result = await syncRes.json()

    return NextResponse.json({
      triggered: true,
      election_id: election.election_id,
      election_name: election.election_name,
      election_date: election.election_date,
      sync_result: result,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
