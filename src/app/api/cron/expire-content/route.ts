/**
 * @fileoverview POST /api/cron/expire-content — Archive expired content and past events.
 *
 * 1. Finds content_published items where expires_at < now() and deactivates them.
 * 2. Deactivates past events across events, civic_calendar, and opportunities tables.
 * 3. Deactivates content_published items of type 'event' whose event dates have passed.
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
  const auth = req.headers.get('authorization')
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()
    const todayDate = now.split('T')[0]
    // Grace period: archive events that ended more than 1 day ago
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const yesterdayDate = yesterday.split('T')[0]
    let totalArchived = 0
    const details: string[] = []

    // 1. Content with expires_at in the past
    try {
      const expired = await supaRest(
        'GET',
        `content_published?is_active=eq.true&expires_at=lt.${encodeURIComponent(now)}&select=id,title_6th_grade,content_type,expires_at&limit=100`
      )
      if (Array.isArray(expired) && expired.length > 0) {
        for (const item of expired) {
          try {
            await supaRest('PATCH', `content_published?id=eq.${item.id}`, { is_active: false })
            totalArchived++
          } catch (e) {
            console.error(`Failed to archive expired content ${item.id}:`, (e as Error).message)
          }
        }
        details.push(`${expired.length} expired content items`)
      }
    } catch {
      // expires_at column may not exist yet — skip gracefully
    }

    // 2. Content events with event dates in the past
    try {
      const pastContentEvents = await supaRest(
        'GET',
        `content_published?is_active=eq.true&content_type=eq.event&event_start_date=lt.${yesterdayDate}&event_end_date=is.null&select=id,title_6th_grade,event_start_date&limit=100`
      )
      const pastContentEventsWithEnd = await supaRest(
        'GET',
        `content_published?is_active=eq.true&content_type=eq.event&event_end_date=lt.${yesterdayDate}&select=id,title_6th_grade,event_end_date&limit=100`
      )
      const allPastContent = [...(pastContentEvents || []), ...(pastContentEventsWithEnd || [])]
      const seen = new Set<string>()
      for (const item of allPastContent) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        try {
          await supaRest('PATCH', `content_published?id=eq.${item.id}`, { is_active: false })
          totalArchived++
        } catch (e) {
          console.error(`Failed to archive past content event ${item.id}:`, (e as Error).message)
        }
      }
      if (seen.size > 0) details.push(`${seen.size} past content events`)
    } catch (e) {
      console.error('Error archiving past content events:', (e as Error).message)
    }

    // 3. Past events in events table
    try {
      const pastEvents = await supaRest(
        'GET',
        `events?is_active=eq.Yes&start_datetime=lt.${encodeURIComponent(yesterday)}&end_datetime=is.null&select=event_id,event_name&limit=200`
      )
      const pastEventsWithEnd = await supaRest(
        'GET',
        `events?is_active=eq.Yes&end_datetime=lt.${encodeURIComponent(yesterday)}&select=event_id,event_name&limit=200`
      )
      const allPast = [...(pastEvents || []), ...(pastEventsWithEnd || [])]
      const seen = new Set<string>()
      for (const e of allPast) {
        if (seen.has(e.event_id)) continue
        seen.add(e.event_id)
        try {
          await supaRest('PATCH', `events?event_id=eq.${e.event_id}`, { is_active: 'No' })
          totalArchived++
        } catch (err) {
          console.error(`Failed to archive event ${e.event_id}:`, (err as Error).message)
        }
      }
      if (seen.size > 0) details.push(`${seen.size} past events`)
    } catch (e) {
      console.error('Error archiving past events:', (e as Error).message)
    }

    // 4. Past civic calendar items
    try {
      const pastCivic = await supaRest(
        'GET',
        `civic_calendar?is_active=eq.Yes&date_start=lt.${yesterdayDate}&select=event_id,event_name&limit=200`
      )
      if (Array.isArray(pastCivic) && pastCivic.length > 0) {
        for (const c of pastCivic) {
          try {
            await supaRest('PATCH', `civic_calendar?event_id=eq.${c.event_id}`, { is_active: 'No' })
            totalArchived++
          } catch (err) {
            console.error(`Failed to archive civic ${c.event_id}:`, (err as Error).message)
          }
        }
        details.push(`${pastCivic.length} past civic calendar items`)
      }
    } catch (e) {
      console.error('Error archiving past civic items:', (e as Error).message)
    }

    // 5. Past opportunities
    try {
      const pastOpps = await supaRest(
        'GET',
        `opportunities?is_active=eq.Yes&end_date=lt.${yesterdayDate}&select=opportunity_id,opportunity_name&limit=200`
      )
      if (Array.isArray(pastOpps) && pastOpps.length > 0) {
        for (const o of pastOpps) {
          try {
            await supaRest('PATCH', `opportunities?opportunity_id=eq.${o.opportunity_id}`, { is_active: 'No' })
            totalArchived++
          } catch (err) {
            console.error(`Failed to archive opportunity ${o.opportunity_id}:`, (err as Error).message)
          }
        }
        details.push(`${pastOpps.length} past opportunities`)
      }
    } catch (e) {
      console.error('Error archiving past opportunities:', (e as Error).message)
    }

    // Log summary
    if (totalArchived > 0) {
      try {
        await supaRest('POST', 'ingestion_log', {
          event_type: 'expire_content',
          source: 'cron/expire-content',
          status: 'success',
          message: `Archived ${totalArchived} items: ${details.join(', ')}`,
          item_count: totalArchived,
        })
      } catch {
        // logging is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      archived: totalArchived,
      details,
    })
  } catch (err) {
    console.error('expire-content error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
