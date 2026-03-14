/**
 * @fileoverview POST /api/cron/expire-content — Archive expired content.
 *
 * Finds content_published items where expires_at < now() and is_active = true,
 * sets is_active = false to move them out of featured/public feeds into archive.
 *
 * Auth: Requires CRON_SECRET bearer token.
 * Schedule: Daily at 6 AM UTC.
 */

import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET

async function supaRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'
  if (method === 'POST') headers['Prefer'] = 'return=representation'

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`${method} ${path}: ${res.status} ${err}`)
  }
  return res.json()
}

export async function POST(req: NextRequest) {
  // Auth
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()

    // Find active content that has expired
    const expired = await supaRest(
      'GET',
      `content_published?is_active=eq.true&expires_at=lt.${encodeURIComponent(now)}&select=id,title_6th_grade,content_type,expires_at&limit=100`
    )

    if (!Array.isArray(expired) || expired.length === 0) {
      return NextResponse.json({ message: 'No expired content found', archived: 0 })
    }

    // Deactivate each expired item
    let archived = 0
    for (const item of expired) {
      try {
        await supaRest('PATCH', `content_published?id=eq.${item.id}`, {
          is_active: false,
        })
        archived++
      } catch (e) {
        console.error(`Failed to archive ${item.id}:`, (e as Error).message)
      }
    }

    // Log
    await supaRest('POST', 'ingestion_log', {
      event_type: 'expire_content',
      source: 'cron/expire-content',
      status: 'success',
      message: `Archived ${archived} expired items (${expired.map((i: any) => i.content_type).join(', ')})`,
      item_count: archived,
    })

    return NextResponse.json({
      success: true,
      archived,
      items: expired.map((i: any) => ({ id: i.id, title: i.title_6th_grade, type: i.content_type, expired_at: i.expires_at })),
    })
  } catch (err) {
    console.error('expire-content error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
