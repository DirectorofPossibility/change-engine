/**
 * @fileoverview Data-fetching layer for the admin dashboard (/dashboard/*).
 *
 * All functions use the Supabase server client (inherits the logged-in user's session).
 * Dashboard pages are server-rendered (no ISR) so data is always fresh.
 *
 * Organized by dashboard section:
 *   1. Pipeline stats (overview cards + pipeline flow chart)
 *   2. Content by pathway / center (bar charts)
 *   3. Review queue + published content (data tables)
 *   4. Ingestion log (activity feed)
 *   5. RSS feeds + source trust (configuration)
 *   6. Translation stats + coverage
 *   7. Taxonomy browser (themes, focus areas, SDGs, SDOH, NTEE, AIRS)
 *   8. API keys management
 */

import { createClient } from '@/lib/supabase/server'
import type { ApiKey, PipelineStats, ReviewStatusBreakdown, RssFeed } from '@/lib/types/dashboard'

// ── Pipeline overview ──────────────────────────────────────────────────

/** Aggregate counts for the 4 dashboard overview cards (ingested, needs review, published, translated). */
export async function getPipelineStats(): Promise<PipelineStats> {
  const supabase = await createClient()
  const [inbox, review, published, translationRows] = await Promise.all([
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).in('review_status', ['pending', 'flagged']),
    supabase.from('content_published').select('id', { count: 'exact', head: true }),
    // Count distinct translated items (not rows) — each content_id+language pair = 1 item
    supabase.from('translations').select('content_id, language_id').in('field_name', ['title_6th_grade', 'title']),
  ])
  // Deduplicate: count unique content_id values across all languages
  const translatedIds = new Set((translationRows.data || []).map((r: any) => r.content_id))
  return {
    totalIngested: inbox.count ?? 0,
    needsReview: review.count ?? 0,
    published: published.count ?? 0,
    translated: translatedIds.size,
  }
}

/** Breakdown of review queue by status — feeds the pipeline flow visualization. */
export async function getReviewStatusBreakdown(): Promise<ReviewStatusBreakdown & { total: number }> {
  const supabase = await createClient()
  const [autoApproved, pending, flagged, rejected] = await Promise.all([
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'auto_approved'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'pending'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'flagged'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'rejected'),
  ])
  return {
    auto_approved: autoApproved.count ?? 0,
    pending: pending.count ?? 0,
    flagged: flagged.count ?? 0,
    rejected: rejected.count ?? 0,
    total: (autoApproved.count ?? 0) + (pending.count ?? 0) + (flagged.count ?? 0) + (rejected.count ?? 0),
  }
}

/** Per-stage counts for the pipeline flow visualization. */
export async function getPipelineFlowStats() {
  const supabase = await createClient()
  const [
    inboxPending, inboxClassified, inboxFlagged, inboxNeedsReview,
    reviewPending, reviewAutoApproved, reviewApproved, reviewFlagged, reviewRejected,
    published,
  ] = await Promise.all([
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }).eq('status', 'classified'),
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }).eq('status', 'flagged'),
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }).eq('status', 'needs_review'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'pending'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'auto_approved'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'approved'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'flagged'),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).eq('review_status', 'rejected'),
    supabase.from('content_published').select('id', { count: 'exact', head: true }),
  ])
  return {
    inbox: {
      pending: inboxPending.count ?? 0,
      classified: inboxClassified.count ?? 0,
      flagged: inboxFlagged.count ?? 0,
      needs_review: inboxNeedsReview.count ?? 0,
    },
    review: {
      pending: reviewPending.count ?? 0,
      auto_approved: reviewAutoApproved.count ?? 0,
      approved: reviewApproved.count ?? 0,
      flagged: reviewFlagged.count ?? 0,
      rejected: reviewRejected.count ?? 0,
    },
    published: published.count ?? 0,
  }
}

// ── Entity counts (object type overview) ──────────────────────────────

