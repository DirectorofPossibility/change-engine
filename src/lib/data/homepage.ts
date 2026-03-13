import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import type { ExchangeStats, FocusArea, CompassPreviewData, ContentPreview } from '@/lib/types/exchange'
import { getPathwayBridges } from './wayfinder'
/**
 * Aggregate counts for the stats bar at the bottom of the homepage.
 * Note: `newsItems` counts newsfeed articles (content_published), NOT resources.
 * Resources are services + organizations + benefit programs.
 */
export const getExchangeStats = cache(async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = await createClient()
  const [newsItems, services, officials, paths, orgs, policies, opps, elections, foundations] = await Promise.all([
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('path_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }),
    (supabase as any).from('opportunities').select('opportunity_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('elections').select('election_id', { count: 'exact', head: true }),
    supabase.from('foundations').select('id', { count: 'exact', head: true }),
  ])
  return {
    resources: newsItems.count ?? 0,
    services: services.count ?? 0,
    officials: officials.count ?? 0,
    learningPaths: paths.count ?? 0,
    organizations: orgs.count ?? 0,
    policies: policies.count ?? 0,
    opportunities: opps.count ?? 0,
    elections: elections.count ?? 0,
    foundations: foundations.count ?? 0,
  }
})

/**
 * Count newsfeed items per engagement level (Learning/Action/Resource/Accountability).
 * These are NEWS counts — articles, videos, reports — not community resource counts.
 */

/**
 * Count newsfeed items per engagement level (Learning/Action/Resource/Accountability).
 * These are NEWS counts — articles, videos, reports — not community resource counts.
 */
export const getCenterCounts = cache(async function getCenterCounts(): Promise<Record<string, number>> {
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
})

/**
 * Most recently published newsfeed items.
 * These are NEWS articles/videos/reports, not community resources.
 */

/** Count newsfeed items per pathway (THEME_01..THEME_07) for homepage pills. */
export const getPathwayCounts = cache(async function getPathwayCounts(): Promise<Record<string, number>> {
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
})


export const getCenterContentForPathway = cache(async function getCenterContentForPathway(themeId: string): Promise<Record<string, number>> {
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
})

// ── Taxonomy lookups ───────────────────────────────────────────────────

/** All focus areas (specific topics like "Mental Health" under a pathway). */

/**
 * Fetch content previews for the Compass grid: up to 3 items per pathway×center cell.
 * Returns a nested record keyed by pathway_primary → center → ContentPreview[].
 */
export const getCompassPreview = cache(async function getCompassPreview(): Promise<CompassPreviewData> {
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
})

/** Get geography rows for a policy. */

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

// ── Promotions ──────────────────────────────────────────────────────────

export async function getActivePromotions(pathwayId?: string, limit = 5) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  let query = (supabase as any)
    .from('promotions')
    .select('promo_id, title, subtitle, description, promo_type, image_url, cta_text, cta_href, color, start_date, end_date, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit)

  // Only include promotions within their active date window
  query = query.or(`start_date.is.null,start_date.lte.${now}`)
  query = query.or(`end_date.is.null,end_date.gte.${now}`)

  if (pathwayId) {
    // If pathwayId provided, include promotions for that pathway or general (no pathway)
    query = query.or(`pathway_id.eq.${pathwayId},pathway_id.is.null`)
  }

  const { data } = await query
  return data || []
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


export const getPathwaysHubData = cache(async function getPathwaysHubData(): Promise<Record<string, PathwayHubItem>> {
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
})

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


export const getArchetypeDashboardData = cache(async function getArchetypeDashboardData(): Promise<ArchetypeDashboardData> {
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
})
