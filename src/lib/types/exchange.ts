/**
 * @fileoverview Types for the public-facing exchange site (/(exchange)/*).
 *
 * Shared types (ContentPublished, Translation, FocusArea) are re-exported from
 * `./dashboard.ts` to avoid duplication — dashboard.ts is the single source of truth.
 *
 * Search result types are intentionally narrow — they only include the columns
 * selected by `searchAll()` to keep payloads small and types honest.
 */

import type { Database } from '@/lib/supabase/database.types'
export type { ContentPublished, Translation, FocusArea } from './dashboard'

/** Helper — extracts the Row type for a given Supabase public table. */
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

// ── Entity row types ───────────────────────────────────────────────────

/** Life situation scenarios — e.g. "Find food", "Find a job". Featured on homepage. */
export type LifeSituation = Tables<'life_situations'>
/** City council, state, federal elected officials. Pulled from Civic API + manual entry. */
export type ElectedOfficial = Tables<'elected_officials'>
/** 211 social services (food banks, shelters, clinics). Sourced from United Way 211 data. */
export type Service211 = Tables<'services_211'>
/** Curated learning paths (multi-step educational content). */
export type LearningPath = Tables<'learning_paths'>
/** Community organizations (nonprofits, govt agencies, mutual aid groups). */
export type Organization = Tables<'organizations'>
/** Government level definitions (federal, state, county, city, special district). */
export type GovernmentLevel = Tables<'government_levels'>

// ── View models ────────────────────────────────────────────────────────

/** Homepage stats bar counts — aggregated by getExchangeStats(). */
export interface ExchangeStats {
  resources: number
  services: number
  officials: number
  learningPaths: number
  organizations: number
  policies: number
}

/** Service row enriched with its parent organization's name and coordinates. */
export interface ServiceWithOrg extends Service211 {
  org_name?: string
  latitude?: number | null
  longitude?: number | null
}

// ── Additional entity types ────────────────────────────────────────────

/** Houston neighborhoods, each belonging to a super neighborhood. */
export type Neighborhood = Tables<'neighborhoods'>
/** Volunteer, job, and civic engagement opportunities. */
export type Opportunity = Tables<'opportunities'>
/** Local/state/federal policies tracked for civic awareness. */
export type Policy = Tables<'policies'>
/** UN Sustainable Development Goals — cross-referenced with focus areas. */
export type SDG = Tables<'sdgs'>
/** Social Determinants of Health domains — cross-referenced with focus areas. */
export type SDOHDomain = Tables<'sdoh_domains'>
/** Long-form editorial guides (rendered from markdown). */
export type Guide = Tables<'guides'>

/** The 3 languages supported in the UI. */
export type SupportedLanguage = 'en' | 'es' | 'vi'

/** Polling places and early voting locations, synced from election data. */
export type VotingLocation = Tables<'voting_locations'>

/** Food/supply distribution sites (disaster relief, food banks, etc.). */
export type DistributionSite = Tables<'distribution_sites'>

// ── Translation ────────────────────────────────────────────────────────

/**
 * Client-side translation cache, keyed by inbox_id (content identifier).
 * Populated by LanguageContext.loadTranslations() and consumed by
 * TranslatedContentGrid and other translation-aware components.
 */
export interface TranslationMap {
  [inboxId: string]: {
    title?: string
    summary?: string
  }
}

// ── Search result types ────────────────────────────────────────────────
// These are intentionally narrow subsets of the full row types.
// They match the exact columns selected by searchAll() in lib/data/search.ts.

/** Published content result — subset of content_published columns. */
export interface SearchResultContent {
  id: string
  inbox_id: string | null
  title_6th_grade: string | null
  summary_6th_grade: string | null
  pathway_primary: string | null
  center: string | null
  source_url: string | null
  published_at: string | null
}

/** 211 service result, enriched with org_name via a join in searchAll(). */
export interface SearchResultService {
  service_id: string
  service_name: string | null
  description_5th_grade: string | null
  org_id: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  website: string | null
  org_name?: string
}

export interface SearchResultOfficial {
  official_id: string
  official_name: string | null
  title: string | null
  level: string | null
  party: string | null
  jurisdiction: string | null
  email: string | null
  office_phone: string | null
  website: string | null
}