/** Count of records in each major entity table — for the dashboard "at a glance" grid. */
export async function getEntityCounts(): Promise<{ label: string; table: string; count: number }[]> {
  const supabase = await createClient()
  const [content, officials, policies, services, organizations, opportunities, focusAreas, learningPaths, neighborhoods, foundations, campaigns, events, kbDocs, contentTypes] = await Promise.all([
    supabase.from('content_published').select('*', { count: 'exact', head: true }),
    supabase.from('elected_officials').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('services_211').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('*', { count: 'exact', head: true }),
    supabase.from('neighborhoods').select('*', { count: 'exact', head: true }),
    supabase.from('foundations').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('kb_documents').select('*', { count: 'exact', head: true }),
    // Content type breakdown
    supabase.from('content_published').select('content_type'),
  ])

  // Count content by type
  const typeCounts: Record<string, number> = {}
  for (const row of (contentTypes.data ?? []) as { content_type: string | null }[]) {
    const t = row.content_type || 'unclassified'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }

  const TYPE_LABELS: Record<string, string> = {
    article: 'Articles',
    guide: 'Guides',
    report: 'Reports',
    video: 'Videos',
    tool: 'Tools',
    course: 'Courses',
    event: 'Event Content',
    campaign: 'Campaign Content',
    opportunity: 'Opportunity Content',
    book: 'Books',
    podcast: 'Podcasts',
    research: 'Research',
    diy_kit: 'DIY Kits',
  }

  const contentTypeRows = Object.entries(typeCounts)
    .filter(([t]) => t !== 'unclassified')
    .sort((a, b) => b[1] - a[1])
    .map(([t, count]) => ({
      label: TYPE_LABELS[t] || (t.charAt(0).toUpperCase() + t.slice(1) + 's'),
      table: 'content_type:' + t,
      count,
    }))

  return [
    // Entity tables
    { label: 'Published Content', table: 'content_published', count: content.count ?? 0 },
    { label: 'Elected Officials', table: 'elected_officials', count: officials.count ?? 0 },
    { label: 'Policies', table: 'policies', count: policies.count ?? 0 },
    { label: 'Services (211)', table: 'services_211', count: services.count ?? 0 },
    { label: 'Organizations', table: 'organizations', count: organizations.count ?? 0 },
    { label: 'Opportunities', table: 'opportunities', count: opportunities.count ?? 0 },
    { label: 'Focus Areas', table: 'focus_areas', count: focusAreas.count ?? 0 },
    { label: 'Learning Paths', table: 'learning_paths', count: learningPaths.count ?? 0 },
    { label: 'Neighborhoods', table: 'neighborhoods', count: neighborhoods.count ?? 0 },
    { label: 'Foundations', table: 'foundations', count: foundations.count ?? 0 },
    { label: 'Campaigns', table: 'campaigns', count: campaigns.count ?? 0 },
    { label: 'Events', table: 'events', count: events.count ?? 0 },
    { label: 'Library Documents', table: 'kb_documents', count: kbDocs.count ?? 0 },
    // Content type breakdown
    ...contentTypeRows,
  ]
}

// ── Content distribution ───────────────────────────────────────────────

