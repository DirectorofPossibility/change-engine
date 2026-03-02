import { createClient } from '@/lib/supabase/server'
import type { ApiKey, PipelineStats, ReviewStatusBreakdown, RssFeed } from '@/lib/types/dashboard'

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

export async function getRecentActivity(limit = 10) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingestion_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getReviewQueue() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_review_queue')
    .select('*, content_inbox(*)')
    .order('created_at', { ascending: false })
    .limit(200)
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

export async function getIngestionLog(limit = 100) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ingestion_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

export async function getRssFeeds(): Promise<RssFeed[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('rss_feeds' as any)
    .select('*')
    .order('feed_name')
  return (data as unknown as RssFeed[]) || []
}

export async function getSourceTrust() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('source_trust')
    .select('*')
    .order('domain')
  return data || []
}

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

export async function getTranslationsWithContent() {
  const supabase = await createClient()
  const [published, translations] = await Promise.all([
    supabase.from('content_published').select('id, inbox_id, title_6th_grade').order('published_at', { ascending: false }),
    supabase.from('translations').select('*').in('language_id', ['LANG-ES', 'LANG-VI']).in('field_name', ['title_6th_grade', 'title', 'summary_6th_grade', 'summary']),
  ])
  return { published: published.data || [], translations: translations.data || [] }
}

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

export async function getApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_keys' as any)
    .select('*')
    .order('created_at', { ascending: false })
  return (data as unknown as ApiKey[]) || []
}
