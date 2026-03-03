import { NextRequest, NextResponse } from 'next/server'

/**
 * Validates API route requests via API key (x-api-key header).
 * Keys are stored as SHA-256 hashes in the api_keys table.
 * Returns null if authorized, or a NextResponse error if not.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const CRON_SECRET = process.env.CRON_SECRET

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
