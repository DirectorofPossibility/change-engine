/**
 * @fileoverview Homepage for The Change Engine Community Exchange.
 *
 * Editorial magazine-style landing page featuring all MVP resources,
 * the Civic Compass, latest content, and community engagement.
 *
 * @datasource Supabase tables: content_published, services_211, elected_officials,
 *   organizations, policies, focus_areas
 * @caching ISR with `revalidate = 600` (10 minutes)
 * @route GET /exchange
 */

import type { Metadata } from 'next'
import {
  getExchangeStats,
  getLatestContent,
} from '@/lib/data/exchange'
import { EditorialHome } from '@/components/exchange/EditorialHome'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Exchange — Powered by The Change Engine',
  description: 'Your wayfinder to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function ExchangeHomePage() {
  const [stats, latestContent] = await Promise.all([
    getExchangeStats(),
    getLatestContent(6),
  ])

  const circleStats = {
    resources: (stats.resources || 0) + (stats.services || 0),
    officials: stats.officials || 0,
    policies: stats.policies || 0,
    focusAreas: 0,
  }

  return (
    <EditorialHome
      stats={circleStats}
      organizations={stats.organizations || 0}
      latestContent={latestContent}
    />
  )
}
