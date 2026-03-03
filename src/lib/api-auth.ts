/**
 * @fileoverview API route authentication middleware.
 *
 * Provides a single entry-point -- {@link validateApiRequest} -- that API
 * route handlers call to gate access. Two authentication strategies are
 * supported:
 *
 * 1. **CRON_SECRET bearer token** -- used by Vercel Cron jobs.
 * 2. **x-api-key header** -- the raw key is SHA-256 hashed and compared
 *    against the `api_keys` table in Supabase. Expired or revoked keys are
 *    rejected and a fire-and-forget PATCH bumps usage counters on success.
 *
 * Returns `null` when the request is authorized, or a `NextResponse` JSON
 * error (401) when it is not.
 */

// ── Imports ──

import { NextRequest, NextResponse } from 'next/server'

// ── Environment ──

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// ── Validation ──

/**
 * Validates an incoming API request and authorises or rejects it.
 *
 * Checks, in order:
 * 1. `Authorization: Bearer <CRON_SECRET>` header (fast-path for cron jobs).
 * 2. `x-api-key` header -- SHA-256 hashed and matched against the Supabase
 *    `api_keys` table. Expired or inactive keys are rejected. On success the
 *    row's `total_requests` and `last_used_at` fields are bumped
 *    (fire-and-forget).
 *
 * @param req - The incoming Next.js API request.
 * @returns `null` if the request is authorised, otherwise a `NextResponse`
 *          JSON body with an appropriate 401 status.
 */
export async function validateApiRequest(req: NextRequest): Promise<NextResponse | null> {
  // Allow cron jobs via Bearer token
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    return null
  }

  // Validate API key
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 })
  }

  // Hash the provided key and look it up
  const encoded = new TextEncoder().encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${keyHash}&is_active=eq.true&select=id,rate_limit_per_day,expires_at,total_requests`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    },
  )

  const rows = await res.json()
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
  }

  const key = rows[0]

  // Check expiry
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return NextResponse.json({ error: 'API key expired' }, { status: 401 })
  }

  // Bump usage counter (fire-and-forget)
  fetch(`${SUPABASE_URL}/rest/v1/api_keys?id=eq.${key.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: '',
    },
    body: JSON.stringify({
      total_requests: (key.total_requests || 0) + 1,
      last_used_at: new Date().toISOString(),
    }),
  }).catch(() => {})

  return null
}
