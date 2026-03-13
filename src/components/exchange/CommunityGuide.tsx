'use client'

/**
 * @fileoverview The Community Exchange — a culture guide to Houston.
 *
 * Modeled on a real city guidebook: voice, personality, recommendations,
 * neighborhood feel. Not a dashboard. Not a data display. A guide.
 */

import { HomeCover, HomeToday, HomeOrientation, HomeNeighborhood, HomeNewsFeed, HomeIndex, HomeBackPages } from './home'

// ── Types ────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string
  title_6th_grade: string
  summary_6th_grade?: string | null
  image_url?: string | null
  source_domain?: string | null
  published_at?: string | null
  content_type?: string | null
}

interface LatestContentItem {
  id?: string | null
  inbox_id?: string | null
  title_6th_grade?: string | null
  summary_6th_grade?: string | null
  image_url?: string | null
  pathway_primary?: string | null
  center?: string | null
  resource_type?: string | null
  source_domain?: string | null
  published_at?: string | null
  [key: string]: unknown
}

interface CommunityGuideProps {
  stats: {
    resources: number
    services: number
    officials: number
    policies: number
    organizations: number
    opportunities: number
    elections: number
    newsCount: number
  }
  latestContent: LatestContentItem[]
  newsFeed: NewsItem[]
  quote?: {
    quote_text: string
    attribution?: string
    source_url?: string
  } | null
  promotions?: Array<{
    promo_id: string
    title: string
    subtitle?: string
    description?: string
    cta_text?: string
    cta_href?: string
    color?: string
  }>
  upcomingEvents?: Array<{
    id: string
    title: string
    date: string
    type: string | null
    location: string | null
    href: string
  }>
}

// ── Component ────────────────────────────────────────────────────────────

export function CommunityGuide({ stats, latestContent, newsFeed, quote, promotions, upcomingEvents }: CommunityGuideProps) {
  return (
    <div className="bg-paper">
      <HomeCover stats={stats} />

      <HomeToday
        quote={quote}
        promotions={promotions}
        upcomingEvents={upcomingEvents}
      />

      <HomeOrientation />

      <div className="h-px bg-rule" />

      <HomeNeighborhood />

      <div className="h-px bg-rule" />

      <HomeNewsFeed
        newsFeed={newsFeed}
        latestContent={latestContent}
      />

      <div className="h-px bg-rule" />

      <HomeIndex stats={stats} />

      <div className="h-px bg-rule" />

      <HomeBackPages />
    </div>
  )
}
