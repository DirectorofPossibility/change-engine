import { createClient } from '@/lib/supabase/server'
import type { FocusArea } from '@/lib/types/exchange'
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
