/**
 * @fileoverview GET /api/calendar.ics — iCalendar feed for all events.
 *
 * Returns a standard .ics file that calendar apps (Google Calendar, Apple
 * Calendar, Outlook) can subscribe to. Merges events from all four sources:
 * events table, civic_calendar, opportunities, and content_published events.
 *
 * Query params:
 *   ?category=event|civic|opportunity|content  (filter by category)
 *   ?pathway=THEME_XX  (filter by pathway)
 *
 * @route GET /api/calendar.ics
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function formatICSDateOnly(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

interface ICSEvent {
  uid: string
  summary: string
  description: string
  dtstart: string
  dtend: string
  location: string
  url: string
  isAllDay: boolean
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const category = req.nextUrl.searchParams.get('category')
  const pathway = req.nextUrl.searchParams.get('pathway')

  const icsEvents: ICSEvent[] = []

  // Events table
  if (!category || category === 'event') {
    const { data: events } = await supabase
      .from('events')
      .select('event_id, event_name, description_5th_grade, start_datetime, end_datetime, address, city, state, zip_code, is_virtual, registration_url')
      .eq('is_active', 'Yes')
      .limit(200)

    for (const e of events ?? []) {
      if (!e.start_datetime) continue
      const loc = e.is_virtual === 'Yes' ? 'Virtual / Online' : [e.address, e.city, e.state, e.zip_code].filter(Boolean).join(', ')
      icsEvents.push({
        uid: `event-${e.event_id}@changeengine.us`,
        summary: e.event_name,
        description: e.description_5th_grade || '',
        dtstart: e.start_datetime,
        dtend: e.end_datetime || e.start_datetime,
        location: loc,
        url: `https://www.changeengine.us/events/${e.event_id}`,
        isAllDay: false,
      })
    }
  }

  // Civic calendar
  if (!category || category === 'civic') {
    const { data: civic } = await supabase
      .from('civic_calendar')
      .select('event_id, event_name, description_5th_grade, date_start, date_end, time_start, location_name, location_address, is_virtual, virtual_url')
      .eq('is_active', 'Yes')
      .limit(100)

    for (const c of civic ?? []) {
      if (!c.date_start) continue
      const start = c.date_start + (c.time_start ? `T${c.time_start}` : '')
      const loc = c.is_virtual === 'Yes' ? 'Virtual' : [c.location_name, c.location_address].filter(Boolean).join(', ')
      icsEvents.push({
        uid: `civic-${c.event_id}@changeengine.us`,
        summary: c.event_name,
        description: c.description_5th_grade || '',
        dtstart: start,
        dtend: c.date_end || start,
        location: loc,
        url: `https://www.changeengine.us/calendar`,
        isAllDay: !c.time_start,
      })
    }
  }

  // Opportunities with dates
  if (!category || category === 'opportunity') {
    const { data: opps } = await supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, address, city, state, zip_code, is_virtual, registration_url')
      .eq('is_active', 'Yes')
      .not('start_date', 'is', null)
      .limit(100)

    for (const o of opps ?? []) {
      if (!o.start_date) continue
      const loc = o.is_virtual === 'Yes' ? 'Virtual / Online' : [o.address, o.city, o.state, o.zip_code].filter(Boolean).join(', ')
      icsEvents.push({
        uid: `opp-${o.opportunity_id}@changeengine.us`,
        summary: o.opportunity_name,
        description: o.description_5th_grade || '',
        dtstart: o.start_date,
        dtend: o.end_date || o.start_date,
        location: loc,
        url: o.registration_url || `https://www.changeengine.us/calendar`,
        isAllDay: !o.start_date.includes('T'),
      })
    }
  }

  // Build ICS file
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Change Engine//changeengine.us//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Change Engine Events',
    'X-WR-CALDESC:Events from the Change Engine — Houston civic engagement platform',
  ]

  for (const ev of icsEvents) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${ev.uid}`)
    if (ev.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDateOnly(ev.dtstart)}`)
      if (ev.dtend && ev.dtend !== ev.dtstart) {
        lines.push(`DTEND;VALUE=DATE:${formatICSDateOnly(ev.dtend)}`)
      }
    } else {
      lines.push(`DTSTART:${formatICSDate(ev.dtstart)}`)
      if (ev.dtend) lines.push(`DTEND:${formatICSDate(ev.dtend)}`)
    }
    lines.push(`SUMMARY:${escapeICS(ev.summary)}`)
    if (ev.description) lines.push(`DESCRIPTION:${escapeICS(ev.description)}`)
    if (ev.location) lines.push(`LOCATION:${escapeICS(ev.location)}`)
    if (ev.url) lines.push(`URL:${ev.url}`)
    lines.push(`DTSTAMP:${formatICSDate(new Date().toISOString())}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="community-exchange.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
