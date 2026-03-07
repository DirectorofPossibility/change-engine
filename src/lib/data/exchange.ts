/**
 * @fileoverview Data-fetching layer for the public exchange site (/(exchange)/*).
 *
 * ## Object Type Model
 *
 * The platform distinguishes NEWS from RESOURCES:
 *
 * - **News / Newsfeed** (`content_published`) — articles, videos, research,
 *   reports, DIY activities, courses. These flow as a per-pathway feed.
 *   The `resource_type` field is the content FORMAT (Video, Report, etc.),
 *   NOT a community resource classification.
 *
 * - **Resources** — persistent civic infrastructure:
 *   - `services_211` — 211 social services (food, shelter, clinics)
 *   - `organizations` — nonprofits, agencies, mutual aid groups
 *   - `benefit_programs` — government assistance programs
 *   - `opportunities` — volunteer, jobs, civic engagement
 *
 * - **Accountability** — governance entities:
 *   - `elected_officials`, `policies`, `agencies`, `ballot_items`
 *
 * ## Engagement Levels (Centers)
 *
 * Each center answers a distinct community question:
 *   - Learning  → "How can I understand?" (newsfeed: videos, research, reports, courses)
 *   - Action    → "How can I help?"       (opportunities, campaigns, CTAs)
 *   - Resource  → "What's available?"      (services, orgs, benefits)
 *   - Accountability → "Who decides?"      (officials, policies, agencies)
 *
 * ## Sections
 *
 *   1. Language / Translation helpers
 *   2. Homepage data (stats, newsfeed counts, pathway counts)
 *   3. Newsfeed queries (per-pathway feed, latest news, center counts)
 *   4. Entity queries (officials, services, learning paths, situations)
 *   5. Pathway + center content filtering
 *   6. Taxonomy lookups (focus areas, SDGs, SDOH)
 *   7. Geographic data (neighborhoods, super neighborhoods, ZIP lookups)
 *   8. Map marker data (services, voting locations, orgs, distribution sites)
 *   9. Mesh query functions (cross-entity traversal via junction tables)
 *
 * Most pages use ISR (`export const revalidate = N`) so these queries are cached
 * at the edge and only re-run every N seconds.
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LANGUAGES, THEMES } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'
import type { ExchangeStats, ServiceWithOrg, TranslationMap, FocusArea, SDG, SDOHDomain, DistributionSite, SuperNeighborhood, GeographyData, MapMarkerData, CompassPreviewData, ContentPreview } from '@/lib/types/exchange'

type ContentRow = Database['public']['Tables']['content_published']['Row'] & { content_type?: string | null }
type MunicipalServiceRow = Database['public']['Tables']['municipal_services']['Row']

/**
 * Read language preference from cookie and return the LANG-XX id.
 * Returns null for English (no translations needed).
 */
export async function getLangId(): Promise<string | null> {
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })
  return langConfig?.langId ?? null
}

// ── Election banner ───────────────────────────────────────────────────

/** Fetch the next upcoming active election, or null if none. */
export async function getNextElection(): Promise<{
  election_name: string
  election_date: string
  election_type: string | null
  polls_open: string | null
  polls_close: string | null
  find_polling_url: string | null
  register_url: string | null
} | null> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)
  if (!data || data.length === 0) return null
  const row = data[0] as any
  return {
    election_name: row.election_name,
    election_date: row.election_date,
    election_type: row.election_type ?? null,
    polls_open: row.polls_open ?? null,
    polls_close: row.polls_close ?? null,
    find_polling_url: row.find_polling_url ?? null,
    register_url: row.register_url ?? null,
  }
}

// ── Homepage data ──────────────────────────────────────────────────────

/**
 * Aggregate counts for the stats bar at the bottom of the homepage.
 * Note: `newsItems` counts newsfeed articles (content_published), NOT resources.
 * Resources are services + organizations + benefit programs.
 */
export async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = await createClient()
  const [newsItems, services, officials, paths, orgs, policies] = await Promise.all([
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('path_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }),
  ])
  return {
    resources: newsItems.count ?? 0,
    services: services.count ?? 0,
    officials: officials.count ?? 0,
    learningPaths: paths.count ?? 0,
    organizations: orgs.count ?? 0,
    policies: policies.count ?? 0,
  }
}

/**
 * Count newsfeed items per engagement level (Learning/Action/Resource/Accountability).
 * These are NEWS counts — articles, videos, reports — not community resource counts.
 */
export async function getCenterCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}

/**
 * Most recently published newsfeed items.
 * These are NEWS articles/videos/reports, not community resources.
 */
export async function getLatestContent(limit = 6) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .not('content_type', 'in', '("article","report","announcement","event")')
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

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
  }

  const items: CalendarItem[] = []

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
export async function getNewsFeed(pathway?: string, limit = 30, contentType?: string) {
  const supabase = await createClient()
  let q = supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, source_domain, published_at, content_type')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  if (contentType) {
    q = q.eq('content_type', contentType)
  }
  if (pathway) q = q.eq('pathway_primary', pathway)
  const { data } = await q
  return data ?? []
}

/**
 * News count for a pathway — used to show "X news articles" link.
 */
export async function getPathwayNewsCount(themeId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('content_published')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
    .in('content_type', ['article', 'report', 'announcement'])
  return count ?? 0
}

/**
 * Evergreen resource feed — guides, courses, tools, videos, opportunities.
 * Excludes news (articles/reports/announcements) and events.
 */
export async function getResourceFeed(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .in('content_type', ['guide', 'course', 'tool', 'video', 'opportunity', 'campaign'])
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

/**
 * Featured content for the guide page hero.
 * Tries is_featured=true first, falls back to most recent.
 */
export async function getFeaturedContent() {
  const supabase = await createClient()
  const { data: featured } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
  if (featured && featured.length > 0) return featured[0]
  const { data: latest } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(1)
  return latest?.[0] ?? null
}

// ── Life situations ("Available Resources") ───────────────────────────

/** All life situations, ordered for display. Featured/critical ones show on the homepage. */
export async function getLifeSituations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .order('display_order', { ascending: true })
  return data ?? []
}

export async function getLifeSituation(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .eq('situation_slug', slug)
    .single()
  return data
}

/**
 * Fetch content + services relevant to a life situation.
 * Resolves focus areas via the life_situation_focus_areas junction table,
 * then finds matching content via content_focus_areas junction.
 * Services are resolved via life_situation_service_categories junction.
 * When zipCode is provided, services are additionally filtered by geography.
 */
export async function getLifeSituationContent(situationId: string, serviceCatIds: string | null, zipCode?: string) {
  const supabase = await createClient()

  // Get focus area IDs from junction table
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situationId)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)

  let content: ContentRow[] = []
  if (focusIds.length > 0) {
    // Get content IDs that share these focus areas
    const { data: contentJunctions } = await supabase
      .from('content_focus_areas')
      .select('content_id')
      .in('focus_id', focusIds)
    const contentIds = Array.from(new Set((contentJunctions ?? []).map(j => j.content_id)))

    if (contentIds.length > 0) {
      const { data: contentData } = await supabase
        .from('content_published')
        .select('*')
        .eq('is_active', true)
        .in('id', contentIds)
        .order('published_at', { ascending: false })
        .limit(20)
      content = contentData ?? []
    }
  }

  let services: ServiceWithOrg[] = []
  if (serviceCatIds) {
    // Get service category IDs from junction table
    const { data: catJunctions } = await supabase
      .from('life_situation_service_categories')
      .select('service_cat_id')
      .eq('situation_id', situationId)
    const catIds = (catJunctions ?? []).map(j => j.service_cat_id)

    if (catIds.length > 0) {
      let svcQuery = supabase
        .from('services_211')
        .select('*')
        .eq('is_active', 'Yes')
        .in('service_cat_id', catIds)
      if (zipCode) {
        svcQuery = svcQuery.eq('zip_code', zipCode)
      }
      const { data: svcData } = await svcQuery.limit(20)
      if (svcData) {
        const orgIds = Array.from(new Set(svcData.map(s => s.org_id).filter(Boolean)))
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organizations')
            .select('org_id, org_name')
            .in('org_id', orgIds as string[])
          const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
          services = svcData.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
        } else {
          services = svcData
        }
      }
    }
  }

  return { content, services }
}

// ── Entity queries ─────────────────────────────────────────────────────

/** All organizations — nonprofits, agencies, foundations, etc. */
export async function getOrganizations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, phone, address, city, zip_code, logo_url, org_type, mission_statement, service_area, focus_area_ids, ntee_code, is_verified')
    .order('org_name')
  return data ?? []
}

/** All elected officials with their government levels and LinkedIn profiles. */
export async function getOfficials() {
  const supabase = await createClient()
  const [{ data: officials }, { data: levels }] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('government_levels').select('*').order('level_order'),
  ])
  const { data: profileRows } = await supabase
    .from('official_profiles' as any)
    .select('official_id, social_linkedin, linkedin_status')
  const profiles = ((profileRows ?? []) as unknown as Array<{ official_id: string; social_linkedin: string | null; linkedin_status: string | null }>)
    .reduce<Record<string, string>>(function (acc, p) {
      if (p.social_linkedin && (!p.linkedin_status || p.linkedin_status === 'verified')) acc[p.official_id] = p.social_linkedin
      return acc
    }, {})
  return { officials: officials ?? [], levels: levels ?? [], profiles }
}

/** Officials matching a ZIP code — looks up districts from zip_codes table, then finds matching officials. */
export async function getOfficialsByZip(zip: string) {
  const supabase = await createClient()

  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipData) return null

  const districts = [
    zipData.congressional_district,
    zipData.state_senate_district,
    zipData.state_house_district,
    'TX',
  ].filter(Boolean)

  // Look up city council district from neighborhoods table
  const { data: hoodRows } = await supabase
    .from('neighborhoods')
    .select('council_district')
    .like('zip_codes', '%' + zip + '%')
    .not('council_district', 'is', null)
    .limit(1)

  const councilDistrict = hoodRows?.[0]?.council_district || null

  let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
  // City officials: Mayor (null district) + At-Large + specific council district
  if (councilDistrict) {
    filterParts += ',district_id.eq.' + councilDistrict
  }
  // Always include At-Large and Mayor (city-wide officials)
  filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  if (zipData.county_id) {
    filterParts += ',counties_served.like.%' + zipData.county_id + '%'
  }

  const { data: officials } = await supabase
    .from('elected_officials')
    .select('*')
    .or(filterParts)
    .order('official_name')

  const all = officials ?? []
  return {
    federal: all.filter(function (o) { return o.level === 'Federal' }),
    state: all.filter(function (o) { return o.level === 'State' }),
    county: all.filter(function (o) { return o.level === 'County' }),
    city: all.filter(function (o) { return o.level === 'City' }),
    zipData,
  }
}

/** Fetch all data for the Civic Hub: officials, policies, elections, government_levels. */
export async function getCivicHubData() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: officials },
    { data: policies },
    { data: elections },
    { data: levels },
    { data: upcoming },
  ] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('policies').select('*').order('last_action_date', { ascending: false }),
    supabase.from('elections').select('*').order('election_date', { ascending: false }),
    supabase.from('government_levels').select('*').order('level_order'),
    supabase
      .from('elections')
      .select('*')
      .eq('is_active', 'Yes')
      .gte('election_date', today)
      .order('election_date', { ascending: true })
      .limit(1),
  ])

  const { data: profileRows } = await supabase
    .from('official_profiles' as any)
    .select('official_id, social_linkedin, linkedin_status')
  const linkedinProfiles = ((profileRows ?? []) as unknown as Array<{ official_id: string; social_linkedin: string | null; linkedin_status: string | null }>)
    .reduce<Record<string, string>>(function (acc, p) {
      if (p.social_linkedin && (!p.linkedin_status || p.linkedin_status === 'verified')) acc[p.official_id] = p.social_linkedin
      return acc
    }, {})

  return {
    officials: officials ?? [],
    policies: policies ?? [],
    elections: elections ?? [],
    levels: levels ?? [],
    upcomingElection: upcoming && upcoming.length > 0 ? upcoming[0] : null,
    linkedinProfiles,
  }
}

