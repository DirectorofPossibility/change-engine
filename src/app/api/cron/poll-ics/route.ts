/**
 * @fileoverview POST /api/cron/poll-ics — Sync external ICS calendar feeds.
 *
 * Fetches .ics feeds, parses VEVENT entries, and upserts into the `events`
 * table so they appear on the calendar alongside other event sources.
 *
 * Auth: Requires CRON_SECRET bearer token (or admin session).
 * Can also be triggered manually: POST /api/cron/poll-ics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
const CRON_SECRET = process.env.CRON_SECRET

// ── ICS Feed Registry ──

interface ICSFeed {
  name: string
  url: string
  /** Default event_type label for imported events */
  eventType: string
}

const ICS_FEEDS: ICSFeed[] = [
  {
    name: 'Civic Tech Field Guide',
    url: 'https://calendar.google.com/calendar/ical/fcrjsfqi6p3jpc3urerk77caig%40group.calendar.google.com/public/basic.ics',
    eventType: 'Conference',
  },
]

// ── ICS Parser ──

interface ParsedEvent {
  uid: string
  summary: string
  description: string | null
  dtstart: string | null
  dtend: string | null
  location: string | null
  url: string | null
}

/**
 * Parse an ICS date string (e.g. "20250308T140000Z" or "20250308") into ISO.
 */
function parseICSDate(raw: string): string | null {
  if (!raw) return null
  // Strip VALUE=DATE: or TZID=...: prefixes
  const cleaned = raw.replace(/^[A-Z/=_-]+:/i, '').trim()
  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`
  }
  // Datetime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const m = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/)
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`
  }
  return null
}

/**
 * Unescape ICS text encoding.
 */
function unescapeICS(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

/**
 * Parse VCALENDAR text into an array of events.
 * Handles line folding (RFC 5545 §3.1).
 */
function parseICS(icsText: string): ParsedEvent[] {
  // Unfold continuation lines (lines starting with space or tab)
  const unfolded = icsText.replace(/\r?\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  const events: ParsedEvent[] = []
  let current: Record<string, string> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {}
      continue
    }
    if (line === 'END:VEVENT' && current) {
      events.push({
        uid: current['UID'] || '',
        summary: unescapeICS(current['SUMMARY'] || ''),
        description: current['DESCRIPTION'] ? unescapeICS(current['DESCRIPTION']).slice(0, 2000) : null,
        dtstart: parseICSDate(current['DTSTART'] || ''),
        dtend: parseICSDate(current['DTEND'] || ''),
        location: current['LOCATION'] ? unescapeICS(current['LOCATION']) : null,
        url: current['URL'] || null,
      })
      current = null
      continue
    }
    if (current) {
      // Handle properties with parameters (e.g. DTSTART;VALUE=DATE:20250308)
      const colonIdx = line.indexOf(':')
      if (colonIdx === -1) continue
      const key = line.slice(0, colonIdx)
      const value = line.slice(colonIdx + 1)
      // Normalize key — strip parameters after semicolon for storage
      const baseKey = key.split(';')[0]
      current[baseKey] = value
    }
  }

  return events
}

// ── Sync Logic ──

export async function POST(req: NextRequest) {
  // Auth: cron secret or pass ?force=1 for manual trigger during dev
  const authHeader = req.headers.get('authorization') || ''
  const isCron = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`
  const isForce = req.nextUrl.searchParams.get('force') === '1'

  if (!isCron && !isForce) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const results: { feed: string; fetched: number; upserted: number; errors: string[] }[] = []

  for (const feed of ICS_FEEDS) {
    const feedResult = { feed: feed.name, fetched: 0, upserted: 0, errors: [] as string[] }

    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'ChangeEngine/1.0 (calendar sync)' },
      })
      if (!res.ok) {
        feedResult.errors.push(`Fetch failed: ${res.status}`)
        results.push(feedResult)
        continue
      }

      const icsText = await res.text()
      const events = parseICS(icsText)
      feedResult.fetched = events.length

      // Upsert each event into the events table
      for (const evt of events) {
        if (!evt.summary || !evt.dtstart) continue

        // Build a stable event_id from feed name + UID
        const eventId = `ics-${evt.uid.slice(0, 60)}`

        // Determine if URL is in the location field (common in this feed)
        let location = evt.location
        let registrationUrl = evt.url || null
        if (location && location.startsWith('http')) {
          registrationUrl = registrationUrl || location
          location = 'See registration link'
        }

        const { error } = await supabase
          .from('events')
          .upsert(
            {
              event_id: eventId,
              event_name: evt.summary.slice(0, 300),
              description_5th_grade: evt.description?.slice(0, 2000) || null,
              event_type: feed.eventType,
              start_datetime: evt.dtstart,
              end_datetime: evt.dtend || evt.dtstart,
              address: location?.slice(0, 500) || null,
              city: null,
              state: null,
              zip_code: null,
              is_virtual: 'Yes',
              registration_url: registrationUrl?.slice(0, 1000) || null,
              is_active: 'Yes',
              is_free: 'Yes',
              org_id: null,
              data_source: feed.name,
            },
            { onConflict: 'event_id' },
          )

        if (error) {
          feedResult.errors.push(`${eventId}: ${error.message}`)
        } else {
          feedResult.upserted++
        }
      }
    } catch (err) {
      feedResult.errors.push((err as Error).message)
    }

    results.push(feedResult)
  }

  return NextResponse.json({ synced: true, results })
}
