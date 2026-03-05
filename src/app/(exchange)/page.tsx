/**
 * @fileoverview Homepage for The Change Engine — the Community Exchange wayfinder.
 *
 * This server component fetches aggregate stats, pathway counts, center counts,
 * and latest content for the simplified "Choose Your Own Houston" homepage.
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
import { EnvironmentBar } from '@/components/exchange/EnvironmentBar'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'The Change Engine — Community Life, Organized',
  description: 'Your wayfinder to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function HomePage() {
  const [stats, pathwayCounts, latestContent, centerCounts] = await Promise.all([
    getExchangeStats(),
    getPathwayCounts(),
    getLatestContent(6),
    getCenterCounts(),
  ])

  // Query new-this-week count from content_published
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
    <div className="min-h-screen bg-brand-bg">
      <EnvironmentBar />
      <Wayfinder
        stats={circleStats}
        pathwayCounts={pathwayCounts}
        newThisWeek={newThisWeek}
        latestContent={latestContent}
        centerCounts={centerCounts}
        organizations={stats.organizations || 0}
      />
    </div>
  )
}
