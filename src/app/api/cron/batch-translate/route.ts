/**
 * @fileoverview POST /api/cron/batch-translate — Nightly translation cron.
 *
 * Calls the Supabase Edge Function `translate-all` for every supported table,
 * translating untranslated content into Spanish and Vietnamese.
 *
 * Auth: Requires CRON_SECRET bearer token (set by Vercel cron scheduler).
 * Schedule: Runs daily at 1 AM UTC.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
const CRON_SECRET = process.env.CRON_SECRET

const ALL_TABLES = [
  'content_published',
  'services_211',
  'policies',
  'opportunities',
  'organizations',
  'elected_officials',
  'learning_paths',
  'life_situations',
  'agencies',
  'benefit_programs',
  'campaigns',
  'ballot_items',
  'events',
  'foundations',
  'guides',
]

export async function POST(req: NextRequest) {
  if (!CRON_SECRET || !SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization') || ''
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}
  let totalTranslated = 0

  for (const table of ALL_TABLES) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/translate-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tables: [table],
          languages: ['es', 'vi'],
          limit: 100,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        results[table] = { error: `${res.status}: ${errText}` }
        continue
      }

      const data = await res.json()
      results[table] = data
      totalTranslated += data.translated_count || 0
    } catch (err) {
      results[table] = { error: (err as Error).message }
    }
  }

  return NextResponse.json({
    triggered: true,
    total_translated: totalTranslated,
    tables: results,
  })
}
