/**
 * @fileoverview Homepage for The Change Engine.
 *
 * @datasource Supabase tables: content_published, services_211, elected_officials,
 *   organizations, policies, focus_areas
 * @caching ISR with `revalidate = 600` (10 minutes)
 * @route GET /
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import {
  getExchangeStats,
  getPathwayCounts,
  getLatestContent,
  getCenterCounts,
} from '@/lib/data/exchange'
import { Wayfinder } from '@/components/exchange/Wayfinder'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Exchange — Powered by The Change Lab',
  description: 'Your wayfinder to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function HomePage() {
  const [stats, pathwayCounts, latestContent, centerCounts] = await Promise.all([
    getExchangeStats(),
    getPathwayCounts(),
    getLatestContent(6),
    getCenterCounts(),
  ])

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const supabase = await createClient()
  const { count: newCount } = await supabase
    .from('content_published')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('published_at', weekAgo.toISOString())
  const newThisWeek = newCount ?? 0

  const circleStats = {
    resources: (stats.resources || 0) + (stats.services || 0),
    officials: stats.officials || 0,
    policies: stats.policies || 0,
    focusAreas: 0,
  }

  return (
    <Wayfinder
      stats={circleStats}
      pathwayCounts={pathwayCounts}
      newThisWeek={newThisWeek}
      latestContent={latestContent}
      centerCounts={centerCounts}
      organizations={stats.organizations || 0}
    />
  )
}