export interface SearchResultOrganization {
  org_id: string
  org_name: string | null
  description_5th_grade: string | null
  website: string | null
}

export interface SearchResultPolicy {
  policy_id: string
  policy_name: string | null
  title_6th_grade: string | null
  policy_type: string | null
  level: string | null
  status: string | null
  summary_5th_grade: string | null
  summary_6th_grade: string | null
  bill_number: string | null
  source_url: string | null
}

export interface SearchResultSituation {
  situation_id: string
  situation_name: string | null
  situation_slug: string | null
  description_5th_grade: string | null
  urgency_level: string | null
  icon_name: string | null
}

export interface SearchResultResource {
  resource_id: string
  resource_name: string | null
  description_5th_grade: string | null
  source_url: string | null
}

export interface SearchResultPath {
  path_id: string
  path_name: string | null
  description_5th_grade: string | null
  theme_id: string | null
  difficulty_level: string | null
}

/** Aggregated search results across all entity types. Returned by searchAll(). */
export interface SearchResults {
  content: SearchResultContent[]
  officials: SearchResultOfficial[]
  services: SearchResultService[]
  organizations: SearchResultOrganization[]
  policies: SearchResultPolicy[]
  situations: SearchResultSituation[]
  resources: SearchResultResource[]
  paths: SearchResultPath[]
}

// ── Geographic types ───────────────────────────────────────────────────

/** Resolved neighborhood with its council district and elected officials. */
export interface NeighborhoodInfo {
  neighborhood: Neighborhood
  councilDistrict: string | null
  officials: ElectedOfficial[]
}

/** Houston super neighborhood — a City-defined geographic grouping of neighborhoods. */
export interface SuperNeighborhood {
  sn_id: string
  sn_name: string
  sn_number: number | null
  council_districts: string | null
  zip_codes: string | null
  population: number | null
  median_income: number | null
  description: string | null
}

/** Properties bag for a clicked GeoJSON polygon feature (dynamic keys from the GeoJSON). */
export interface GeoFeatureProperties {
  [key: string]: string | number | null | undefined
}

/** Unified marker format for the geography map. */
export interface MapMarkerData {
  id: string
  lat: number
  lng: number
  title: string
  type: string
  address?: string | null
  phone?: string | null
  link?: string | null
}

/** Data bundle returned by getGeographyData(). */
export interface GeographyData {
  superNeighborhoods: SuperNeighborhood[]
  neighborhoods: Array<{ neighborhood_id: string; neighborhood_name: string; super_neighborhood_id: string | null }>
  serviceMarkers: MapMarkerData[]
  organizationMarkers: MapMarkerData[]
  officials: Array<{
    official_id: string
    official_name: string
    title: string | null
    level: string | null
    party: string | null
    email: string | null
    office_phone: string | null
    website: string | null
    photo_url: string | null
  }>
  policies: Array<{
    policy_id: string
    policy_name: string
    title_6th_grade: string | null
    status: string | null
    level: string | null
    source_url: string | null
  }>
}

// ── Election Dashboard types ─────────────────────────────────────────

export type Election = Tables<'elections'>
export type Candidate = Tables<'candidates'>
export type BallotItem = Tables<'ballot_items'>
export type CivicCalendarEvent = Tables<'civic_calendar'>

// ── Compass types ────────────────────────────────────────────────────

/** Lightweight content preview for the Compass grid (pathway × center). */
export interface ContentPreview {
  id: string
  title: string | null
  summary: string | null
  pathway: string | null
  center: string | null
  image_url: string | null
  source_url: string | null
}

/** Compass preview data: pathway → center → content previews. */
export type CompassPreviewData = Record<string, Record<string, ContentPreview[]>>

/** Aggregated data for the voting dashboard page. */
export interface ElectionDashboardData {
  pastElections: Election[]
  upcomingElections: Election[]
  civicEvents: CivicCalendarEvent[]
  recentCandidates: Candidate[]
  recentBallotItems: BallotItem[]
  upcomingCandidates: Candidate[]
  upcomingBallotItems: BallotItem[]
  officials: ElectedOfficial[]
}
