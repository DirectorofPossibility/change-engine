import type { Database } from '@/lib/supabase/database.types'

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type ContentInbox = Tables<'content_inbox'>
export type ContentPublished = Tables<'content_published'>
export type ContentReviewQueue = Tables<'content_review_queue'>
export type IngestionLog = Tables<'ingestion_log'>
export type SourceTrust = Tables<'source_trust'>
export type Translation = Tables<'translations'>
export type Theme = Tables<'themes'>
export type FocusArea = Tables<'focus_areas'>

// rss_feeds not in auto-generated types (created via SQL migration in Sprint 1)
export interface RssFeed {
  id: string
  feed_name: string
  feed_url: string
  source_domain: string | null
  is_active: boolean
  last_polled: string | null
  last_item_count: number | null
  poll_interval_hours: number
  created_at: string | null
}

export interface PipelineStats {
  totalIngested: number
  needsReview: number
  published: number
  translated: number
}

export interface ReviewStatusBreakdown {
  auto_approved: number
  pending: number
  flagged: number
  rejected: number
}

export interface AiClassification {
  theme_primary: string
  theme_secondary: string[]
  focus_area_ids: string[]
  sdg_ids: string[]
  sdoh_code: string
  ntee_codes: string[]
  airs_codes: string[]
  center: string
  resource_type_id: string
  audience_segment_ids: string[]
  life_situation_ids: string[]
  service_cat_ids: string[]
  skill_ids: string[]
  title_6th_grade: string
  summary_6th_grade: string
  action_items: Record<string, string | null>
  geographic_scope: string
  confidence: number
  reasoning: string
  _enriched_focus_areas?: Array<{
    id: string; name: string; theme: string
    sdg: string; ntee: string; airs: string; sdoh: string; bridging: boolean
  }>
  _validation?: { valid: string[]; invalid: string[]; enriched: string[] }
  _version?: string
}

export interface CronJob {
  name: string
  schedule: string
  description: string
}

export const CRON_JOBS: CronJob[] = [
  { name: 'backfill-resources', schedule: 'Every 10 min', description: 'Backfill resources table' },
  { name: 'backfill-services', schedule: 'Every 10 min', description: 'Backfill services_211 table' },
  { name: 'backfill-policies', schedule: 'Every 10 min', description: 'Backfill policies table' },
  { name: 'backfill-opportunities', schedule: 'Every 10 min', description: 'Backfill opportunities table' },
  { name: 'backfill-officials', schedule: 'Every 10 min', description: 'Backfill elected_officials table' },
  { name: 'rss-poll', schedule: 'Every hour', description: 'Poll RSS feeds for new content' },
  { name: 'auto-publish', schedule: 'Every 30 min', description: 'Publish auto-approved content' },
  { name: 'batch-translate', schedule: 'Daily 2am CT', description: 'Translate new content to ES/VI' },
]