/** Election dashboard data — past/upcoming elections, candidates, ballot items, civic events, officials. */
export async function getElectionDashboard(zip?: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: pastElections },
    { data: upcomingElections },
    { data: civicEvents },
  ] = await Promise.all([
    supabase.from('elections').select('*').lt('election_date', today).order('election_date', { ascending: false }).limit(5),
    supabase.from('elections').select('*').gte('election_date', today).eq('is_active', 'Yes').order('election_date', { ascending: true }),
    supabase.from('civic_calendar').select('*').eq('is_active', 'Yes').order('date_start', { ascending: true }).limit(15),
  ])

  // Fetch candidates + ballot items for the most recent past election
  const recentElection = pastElections && pastElections.length > 0 ? pastElections[0] : null
  const nextElection = upcomingElections && upcomingElections.length > 0 ? upcomingElections[0] : null

  const [
    { data: recentCandidates },
    { data: recentBallotItems },
    { data: upcomingCandidates },
    { data: upcomingBallotItems },
  ] = await Promise.all([
    recentElection
      ? supabase.from('candidates').select('*').eq('election_id', recentElection.election_id).eq('is_active', 'Yes')
      : Promise.resolve({ data: [] as any[] }),
    recentElection
      ? supabase.from('ballot_items').select('*').eq('election_id', recentElection.election_id)
      : Promise.resolve({ data: [] as any[] }),
    nextElection
      ? supabase.from('candidates').select('*').eq('election_id', nextElection.election_id).eq('is_active', 'Yes')
      : Promise.resolve({ data: [] as any[] }),
    nextElection
      ? supabase.from('ballot_items').select('*').eq('election_id', nextElection.election_id)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // If ZIP provided, fetch officials for matching districts
  let officials: any[] = []
  if (zip) {
    const { data } = await supabase.from('elected_officials').select('*').order('official_name')
    officials = data ?? []
  }

  // Related content (election/voting articles)
  const { data: relatedContent } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, published_at')
    .or('title_6th_grade.ilike.%elect%,title_6th_grade.ilike.%vote%,title_6th_grade.ilike.%ballot%,title_6th_grade.ilike.%civic%')
    .order('published_at', { ascending: false })
    .limit(6)

  return {
    pastElections: pastElections ?? [],
    upcomingElections: upcomingElections ?? [],
    civicEvents: civicEvents ?? [],
    recentCandidates: recentCandidates ?? [],
    recentBallotItems: recentBallotItems ?? [],
    upcomingCandidates: upcomingCandidates ?? [],
    upcomingBallotItems: upcomingBallotItems ?? [],
    officials,
    relatedContent: relatedContent ?? [],
  }
}

/** All active 211 services, enriched with parent org names. */
export async function getServices(): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')
    .order('service_name')

  if (!services || services.length === 0) return []

  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  if (orgIds.length === 0) return services

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .in('org_id', orgIds as string[])

  const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
  return services.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
}

export async function getLearningPaths() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', 'Yes')
    .order('display_order', { ascending: true })
  return data ?? []
}

// ── Pathway + center content ───────────────────────────────────────────

/**
 * Newsfeed for a specific pathway, optionally filtered by engagement level (center).
 * Returns news items (articles, videos, research, reports, courses) — not community resources.
 */
export async function getPathwayContent(themeId: string, center?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
    .not('content_type', 'in', '("article","report","announcement","event")')
    .order('published_at', { ascending: false })

  if (center) {
    query = query.eq('center', center)
  }

  const { data } = await query.limit(50)
  return data ?? []
}

/** Count newsfeed items per pathway (THEME_01..THEME_07) for homepage pills. */
export async function getPathwayCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('pathway_primary')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.pathway_primary) {
      counts[item.pathway_primary] = (counts[item.pathway_primary] || 0) + 1
    }
  })
  return counts
}

export async function getCenterContentForPathway(themeId: string): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}

// ── Taxonomy lookups ───────────────────────────────────────────────────

/** All focus areas (specific topics like "Mental Health" under a pathway). */
export async function getFocusAreas(): Promise<FocusArea[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*')
  return data ?? []
}

/** Quick lookup: focus_id → focus_area_name. Used for rendering focus area labels. */
export async function getFocusAreaMap(): Promise<Record<string, string>> {
  const areas = await getFocusAreas()
  const map: Record<string, string> = {}
  areas.forEach(function (a) { map[a.focus_id] = a.focus_area_name })
  return map
}

export async function getSDGs(): Promise<SDG[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdgs').select('*').order('sdg_number')
  return data ?? []
}

export async function getSDGMap(): Promise<Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>> {
  const sdgs = await getSDGs()
  const map: Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }> = {}
  sdgs.forEach(function (s) { map[s.sdg_id] = { sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })
  return map
}

export async function getSDOHDomains(): Promise<SDOHDomain[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdoh_domains').select('*')
  return data ?? []
}

export async function getSDOHMap(): Promise<Record<string, { sdoh_name: string; sdoh_description: string | null }>> {
  const domains = await getSDOHDomains()
  const map: Record<string, { sdoh_name: string; sdoh_description: string | null }> = {}
  domains.forEach(function (d) { map[d.sdoh_code] = { sdoh_name: d.sdoh_name, sdoh_description: d.sdoh_description } })
  return map
}

export async function getFocusAreasByIds(ids: string[]): Promise<FocusArea[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*').in('focus_id', ids)
  return data ?? []
}

/** Fetch published content linked to a focus area via the content_focus_areas junction. */
export async function getContentByFocusArea(focusId: string) {
  const supabase = await createClient()
  const { data: junctions } = await supabase
    .from('content_focus_areas')
    .select('content_id')
    .eq('focus_id', focusId)
  const contentIds = (junctions ?? []).map(j => j.content_id)
  if (contentIds.length === 0) return []
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .in('id', contentIds)
    .order('published_at', { ascending: false })
    .limit(20)
  return data ?? []
}

/** Fetch active opportunities sharing any of the given focus areas via junction table. */
export async function getRelatedOpportunities(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('opportunity_focus_areas')
    .select('opportunity_id')
    .in('focus_id', focusAreaIds)
  const oppIds = Array.from(new Set((junctions ?? []).map(j => j.opportunity_id)))
  if (oppIds.length === 0) return []
  const { data } = await supabase
    .from('opportunities')
    .select('*')
    .in('opportunity_id', oppIds)
    .eq('is_active', 'Yes')
    .limit(10)
  return data ?? []
}

/** Fetch policies sharing any of the given focus areas via junction table. */
export async function getRelatedPolicies(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('policy_focus_areas')
    .select('policy_id')
    .in('focus_id', focusAreaIds)
  const policyIds = Array.from(new Set((junctions ?? []).map(j => j.policy_id)))
  if (policyIds.length === 0) return []
  const { data } = await supabase
    .from('policies')
    .select('*')
    .in('policy_id', policyIds)
    .limit(10)
  return data ?? []
}

/** Fetch services sharing any of the given focus areas via junction table. */
export async function getRelatedServices(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('service_focus_areas')
    .select('service_id')
    .in('focus_id', focusAreaIds)
  const serviceIds = Array.from(new Set((junctions ?? []).map(j => j.service_id)))
  if (serviceIds.length === 0) return []
  const { data } = await supabase
    .from('services_211')
    .select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website')
    .in('service_id', serviceIds.slice(0, 100))
    .limit(20)
  return data ?? []
}

/** Fetch officials sharing any of the given focus areas via junction table. */
export async function getRelatedOfficials(focusAreaIds: string[]) {
  const supabase = await createClient()
  if (focusAreaIds.length === 0) return []
  const { data: junctions } = await supabase
    .from('official_focus_areas')
    .select('official_id')
    .in('focus_id', focusAreaIds)
  const officialIds = Array.from(new Set((junctions ?? []).map(j => j.official_id)))
  if (officialIds.length === 0) return []
  const { data } = await supabase
    .from('elected_officials')
    .select('official_id, official_name, title, party, level, email, office_phone, website')
    .in('official_id', officialIds.slice(0, 50))
    .limit(12)
  return data ?? []
}

/** Fetch foundations linked to a pathway (theme) via foundation_pathways junction. */
export async function getFoundationsByPathway(pathwayId: string) {
  const themeToPathway: Record<string, string> = {
    THEME_01: 'health', THEME_02: 'families', THEME_03: 'neighborhood',
    THEME_04: 'voice', THEME_05: 'money', THEME_06: 'planet', THEME_07: 'bigger_we',
  }
  const pwId = themeToPathway[pathwayId] || pathwayId
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const hd = { apikey: key, Authorization: `Bearer ${key}` }
  const jRes = await fetch(`${url}/rest/v1/foundation_pathways?pathway_id=eq.${encodeURIComponent(pwId)}&select=foundation_id`, { headers: hd })
  const junctions: any[] = jRes.ok ? await jRes.json() : []
  const ids = Array.from(new Set(junctions.map(j => j.foundation_id)))
  if (ids.length === 0) return []
  const fRes = await fetch(`${url}/rest/v1/foundations?id=in.(${ids.join(',')})&select=id,name,mission,assets,annual_giving,website_url,website_display,geo_level,org_id&order=name`, { headers: hd })
  return fRes.ok ? fRes.json() : []
}

/** Fetch foundations linked to a focus area name via foundation_focus_areas junction. */
export async function getFoundationsByFocusArea(focusAreaName: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const hd = { apikey: key, Authorization: `Bearer ${key}` }
  const jRes = await fetch(`${url}/rest/v1/foundation_focus_areas?focus_area=eq.${encodeURIComponent(focusAreaName)}&select=foundation_id`, { headers: hd })
  const junctions: any[] = jRes.ok ? await jRes.json() : []
  const ids = Array.from(new Set(junctions.map(j => j.foundation_id)))
  if (ids.length === 0) return []
  const fRes = await fetch(`${url}/rest/v1/foundations?id=in.(${ids.join(',')})&select=id,name,mission,assets,annual_giving,website_url,website_display,geo_level,org_id&order=name`, { headers: hd })
  return fRes.ok ? fRes.json() : []
}

/**
 * Fetch translations for any table type.
 * Returns a map keyed by content_id with translated title/summary.
 * Handles both 'title'/'summary' and 'title_6th_grade'/'summary_6th_grade' field_name formats.
 */
export async function fetchTranslationsForTable(
  contentType: string,
  ids: string[],
  langId: string
): Promise<TranslationMap> {
  if (ids.length === 0 || !langId) return {}
  const supabase = await createClient()
  const { data } = await supabase
    .from('translations')
    .select('content_id, field_name, translated_text')
    .eq('content_type', contentType)
    .in('content_id', ids)
    .eq('language_id', langId)
  const map: TranslationMap = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id) return
      if (!map[t.content_id]) map[t.content_id] = {}
      if (t.field_name === 'title' || t.field_name === 'title_6th_grade') {
        map[t.content_id].title = t.translated_text ?? undefined
      }
      if (t.field_name === 'summary' || t.field_name === 'summary_6th_grade') {
        map[t.content_id].summary = t.translated_text ?? undefined
      }
    })
  }
  return map
}

/** Check which languages each content item has been translated into. Returns { inboxId: ['LANG-ES', 'LANG-VI'] }. */
export async function getTranslationAvailability(inboxIds: string[]): Promise<Record<string, string[]>> {
  const supabase = await createClient()
  if (inboxIds.length === 0) return {}
  const { data } = await supabase
    .from('translations')
    .select('content_id, language_id')
    .in('content_id', inboxIds)
  const avail: Record<string, string[]> = {}
  if (data) {
    data.forEach(function (t) {
      if (!t.content_id || !t.language_id) return
      if (!avail[t.content_id]) avail[t.content_id] = []
      if (avail[t.content_id].indexOf(t.language_id) === -1) {
        avail[t.content_id].push(t.language_id)
      }
    })
  }
  return avail
}

// ── Geographic lookups ─────────────────────────────────────────────────

/**
 * Find the neighborhood that contains a given ZIP code.
 * Uses the neighborhood_zip_codes junction table for exact matching.
 */
export async function getNeighborhoodByZip(zip: string) {
  const supabase = await createClient()
  const { data: junctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('neighborhood_id')
    .eq('zip_code', zip)
    .limit(1)
  if (!junctions || junctions.length === 0) return null
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('neighborhood_id', junctions[0].neighborhood_id)
    .single()
  return data ?? null
}

export async function getOfficialsForDistrict(districtId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('elected_officials')
    .select('*')
    .eq('district_id', districtId)
  return data ?? []
}

export async function getGuides() {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('is_active', true).order('display_order')
  return data ?? []
}

export async function getGuideBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('guides').select('*').eq('slug', slug).eq('is_active', true).single()
  return data
}

export async function getServicesByZip(zip: string): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')
    .eq('zip_code', zip)
    .limit(20)
  if (!services || services.length === 0) return []
  const orgIds = Array.from(new Set(services.map(function (s) { return s.org_id }).filter(Boolean)))
  if (orgIds.length === 0) return services
  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .in('org_id', orgIds as string[])
  const orgMap = new Map(orgs?.map(function (o) { return [o.org_id, o.org_name] as [string, string] }) ?? [])
  return services.map(function (s) { return Object.assign({}, s, { org_name: orgMap.get(s.org_id!) ?? undefined }) })
}

// ── Super Neighborhoods ────────────────────────────────────────────────
// Houston has 88 "super neighborhoods" — city-defined groupings of smaller neighborhoods.
// Each has demographics, ZIP codes, and associated services/organizations.

/** All super neighborhoods, alphabetically. Used for the listing page. */
export async function getSuperNeighborhoods(): Promise<SuperNeighborhood[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('*')
    .order('sn_name')
  return data ?? []
}

/** Lightweight super neighborhoods list for dropdowns (id + name only). */
export async function getSuperNeighborhoodsList(): Promise<Array<{ sn_id: string; sn_name: string }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('sn_id, sn_name')
    .order('sn_name')
  return data ?? []
}

