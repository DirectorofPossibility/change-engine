/**
 * @fileoverview Homepage for The Change Engine — the Community Exchange wayfinder.
 *
 * This server component fetches all data needed for the wayfinder experience:
 *   - Aggregate stats (resources, officials, policies, focus areas)
 *   - Pathway counts and bridge connections
 *   - Braided feed data for each pathway (content, officials, policies, services)
 *   - Topic names for sidebar pills
 *   - Latest content for the home state feed
 *
 * All data is passed to the Wayfinder client component which manages the
 * two-column layout, pathway selection, center filtering, and detail panels.
 *
 * @datasource Supabase tables: content_published, services_211, elected_officials,
 *   organizations, policies, focus_areas, content_focus_areas, official_focus_areas,
 *   policy_focus_areas, service_focus_areas, content_pathways
 * @caching ISR with `revalidate = 600` (10 minutes)
 * @route GET /
 */

import type { Metadata } from 'next'
import { THEMES } from '@/lib/constants'
import {
  getExchangeStats,
  getPathwayCounts,
  getPathwayBraidedFeed,
  getPathwayBridges,
  getAllTopics,
  getLatestContent,
} from '@/lib/data/exchange'
import { Wayfinder } from '@/components/exchange/Wayfinder'
import type { PathwayFeedData } from '@/components/exchange/Wayfinder'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'The Change Engine — Community Life, Organized',
  description: 'Your wayfinder to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function HomePage() {
  // Fetch all data in parallel
  const [stats, pathwayCounts, bridges, topics, latestContent] = await Promise.all([
    getExchangeStats(),
    getPathwayCounts(),
    getPathwayBridges(),
    getAllTopics(30),
    getLatestContent(12),
  ])

  // Fetch braided feed for each pathway in parallel
  const themeIds = Object.keys(THEMES)
  const feedResults = await Promise.all(
    themeIds.map(function (themeId) {
      return getPathwayBraidedFeed(themeId)
    })
  )

  const feedsByPathway: Record<string, PathwayFeedData> = {}
  themeIds.forEach(function (themeId, i) {
    feedsByPathway[themeId] = {
      themeId,
      ...feedResults[i],
    }
  })

  // Calculate total items and new this week
  const totalItems = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)
  const newThisWeek = 0 // TODO: query content_published WHERE published_at > now() - 7 days

  // Build stats object for circles
  const circleStats = {
    resources: (stats.resources || 0) + (stats.services || 0),
    officials: stats.officials || 0,
    policies: stats.policies || 0,
    focusAreas: topics.length,
  }

  return (
    <Wayfinder
      stats={circleStats}
      pathwayCounts={pathwayCounts}
      bridges={bridges}
      topics={topics}
      feedsByPathway={feedsByPathway}
      totalItems={totalItems}
      newThisWeek={newThisWeek}
      latestContent={latestContent}
    />
  )
}
