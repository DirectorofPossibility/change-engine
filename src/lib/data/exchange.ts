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
import { LANGUAGES } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'
import type { ExchangeStats, ServiceWithOrg, TranslationMap, FocusArea, SDG, SDOHDomain, DistributionSite, SuperNeighborhood } from '@/lib/types/exchange'

type ContentRow = Database['public']['Tables']['content_published']['Row']

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

/** All elected officials with their government levels (for sorting/grouping). */
export async function getOfficials() {
  const supabase = await createClient()
  const [{ data: officials }, { data: levels }] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('government_levels').select('*').order('level_order'),
  ])
  return { officials: officials ?? [], levels: levels ?? [] }
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

  let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
  filterParts += ',level.eq.City'
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

  return {
    officials: officials ?? [],
    policies: policies ?? [],
    elections: elections ?? [],
    levels: levels ?? [],
    upcomingElection: upcoming && upcoming.length > 0 ? upcoming[0] : null,
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
    (async () => {
      const results: Awaited<ReturnType<typeof getVotingLocationsWithCoords>> = []
      for (const z of allZips) {
        const locs = await getVotingLocationsWithCoords(z)
        results.push(...locs)
      }
      return results
    })(),
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
export async function getVotingLocationsWithCoords(zipCode?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('voting_locations')
    .select('*')
    .eq('is_active', 'Yes')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)

  if (zipCode) {
    query = query.eq('zip_code', parseInt(zipCode))
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
    (async () => {
      const results: Awaited<ReturnType<typeof getVotingLocationsWithCoords>> = []
      for (const z of zips) {
        const locs = await getVotingLocationsWithCoords(z)
        results.push(...locs)
      }
      return results
    })(),
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

  const relContentIds = Array.from(new Set((contentJ.data ?? []).map(j => j.content_id))).slice(0, 5)
  const relOfficialIds = Array.from(new Set((officialJ.data ?? []).map(j => j.official_id))).slice(0, 5)
  const relPolicyIds = Array.from(new Set((policyJ.data ?? []).map(j => j.policy_id))).slice(0, 5)
  const relServiceIds = Array.from(new Set((serviceJ.data ?? []).map(j => j.service_id))).slice(0, 5)

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
    .select('org_id, org_name, description_5th_grade, website, logo_url')
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
    supabase.from('organizations').select('org_id, org_name, focus_area_ids, website, description_5th_grade'),
    supabase.from('services_211').select('service_id, service_name, focus_area_ids, org_id, description_5th_grade').eq('is_active', 'Yes'),
    supabase.from('guides').select('guide_id, title, slug, theme_id, focus_area_ids, description, hero_image_url').eq('is_active', true),
    supabase.from('policies').select('policy_id, policy_name, focus_area_ids, summary_5th_grade'),
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
      .select('org_id, org_name, focus_area_ids, website, description_5th_grade')
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
      .select('org_id, org_name, website, description_5th_grade')
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