export async function getSuperNeighborhood(snId: string): Promise<SuperNeighborhood | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('super_neighborhoods')
    .select('*')
    .eq('sn_id', snId)
    .single()
  return data ?? null
}

export async function getNeighborhoodsBySuperNeighborhood(snId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('super_neighborhood_id', snId)
    .order('neighborhood_name')
  return data ?? []
}

/**
 * Gather all map markers (services, voting, distribution, orgs) for a super neighborhood.
 * Aggregates ZIP codes from child neighborhoods via neighborhood_zip_codes junction,
 * then queries each marker type by ZIP.
 */
export async function getMapMarkersForSuperNeighborhood(snId: string) {
  const supabase = await createClient()

  // Get all neighborhoods in this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', snId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)

  // Get ZIP codes from junction table
  let allZips: string[] = []
  if (hoodIds.length > 0) {
    const { data: zipJunctions } = await supabase
      .from('neighborhood_zip_codes')
      .select('zip_code')
      .in('neighborhood_id', hoodIds)
    allZips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  }

  if (allZips.length === 0) return { services: [], votingLocations: [], distributionSites: [], organizations: [] }

  const [services, votingLocations, distributionSites, organizations] = await Promise.all([
    getServicesWithCoords(allZips),
    getVotingLocationsWithCoords(allZips),
    getDistributionSitesWithCoords(allZips),
    getOrganizationsWithCoords(),
  ])

  return { services, votingLocations, distributionSites, organizations }
}

// ── Map marker data ────────────────────────────────────────────────────
// These functions return entities with lat/lng for rendering on Leaflet maps.
// Coordinates come from the entity table or fall back to geocode_cache.

/**
 * Services with coordinates for map markers.
 * Joins with organizations for names and geocode_cache for lat/lng.
 * Optionally filtered by ZIP codes.
 */
export async function getServicesWithCoords(zipCodes?: string[]): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()

  // services_211 may or may not have latitude/longitude columns yet.
  // Fetch services and join with geocode_cache by address hash if lat/lng not on table.
  let query = supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')

  if (zipCodes && zipCodes.length > 0) {
    query = query.in('zip_code', zipCodes)
  }

  const { data: services } = await query.limit(200)
  if (!services || services.length === 0) return []

  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  let orgMap = new Map<string, string>()
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from('organizations')
      .select('org_id, org_name')
      .in('org_id', orgIds as string[])
    orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
  }

  // Try to get coords from geocode_cache for services that have addresses
  let coordMap = new Map<string, { latitude: number; longitude: number }>()
  const addressedServices = services.filter(s => s.address)
  if (addressedServices.length > 0) {
    const { data: cached } = await supabase
      .from('geocode_cache')
      .select('raw_address, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(1000)
    if (cached) {
      cached.forEach(c => {
        if (c.raw_address && c.latitude != null && c.longitude != null) {
          coordMap.set(c.raw_address.toLowerCase().trim(), { latitude: c.latitude, longitude: c.longitude })
        }
      })
    }
  }

  return services.map(s => {
    const fullAddr = [s.address, s.city, s.state, s.zip_code].filter(Boolean).join(', ').toLowerCase().trim()
    const coords = coordMap.get(fullAddr)
    return {
      ...s,
      org_name: orgMap.get(s.org_id!) ?? undefined,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    }
  })
}

/** Voting locations with coordinates, optionally filtered by ZIP code. */
export async function getVotingLocationsWithCoords(zipCodes?: string | string[]) {
  const supabase = await createClient()
  let query = supabase
    .from('voting_locations')
    .select('*')
    .eq('is_active', 'Yes')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCodes) {
    const zips = Array.isArray(zipCodes) ? zipCodes : [zipCodes]
    query = query.in('zip_code', zips.map(z => parseInt(z)))
  }

  const { data } = await query.limit(200)
  return data ?? []
}

/** Organizations with coordinates, optionally filtered by ZIP code. Selects only marker-needed fields. */
export async function getOrganizationsWithCoords(zipCode?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, latitude, longitude, zip_code, address, city')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCode) {
    query = query.eq('zip_code', zipCode)
  }

  const { data } = await query.limit(200)
  return data ?? []
}

export async function getDistributionSitesWithCoords(zipCodes?: string[]): Promise<DistributionSite[]> {
  const supabase = await createClient()
  let query = supabase
    .from('distribution_sites')
    .select('*')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCodes && zipCodes.length > 0) {
    query = query.in('zip_code', zipCodes)
  }

  const { data } = await query.limit(200)
  return data ?? []
}

/** Gather all map markers for a neighborhood using the neighborhood_zip_codes junction. */
export async function getMapMarkersForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  // Get ZIP codes from junction table
  const { data: zipJunctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .eq('neighborhood_id', neighborhoodId)

  const zips = (zipJunctions ?? []).map(j => j.zip_code)
  if (zips.length === 0) return { services: [], votingLocations: [], distributionSites: [], organizations: [] }

  const [services, votingLocations, distributionSites, organizations] = await Promise.all([
    getServicesWithCoords(zips),
    getVotingLocationsWithCoords(zips),
    getDistributionSitesWithCoords(zips),
    getOrganizationsWithCoords(),
  ])

  return { services, votingLocations, distributionSites, organizations }
}

// ── Service-Org-Geography connectivity ───────────────────────────────
// Functions that connect the service layer to organizations and geography,
// enabling queries like "what services are in this neighborhood?"

/**
 * Fetch services available in a super neighborhood by aggregating ZIP codes
 * from the neighborhood_zip_codes junction table. Joins with organizations for parent org names.
 */
export async function getServicesByNeighborhood(neighborhoodId: string): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()

  // Get child neighborhoods of this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', neighborhoodId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)
  if (hoodIds.length === 0) return []

  // Get ZIP codes from junction table
  const { data: zipJunctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .in('neighborhood_id', hoodIds)

  const allZips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  if (allZips.length === 0) return []
  return getServicesWithCoords(allZips)
}

/**
 * Fetch organizations located in a super neighborhood using the
 * organization_neighborhoods junction table. Returns organizations with coordinates for map rendering.
 */
export async function getOrganizationsByNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()

  // Get child neighborhoods of this super neighborhood
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', neighborhoodId)

  const hoodIds = (hoods ?? []).map(h => h.neighborhood_id)
  if (hoodIds.length === 0) return []

  // Get org IDs from junction table
  const { data: orgJunctions } = await supabase
    .from('organization_neighborhoods')
    .select('org_id')
    .in('neighborhood_id', hoodIds)

  const orgIds = Array.from(new Set((orgJunctions ?? []).map(j => j.org_id)))
  if (orgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, latitude, longitude, zip_code, address, city')
    .in('org_id', orgIds)
    .limit(200)

  return data ?? []
}

// ── Mesh query functions (enabled by normalized junction tables) ──────

/**
 * Get all organizations addressing a specific SDOH domain.
 * Traverses: sdoh_domains → focus_areas → organization_focus_areas → organizations
 */
export async function getOrganizationsBySdoh(sdohCode: string) {
  const supabase = await createClient()
  // Get focus areas linked to this SDOH domain
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id')
    .eq('sdoh_code', sdohCode)
  const focusIds = (focusAreas ?? []).map(f => f.focus_id)
  if (focusIds.length === 0) return []

  // Get org IDs from junction
  const { data: orgJunctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusIds)
  const orgIds = Array.from(new Set((orgJunctions ?? []).map(j => j.org_id)))
  if (orgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .in('org_id', orgIds)
    .limit(50)
  return data ?? []
}

/**
 * Get newsfeed items for a neighborhood.
 * Traverses: neighborhood → organization_neighborhoods → organizations → content_published (news).
 * Returns news articles/videos/reports, not community resources.
 */
export async function getContentForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()
  const { data: orgJunctions } = await supabase
    .from('organization_neighborhoods')
    .select('org_id')
    .eq('neighborhood_id', neighborhoodId)
  const orgIds = (orgJunctions ?? []).map(j => j.org_id)
  if (orgIds.length === 0) return []

  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .in('org_id', orgIds)
    .order('published_at', { ascending: false })
    .limit(20)
  return data ?? []
}

/**
 * Get officials responsible for a neighborhood's districts.
 * Traverses: neighborhood → precinct_neighborhoods → precincts → elected_officials
 * Collects council, congressional, state house, and state senate district IDs.
 */
export async function getOfficialsForNeighborhood(neighborhoodId: string) {
  const supabase = await createClient()
  const { data: precinctJunctions } = await supabase
    .from('precinct_neighborhoods')
    .select('precinct_id')
    .eq('neighborhood_id', neighborhoodId)
  const precinctIds = (precinctJunctions ?? []).map(j => j.precinct_id)
  if (precinctIds.length === 0) return []

  const { data: precincts } = await supabase
    .from('precincts')
    .select('council_district, congressional_district, state_house_district, state_senate_district')
    .in('precinct_id', precinctIds)

  // Collect all unique district IDs across district types
  const districtIds = Array.from(new Set(
    (precincts ?? []).flatMap(p => [
      p.council_district,
      p.congressional_district,
      p.state_house_district,
      p.state_senate_district,
    ]).filter((d): d is string => d != null)
  ))
  if (districtIds.length === 0) return []

  const { data } = await supabase
    .from('elected_officials')
    .select('*')
    .in('district_id', districtIds)
  return data ?? []
}

/**
 * Get the full mesh path: situation → focus_areas → orgs → neighborhoods.
 * Returns organizations that address the given life situation and serve the given neighborhood.
 */
export async function getMeshPath(situationId: string, neighborhoodId: string) {
  const supabase = await createClient()

  // Get focus areas for the situation
  const { data: focusJunctions } = await supabase
    .from('life_situation_focus_areas')
    .select('focus_id')
    .eq('situation_id', situationId)
  const focusIds = (focusJunctions ?? []).map(j => j.focus_id)
  if (focusIds.length === 0) return []

  // Get orgs that address these focus areas
  const { data: orgFocusJunctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusIds)
  const focusOrgIds = new Set((orgFocusJunctions ?? []).map(j => j.org_id))

  // Get orgs in the neighborhood
  const { data: orgHoodJunctions } = await supabase
    .from('organization_neighborhoods')
    .select('org_id')
    .eq('neighborhood_id', neighborhoodId)
  const hoodOrgIds = new Set((orgHoodJunctions ?? []).map(j => j.org_id))

  // Intersection: orgs that both address the situation AND serve the neighborhood
  const matchingOrgIds = Array.from(focusOrgIds).filter(id => hoodOrgIds.has(id))
  if (matchingOrgIds.length === 0) return []

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .in('org_id', matchingOrgIds)
    .limit(50)
  return data ?? []
}

/** Get ZIP codes for a neighborhood from the junction table. */
export async function getNeighborhoodZipCodes(neighborhoodId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .eq('neighborhood_id', neighborhoodId)
  return (data ?? []).map(j => j.zip_code)
}

/** Get focus area IDs for an official from the junction table. */
export async function getOfficialFocusAreaIds(officialId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('official_focus_areas')
    .select('focus_id')
    .eq('official_id', officialId)
  return (data ?? []).map(j => j.focus_id)
}

/** Get official IDs for a policy from the junction table. */
export async function getPolicyOfficialIds(policyId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policy_officials')
    .select('official_id')
    .eq('policy_id', policyId)
  return (data ?? []).map(j => j.official_id)
}

/** Get life situation IDs linked to content from the junction table. */
export async function getContentLifeSituationIds(contentId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_life_situations')
    .select('situation_id')
    .eq('content_id', contentId)
  return (data ?? []).map(j => j.situation_id)
}

// ── Wayfinder data (braided feed, mesh traversal) ────────────────────

/**
 * Fetch all entity types connected to a pathway via focus areas.
 * Returns content, officials, policies, and services that share focus areas
 * belonging to the given theme. This powers the braided feed.
 *
 * @param themeId - Pathway ID (THEME_01..THEME_07)
 * @param zipCode - Optional ZIP for geographic filtering of services
 */
