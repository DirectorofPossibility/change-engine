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
  pathway_hint: string | null
  category: string | null
  error_count: number
  last_error: string | null
  total_items_ingested: number
  notes: string | null
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
  /** Primary pathway (THEME_01–THEME_07). */
  theme_primary: string
  /** 0–2 secondary pathways. */
  theme_secondary: string[]
  /** 1–4 focus area IDs — the specific topics within a pathway. */
  focus_area_ids: string[]
  /** UN Sustainable Development Goal IDs. */
  sdg_ids: string[]
  /** Social Determinants of Health code. */
  sdoh_code: string
  /** Nonprofit taxonomy codes. */
  ntee_codes: string[]
  /** Community resource info system codes. */
  airs_codes: string[]
  /** Engagement level: Learning | Action | Resource | Accountability. */
  center: string
  /** Content format (video, report, article, course, etc.) — NOT a community resource type. */
  resource_type_id: string
  /** Who this content is for (1–3 segment IDs). */
  audience_segment_ids: string[]
  /** What life situations this addresses (0–3). */
  life_situation_ids: string[]
  /** Service domains referenced (0–2). */
  service_cat_ids: string[]
  /** Skills needed or taught (0–3). */
  skill_ids: string[]
  /** Time commitment to engage with this content (0–1). */
  time_commitment_id?: string | null
  /** Action types possible (0–2). */
  action_type_ids?: string[]
  /** Government level if accountability content (0–1). */
  gov_level_id?: string | null
  /** Organizations mentioned or responsible. */
  organizations?: Array<{ name: string; url: string; description?: string }>
  /** Partner organizations featured or collaborating (distinct from source org). */
  partner_organizations?: Array<{ name: string; url: string }>
  /** Locations identified (neighborhoods, ZIP codes, districts). */
  locations?: { neighborhoods?: string[]; zip_codes?: string[]; city?: string; district?: string }
  /** Rewritten title at 6th-grade reading level. */
  title_6th_grade: string
  /** Subtitle or tagline extracted from the page, or null. */
  subtitle?: string | null
  /** Rewritten summary at 6th-grade reading level (150–300 words). */
  summary_6th_grade: string
  /** Author name(s) if listed, or null. */
  author?: string | null
  /** Publication date in ISO 8601 (YYYY-MM-DD) if found, or null. */
  publication_date?: string | null
  /** Actionable URLs extracted from the content. */
  action_items: Record<string, string | null>
  /** Structured action cards with title, description, CTA text, and URL. */
  structured_actions?: Array<{ title: string; description: string; cta_text: string; cta_url: string }>
  /** Key statistics extracted from the content as value/label pairs. */
  key_stats?: Array<{ value: string; label: string }>
  /** Structured sections with numbered headings and plain-language summaries. */
  sections?: Array<{ number: number; heading: string; summary: string }>
  /** Exact pull quote from the source with attribution. */
  hero_quote?: string | null
  /** Attribution for the hero quote (name and title/org). */
  hero_quote_attribution?: string | null
  /** Direct URL to a downloadable PDF or file, or null. */
  download_url?: string | null
  /** Cost to access: Free | Paid | Sliding Scale, or null. */
  cost?: string | null
  /** Geographic scope: Houston | Harris County | Texas | National | Global. */
  geographic_scope: string
  /** Classifier confidence (0.0–1.0). */
  confidence: number
  /** Why the classifier made these choices. */
  reasoning: string
  /** Extracted keywords. */
  keywords?: string[]
  /** Every tag found on the page, exactly as written. */
  raw_tags?: string[]
  /** ISO 8601 datetime when this content expires. Null for evergreen content. */
  expires_at?: string | null
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
  { name: 'expire-content', schedule: 'Daily 6:30pm CT', description: 'Archive expired events and time-limited content' },
]

// ── Entity Fidelity types ─────────────────────────────────────────

export interface EntityCompleteness {
  entity_type: string
  entity_id: string
  entity_name: string
  completeness_score: number
  completeness_tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  total_fields: number
  filled_fields: number
  missing_fields: string[]
  critical_missing: string[]
  field_scores: Record<string, { weight: number; filled: boolean; category: string }>
  scored_at: string
}

export interface FidelityOverview {
  entityType: string
  count: number
  avgScore: number
  tiers: { platinum: number; gold: number; silver: number; bronze: number }
  topMissing: Array<{ field: string; count: number; pct: number }>
}

export const ENTITY_TYPE_META: Record<string, { label: string; singular: string }> = {
  organization:   { label: 'Organizations',      singular: 'Organization' },
  official:       { label: 'Elected Officials',   singular: 'Official' },
  content:        { label: 'Published Content',   singular: 'Content' },
  service:        { label: '211 Services',         singular: 'Service' },
  resource:       { label: 'Resources',            singular: 'Resource' },
  life_situation: { label: 'Life Situations',      singular: 'Life Situation' },
  agency:         { label: 'Agencies',             singular: 'Agency' },
  benefit:        { label: 'Benefit Programs',     singular: 'Benefit' },
  campaign:       { label: 'Campaigns',            singular: 'Campaign' },
  event:          { label: 'Events',               singular: 'Event' },
  foundation:     { label: 'Foundations',           singular: 'Foundation' },
  opportunity:    { label: 'Opportunities',         singular: 'Opportunity' },
  policy:         { label: 'Policies',              singular: 'Policy' },
  guide:          { label: 'Guides',                singular: 'Guide' },
  learning_path:  { label: 'Learning Paths',        singular: 'Learning Path' },
  ballot_item:    { label: 'Ballot Items',           singular: 'Ballot Item' },
  kb_document:    { label: 'Library Documents',      singular: 'Document' },
}

export const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  platinum: { label: 'Platinum', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  gold:     { label: 'Gold',     bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  silver:   { label: 'Silver',   bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
  bronze:   { label: 'Bronze',   bg: 'bg-orange-100', text: 'text-orange-700',  dot: 'bg-orange-500' },
}
