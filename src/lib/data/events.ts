import { createClient } from '@/lib/supabase/server'
/**
 * Events feed — items classified as content_type = 'event'.
 */
export async function getEventsFeed(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('content_type', 'event')
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

/**
 * Calendar data: merges content events + events table + civic_calendar + opportunities.
 * Returns a unified list sorted by date, optionally filtered by pathway.
 */

/**
 * Calendar data: merges content events + events table + civic_calendar + opportunities.
 * Returns a unified list sorted by date, optionally filtered by pathway.
 */
export async function getCalendarItems(pathway?: string) {
  const supabase = await createClient()

  // Content items tagged as events
  let contentQ = supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('content_type', 'event')
    .order('published_at', { ascending: false })
    .limit(50)
  if (pathway) contentQ = contentQ.eq('pathway_primary', pathway)

  // Events table (community events with real datetimes)
  const eventsQ = supabase
    .from('events')
    .select('event_id, event_name, description_5th_grade, event_type, start_datetime, end_datetime, address, city, is_virtual, registration_url, org_id, focus_area_ids')
    .eq('is_active', 'Yes')
    .order('start_datetime', { ascending: true })
    .limit(50)

  // Civic calendar (government meetings, deadlines, elections)
  const civicQ = supabase
    .from('civic_calendar')
    .select('event_id, event_name, event_type, description_5th_grade, date_start, time_start, location_name, location_address, is_virtual, virtual_url, registration_url, is_deadline, is_election, gov_level_id')
    .eq('is_active', 'Yes')
    .order('date_start', { ascending: true })
    .limit(30)

  // Opportunities with dates
  let oppsQ = supabase
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, time_commitment_id, is_virtual, registration_url, address, city, org_id')
    .eq('is_active', 'Yes')
    .order('start_date', { ascending: true })
    .limit(30)

  const [contentRes, eventsRes, civicRes, oppsRes] = await Promise.all([
    contentQ, eventsQ, civicQ, oppsQ,
  ])

  // Normalize into unified calendar items
  type CalendarItem = {
    id: string
    title: string
    description: string | null
    category: 'event' | 'civic' | 'opportunity' | 'content'
    date: string | null
    endDate: string | null
    location: string | null
    isVirtual: boolean
    registrationUrl: string | null
    sourceUrl: string | null
    imageUrl: string | null
    pathway: string | null
    eventType: string | null
    orgName: string | null
    orgId: string | null
    detailHref: string | null
    isFree: boolean
    isRecurring: boolean
    recurrencePattern: string | null
  }

  const items: CalendarItem[] = []

  // Batch-fetch org names for events and opportunities
  const allOrgIds = new Set<string>()
  for (const e of (eventsRes.data ?? [])) { if (e.org_id) allOrgIds.add(e.org_id) }
  for (const o of (oppsRes.data ?? [])) { if (o.org_id) allOrgIds.add(o.org_id) }
  const orgMap = new Map<string, string>()
  if (allOrgIds.size > 0) {
    const { data: orgs } = await supabase.from('organizations').select('org_id, org_name').in('org_id', Array.from(allOrgIds))
    for (const o of (orgs ?? [])) { orgMap.set(o.org_id, o.org_name) }
  }

  for (const c of (contentRes.data ?? [])) {
    items.push({
      id: c.id,
      title: c.title_6th_grade,
      description: c.summary_6th_grade,
      category: 'content',
      date: (c as any).event_start_date || c.published_at,
      endDate: (c as any).event_end_date || null,
      location: null,
      isVirtual: false,
      registrationUrl: c.action_register || c.action_attend || null,
      sourceUrl: c.source_url,
      imageUrl: c.image_url,
      pathway: c.pathway_primary,
      eventType: 'Event',
      orgName: (c as any).source_org_name || null,
      orgId: null,
      detailHref: `/content/${c.id}`,
      isFree: false,
      isRecurring: false,
      recurrencePattern: null,
    })
  }

  for (const e of (eventsRes.data ?? [])) {
    items.push({
      id: e.event_id,
      title: e.event_name,
      description: e.description_5th_grade,
      category: 'event',
      date: e.start_datetime,
      endDate: e.end_datetime,
      location: [e.address, e.city].filter(Boolean).join(', ') || null,
      isVirtual: e.is_virtual === 'Yes',
      registrationUrl: e.registration_url,
      sourceUrl: null,
      imageUrl: null,
      pathway: null,
      eventType: e.event_type,
      orgName: e.org_id ? orgMap.get(e.org_id) || null : null,
      orgId: e.org_id || null,
      detailHref: `/events/${e.event_id}`,
      isFree: (e as any).is_free === 'true' || (e as any).is_free === 'Yes',
      isRecurring: (e as any).is_recurring === 'true' || (e as any).is_recurring === 'Yes',
      recurrencePattern: (e as any).recurrence_pattern || null,
    })
  }

  for (const c of (civicRes.data ?? [])) {
    items.push({
      id: c.event_id,
      title: c.event_name,
      description: c.description_5th_grade,
      category: 'civic',
      date: c.date_start ? c.date_start + (c.time_start ? 'T' + c.time_start : '') : null,
      endDate: null,
      location: [c.location_name, c.location_address].filter(Boolean).join(', ') || null,
      isVirtual: c.is_virtual === 'Yes',
      registrationUrl: c.registration_url || c.virtual_url || null,
      sourceUrl: null,
      imageUrl: null,
      pathway: null,
      eventType: c.event_type,
      orgName: null,
      orgId: null,
      detailHref: null,
      isFree: true,
      isRecurring: false,
      recurrencePattern: null,
    })
  }

  for (const o of (oppsRes.data ?? [])) {
    items.push({
      id: o.opportunity_id,
      title: o.opportunity_name,
      description: o.description_5th_grade,
      category: 'opportunity',
      date: o.start_date,
      endDate: o.end_date,
      location: [o.address, o.city].filter(Boolean).join(', ') || null,
      isVirtual: o.is_virtual === 'Yes',
      registrationUrl: o.registration_url,
      sourceUrl: null,
      imageUrl: null,
      pathway: null,
      eventType: 'Opportunity',
      orgName: o.org_id ? orgMap.get(o.org_id) || null : null,
      orgId: o.org_id || null,
      detailHref: null,
      isFree: false,
      isRecurring: false,
      recurrencePattern: null,
    })
  }

  // Sort by date ascending (upcoming first), nulls last
  items.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  return items
}

/**
 * News feed — articles, reports, announcements. Excludes events, guides, courses, tools.
 */