export async function getPathwayBraidedFeed(themeId: string, zipCode?: string) {
  const supabase = await createClient()

  // Get focus areas for this pathway
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name')
    .eq('theme_id', themeId)
  const focusIds = (focusAreas ?? []).map(f => f.focus_id)

  if (focusIds.length === 0) {
    return { content: [], officials: [], policies: [], services: [], focusAreas: [] }
  }

  // Parallel fetch: all entity types connected to these focus areas
  const [contentJunctions, officialJunctions, policyJunctions, serviceJunctions] = await Promise.all([
    supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds),
    supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds),
    supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds),
    supabase.from('service_focus_areas').select('service_id').in('focus_id', focusIds),
  ])

  const contentIds = Array.from(new Set((contentJunctions.data ?? []).map(j => j.content_id)))
  const officialIds = Array.from(new Set((officialJunctions.data ?? []).map(j => j.official_id)))
  const policyIds = Array.from(new Set((policyJunctions.data ?? []).map(j => j.policy_id)))
  const serviceIds = Array.from(new Set((serviceJunctions.data ?? []).map(j => j.service_id)))

  // Fetch actual entities in parallel
  const [content, officials, policies, services] = await Promise.all([
    contentIds.length > 0
      ? supabase
          .from('content_published')
          .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_domain, published_at, image_url')
          .eq('is_active', true)
          .in('id', contentIds.slice(0, 50))
          .order('published_at', { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    officialIds.length > 0
      ? supabase
          .from('elected_officials')
          .select('official_id, official_name, title, party, level, jurisdiction, description_5th_grade')
          .in('official_id', officialIds.slice(0, 50))
          .limit(10)
      : Promise.resolve({ data: [] }),
    policyIds.length > 0
      ? supabase
          .from('policies')
          .select('policy_id, policy_name, summary_5th_grade, policy_type, level, status, bill_number')
          .in('policy_id', policyIds.slice(0, 50))
          .limit(10)
      : Promise.resolve({ data: [] }),
    serviceIds.length > 0
      ? supabase
          .from('services_211')
          .select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website')
          .eq('is_active', 'Yes')
          .in('service_id', serviceIds.slice(0, 100))
          .limit(20)
      : Promise.resolve({ data: [] }),
  ])

  // If zipCode provided, filter services to that zip
  let filteredServices = services.data ?? []
  if (zipCode) {
    filteredServices = filteredServices.filter(s => s.zip_code === zipCode)
  }

  return {
    content: content.data ?? [],
    officials: officials.data ?? [],
    policies: policies.data ?? [],
    services: filteredServices,
    focusAreas: focusAreas ?? [],
  }
}

/**
 * Get pathway bridge connections: count of shared focus areas between pathways.
 * Used to render connection lines between pathway circles.
 */
export async function getPathwayBridges(): Promise<Array<[string, string, number]>> {
  const supabase = await createClient()
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, theme_id')

  if (!focusAreas) return []

  // Build focus_id → theme_id map
  const focusToTheme: Record<string, string> = {}
  focusAreas.forEach(fa => { if (fa.theme_id) focusToTheme[fa.focus_id] = fa.theme_id })

  // Get content that has multiple pathways via content_pathways junction
  const { data: contentPathways } = await supabase
    .from('content_pathways')
    .select('content_id, theme_id')

  if (!contentPathways) return []

  // Count shared content between theme pairs
  const contentThemes: Record<string, Set<string>> = {}
  contentPathways.forEach(cp => {
    if (!contentThemes[cp.content_id]) contentThemes[cp.content_id] = new Set()
    contentThemes[cp.content_id].add(cp.theme_id)
  })

  const pairCounts: Record<string, number> = {}
  Object.values(contentThemes).forEach(themes => {
    const themeArr = Array.from(themes)
    for (let i = 0; i < themeArr.length; i++) {
      for (let j = i + 1; j < themeArr.length; j++) {
        const key = [themeArr[i], themeArr[j]].sort().join('|')
        pairCounts[key] = (pairCounts[key] || 0) + 1
      }
    }
  })

  return Object.entries(pairCounts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const [a, b] = key.split('|')
      return [a, b, count] as [string, string, number]
    })
    .sort((a, b) => b[2] - a[2])
}

/**
 * Get bridge connections for a single pathway.
 * Filters the global bridge data and maps to theme names/colors/slugs.
 */
export async function getBridgesForPathway(themeId: string): Promise<Array<{ targetThemeId: string; targetName: string; targetColor: string; targetSlug: string; sharedCount: number }>> {
  const { THEMES } = await import('@/lib/constants')
  const allBridges = await getPathwayBridges()
  const relevant = allBridges.filter(function (b) { return b[0] === themeId || b[1] === themeId })
  return relevant
    .map(function (b) {
      const otherId = b[0] === themeId ? b[1] : b[0]
      const otherTheme = THEMES[otherId as keyof typeof THEMES]
      if (!otherTheme) return null
      return {
        targetThemeId: otherId,
        targetName: otherTheme.name,
        targetColor: otherTheme.color,
        targetSlug: otherTheme.slug,
        sharedCount: b[2],
      }
    })
    .filter(function (b): b is NonNullable<typeof b> { return b !== null })
    .sort(function (a, b) { return b.sharedCount - a.sharedCount })
}

/**
 * Get the full entity profile with mesh connections for the wayfinder panel.
 * Every entity type returns its focus areas + related entities from other types.
 *
 * @param entityType - 'content' | 'official' | 'policy' | 'service' | 'organization'
 * @param entityId - The entity's primary key value
 */
