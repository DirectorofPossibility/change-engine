/**
 * @fileoverview Homepage for The Change Engine Community Exchange.
 *
 * Community Guide -- a civic & social onramp for the general public.
 * Three pillars: Find Help (211), Who's Responsible, Get Involved.
 *
 * @datasource Supabase tables: content_published, services_211, elected_officials,
 *   organizations, policies, quotes, promotions
 * @caching ISR with `revalidate = 600` (10 minutes)
 * @route GET /exchange
 */

import type { Metadata } from 'next'
import {
  getExchangeStats,
  getLatestContent,
  getRandomQuote,
  getActivePromotions,
} from '@/lib/data/exchange'
import { CommunityGuide } from '@/components/exchange/CommunityGuide'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Guide -- Houston, Texas | The Change Engine',
  description: 'Your guide to Houston -- find services, know who represents you, and get involved in your community. Powered by The Change Engine.',
}

export default async function ExchangeHomePage() {
  const [stats, latestContent, quote, promotions] = await Promise.all([
    getExchangeStats(),
    getLatestContent(6),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
  ])

  return (
    <CommunityGuide
      stats={{
        resources: stats.resources || 0,
        services: stats.services || 0,
        officials: stats.officials || 0,
        policies: stats.policies || 0,
        organizations: stats.organizations || 0,
      }}
      latestContent={latestContent}
      quote={quote}
      promotions={promotions}
    />
  )
}
