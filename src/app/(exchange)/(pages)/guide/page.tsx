/**
 * @fileoverview Magazine-style guide page — aggregates ALL content types.
 *
 * Server component with ISR (600s revalidation). Parallel-fetches all
 * data sources and passes them to the GuidePage client component.
 */
import { Metadata } from 'next'
import {
  getExchangeStats,
  getLatestContent,
  getFeaturedContent,
  getLifeSituations,
  getLearningPaths,
  getGuides,
  getServices,
  getCivicHubData,
  getSDGs,
  getSDOHDomains,
  getPathwayCounts,
} from '@/lib/data/exchange'
import { GuidePage } from '@/components/exchange/GuidePage'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'The Community Exchange | Guide',
  description: 'Your newspaper-style guide to everything happening in Houston — articles, services, officials, learning paths, and more.',
}

export default async function GuidePageServer() {
  const [
    stats,
    latestContent,
    featuredContent,
    lifeSituations,
    learningPaths,
    guides,
    services,
    civicHub,
    sdgs,
    sdohDomains,
    pathwayCounts,
  ] = await Promise.all([
    getExchangeStats(),
    getLatestContent(12),
    getFeaturedContent(),
    getLifeSituations(),
    getLearningPaths(),
    getGuides(),
    getServices(),
    getCivicHubData(),
    getSDGs(),
    getSDOHDomains(),
    getPathwayCounts(),
  ])

  return (
    <GuidePage
      stats={stats}
      latestContent={latestContent}
      featuredContent={featuredContent}
      lifeSituations={lifeSituations}
      learningPaths={learningPaths}
      guides={guides}
      services={services}
      civicHub={civicHub}
      sdgs={sdgs}
      sdohDomains={sdohDomains}
      pathwayCounts={pathwayCounts}
    />
  )
}
