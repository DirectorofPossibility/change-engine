/**
 * @fileoverview POST /api/cron/classify-pending — Sweep all entity tables for unclassified items.
 *
 * Runs after all sync crons to catch anything that landed without classification.
 * Processes up to 5 items per table per run to stay within execution limits.
 *
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Daily at 11 AM CT (after all syncs have run).
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

const TABLES_TO_SWEEP = [
  'elected_officials',
  'policies',
  'organizations',
  'services_211',
  'opportunities',
  'agencies',
  'benefit_programs',
  'campaigns',
  'ballot_items',
]

async function supaRest(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) return null
  return res.json()
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

  const results: Record<string, unknown> = {}
  let totalClassified = 0

  for (const table of TABLES_TO_SWEEP) {
    try {
      // Count unclassified items (no classification_v2 or old version)
      const unclassified = await supaRest(
        `${table}?select=count&classification_v2=is.null&limit=1`,
      )
      const count = Array.isArray(unclassified) ? unclassified.length : 0

      if (count === 0) {
        results[table] = { pending: 0, skipped: true }
        continue
      }

      // Call enrich-entity via internal API
      const baseUrl = req.nextUrl.origin
      const res = await fetch(`${baseUrl}/api/enrich-entity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
        body: JSON.stringify({ table, limit: 5, force: false }),
      })

      if (res.ok) {
        const data = await res.json()
        results[table] = {
          processed: data.processed,
          succeeded: data.succeeded,
          failed: data.failed,
          skipped: data.skipped,
        }
        totalClassified += data.succeeded || 0
      } else {
        results[table] = { error: `HTTP ${res.status}` }
      }
    } catch (err) {
      results[table] = { error: (err as Error).message }
    }
  }

  // Also check for unclassified content in review queue
  try {
    const pending = await supaRest(
      'content_review_queue?select=count&review_status=eq.needs_review&limit=1',
    )
    results['content_review_queue'] = {
      pending_review: Array.isArray(pending) ? pending.length : 0,
      note: 'Content awaiting human review in /dashboard/review',
    }
  } catch (err) {
    results['content_review_queue'] = { error: (err as Error).message }
  }

  // Log
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ingestion_log`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_type: 'classify_sweep',
        source: 'cron',
        status: 'success',
        message: `Classified ${totalClassified} entities across ${TABLES_TO_SWEEP.length} tables`,
        item_count: totalClassified,
      }),
    })
  } catch (_) { /* non-critical */ }

  return NextResponse.json({
    success: true,
    total_classified: totalClassified,
    tables: results,
  })
}