/** Content count by pathway (THEME_01..THEME_07) for the dashboard bar chart. */
export async function getContentByPathway() {
  const supabase = await createClient()
  const { data } = await supabase.from('content_published').select('pathway_primary')
  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const key = row.pathway_primary || 'Unknown'
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

/** Content count by center (Learning/Action/Resource/Accountability) for the dashboard. */
export async function getContentByCenter() {
  const supabase = await createClient()
  const { data } = await supabase.from('content_published').select('center')
  const counts: Record<string, number> = {}
  for (const row of data || []) {
    const key = row.center || 'Unknown'
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

// ── Content tables ─────────────────────────────────────────────────────

/** Review queue with joined inbox data, for the review dashboard. Most recent first. */
export async function getReviewQueue() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_review_queue')
    .select('*, content_inbox(*)')
    .order('created_at', { ascending: false })
    .limit(1000)
  return data || []
}

export async function getPublishedContent() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(300)
  return data || []
}

// ── Activity + configuration ───────────────────────────────────────────

/** Recent ingestion log entries. Displayed as the "Recent Activity" table on the dashboard. */
export async function getIngestionLog(limit = 100) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingestion_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

/**
 * RSS feed configuration.
 *
 * Uses the service-role key via REST to bypass RLS — the `rss_feeds` table
 * has no SELECT policy for the anon/authenticated role.
 */
export async function getRssFeeds(): Promise<RssFeed[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  const res = await fetch(`${url}/rest/v1/rss_feeds?order=feed_name`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export async function getSourceTrust() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('source_trust')
    .select('*')
    .order('domain')
  return data || []
}

// ── Translation coverage ───────────────────────────────────────────────

/**
 * Translation coverage stats across all entity types.
 * Counts distinct content_ids per language (not rows) to avoid inflated percentages.
 */
export async function getTranslationStats() {
  const supabase = await createClient()

  // Entity types and their tables/count queries
  const entityTypes = [
    'content_published', 'elected_officials', 'services_211', 'policies',
    'organizations', 'opportunities', 'foundations', 'events', 'guides',
    'campaigns', 'benefit_programs', 'learning_paths', 'life_situations',
  ] as const

  // Count distinct translated items per language per entity type (title field only)
  const [esRows, viRows] = await Promise.all([
    supabase.from('translations')
      .select('content_type, content_id')
      .eq('language_id', 'LANG-ES')
      .in('field_name', ['title_6th_grade', 'title']),
    supabase.from('translations')
      .select('content_type, content_id')
      .eq('language_id', 'LANG-VI')
      .in('field_name', ['title_6th_grade', 'title']),
  ])

  // Deduplicate: one content_id per entity type counts as "translated"
  function distinctByType(rows: any[]) {
    const map: Record<string, Set<string>> = {}
    for (const r of rows) {
      const ct = r.content_type || 'content_published'
      if (!map[ct]) map[ct] = new Set()
      map[ct].add(r.content_id)
    }
    const result: Record<string, number> = {}
    for (const ct of entityTypes) result[ct] = map[ct]?.size ?? 0
    return result
  }

  const esMap = distinctByType(esRows.data || [])
  const viMap = distinctByType(viRows.data || [])

  // Count totals per entity table
  const totalCounts: Record<string, number> = {}
  const countPromises = entityTypes.map(async (et) => {
    const { count } = await supabase.from(et).select('*', { count: 'exact', head: true })
    totalCounts[et] = count ?? 0
  })
  await Promise.all(countPromises)

  // Build per-entity breakdown
  const breakdown = entityTypes.map((et) => ({
    entity: et,
    total: totalCounts[et] ?? 0,
    es: esMap[et] ?? 0,
    vi: viMap[et] ?? 0,
  })).filter((b) => b.total > 0)

  // Aggregate totals
  const totalItems = breakdown.reduce((s, b) => s + b.total, 0)
  const esTotal = breakdown.reduce((s, b) => s + b.es, 0)
  const viTotal = breakdown.reduce((s, b) => s + b.vi, 0)

  return {
    esCount: esTotal,
    viCount: viTotal,
    totalPublished: totalItems,
    breakdown,
  }
}

/** Published content with their translations — for the translation management table. */
export async function getTranslationsWithContent() {
  const supabase = await createClient()
  const [published, translations] = await Promise.all([
    supabase.from('content_published').select('id, inbox_id, title_6th_grade').order('published_at', { ascending: false }),
    supabase.from('translations').select('*').in('language_id', ['LANG-ES', 'LANG-VI']).in('field_name', ['title_6th_grade', 'title', 'summary_6th_grade', 'summary']),
  ])
  return { published: published.data || [], translations: translations.data || [] }
}

// ── Taxonomy ──────────────────────────────────────────────────────────

/**
 * Full taxonomy tree: themes → focus areas, plus all cross-reference standards
 * (SDGs, SDOH, NTEE, AIRS). Used by the taxonomy browser and classification prompt.
 */
export async function getThemesWithFocusAreas() {
  const supabase = await createClient()
  const [themes, focusAreas, sdgs, sdoh, ntee, airs] = await Promise.all([
    supabase.from('themes').select('*').order('theme_id'),
    supabase.from('focus_areas').select('*'),
    supabase.from('sdgs').select('sdg_id, sdg_number, sdg_name'),
    supabase.from('sdoh_domains').select('sdoh_code, sdoh_name'),
    supabase.from('ntee_codes').select('ntee_code, ntee_name'),
    supabase.from('airs_codes').select('airs_code, airs_name'),
  ])
  return {
    themes: themes.data || [],
    focusAreas: focusAreas.data || [],
    sdgs: sdgs.data || [],
    sdoh: sdoh.data || [],
    ntee: ntee.data || [],
    airs: airs.data || [],
  }
}

// ── API keys ──────────────────────────────────────────────────────────

/** All API keys (hashed — raw keys are never retrievable after creation). */
export async function getApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_keys' as any)
    .select('*')
    .order('created_at', { ascending: false })
  return (data as unknown as ApiKey[]) || []
}

// ── Entity Fidelity ─────────────────────────────────────────────────

import type { EntityCompleteness, FidelityOverview } from '@/lib/types/dashboard'

export async function getFidelityOverview(): Promise<FidelityOverview[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('entity_completeness' as any)
    .select('*')

  const rows = (data as unknown as EntityCompleteness[]) || []

  // Group by entity_type
  const grouped: Record<string, EntityCompleteness[]> = {}
  for (const row of rows) {
    if (!grouped[row.entity_type]) grouped[row.entity_type] = []
    grouped[row.entity_type].push(row)
  }

  const overviews: FidelityOverview[] = []

  for (const [entityType, entities] of Object.entries(grouped)) {
    const count = entities.length
    const avgScore = Math.round(entities.reduce((sum, e) => sum + e.completeness_score, 0) / count)
    const tiers = { platinum: 0, gold: 0, silver: 0, bronze: 0 }
    const missingCounts: Record<string, number> = {}

    for (const e of entities) {
      tiers[e.completeness_tier as keyof typeof tiers] = (tiers[e.completeness_tier as keyof typeof tiers] || 0) + 1
      for (const field of e.critical_missing || []) {
        missingCounts[field] = (missingCounts[field] || 0) + 1
      }
    }

    const topMissing = Object.entries(missingCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([field, cnt]) => ({ field, count: cnt, pct: Math.round((cnt / count) * 100) }))

    overviews.push({ entityType, count, avgScore, tiers, topMissing })
  }

  return overviews
}

export async function getFidelityEntities(
  entityType: string,
  tier?: string,
  limit = 50,
  offset = 0,
): Promise<{ entities: EntityCompleteness[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from('entity_completeness' as any)
    .select('*', { count: 'exact' })
    .eq('entity_type', entityType)
    .order('completeness_score', { ascending: true })
    .range(offset, offset + limit - 1)

  if (tier) {
    query = query.eq('completeness_tier', tier)
  }

  const { data, count } = await query

  return {
    entities: (data as unknown as EntityCompleteness[]) || [],
    total: count ?? 0,
  }
}

// ── Graph Coverage & Explorer ────────────────────────────────────────────

export interface CoverageCell {
  entity: string
  dimension: string
  edgeCount: number
  entityCount: number
}

export interface GraphNode {
  id: string
  label: string
  type: 'entity' | 'taxonomy'
  subtype: string
}

export interface GraphEdge {
  source: string
  target: string
  weight: number
}

export async function getGraphCoverage(): Promise<{
  cells: CoverageCell[]
  entityCounts: Record<string, number>
}> {
  const supabase = await createClient()

  // Get entity counts using typed queries
  const [orgs, content, policies, opps, officials, founds, campaigns, services] = await Promise.all([
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('content_published').select('id', { count: 'exact', head: true }),
    supabase.from('policies').select('policy_id', { count: 'exact', head: true }),
    supabase.from('opportunities').select('opportunity_id', { count: 'exact', head: true }),
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('foundations').select('id', { count: 'exact', head: true }),
    supabase.from('campaigns').select('campaign_id', { count: 'exact', head: true }),
    supabase.from('services_211').select('id', { count: 'exact', head: true }),
  ])

  const entityCounts: Record<string, number> = {
    organization: orgs.count ?? 0,
    content: content.count ?? 0,
    policy: policies.count ?? 0,
    opportunity: opps.count ?? 0,
    official: officials.count ?? 0,
    foundation: founds.count ?? 0,
    campaign: campaigns.count ?? 0,
    service: services.count ?? 0,
  }

  // Get edge counts for junction tables using typed queries
  const junctions = await Promise.all([
    supabase.from('organization_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('organization_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('organization_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('organization_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('organization_life_situations').select('*', { count: 'exact', head: true }),
    supabase.from('organization_service_categories').select('*', { count: 'exact', head: true }),
    supabase.from('organization_neighborhoods').select('*', { count: 'exact', head: true }),
    supabase.from('content_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('content_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('content_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('content_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('content_life_situations').select('*', { count: 'exact', head: true }),
    supabase.from('content_service_categories').select('*', { count: 'exact', head: true }),
    supabase.from('content_neighborhoods').select('*', { count: 'exact', head: true }),
    supabase.from('policy_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('policy_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('policy_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('policy_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('policy_life_situations').select('*', { count: 'exact', head: true }),
    supabase.from('opportunity_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('opportunity_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('opportunity_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('opportunity_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('opportunity_life_situations').select('*', { count: 'exact', head: true }),
    supabase.from('official_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('official_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('official_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('official_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('foundation_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('foundation_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('campaign_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('campaign_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('campaign_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('service_pathways').select('*', { count: 'exact', head: true }),
    supabase.from('service_sdgs').select('*', { count: 'exact', head: true }),
    supabase.from('service_focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('service_audience_segments').select('*', { count: 'exact', head: true }),
    supabase.from('service_life_situations').select('*', { count: 'exact', head: true }),
  ])

  // Map junction results to cells
  const junctionDefs: { entity: string; dimension: string }[] = [
    { entity: 'organization', dimension: 'pathways' },
    { entity: 'organization', dimension: 'sdgs' },
    { entity: 'organization', dimension: 'focus_areas' },
    { entity: 'organization', dimension: 'audience_segments' },
    { entity: 'organization', dimension: 'life_situations' },
    { entity: 'organization', dimension: 'service_categories' },
    { entity: 'organization', dimension: 'neighborhoods' },
    { entity: 'content', dimension: 'pathways' },
    { entity: 'content', dimension: 'sdgs' },
    { entity: 'content', dimension: 'focus_areas' },
    { entity: 'content', dimension: 'audience_segments' },
    { entity: 'content', dimension: 'life_situations' },
    { entity: 'content', dimension: 'service_categories' },
    { entity: 'content', dimension: 'neighborhoods' },
    { entity: 'policy', dimension: 'pathways' },
    { entity: 'policy', dimension: 'sdgs' },
    { entity: 'policy', dimension: 'focus_areas' },
    { entity: 'policy', dimension: 'audience_segments' },
    { entity: 'policy', dimension: 'life_situations' },
    { entity: 'opportunity', dimension: 'pathways' },
    { entity: 'opportunity', dimension: 'sdgs' },
    { entity: 'opportunity', dimension: 'focus_areas' },
    { entity: 'opportunity', dimension: 'audience_segments' },
    { entity: 'opportunity', dimension: 'life_situations' },
    { entity: 'official', dimension: 'pathways' },
    { entity: 'official', dimension: 'sdgs' },
    { entity: 'official', dimension: 'focus_areas' },
    { entity: 'official', dimension: 'audience_segments' },
    { entity: 'foundation', dimension: 'pathways' },
    { entity: 'foundation', dimension: 'focus_areas' },
    { entity: 'campaign', dimension: 'pathways' },
    { entity: 'campaign', dimension: 'sdgs' },
    { entity: 'campaign', dimension: 'audience_segments' },
    { entity: 'service', dimension: 'pathways' },
    { entity: 'service', dimension: 'sdgs' },
    { entity: 'service', dimension: 'focus_areas' },
    { entity: 'service', dimension: 'audience_segments' },
    { entity: 'service', dimension: 'life_situations' },
  ]

  const cells: CoverageCell[] = junctions.map((result, i) => ({
    entity: junctionDefs[i].entity,
    dimension: junctionDefs[i].dimension,
    edgeCount: result.error ? 0 : (result.count ?? 0),
    entityCount: entityCounts[junctionDefs[i].entity] ?? 0,
  }))

  return { cells, entityCounts }
}

export async function getGraphExplorerData(): Promise<{
  nodes: GraphNode[]
  edges: GraphEdge[]
}> {
  const supabase = await createClient()

  // Fetch taxonomy dimensions with correct column names
  const [focusAreas, sdgsData, audiences, pathways, serviceCats] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, focus_area_name').limit(500),
    supabase.from('sdgs').select('sdg_id, sdg_name').limit(20),
    supabase.from('audience_segments').select('segment_id, segment_name').limit(50),
    supabase.from('life_situations').select('situation_id, situation_name').limit(50),
    supabase.from('service_categories').select('service_cat_id, service_cat_name').limit(50),
  ])

  // Fetch entities with correct column names
  const [orgData, contentData, policyData, foundData, officialData, oppData, campaignData] = await Promise.all([
    supabase.from('organizations').select('org_id, org_name').limit(200),
    supabase.from('content_published').select('id, title_6th_grade').limit(200),
    supabase.from('policies').select('policy_id, policy_name').limit(200),
    supabase.from('foundations').select('id, name').limit(200),
    supabase.from('elected_officials').select('official_id, official_name').limit(200),
    supabase.from('opportunities').select('opportunity_id, opportunity_name').limit(200),
    supabase.from('campaigns').select('campaign_id, campaign_name').limit(200),
  ])

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Add taxonomy nodes
  for (const item of focusAreas.data || []) {
    nodes.push({ id: `focus_area:${item.focus_id}`, label: item.focus_area_name || '', type: 'taxonomy', subtype: 'focus_area' })
  }
  for (const item of sdgsData.data || []) {
    nodes.push({ id: `sdg:${item.sdg_id}`, label: item.sdg_name || '', type: 'taxonomy', subtype: 'sdg' })
  }
  for (const item of audiences.data || []) {
    nodes.push({ id: `audience_segment:${item.segment_id}`, label: item.segment_name || '', type: 'taxonomy', subtype: 'audience_segment' })
  }
  for (const item of pathways.data || []) {
    nodes.push({ id: `pathway:${item.situation_id}`, label: item.situation_name || '', type: 'taxonomy', subtype: 'pathway' })
  }
  for (const item of serviceCats.data || []) {
    nodes.push({ id: `service_category:${item.service_cat_id}`, label: item.service_cat_name || '', type: 'taxonomy', subtype: 'service_category' })
  }

  // Add entity nodes
  for (const item of orgData.data || []) {
    nodes.push({ id: `organization:${item.org_id}`, label: item.org_name || '', type: 'entity', subtype: 'organization' })
  }
  for (const item of contentData.data || []) {
    nodes.push({ id: `content:${item.id}`, label: item.title_6th_grade || '', type: 'entity', subtype: 'content' })
  }
  for (const item of policyData.data || []) {
    nodes.push({ id: `policy:${item.policy_id}`, label: item.policy_name || '', type: 'entity', subtype: 'policy' })
  }
  for (const item of foundData.data || []) {
    nodes.push({ id: `foundation:${item.id}`, label: item.name || '', type: 'entity', subtype: 'foundation' })
  }
  for (const item of officialData.data || []) {
    nodes.push({ id: `official:${item.official_id}`, label: item.official_name || '', type: 'entity', subtype: 'official' })
  }
  for (const item of oppData.data || []) {
    nodes.push({ id: `opportunity:${item.opportunity_id}`, label: item.opportunity_name || '', type: 'entity', subtype: 'opportunity' })
  }
  for (const item of campaignData.data || []) {
    nodes.push({ id: `campaign:${item.campaign_id}`, label: item.campaign_name || '', type: 'entity', subtype: 'campaign' })
  }

  // Fetch services too
  const serviceData = await supabase.from('services_211').select('service_id, service_name').eq('is_active', 'Yes').limit(200)
  for (const item of serviceData.data || []) {
    nodes.push({ id: `service:${item.service_id}`, label: item.service_name || '', type: 'entity', subtype: 'service' })
  }

  // Fetch edges from ALL junction tables — focus areas, pathways, SDGs, audiences
  const [
    orgFocus, orgPath, orgSdg, orgAud,
    contentFocus, contentPath, contentSdg, contentAud,
    policyFocus, policyPath, policySdg, policyAud,
    officialFocus, officialPath, officialSdg, officialAud,
    oppFocus, oppPath, oppSdg, oppAud,
    foundFocus, foundPath,
    campaignPath, campaignSdg, campaignAud,
    serviceFocus, servicePath, serviceSdg, serviceAud,
  ] = await Promise.all([
    // Organizations
    supabase.from('organization_focus_areas').select('org_id, focus_id').limit(3000),
    supabase.from('organization_pathways').select('org_id, theme_id').limit(2000),
    supabase.from('organization_sdgs').select('org_id, sdg_id').limit(2000),
    supabase.from('organization_audience_segments').select('org_id, segment_id').limit(2000),
    // Content
    supabase.from('content_focus_areas').select('content_id, focus_id').limit(3000),
    supabase.from('content_pathways').select('content_id, theme_id').limit(2000),
    supabase.from('content_sdgs').select('content_id, sdg_id').limit(2000),
    supabase.from('content_audience_segments').select('content_id, segment_id').limit(2000),
    // Policies
    supabase.from('policy_focus_areas').select('policy_id, focus_id').limit(2000),
    supabase.from('policy_pathways').select('policy_id, theme_id').limit(2000),
    supabase.from('policy_sdgs').select('policy_id, sdg_id').limit(2000),
    supabase.from('policy_audience_segments').select('policy_id, segment_id').limit(2000),
    // Officials
    supabase.from('official_focus_areas').select('official_id, focus_id').limit(2000),
    supabase.from('official_pathways').select('official_id, theme_id').limit(2000),
    supabase.from('official_sdgs').select('official_id, sdg_id').limit(2000),
    supabase.from('official_audience_segments').select('official_id, segment_id').limit(2000),
    // Opportunities
    supabase.from('opportunity_focus_areas').select('opportunity_id, focus_id').limit(2000),
    supabase.from('opportunity_pathways').select('opportunity_id, theme_id').limit(2000),
    supabase.from('opportunity_sdgs').select('opportunity_id, sdg_id').limit(2000),
    supabase.from('opportunity_audience_segments').select('opportunity_id, segment_id').limit(2000),
    // Foundations
    supabase.from('foundation_focus_areas').select('foundation_id, focus_area').limit(2000),
    supabase.from('foundation_pathways').select('foundation_id, pathway_id').limit(2000),
    // Campaigns
    supabase.from('campaign_pathways').select('campaign_id, theme_id').limit(2000),
    supabase.from('campaign_sdgs').select('campaign_id, sdg_id').limit(2000),
    supabase.from('campaign_audience_segments').select('campaign_id, segment_id').limit(2000),
    // Services
    supabase.from('service_focus_areas').select('service_id, focus_id').limit(3000),
    supabase.from('service_pathways').select('service_id, theme_id').limit(2000),
    supabase.from('service_sdgs').select('service_id, sdg_id').limit(2000),
    supabase.from('service_audience_segments').select('service_id, segment_id').limit(2000),
  ])

  // Helper to push edges
  function addEdges(data: any[] | null, sourcePrefix: string, sourceKey: string, targetPrefix: string, targetKey: string) {
    for (const row of data || []) {
      edges.push({ source: `${sourcePrefix}:${row[sourceKey]}`, target: `${targetPrefix}:${row[targetKey]}`, weight: 1 })
    }
  }

  // Organization edges
  addEdges(orgFocus.data, 'organization', 'org_id', 'focus_area', 'focus_id')
  addEdges(orgPath.data, 'organization', 'org_id', 'pathway', 'theme_id')
  addEdges(orgSdg.data, 'organization', 'org_id', 'sdg', 'sdg_id')
  addEdges(orgAud.data, 'organization', 'org_id', 'audience_segment', 'segment_id')

  // Content edges
  addEdges(contentFocus.data, 'content', 'content_id', 'focus_area', 'focus_id')
  addEdges(contentPath.data, 'content', 'content_id', 'pathway', 'theme_id')
  addEdges(contentSdg.data, 'content', 'content_id', 'sdg', 'sdg_id')
  addEdges(contentAud.data, 'content', 'content_id', 'audience_segment', 'segment_id')

  // Policy edges
  addEdges(policyFocus.data, 'policy', 'policy_id', 'focus_area', 'focus_id')
  addEdges(policyPath.data, 'policy', 'policy_id', 'pathway', 'theme_id')
  addEdges(policySdg.data, 'policy', 'policy_id', 'sdg', 'sdg_id')
  addEdges(policyAud.data, 'policy', 'policy_id', 'audience_segment', 'segment_id')

  // Official edges
  addEdges(officialFocus.data, 'official', 'official_id', 'focus_area', 'focus_id')
  addEdges(officialPath.data, 'official', 'official_id', 'pathway', 'theme_id')
  addEdges(officialSdg.data, 'official', 'official_id', 'sdg', 'sdg_id')
  addEdges(officialAud.data, 'official', 'official_id', 'audience_segment', 'segment_id')

  // Opportunity edges
  addEdges(oppFocus.data, 'opportunity', 'opportunity_id', 'focus_area', 'focus_id')
  addEdges(oppPath.data, 'opportunity', 'opportunity_id', 'pathway', 'theme_id')
  addEdges(oppSdg.data, 'opportunity', 'opportunity_id', 'sdg', 'sdg_id')
  addEdges(oppAud.data, 'opportunity', 'opportunity_id', 'audience_segment', 'segment_id')

  // Foundation edges
  addEdges(foundFocus.data, 'foundation', 'foundation_id', 'focus_area', 'focus_area')
  addEdges(foundPath.data, 'foundation', 'foundation_id', 'pathway', 'pathway_id')

  // Campaign edges
  addEdges(campaignPath.data, 'campaign', 'campaign_id', 'pathway', 'theme_id')
  addEdges(campaignSdg.data, 'campaign', 'campaign_id', 'sdg', 'sdg_id')
  addEdges(campaignAud.data, 'campaign', 'campaign_id', 'audience_segment', 'segment_id')

  // Service edges
  addEdges(serviceFocus.data, 'service', 'service_id', 'focus_area', 'focus_id')
  addEdges(servicePath.data, 'service', 'service_id', 'pathway', 'theme_id')
  addEdges(serviceSdg.data, 'service', 'service_id', 'sdg', 'sdg_id')
  addEdges(serviceAud.data, 'service', 'service_id', 'audience_segment', 'segment_id')

  return { nodes, edges }
}
