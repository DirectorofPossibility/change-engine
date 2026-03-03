/**
 * @fileoverview Types for the admin dashboard (/dashboard/*).
 *
 * Row types are auto-derived from Supabase's generated `database.types.ts`.
 * Custom interfaces (RssFeed, ApiKey, etc.) cover tables added via SQL
 * migrations that aren't in the auto-generated schema yet.
 *
 * Shared types (ContentPublished, Translation, FocusArea) are canonical here
 * and re-exported from `./exchange.ts` for public-site code.
 */

import type { Database } from '@/lib/supabase/database.types'

/** Helper — extracts the Row type for a given Supabase public table. */
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// ── Content pipeline types ─────────────────────────────────────────────
// These mirror the 3-stage pipeline: inbox → review queue → published.

/** Raw scraped/ingested content before classification. */
export type ContentInbox = Tables<'content_inbox'>
/** Reviewed + approved content visible on the public site. */
export type ContentPublished = Tables<'content_published'>
/** AI classification + human review state for each inbox item. */
export type ContentReviewQueue = Tables<'content_review_queue'>
/** Timestamped log entries for every pipeline event (ingest, classify, translate, etc.). */
export type IngestionLog = Tables<'ingestion_log'>
/** Per-domain trust scores that influence auto-publish confidence thresholds. */
export type SourceTrust = Tables<'source_trust'>

// ── Taxonomy types ─────────────────────────────────────────────────────

/** Machine + human translations of content into ES/VI. Keyed by content_id + language_id. */
export type Translation = Tables<'translations'>
/** One of the 7 pathways (Our Health, Our Families, etc.). */
export type Theme = Tables<'themes'>
/** A specific topic within a pathway (e.g. "Mental Health" under Our Health). */
export type FocusArea = Tables<'focus_areas'>

// ── Manual types (not yet in auto-generated schema) ────────────────────

/** RSS feed configuration. Polled by the rss-poll cron job to discover new content. */
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

/**
 * API key for authenticating external requests to /api/* routes.
 * Keys are stored as SHA-256 hashes — the raw key is shown exactly once at creation.
 * Validated by `src/lib/api-auth.ts` on every API route call.
 */
export interface ApiKey {
  id: string
  key_hash: string
  key_prefix: string
  org_id: string | null
  label: string
  is_active: boolean
  rate_limit_per_day: number
  total_requests: number
  total_items: number
  last_used_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string | null
}

// ── Dashboard view models ──────────────────────────────────────────────

/** Aggregate counts for the dashboard overview cards. */
export interface PipelineStats {
  totalIngested: number
  needsReview: number
  published: number
  translated: number
}

/** Breakdown of content_review_queue by review_status for the pipeline flow chart. */
export interface ReviewStatusBreakdown {
  auto_approved: number
  pending: number
  flagged: number
  rejected: number
}

/**
 * The JSON shape stored in content_review_queue.ai_classification.
 * Produced by Claude during /api/classify and /api/enrich. Contains:
 * - Pathway + center assignment
 * - Focus area, SDG, SDOH, NTEE, AIRS cross-references
 * - 6th-grade-level title + summary rewrites
 * - Action URLs (donate, volunteer, register, etc.)
 * - Confidence score + reasoning
 *
 * Fields prefixed with `_` are enrichment metadata added during /api/enrich.
 */
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

// ── Cron job registry ──────────────────────────────────────────────────

/** Metadata for a scheduled cron job, displayed on the dashboard. */
export interface CronJob {
  name: string
  schedule: string
  description: string
}

/** All active cron jobs. Rendered on the dashboard and used for count display. */
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