export async function getEntityMeshProfile(entityType: string, entityId: string) {
  const supabase = await createClient()

  const emptyResult = { focusAreas: [] as Array<{ focus_id: string; focus_area_name: string; theme_id: string | null }>, relatedContent: [] as Array<{ id: string; title_6th_grade: string | null; center: string | null }>, relatedOfficials: [] as Array<{ official_id: string; official_name: string; title: string | null; level: string | null }>, relatedPolicies: [] as Array<{ policy_id: string; policy_name: string; status: string | null }>, relatedServices: [] as Array<{ service_id: string; service_name: string; org_id: string | null }> }

  // Get this entity's focus areas by entity type
  let focusIds: string[] = []
  if (entityType === 'content') {
    const { data } = await supabase.from('content_focus_areas').select('focus_id').eq('content_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'official') {
    const { data } = await supabase.from('official_focus_areas').select('focus_id').eq('official_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'policy') {
    const { data } = await supabase.from('policy_focus_areas').select('focus_id').eq('policy_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'service') {
    const { data } = await supabase.from('service_focus_areas').select('focus_id').eq('service_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'organization') {
    const { data } = await supabase.from('organization_focus_areas').select('focus_id').eq('org_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else {
    return emptyResult
  }

  if (focusIds.length === 0) {
    return emptyResult
  }

  // Get focus area names
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  // Find related entities through shared focus areas (excluding self)
  const [contentJ, officialJ, policyJ, serviceJ] = await Promise.all([
    entityType !== 'content'
      ? supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'official'
      ? supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'policy'
      ? supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
    entityType !== 'service'
      ? supabase.from('service_focus_areas').select('service_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] }),
  ])

  const relContentIds = Array.from<string>(new Set((contentJ.data ?? []).map(j => String(j.content_id)))).slice(0, 5)
  const relOfficialIds = Array.from<string>(new Set((officialJ.data ?? []).map(j => String(j.official_id)))).slice(0, 5)
  const relPolicyIds = Array.from<string>(new Set((policyJ.data ?? []).map(j => String(j.policy_id)))).slice(0, 5)
  const relServiceIds = Array.from<string>(new Set((serviceJ.data ?? []).map(j => String(j.service_id)))).slice(0, 5)

  const [relContent, relOfficials, relPolicies, relServices] = await Promise.all([
    relContentIds.length > 0
      ? supabase.from('content_published').select('id, title_6th_grade, center').eq('is_active', true).in('id', relContentIds)
      : Promise.resolve({ data: [] }),
    relOfficialIds.length > 0
      ? supabase.from('elected_officials').select('official_id, official_name, title, level').in('official_id', relOfficialIds)
      : Promise.resolve({ data: [] }),
    relPolicyIds.length > 0
      ? supabase.from('policies').select('policy_id, policy_name, status').in('policy_id', relPolicyIds)
      : Promise.resolve({ data: [] }),
    relServiceIds.length > 0
      ? supabase.from('services_211').select('service_id, service_name, org_id').eq('is_active', 'Yes').in('service_id', relServiceIds)
      : Promise.resolve({ data: [] }),
  ])

  return {
    focusAreas: focusAreas ?? [],
    relatedContent: relContent.data ?? [],
    relatedOfficials: relOfficials.data ?? [],
    relatedPolicies: relPolicies.data ?? [],
    relatedServices: relServices.data ?? [],
  }
}

/**
 * Universal Wayfinder context — surfaces ALL related entities through shared focus areas.
 * Replaces getEntityMeshProfile with richer, multi-hop traversal.
 */
export async function getWayfinderContext(
  entityType: string,
  entityId: string,
  userRole?: string,
): Promise<import('@/lib/types/exchange').WayfinderData> {
  const { getLibraryNuggets } = await import('@/lib/data/library')
  const supabase = await createClient()

  const empty: import('@/lib/types/exchange').WayfinderData = {
    focusAreas: [], themes: [], content: [], libraryNuggets: [],
    opportunities: [], services: [], officials: [], policies: [],
    foundations: [], organizations: [],
  }

  // ── Hop 1: Get this entity's focus area IDs ──
  let focusIds: string[] = []
  if (entityType === 'content') {
    const { data } = await supabase.from('content_focus_areas').select('focus_id').eq('content_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'official') {
    const { data } = await supabase.from('official_focus_areas').select('focus_id').eq('official_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'policy') {
    const { data } = await supabase.from('policy_focus_areas').select('focus_id').eq('policy_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'service') {
    const { data } = await (supabase as any).from('service_focus_areas').select('focus_id').eq('service_id', entityId)
    focusIds = (data ?? []).map((j: any) => j.focus_id)
  } else if (entityType === 'organization') {
    const { data } = await supabase.from('organization_focus_areas').select('focus_id').eq('org_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'guide') {
    // Guide stores focus_area_ids inline
    const { data } = await supabase.from('guides').select('focus_area_ids').eq('guide_id', entityId).single()
    focusIds = (data as any)?.focus_area_ids ?? []
  } else if (entityType === 'kb_document') {
    const { data } = await (supabase as any).from('kb_documents').select('focus_area_ids, theme_ids').eq('id', entityId).single()
    focusIds = (data as any)?.focus_area_ids ?? []
  } else if (entityType === 'life_situation') {
    const { data } = await supabase.from('life_situation_focus_areas').select('focus_id').eq('situation_id', entityId)
    focusIds = (data ?? []).map(j => j.focus_id)
  } else if (entityType === 'opportunity') {
    const { data } = await (supabase as any).from('opportunity_focus_areas').select('focus_id').eq('opportunity_id', entityId)
    focusIds = (data ?? []).map((j: any) => j.focus_id)
  } else if (entityType === 'learning_path') {
    const { data } = await supabase.from('learning_paths').select('focus_area_ids').eq('path_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'campaign') {
    const { data } = await supabase.from('campaigns').select('focus_area_ids').eq('campaign_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'benefit') {
    const { data } = await supabase.from('benefit_programs').select('focus_area_ids').eq('benefit_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'agency') {
    const { data } = await supabase.from('agencies').select('focus_area_ids').eq('agency_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'event') {
    const { data } = await supabase.from('events').select('focus_area_ids').eq('event_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'foundation') {
    const { data } = await supabase.from('foundation_focus_areas').select('focus_id').eq('foundation_id', entityId)
    focusIds = (data ?? []).map((j: any) => j.focus_id)
  } else if (entityType === 'candidate') {
    const { data } = await (supabase as any).from('candidate_focus_areas').select('focus_id').eq('candidate_id', entityId)
    focusIds = (data ?? []).map((j: any) => j.focus_id)
  } else if (entityType === 'municipal_service') {
    const { data } = await (supabase as any).from('municipal_service_focus_areas').select('focus_id').eq('municipal_service_id', entityId)
    focusIds = (data ?? []).map((j: any) => j.focus_id)
  } else if (entityType === 'election') {
    // Elections don't have focus areas directly — aggregate from their candidates
    const { data: cands } = await (supabase as any).from('candidates').select('candidate_id').eq('election_id', entityId)
    if (cands && cands.length > 0) {
      const candIds = cands.map((c: any) => c.candidate_id)
      const { data: cfa } = await (supabase as any).from('candidate_focus_areas').select('focus_id').in('candidate_id', candIds)
      focusIds = Array.from(new Set((cfa ?? []).map((j: any) => j.focus_id)))
    }
  } else if (entityType === 'neighborhood') {
    const { data } = await (supabase as any).from('neighborhoods').select('focus_area_ids, theme_id').eq('neighborhood_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'super_neighborhood') {
    const { data } = await (supabase as any).from('super_neighborhoods').select('focus_area_ids, theme_id').eq('sn_id', entityId).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'story') {
    const { data } = await (supabase as any).from('success_stories').select('focus_area_ids, theme_id').or(`story_id.eq.${entityId},id.eq.${entityId}`).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else if (entityType === 'collection') {
    const { data } = await (supabase as any).from('featured_collections').select('focus_area_ids, theme_id').or(`collection_id.eq.${entityId},id.eq.${entityId}`).single()
    const raw = (data as any)?.focus_area_ids
    focusIds = Array.isArray(raw) ? raw : typeof raw === 'string' ? JSON.parse(raw) : []
  } else {
    return empty
  }

  if (focusIds.length === 0) return empty

  // Get focus area details
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  const faList = focusAreas ?? []
  const themes = Array.from(new Set(faList.map(fa => fa.theme_id).filter(Boolean))) as string[]

  // ── Hop 2: Fan out through focus areas to find related entity IDs ──
  // Foundation junction uses focus_area name strings, not IDs
  const faNames = faList.map(fa => fa.focus_area_name)

  const [contentJ, officialJ, policyJ, serviceJ, orgJ, oppJ, foundationJ] = await Promise.all([
    entityType !== 'content'
      ? supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds),
    supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds),
    (supabase as any).from('service_focus_areas').select('service_id').in('focus_id', focusIds),
    supabase.from('organization_focus_areas').select('org_id').in('focus_id', focusIds),
    supabase.from('opportunity_focus_areas').select('opportunity_id').in('focus_id', focusIds),
    faNames.length > 0
      ? (supabase as any).from('foundation_focus_areas').select('foundation_id').in('focus_area', faNames)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Exclude the current entity from its own related results (M3 self-referencing fix)
  const exclude = (ids: string[]) => ids.filter(id => id !== entityId)
  const relContentIds = exclude(Array.from<string>(new Set((contentJ.data ?? []).map((j: any) => String(j.content_id))))).slice(0, 6)
  const relOfficialIds = exclude(Array.from<string>(new Set((officialJ.data ?? []).map((j: any) => String(j.official_id))))).slice(0, 4)
  const relPolicyIds = exclude(Array.from<string>(new Set((policyJ.data ?? []).map((j: any) => String(j.policy_id))))).slice(0, 4)
  const relServiceIds = exclude(Array.from<string>(new Set((serviceJ.data ?? []).map((j: any) => String(j.service_id))))).slice(0, 6)
  const relOrgIds = exclude(Array.from<string>(new Set((orgJ.data ?? []).map((j: any) => String(j.org_id))))).slice(0, 4)
  const relOppIds = exclude(Array.from<string>(new Set((oppJ.data ?? []).map((j: any) => String(j.opportunity_id))))).slice(0, 4)
  const relFoundationIds = Array.from<string>(new Set((foundationJ.data ?? []).map((j: any) => String(j.foundation_id)))).slice(0, 3)

  // ── Hop 3: Fetch enriched entity details in parallel ──
  const [relContent, relOfficials, relPolicies, relServices, relOrgs, relOpps, nuggets, relFoundations] = await Promise.all([
    relContentIds.length > 0
      ? supabase.from('content_published')
          .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url, inbox_id, content_type')
          .eq('is_active', true).in('id', relContentIds)
      : Promise.resolve({ data: [] }),
    relOfficialIds.length > 0
      ? supabase.from('elected_officials')
          .select('official_id, official_name, title, level, party, photo_url')
          .in('official_id', relOfficialIds)
      : Promise.resolve({ data: [] }),
    relPolicyIds.length > 0
      ? supabase.from('policies')
          .select('policy_id, policy_name, title_6th_grade, bill_number, status, level')
          .in('policy_id', relPolicyIds)
      : Promise.resolve({ data: [] }),
    relServiceIds.length > 0
      ? supabase.from('services_211')
          .select('service_id, service_name, description_5th_grade, phone, address, city, zip_code, org_id')
          .eq('is_active', 'Yes').in('service_id', relServiceIds)
      : Promise.resolve({ data: [] }),
    relOrgIds.length > 0
      ? supabase.from('organizations')
          .select('org_id, org_name, description_5th_grade, logo_url, website, phone, donate_url, volunteer_url, newsletter_url, org_type')
          .in('org_id', relOrgIds)
      : Promise.resolve({ data: [] }),
    relOppIds.length > 0
      ? supabase.from('opportunities')
          .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, time_commitment, is_virtual, registration_url, org_id')
          .eq('is_active', 'Yes').in('opportunity_id', relOppIds)
      : Promise.resolve({ data: [] }),
    getLibraryNuggets(themes, focusIds, 2),
    relFoundationIds.length > 0
      ? (supabase as any).from('foundations').select('id, name, mission, website_url').in('id', relFoundationIds)
      : Promise.resolve({ data: [] }),
  ])

  // Map foundation results from parallel queries above
  const foundations = ((relFoundations.data ?? []) as any[]).map((f: any) => ({
    foundation_id: f.id,
    name: f.name,
    description: f.mission || null,
    website: f.website_url || null,
  }))

  // ── Taxonomy metadata — available to all users ──
  let taxonomy: import('@/lib/types/exchange').WayfinderData['taxonomy']

  // Helper to resolve SDGs from a junction table
  async function resolveSDGs(table: string, idCol: string, idVal: string) {
    const { data: junctions } = await (supabase as any).from(table).select('sdg_id').eq(idCol, idVal)
    const ids = (junctions ?? []).map((j: any) => j.sdg_id)
    if (ids.length === 0) return []
    const { data } = await supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name, sdg_color').in('sdg_id', ids)
    return (data ?? []) as any[]
  }

  // Helper to resolve gov level from a gov_level_id
  async function resolveGovLevel(govLevelId: string | null) {
    if (!govLevelId) return null
    const { data } = await supabase.from('government_levels').select('gov_level_id, gov_level_name').eq('gov_level_id', govLevelId).single()
    return data as any
  }

  if (entityType === 'content') {
    const [sdgJ, contentRow, actionTypeJ, govLevelJ] = await Promise.all([
      supabase.from('content_sdgs').select('sdg_id').eq('content_id', entityId),
      supabase.from('content_published').select('sdoh_domain, time_commitment_id, gov_level_id').eq('id', entityId).single(),
      (supabase as any).from('content_action_types').select('action_type_id').eq('content_id', entityId),
      (supabase as any).from('content_government_levels').select('gov_level_id').eq('content_id', entityId),
    ])

    const sdgIds = (sdgJ.data ?? []).map((j: any) => j.sdg_id)
    const atIds = (actionTypeJ.data ?? []).map((j: any) => j.action_type_id)
    const glIds = (govLevelJ.data ?? []).map((j: any) => j.gov_level_id)
    const pub = contentRow.data as any

    const [sdgRows, sdohRow, atRows, glRow, tcRow] = await Promise.all([
      sdgIds.length > 0
        ? supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name, sdg_color').in('sdg_id', sdgIds)
        : Promise.resolve({ data: [] }),
      pub?.sdoh_domain
        ? supabase.from('sdoh_domains').select('sdoh_code, sdoh_name, sdoh_description').eq('sdoh_code', pub.sdoh_domain).single()
        : Promise.resolve({ data: null }),
      atIds.length > 0
        ? supabase.from('action_types').select('action_type_id, action_type_name, category').in('action_type_id', atIds)
        : Promise.resolve({ data: [] }),
      glIds.length > 0
        ? supabase.from('government_levels').select('gov_level_id, gov_level_name').in('gov_level_id', glIds).limit(1)
        : Promise.resolve({ data: [] }),
      pub?.time_commitment_id
        ? supabase.from('time_commitments').select('time_id, time_name').eq('time_id', pub.time_commitment_id).single()
        : Promise.resolve({ data: null }),
    ])

    // Get NTEE/AIRS from the review queue classification
    let ntee_codes: string[] = []
    let airs_codes: string[] = []
    const { data: reviewRow } = await supabase
      .from('content_review_queue')
      .select('ai_classification')
      .eq('inbox_id', entityId)
      .single()
    if (reviewRow?.ai_classification) {
      const cls = typeof reviewRow.ai_classification === 'string'
        ? JSON.parse(reviewRow.ai_classification)
        : reviewRow.ai_classification
      ntee_codes = cls.ntee_codes || []
      airs_codes = cls.airs_codes || []
    }

    taxonomy = {
      sdgs: (sdgRows.data ?? []) as any[],
      sdohDomain: sdohRow.data as any,
      actionTypes: (atRows.data ?? []) as any[],
      govLevel: (glRow.data as any)?.[0] || null,
      timeCommitment: tcRow.data as any,
      ntee_codes,
      airs_codes,
    }
  } else if (entityType === 'official') {
    const { data: officialRow } = await supabase.from('elected_officials').select('gov_level_id').eq('official_id', entityId).single()
    const [sdgs, govLevel] = await Promise.all([
      resolveSDGs('official_sdgs', 'official_id', entityId),
      resolveGovLevel((officialRow as any)?.gov_level_id),
    ])
    taxonomy = {
      sdgs,
      sdohDomain: null,
      actionTypes: [],
      govLevel,
      timeCommitment: null,
      ntee_codes: [],
      airs_codes: [],
    }
  } else if (entityType === 'service') {
    const sdgs = await resolveSDGs('service_sdgs', 'service_id', entityId)
    taxonomy = {
      sdgs,
      sdohDomain: null,
      actionTypes: [],
      govLevel: null,
      timeCommitment: null,
      ntee_codes: [],
      airs_codes: [],
    }
  } else if (entityType === 'organization') {
    const sdgs = await resolveSDGs('organization_sdgs', 'org_id', entityId)
    // Get NTEE from org row
    const { data: orgRow } = await supabase.from('organizations').select('ntee_code').eq('org_id', entityId).single()
    const ntee_codes = (orgRow as any)?.ntee_code ? [(orgRow as any).ntee_code] : []
    taxonomy = {
      sdgs,
      sdohDomain: null,
      actionTypes: [],
      govLevel: null,
      timeCommitment: null,
      ntee_codes,
      airs_codes: [],
    }
  }

  return {
    focusAreas: faList,
    themes,
    content: (relContent.data ?? []) as any[],
    libraryNuggets: nuggets as any,
    opportunities: (relOpps.data ?? []) as any[],
    services: (relServices.data ?? []) as any[],
    officials: (relOfficials.data ?? []) as any[],
    policies: (relPolicies.data ?? []) as any[],
    foundations,
    organizations: (relOrgs.data ?? []) as any[],
    taxonomy,
  }
}

/**
 * Get topics (focus area names) for a pathway, used in sidebar topic pills.
 */
export async function getPathwayTopics(themeId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('focus_areas')
    .select('focus_area_name')
    .eq('theme_id', themeId)
    .order('focus_area_name')
  return (data ?? []).map(fa => fa.focus_area_name)
}

/**
 * Get all topic names across all pathways for the home state sidebar.
 * Returns top topics by entity count.
 */
export async function getAllTopics(limit = 24): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('focus_areas')
    .select('focus_area_name')
    .order('focus_area_name')
    .limit(limit)
  return (data ?? []).map(fa => fa.focus_area_name)
}

/** Related organizations matching focus area IDs. */
export async function getRelatedOrgsForGuide(focusAreaIds: string[]) {
  if (focusAreaIds.length === 0) return []
  const supabase = await createClient()
  const { data: junctions } = await supabase
    .from('organization_focus_areas')
    .select('org_id')
    .in('focus_id', focusAreaIds)
  const orgIds = Array.from(new Set((junctions ?? []).map((j: any) => j.org_id)))
  if (orgIds.length === 0) return []
  const { data } = await supabase
    .from('organizations')
    .select('org_id, org_name, description_5th_grade, website, logo_url, org_type')
    .in('org_id', orgIds)
    .limit(8)
  return data ?? []
}

/** Related published content matching focus area IDs. */
export async function getRelatedContentForGuide(focusAreaIds: string[]) {
  if (focusAreaIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url')
    .overlaps('focus_area_ids', focusAreaIds)
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(6)
  return data ?? []
}

/** Get adjacent guides for prev/next navigation. */
export async function getAdjacentGuides(currentOrder: number | null, themeId: string | null) {
  const supabase = await createClient()
  let prev = null
  let next = null

  if (currentOrder != null) {
    const { data: prevData } = await supabase
      .from('guides')
      .select('slug, title')
      .eq('is_active', true)
      .lt('display_order', currentOrder)
      .order('display_order', { ascending: false })
      .limit(1)
    if (prevData && prevData.length > 0) prev = prevData[0]

    const { data: nextData } = await supabase
      .from('guides')
      .select('slug, title')
      .eq('is_active', true)
      .gt('display_order', currentOrder)
      .order('display_order', { ascending: true })
      .limit(1)
    if (nextData && nextData.length > 0) next = nextData[0]
  }

  return { prev, next }
}

// ═══════════════════════════════════════════════════════════════
// KNOWLEDGE GRAPH — Data-driven queries
// ═══════════════════════════════════════════════════════════════

/** Full knowledge graph data for the constellation view. */
export async function getKnowledgeGraphData() {
  const supabase = await createClient()

  const [
    { data: focusAreas },
    { data: content },
    { data: orgs },
    { data: services },
    { data: guides },
    { data: policies },
    { data: opportunities },
    { data: sdgs },
    { data: sdohDomains },
  ] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, focus_area_name, theme_id, sdg_id, sdoh_code, is_bridging, description'),
    supabase.from('content_published').select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, focus_area_ids, sdg_ids, image_url, published_at, source_url'),
    supabase.from('organizations').select('org_id, org_name, focus_area_ids, website, description_5th_grade, org_type, logo_url'),
    supabase.from('services_211').select('service_id, service_name, focus_area_ids, org_id, description_5th_grade').eq('is_active', 'Yes'),
    supabase.from('guides').select('guide_id, title, slug, theme_id, focus_area_ids, description, hero_image_url').eq('is_active', true),
    supabase.from('policies').select('policy_id, policy_name, title_6th_grade, focus_area_ids, summary_5th_grade, summary_6th_grade'),
    supabase.from('opportunities').select('opportunity_id, opportunity_name, focus_area_ids, description_5th_grade, org_id').eq('is_active', 'Yes'),
    supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name, sdg_color'),
    supabase.from('sdoh_domains').select('sdoh_code, sdoh_name, sdoh_description'),
  ])

  // Build focus area lookup
  const faList = focusAreas || []
  const faMap = new Map(faList.map(fa => [fa.focus_id, fa]))

  // Helper: parse focus_area_ids which may be a text[] array or comma-separated string
  const parseFaIds = (val: string | string[] | null): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val
    return (val as string).split(',').map(s => s.trim()).filter(Boolean)
  }

  // Count content linked to each focus area
  const faContentCount: Record<string, number> = {}
  for (const c of content || []) {
    for (const fid of parseFaIds(c.focus_area_ids)) {
      faContentCount[fid] = (faContentCount[fid] || 0) + 1
    }
  }

  // Count orgs linked to each focus area
  const faOrgCount: Record<string, number> = {}
  for (const o of orgs || []) {
    for (const fid of parseFaIds(o.focus_area_ids)) {
      faOrgCount[fid] = (faOrgCount[fid] || 0) + 1
    }
  }

  // Build theme aggregations
  const themes: Record<string, {
    focusAreaCount: number
    contentCount: number
    orgCount: number
    serviceCount: number
    guideCount: number
    policyCount: number
    opportunityCount: number
    totalCount: number
    focusAreas: { focus_id: string; name: string; sdg_id: string | null; sdoh_code: string | null; contentCount: number; orgCount: number; is_bridging: boolean }[]
    recentContent: { id: string; title: string | null; image_url: string | null }[]
  }> = {}

  const themeIds = ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_04', 'THEME_05', 'THEME_06', 'THEME_07']
  for (const tid of themeIds) {
    const fas = faList.filter(fa => fa.theme_id === tid)
    const faIds = new Set(fas.map(fa => fa.focus_id))

    const themeContent = (content || []).filter(c => c.pathway_primary === tid)
    const themeOrgs = (orgs || []).filter(o => parseFaIds(o.focus_area_ids).some(fid => faIds.has(fid)))
    const themeServices = (services || []).filter(s => parseFaIds(s.focus_area_ids).some(fid => faIds.has(fid)))
    const themeGuides = (guides || []).filter(g => g.theme_id === tid)
    const themePolicies = (policies || []).filter(p => parseFaIds(p.focus_area_ids).some(fid => faIds.has(fid)))
    const themeOpps = (opportunities || []).filter(o => parseFaIds(o.focus_area_ids).some(fid => faIds.has(fid)))

    const recent = themeContent
      .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))
      .slice(0, 3)
      .map(c => ({ id: c.id, title: c.title_6th_grade, image_url: c.image_url }))

    themes[tid] = {
      focusAreaCount: fas.length,
      contentCount: themeContent.length,
      orgCount: themeOrgs.length,
      serviceCount: themeServices.length,
      guideCount: themeGuides.length,
      policyCount: themePolicies.length,
      opportunityCount: themeOpps.length,
      totalCount: themeContent.length + themeOrgs.length + themeServices.length + themeGuides.length + themePolicies.length + themeOpps.length,
      focusAreas: fas.map(fa => ({
        focus_id: fa.focus_id,
        name: fa.focus_area_name,
        sdg_id: fa.sdg_id,
        sdoh_code: fa.sdoh_code,
        contentCount: faContentCount[fa.focus_id] || 0,
        orgCount: faOrgCount[fa.focus_id] || 0,
        is_bridging: fa.is_bridging || false,
      })),
      recentContent: recent,
    }
  }

  // Compute bridges (shared focus areas between themes via content)
  const bridges: { a: string; b: string; shared: number }[] = []
  for (let i = 0; i < themeIds.length; i++) {
    for (let j = i + 1; j < themeIds.length; j++) {
      const aFaIds = new Set(faList.filter(fa => fa.theme_id === themeIds[i]).map(fa => fa.focus_id))
      const bFaIds = new Set(faList.filter(fa => fa.theme_id === themeIds[j]).map(fa => fa.focus_id))
      // Count content that has focus areas in both themes
      let shared = 0
      for (const c of content || []) {
        const cFaIds = parseFaIds(c.focus_area_ids)
        const hasA = cFaIds.some(fid => aFaIds.has(fid))
        const hasB = cFaIds.some(fid => bFaIds.has(fid))
        if (hasA && hasB) shared++
      }
      if (shared > 0) bridges.push({ a: themeIds[i], b: themeIds[j], shared })
    }
  }

  // SDG aggregation
  const sdgCounts: Record<string, number> = {}
  for (const fa of faList) {
    if (fa.sdg_id) sdgCounts[fa.sdg_id] = (sdgCounts[fa.sdg_id] || 0) + 1
  }

  // SDOH aggregation
  const sdohCounts: Record<string, number> = {}
  for (const fa of faList) {
    if (fa.sdoh_code) sdohCounts[fa.sdoh_code] = (sdohCounts[fa.sdoh_code] || 0) + 1
  }

  return {
    themes,
    bridges,
    sdgs: (sdgs || []).map(s => ({ ...s, focusAreaCount: sdgCounts[s.sdg_id] || 0 })),
    sdohDomains: (sdohDomains || []).map(s => ({ ...s, focusAreaCount: sdohCounts[s.sdoh_code] || 0 })),
    totals: {
      focusAreas: faList.length,
      content: (content || []).length,
      organizations: (orgs || []).length,
      services: (services || []).length,
      guides: (guides || []).length,
      policies: (policies || []).length,
      opportunities: (opportunities || []).length,
    },
  }
}

/** Drill-down data for a specific theme. */
export async function getThemeDrillDown(themeId: string) {
  const supabase = await createClient()

  // Get focus areas for this theme
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, sdg_id, sdoh_code, is_bridging, description')
    .eq('theme_id', themeId)

  const faIds = (focusAreas || []).map(fa => fa.focus_id)
  if (faIds.length === 0) return { focusAreas: [], content: [], organizations: [], services: [], guides: [], policies: [], opportunities: [] }

  // For text-column tables (orgs, services, policies, opportunities) we build OR filters
  // matching any focus area ID in the comma-separated string
  const faOrFilter = faIds.map(id => `focus_area_ids.ilike.%${id}%`).join(',')

  // Fetch all linked entities in parallel
  const [
    { data: content },
    { data: orgs },
    { data: services },
    { data: guides },
    { data: policies },
    { data: opportunities },
  ] = await Promise.all([
    supabase.from('content_published')
      .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, focus_area_ids, image_url, source_url, published_at')
      .eq('pathway_primary', themeId)
      .order('published_at', { ascending: false })
      .limit(50),
    supabase.from('organizations')
      .select('org_id, org_name, focus_area_ids, website, description_5th_grade, org_type, logo_url')
      .or(faOrFilter)
      .limit(30),
    supabase.from('services_211')
      .select('service_id, service_name, focus_area_ids, org_id, description_5th_grade')
      .eq('is_active', 'Yes')
      .or(faOrFilter)
      .limit(20),
    supabase.from('guides')
      .select('guide_id, title, slug, theme_id, focus_area_ids, description, hero_image_url')
      .eq('is_active', true)
      .eq('theme_id', themeId),
    supabase.from('policies')
      .select('policy_id, policy_name, focus_area_ids, summary_5th_grade')
      .or(faOrFilter)
      .limit(20),
    supabase.from('opportunities')
      .select('opportunity_id, opportunity_name, focus_area_ids, description_5th_grade, org_id')
      .eq('is_active', 'Yes')
      .or(faOrFilter)
      .limit(20),
  ])

  return {
    focusAreas: focusAreas || [],
    content: content || [],
    organizations: orgs || [],
    services: services || [],
    guides: guides || [],
    policies: policies || [],
    opportunities: opportunities || [],
  }
}

/** Get content linked to a specific focus area for the drill-down panel. */
export async function getFocusAreaDrillDown(focusId: string) {
  const supabase = await createClient()

  // content_published and guides have array-type focus_area_ids → use contains
  // orgs, services, policies, opportunities have text-type → use ilike
  const textMatch = `focus_area_ids.ilike.%${focusId}%`

  const [
    { data: focusArea },
    { data: content },
    { data: orgs },
    { data: services },
    { data: guides },
    { data: opportunities },
  ] = await Promise.all([
    supabase.from('focus_areas').select('*').eq('focus_id', focusId).single(),
    supabase.from('content_published')
      .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, image_url, source_url')
      .contains('focus_area_ids', [focusId])
      .order('published_at', { ascending: false })
      .limit(10),
    supabase.from('organizations')
      .select('org_id, org_name, website, description_5th_grade, org_type, logo_url')
      .or(textMatch)
      .limit(10),
    supabase.from('services_211')
      .select('service_id, service_name, org_id, description_5th_grade')
      .eq('is_active', 'Yes')
      .or(textMatch)
      .limit(10),
    supabase.from('guides')
      .select('guide_id, title, slug, description')
      .eq('is_active', true)
      .contains('focus_area_ids', [focusId]),
    supabase.from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade')
      .eq('is_active', 'Yes')
      .or(textMatch)
      .limit(10),
  ])

  return {
    focusArea,
    content: content || [],
    organizations: orgs || [],
    services: services || [],
    guides: guides || [],
    opportunities: opportunities || [],
  }
}

// ── Municipal Services ──

export interface MunicipalServicesResult {
  emergency: MunicipalServiceRow[]
  police: MunicipalServiceRow[]
  fire: MunicipalServiceRow[]
  medical: MunicipalServiceRow[]
  parks: MunicipalServiceRow[]
  library: MunicipalServiceRow[]
  utilities: MunicipalServiceRow[]
}

export async function getMunicipalServices(zip: string): Promise<MunicipalServicesResult> {
  const supabase = await createClient()

  // Get zip_code row for county_id and city
  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('county_id, city')
    .eq('zip_code', parseInt(zip))
    .single()

  const countyId = zipData?.county_id ?? null
  const city = zipData?.city ?? 'Houston'

  // Build OR filter: match county, city, or citywide coverage
  const filters: string[] = ['coverage_area.eq.citywide']
  if (countyId) filters.push('county_id.eq.' + countyId)
  if (city) filters.push('city.eq.' + city)

  const { data: services } = await supabase
    .from('municipal_services')
    .select('*')
    .or(filters.join(','))
    .order('display_order')

  const all = services || []

  return {
    emergency: all.filter(s => s.service_type === 'emergency'),
    police: all.filter(s => s.service_type === 'police'),
    fire: all.filter(s => s.service_type === 'fire'),
    medical: all.filter(s => s.service_type === 'medical'),
    parks: all.filter(s => s.service_type === 'parks'),
    library: all.filter(s => s.service_type === 'library'),
    utilities: all.filter(s => s.service_type === 'utilities'),
  }
}

// ── Policy geography queries ──────────────────────────────────────────

/** Get published policies affecting a ZIP code's districts. */
export async function getPoliciesByZip(zip: string) {
  const supabase = await createClient()

  // Look up the ZIP's district assignments
  const { data: zipDataRaw } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipDataRaw) return { federal: [], state: [], city: [] }
  const zipData = zipDataRaw as any

  // Build geo filters from district assignments
  const geoFilters: string[] = []
  geoFilters.push(`and(geo_type.eq.zip_code,geo_id.eq.${zip})`)
  if (zipData.congressional_district) geoFilters.push(`and(geo_type.eq.congressional,geo_id.eq.${zipData.congressional_district})`)
  if (zipData.state_senate_district) geoFilters.push(`and(geo_type.eq.state_senate,geo_id.eq.${zipData.state_senate_district})`)
  if (zipData.state_house_district) geoFilters.push(`and(geo_type.eq.state_house,geo_id.eq.${zipData.state_house_district})`)
  if (zipData.council_district) geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${zipData.council_district})`)

  if (geoFilters.length === 0) return { federal: [], state: [], city: [] }

  // Get policy IDs from policy_geography
  const { data: geoRows } = await (supabase as any)
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds: string[] = Array.from(new Set(((geoRows || []) as any[]).map((r: any) => r.policy_id as string)))
  if (policyIds.length === 0) return { federal: [], state: [], city: [] }

  // Fetch published policies
  const { data: policies } = await (supabase as any)
    .from('policies')
    .select('*')
    .in('policy_id', policyIds)
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })

  const all: any[] = policies || []
  return {
    federal: all.filter(function (p: any) { return p.level === 'Federal' }),
    state: all.filter(function (p: any) { return p.level === 'State' }),
    city: all.filter(function (p: any) { return p.level === 'City' }),
  }
}

/** Get published policies for a super neighborhood via its ZIP codes. */
export async function getPoliciesForNeighborhood(snId: string) {
  const supabase = await createClient()

  // Get ZIP codes that belong to this super neighborhood
  const { data: zipRows } = await (supabase as any)
    .from('zip_codes')
    .select('zip_code, council_district')
    .eq('neighborhood_id', parseInt(snId) || 0)

  if (!zipRows || zipRows.length === 0) return []

  // Get council districts for this SN
  const councilDistricts = Array.from(new Set(zipRows.map(function (z: any) { return z.council_district }).filter(Boolean)))

  // Query policy_geography for council district matches
  const geoFilters: string[] = []
  for (const cd of councilDistricts) {
    geoFilters.push(`and(geo_type.eq.council_district,geo_id.eq.${cd})`)
  }

  if (geoFilters.length === 0) return []

  const { data: geoRows } = await (supabase as any)
    .from('policy_geography')
    .select('policy_id')
    .or(geoFilters.join(','))

  const policyIds = (geoRows || []).map(function (r: any) { return r.policy_id as string })
  const uniquePolicyIds = Array.from(new Set(policyIds)) as string[]
  if (uniquePolicyIds.length === 0) return []

  const { data: policies } = await (supabase as any)
    .from('policies')
    .select('*')
    .in('policy_id', uniquePolicyIds)
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })
    .limit(20)

  return (policies || []) as any[]
}

/** Combined civic profile: officials + policies + geographic context for a ZIP. */
export async function getCivicProfileByZip(zip: string) {
  const [officials, policies] = await Promise.all([
    getOfficialsByZip(zip),
    getPoliciesByZip(zip),
  ])

  return { zip, officials, policies }
}

/** Get focus areas linked to a policy via policy_focus_areas. */
export async function getPolicyFocusAreas(policyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policy_focus_areas')
    .select('focus_id')
    .eq('policy_id', policyId)

  if (!data || data.length === 0) return []

  const focusIds = data.map(r => r.focus_id)
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .in('focus_id', focusIds)

  return focusAreas || []
}

/**
 * Get active theme/pathway IDs for a ZIP code.
 * Queries service and content focus-area junctions to find which themes are
 * represented in the user's area. Returns unique THEME_xx keys.
 */
export async function getActivePathwaysForZip(zip: string): Promise<string[]> {
  const supabase = await createClient()

  // Get services in this ZIP
  const { data: services } = await supabase
    .from('services_211')
    .select('service_id')
    .eq('zip_code', zip)
    .eq('is_active', 'Yes')
    .limit(50)

  if (!services || services.length === 0) return []

  const serviceIds = services.map(s => s.service_id)
  const { data: junctions } = await supabase
    .from('service_focus_areas')
    .select('focus_id')
    .in('service_id', serviceIds)

  if (!junctions || junctions.length === 0) return []

  const focusIds = Array.from(new Set(junctions.map(j => j.focus_id)))
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('theme_id')
    .in('focus_id', focusIds)

  if (!focusAreas) return []

  return Array.from(new Set(focusAreas.map(fa => fa.theme_id).filter(Boolean))) as string[]
}

// ── Geography page data ───────────────────────────────────────────────

/** Map municipal service_type to marker type for the geography map. */
const SERVICE_TYPE_TO_MARKER: Record<string, string> = {
  emergency: 'fire',
  police: 'police',
  fire: 'fire',
  medical: 'medical',
  parks: 'park',
  library: 'library',
  utilities: 'service',
}

/** Get municipal services as map markers (only those with lat/lng). */
export async function getMunicipalServiceMarkers(): Promise<MapMarkerData[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('municipal_services')
    .select('id, service_name, service_type, address, city, phone, website, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('display_order')
  return (data ?? []).map(function (s) {
    return {
      id: s.id,
      lat: Number(s.latitude),
      lng: Number(s.longitude),
      title: s.service_name,
      type: SERVICE_TYPE_TO_MARKER[s.service_type] || 'service',
      address: s.address ? (s.address + (s.city ? ', ' + s.city : '')) : null,
      phone: s.phone,
      link: s.website,
    }
  })
}

/** Fetch everything the geography page needs. */
export async function getGeographyData(zip?: string, superNeighborhoodId?: string): Promise<GeographyData> {
  const supabase = await createClient()

  // Parallel base queries
  const [snResult, hoodResult, svcMarkers, orgResult] = await Promise.all([
    supabase.from('super_neighborhoods').select('*').order('sn_name'),
    supabase.from('neighborhoods').select('neighborhood_id, neighborhood_name, super_neighborhood_id').order('neighborhood_name'),
    getMunicipalServiceMarkers(),
    supabase.from('organizations')
      .select('org_id, org_name, address, city, latitude, longitude, website, phone')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(200),
  ])

  const orgMarkers: MapMarkerData[] = (orgResult.data ?? []).map(function (o: any) {
    return {
      id: o.org_id,
      lat: Number(o.latitude),
      lng: Number(o.longitude),
      title: o.org_name || 'Organization',
      type: 'organization',
      address: o.address ? (o.address + (o.city ? ', ' + o.city : '')) : null,
      phone: o.phone,
      link: '/services?org=' + o.org_id,
    }
  })

  // Officials + policies if ZIP provided
  let officials: GeographyData['officials'] = []
  let policies: GeographyData['policies'] = []

  if (zip) {
    const { data: zipData } = await supabase
      .from('zip_codes')
      .select('*')
      .eq('zip_code', parseInt(zip))
      .single()

    if (zipData) {
      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        'TX',
      ].filter(Boolean)

      // Look up council district from neighborhoods
      const { data: hoodRows2 } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + zip + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDist = hoodRows2?.[0]?.council_district || null

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      if (councilDist) {
        filterParts += ',district_id.eq.' + councilDist
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: officialData } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, level, party, email, office_phone, website')
        .or(filterParts)
      officials = (officialData || []).map(function (o) {
        return { ...o, photo_url: null as string | null }
      })

      // Policies
      const { data: policyData } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, status, level, source_url')
        .limit(30)
      policies = (policyData || []).map(function (p) {
        return { policy_id: p.policy_id, policy_name: p.policy_name, title_6th_grade: p.title_6th_grade, status: p.status, level: p.level, source_url: p.source_url }
      })
    }
  }

  return {
    superNeighborhoods: (snResult.data ?? []) as SuperNeighborhood[],
    neighborhoods: hoodResult.data ?? [],
    serviceMarkers: svcMarkers,
    organizationMarkers: orgMarkers,
    officials,
    policies,
  }
}

// ── Compass ──────────────────────────────────────────────────────────

/**
 * Fetch content previews for the Compass grid: up to 3 items per pathway×center cell.
 * Returns a nested record keyed by pathway_primary → center → ContentPreview[].
 */
export async function getCompassPreview(): Promise<CompassPreviewData> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, image_url, source_url')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(200)

  const result: CompassPreviewData = {}
  const cellCounts: Record<string, number> = {}

  for (const row of data ?? []) {
    const pathway = row.pathway_primary
    const center = row.center
    if (!pathway || !center) continue

    const cellKey = pathway + '|' + center
    const count = cellCounts[cellKey] || 0
    if (count >= 3) continue
    cellCounts[cellKey] = count + 1

    if (!result[pathway]) result[pathway] = {}
    if (!result[pathway][center]) result[pathway][center] = []

    result[pathway][center].push({
      id: row.id,
      title: row.title_6th_grade,
      summary: row.summary_6th_grade,
      pathway,
      center,
      image_url: row.image_url ?? null,
      source_url: row.source_url ?? null,
    })
  }

  return result
}

/** Get geography rows for a policy. */
export async function getPolicyGeography(policyId: string): Promise<Array<{ geo_type: string; geo_id: string }>> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('policy_geography')
    .select('geo_type, geo_id')
    .eq('policy_id', policyId)
  return (data || []).map(function (row: any) {
    return { geo_type: row.geo_type, geo_id: row.geo_id }
  })
}

// ── Quotes ──────────────────────────────────────────────────────────────

export async function getQuotes(pathwayId?: string, limit = 10) {
  const supabase = await createClient()
  let query = (supabase as any)
    .from('quotes')
    .select('quote_id, quote_text, attribution, source_url, pathway_id, focus_area_id')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit)
  if (pathwayId) {
    query = query.or(`pathway_id.eq.${pathwayId},pathway_id.is.null`)
  }
  const { data } = await query
  return data || []
}

export async function getRandomQuote(pathwayId?: string) {
  const quotes = await getQuotes(pathwayId, 50)
  if (quotes.length === 0) return null
  return quotes[Math.floor(Math.random() * quotes.length)]
}

// ── Pathways Hub ────────────────────────────────────────────────────────

export interface PathwayHubItem {
  themeId: string
  heroContent: Array<{
    id: string
    title: string
    summary: string | null
    image_url: string | null
    content_type: string | null
    published_at: string | null
    source_domain: string | null
  }>
  contentCounts: Record<string, number>
  totalContent: number
  entityCounts: { services: number; officials: number; policies: number; opportunities: number }
  focusAreas: Array<{ focus_id: string; focus_area_name: string; description: string | null }>
  learningPaths: Array<{ path_id: string; path_name: string; description: string | null; estimated_minutes: number | null }>
  guides: Array<{ guide_id: string; title: string; slug: string; description: string | null; hero_image_url: string | null }>
  bridges: Array<{ targetThemeId: string; targetName: string; targetColor: string; targetSlug: string; sharedCount: number }>
}

export async function getPathwaysHubData(): Promise<Record<string, PathwayHubItem>> {
  const { THEMES } = await import('@/lib/constants')
  const supabase = await createClient()
  const themeIds = Object.keys(THEMES)

  // Phase 1: global queries
  const [
    { data: allContent },
    { data: allFocusAreas },
    { data: allLearningPaths },
    { data: allGuides },
    allBridges,
    { data: contentFAJunctions },
    { data: officialFAJunctions },
    { data: policyFAJunctions },
    { data: serviceFAJunctions },
    { data: oppFAJunctions },
  ] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, pathway_primary, image_url, content_type, published_at, source_domain')
      .eq('is_active', true)
      .not('pathway_primary', 'is', null)
      .order('published_at', { ascending: false })
      .limit(300),
    supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name, theme_id, description')
      .in('theme_id', themeIds),
    (supabase as any)
      .from('learning_paths')
      .select('path_id, path_name, description, estimated_minutes, theme_id')
      .eq('is_active', 'Yes')
      .in('theme_id', themeIds),
    (supabase as any)
      .from('guides')
      .select('guide_id, title, slug, theme_id, description, hero_image_url')
      .eq('is_active', true)
      .in('theme_id', themeIds),
    getPathwayBridges(),
    supabase.from('content_focus_areas').select('content_id, focus_id'),
    supabase.from('official_focus_areas').select('official_id, focus_id'),
    supabase.from('policy_focus_areas').select('policy_id, focus_id'),
    supabase.from('service_focus_areas').select('service_id, focus_id'),
    supabase.from('opportunity_focus_areas').select('opportunity_id, focus_id'),
  ])

  // Build focus_id → theme_id lookup
  const focusToTheme: Record<string, string> = {}
  for (const fa of allFocusAreas ?? []) {
    if (fa.theme_id) focusToTheme[fa.focus_id] = fa.theme_id
  }

  // Count unique entities per theme via focus area junctions
  const entitySets: Record<string, { services: Set<string>; officials: Set<string>; policies: Set<string>; opportunities: Set<string> }> = {}
  for (const id of themeIds) {
    entitySets[id] = { services: new Set(), officials: new Set(), policies: new Set(), opportunities: new Set() }
  }

  for (const j of officialFAJunctions ?? []) {
    const t = focusToTheme[j.focus_id]
    if (t) entitySets[t]?.officials.add(j.official_id)
  }
  for (const j of policyFAJunctions ?? []) {
    const t = focusToTheme[j.focus_id]
    if (t) entitySets[t]?.policies.add(j.policy_id)
  }
  for (const j of serviceFAJunctions ?? []) {
    const t = focusToTheme[j.focus_id]
    if (t) entitySets[t]?.services.add(j.service_id)
  }
  for (const j of oppFAJunctions ?? []) {
    const t = focusToTheme[j.focus_id]
    if (t) entitySets[t]?.opportunities.add(j.opportunity_id)
  }

  // Build result per theme
  const result: Record<string, PathwayHubItem> = {}

  for (const themeId of themeIds) {
    const themeContent = (allContent ?? []).filter(function (c) { return c.pathway_primary === themeId })

    // Content counts by type
    const contentCounts: Record<string, number> = {}
    for (const c of themeContent) {
      const ct = c.content_type || 'other'
      contentCounts[ct] = (contentCounts[ct] || 0) + 1
    }

    // Hero content: items with valid images
    const heroContent = themeContent
      .filter(function (c) { return c.image_url && c.image_url.startsWith('http') })
      .slice(0, 3)
      .map(function (c) {
        return {
          id: c.id,
          title: c.title_6th_grade || '',
          summary: c.summary_6th_grade,
          image_url: c.image_url,
          content_type: c.content_type,
          published_at: c.published_at,
          source_domain: c.source_domain,
        }
      })

    // Focus areas for this theme
    const themeFAs = (allFocusAreas ?? [])
      .filter(function (fa) { return fa.theme_id === themeId })
      .map(function (fa) { return { focus_id: fa.focus_id, focus_area_name: fa.focus_area_name, description: fa.description } })

    // Learning paths
    const themeLPs = ((allLearningPaths ?? []) as any[])
      .filter(function (lp) { return lp.theme_id === themeId })
      .map(function (lp) { return { path_id: lp.path_id, path_name: lp.path_name, description: lp.description, estimated_minutes: lp.estimated_minutes } })

    // Guides
    const themeGuides = ((allGuides ?? []) as any[])
      .filter(function (g: any) { return g.theme_id === themeId })
      .map(function (g: any) { return { guide_id: g.guide_id, title: g.title, slug: g.slug, description: g.description, hero_image_url: g.hero_image_url } })

    // Bridges
    const themeBridges = allBridges
      .filter(function (b) { return b[0] === themeId || b[1] === themeId })
      .map(function (b) {
        const targetId = b[0] === themeId ? b[1] : b[0]
        const targetTheme = (THEMES as any)[targetId]
        if (!targetTheme) return null
        return { targetThemeId: targetId, targetName: targetTheme.name, targetColor: targetTheme.color, targetSlug: targetTheme.slug, sharedCount: b[2] }
      })
      .filter(function (b): b is NonNullable<typeof b> { return b !== null })
      .sort(function (a, b) { return b.sharedCount - a.sharedCount })

    const es = entitySets[themeId]

    result[themeId] = {
      themeId,
      heroContent,
      contentCounts,
      totalContent: themeContent.length,
      entityCounts: {
        services: es.services.size,
        officials: es.officials.size,
        policies: es.policies.size,
        opportunities: es.opportunities.size,
      },
      focusAreas: themeFAs,
      learningPaths: themeLPs,
      guides: themeGuides,
      bridges: themeBridges,
    }
  }

  return result
}

// ── Archetype Dashboard ─────────────────────────────────────────────────

export interface ArchetypeDashboardData {
  contentByCenter: Record<string, Array<{
    id: string; title: string; summary: string | null; pathway: string | null
    center: string | null; content_type: string | null; image_url: string | null
    source_domain: string | null; published_at: string | null
  }>>
  contentCountsByType: Record<string, number>
  contentCountsByPathway: Record<string, number>
  services: Array<{ service_id: string; service_name: string; description: string | null; org_name: string | null; category: string | null }>
  officials: Array<{ official_id: string; official_name: string; title: string | null; party: string | null; level: string | null; photo_url: string | null }>
  policies: Array<{ policy_id: string; policy_name: string; summary: string | null; policy_type: string | null; level: string | null; status: string | null }>
  opportunities: Array<{ opportunity_id: string; title: string; description: string | null; org_name: string | null; time_commitment: string | null; is_virtual: boolean | null }>
  learningPaths: Array<{ path_id: string; path_name: string; description: string | null; theme_id: string | null; estimated_minutes: number | null; difficulty_level: string | null }>
  guides: Array<{ guide_id: string; title: string; slug: string; description: string | null; theme_id: string | null; hero_image_url: string | null }>
  libraryDocs: Array<{ id: string; title: string; summary: string | null; tags: string[]; theme_ids: string[]; page_count: number | null }>
  totalCounts: { content: number; services: number; officials: number; policies: number; opportunities: number; learningPaths: number; guides: number; library: number }
}

export async function getArchetypeDashboardData(): Promise<ArchetypeDashboardData> {
  const supabase = await createClient()

  const [
    { data: allContent },
    { data: services },
    { data: officials },
    { data: policies },
    { data: opportunities },
    { data: learningPaths },
    { data: guides },
    { data: libraryDocs },
  ] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, content_type, image_url, source_domain, published_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(200),
    supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, org_id, service_category')
      .eq('is_active', 'Yes')
      .limit(30),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .limit(30),
    supabase
      .from('policies')
      .select('policy_id, policy_name, summary_5th_grade, policy_type, level, status')
      .limit(30),
    (supabase as any)
      .from('opportunities')
      .select('opportunity_id, title, description_5th_grade, organization_name, time_commitment, is_virtual')
      .eq('is_active', 'Yes')
      .limit(30),
    (supabase as any)
      .from('learning_paths')
      .select('path_id, path_name, description, theme_id, estimated_minutes, difficulty_level')
      .eq('is_active', 'Yes')
      .order('display_order', { ascending: true }),
    (supabase as any)
      .from('guides')
      .select('guide_id, title, slug, description, theme_id, hero_image_url')
      .eq('is_active', true),
    supabase
      .from('kb_documents')
      .select('id, title, summary, tags, theme_ids, page_count')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20),
  ])

  const contentByCenter: Record<string, any[]> = { Learning: [], Action: [], Resource: [], Accountability: [] }
  const contentCountsByType: Record<string, number> = {}
  const contentCountsByPathway: Record<string, number> = {}

  for (const c of allContent ?? []) {
    const center = c.center || 'Learning'
    if (!contentByCenter[center]) contentByCenter[center] = []
    if (contentByCenter[center].length < 20) {
      contentByCenter[center].push({
        id: c.id, title: c.title_6th_grade || '', summary: c.summary_6th_grade,
        pathway: c.pathway_primary, center: c.center, content_type: c.content_type,
        image_url: c.image_url, source_domain: c.source_domain, published_at: c.published_at,
      })
    }
    const ct = c.content_type || 'other'
    contentCountsByType[ct] = (contentCountsByType[ct] || 0) + 1
    if (c.pathway_primary) contentCountsByPathway[c.pathway_primary] = (contentCountsByPathway[c.pathway_primary] || 0) + 1
  }

  return {
    contentByCenter,
    contentCountsByType,
    contentCountsByPathway,
    services: (services ?? []).map(function (s: any) {
      return { service_id: s.service_id, service_name: s.service_name, description: s.description_5th_grade, org_name: null, category: s.service_category }
    }),
    officials: (officials ?? []).map(function (o: any) {
      return { official_id: o.official_id, official_name: o.official_name, title: o.title, party: o.party, level: o.level, photo_url: o.photo_url }
    }),
    policies: (policies ?? []).map(function (p: any) {
      return { policy_id: p.policy_id, policy_name: p.policy_name, summary: p.summary_5th_grade, policy_type: p.policy_type, level: p.level, status: p.status }
    }),
    opportunities: (opportunities ?? []).map(function (o: any) {
      return { opportunity_id: o.opportunity_id, title: o.title, description: o.description_5th_grade, org_name: o.organization_name, time_commitment: o.time_commitment, is_virtual: o.is_virtual }
    }),
    learningPaths: (learningPaths ?? []).map(function (lp: any) {
      return { path_id: lp.path_id, path_name: lp.path_name, description: lp.description, theme_id: lp.theme_id, estimated_minutes: lp.estimated_minutes, difficulty_level: lp.difficulty_level }
    }),
    guides: (guides ?? []).map(function (g: any) {
      return { guide_id: g.guide_id, title: g.title, slug: g.slug, description: g.description, theme_id: g.theme_id, hero_image_url: g.hero_image_url }
    }),
    libraryDocs: (libraryDocs ?? []).map(function (d: any) {
      return { id: d.id, title: d.title, summary: d.summary, tags: d.tags || [], theme_ids: d.theme_ids || [], page_count: d.page_count }
    }),
    totalCounts: {
      content: (allContent ?? []).length,
      services: (services ?? []).length,
      officials: (officials ?? []).length,
      policies: (policies ?? []).length,
      opportunities: (opportunities ?? []).length,
      learningPaths: (learningPaths ?? []).length,
      guides: (guides ?? []).length,
      library: (libraryDocs ?? []).length,
    },
  }
}

/* ─── Circle Graph data for public CircleKnowledgeGraph ─── */

export interface CircleGraphData {
  pathways: Array<{
    id: string; name: string; color: string; slug: string
    focusAreas: Array<{ id: string; name: string }>
    entityCounts: { content: number; services: number; officials: number; organizations: number; policies: number }
  }>
  bridges: Array<{ from: string; to: string; count: number }>
  totals: { content: number; services: number; officials: number; organizations: number; policies: number; focusAreas: number }
}

export async function getCircleGraphData(): Promise<CircleGraphData> {
  const supabase = await createClient()

  const [
    { data: focusAreas },
    { data: contentFocus },
    { data: serviceFocus },
    { data: officialFocus },
    { data: orgFocus },
    { data: policyFocus },
    { data: contentAll },
    { data: servicesAll },
    { data: officialsAll },
    { data: orgsAll },
    { data: policiesAll },
  ] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, focus_area_name, theme_id'),
    supabase.from('content_focus_areas').select('content_id, focus_id').limit(5000),
    supabase.from('service_focus_areas').select('service_id, focus_id').limit(5000),
    supabase.from('official_focus_areas').select('official_id, focus_id').limit(5000),
    supabase.from('organization_focus_areas').select('org_id, focus_id').limit(5000),
    supabase.from('policy_focus_areas').select('policy_id, focus_id').limit(5000),
    supabase.from('content_published').select('id, pathway_primary').eq('is_active', true),
    supabase.from('services_211').select('service_id'),
    supabase.from('elected_officials').select('official_id'),
    supabase.from('organizations').select('org_id'),
    supabase.from('policies').select('policy_id'),
  ])

  // Group focus areas by theme
  const faByTheme: Record<string, Array<{ id: string; name: string }>> = {}
  for (const fa of focusAreas ?? []) {
    if (!fa.theme_id) continue
    if (!faByTheme[fa.theme_id]) faByTheme[fa.theme_id] = []
    faByTheme[fa.theme_id].push({ id: fa.focus_id, name: fa.focus_area_name || '' })
  }

  // Count entities per focus area
  const faEntityCount: Record<string, { content: number; services: number; officials: number; organizations: number; policies: number }> = {}
  function ensureFa(fid: string) {
    if (!faEntityCount[fid]) faEntityCount[fid] = { content: 0, services: 0, officials: 0, organizations: 0, policies: 0 }
  }
  for (const r of contentFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].content++ }
  for (const r of serviceFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].services++ }
  for (const r of officialFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].officials++ }
  for (const r of orgFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].organizations++ }
  for (const r of policyFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].policies++ }

  // Aggregate counts per theme
  const themeIds = Object.keys(THEMES)
  const pathways = themeIds.map(function (tid) {
    const t = THEMES[tid as keyof typeof THEMES]
    const fas = faByTheme[tid] || []
    const counts = { content: 0, services: 0, officials: 0, organizations: 0, policies: 0 }
    for (const fa of fas) {
      const fc = faEntityCount[fa.id]
      if (fc) {
        counts.content += fc.content
        counts.services += fc.services
        counts.officials += fc.officials
        counts.organizations += fc.organizations
        counts.policies += fc.policies
      }
    }
    return { id: tid, name: t.name, color: t.color, slug: t.slug, focusAreas: fas, entityCounts: counts }
  })

  // Bridge connections: themes that share focus areas connected to the same entities
  const bridges: Array<{ from: string; to: string; count: number }> = []
  // Build focus_id -> theme_id map
  const faToTheme: Record<string, string> = {}
  for (const fa of focusAreas ?? []) { if (fa.theme_id) faToTheme[fa.focus_id] = fa.theme_id }

  // For each entity's focus areas, find which themes are connected
  function addBridges(rows: Array<{ focus_id: string }>, idKey: string) {
    const entityThemes: Record<string, Set<string>> = {}
    for (const r of rows) {
      const eid = (r as any)[idKey]
      const theme = faToTheme[r.focus_id]
      if (!eid || !theme) continue
      if (!entityThemes[eid]) entityThemes[eid] = new Set()
      entityThemes[eid].add(theme)
    }
    const bridgeCount: Record<string, number> = {}
    for (const themes of Object.values(entityThemes)) {
      const arr = Array.from(themes).sort()
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = arr[i] + '|' + arr[j]
          bridgeCount[key] = (bridgeCount[key] || 0) + 1
        }
      }
    }
    return bridgeCount
  }

  const allBridgeCounts: Record<string, number> = {}
  for (const src of [
    { rows: contentFocus ?? [], key: 'content_id' },
    { rows: orgFocus ?? [], key: 'org_id' },
    { rows: officialFocus ?? [], key: 'official_id' },
  ]) {
    const bc = addBridges(src.rows, src.key)
    for (const [k, v] of Object.entries(bc)) {
      allBridgeCounts[k] = (allBridgeCounts[k] || 0) + v
    }
  }
  for (const [key, count] of Object.entries(allBridgeCounts)) {
    if (count < 2) continue
    const [from, to] = key.split('|')
    bridges.push({ from, to, count })
  }
  bridges.sort(function (a, b) { return b.count - a.count })

  // Content counts by pathway_primary
  const contentByPw: Record<string, number> = {}
  for (const c of contentAll ?? []) {
    if (c.pathway_primary) contentByPw[c.pathway_primary] = (contentByPw[c.pathway_primary] || 0) + 1
  }

  return {
    pathways,
    bridges: bridges.slice(0, 21),
    totals: {
      content: (contentAll ?? []).length,
      services: (servicesAll ?? []).length,
      officials: (officialsAll ?? []).length,
      organizations: (orgsAll ?? []).length,
      policies: (policiesAll ?? []).length,
      focusAreas: (focusAreas ?? []).length,
    },
  }
}
