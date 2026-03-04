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
  const [inbox, review, published, translations] = await Promise.all([
    supabase.from('content_inbox').select('id', { count: 'exact', head: true }),
    supabase.from('content_review_queue').select('id', { count: 'exact', head: true }).in('review_status', ['pending', 'flagged']),
    supabase.from('content_published').select('id', { count: 'exact', head: true }),
    supabase.from('translations').select('translation_id', { count: 'exact', head: true }),
  ])
  return {
    totalIngested: inbox.count ?? 0,
    needsReview: review.count ?? 0,
    published: published.count ?? 0,
    translated: translations.count ?? 0,
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

/** Translation coverage stats: how many titles are translated to ES/VI vs total published. */
export async function getTranslationStats() {
  const supabase = await createClient()
  const [esCount, viCount, publishedCount] = await Promise.all([
    supabase.from('translations').select('translation_id', { count: 'exact', head: true }).eq('language_id', 'LANG-ES').in('field_name', ['title_6th_grade', 'title']),
    supabase.from('translations').select('translation_id', { count: 'exact', head: true }).eq('language_id', 'LANG-VI').in('field_name', ['title_6th_grade', 'title']),
    supabase.from('content_published').select('id', { count: 'exact', head: true }),
  ])
  return {
    esCount: esCount.count ?? 0,
    viCount: viCount.count ?? 0,
    totalPublished: publishedCount.count ?? 0,
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
