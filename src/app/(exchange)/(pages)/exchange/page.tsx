/**
 * @fileoverview Homepage — The Community Exchange.
 *
 * Culture guide to Houston civic life. Fetches stats, news, quote,
 * promotions, and upcoming events for the CommunityGuide component.
 *
 * @route GET /exchange
 * @caching ISR with revalidate = 600 (10 minutes)
 */

import type { Metadata } from 'next'
import {
  getExchangeStats,
  getLatestContent,
  getRandomQuote,
  getActivePromotions,
} from '@/lib/data/exchange'
import { getNewsFeed } from '@/lib/data/content'
import { getUpcomingEvents } from '@/lib/data/events'
import { CommunityGuide } from '@/components/exchange/CommunityGuide'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Exchange — Houston, Texas | The Change Engine',
  description: 'Your culture guide to Houston — find services, know who represents you, and get involved in your community.',
}

export default async function ExchangeHomePage() {
  const [stats, latestContent, newsFeed, quote, promotions, upcomingEvents] = await Promise.all([
    getExchangeStats(),
    getLatestContent(6),
    getNewsFeed(undefined, 5),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
    getUpcomingEvents(5),
  ])

  return (
    <CommunityGuide
      stats={{
        resources: (stats.resources || 0) + (stats.services || 0) + (stats.organizations || 0),
        services: stats.services || 0,
        officials: stats.officials || 0,
        policies: stats.policies || 0,
        organizations: stats.organizations || 0,
        opportunities: stats.opportunities || 0,
        elections: stats.elections || 0,
        newsCount: stats.resources || 0,
      }}
      latestContent={latestContent}
      newsFeed={newsFeed}
      quote={quote}
      promotions={promotions}
      upcomingEvents={upcomingEvents}
    />
  )
}
