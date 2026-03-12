/**
 * @fileoverview Magazine-style guide page — aggregates ALL content types.
 *
 * Server component with ISR (600s revalidation). Parallel-fetches all
 * data sources and passes them to the GuidePage client component.
 */
import { Metadata } from 'next'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
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
import { PersonaSelector } from '@/components/exchange/PersonaSelector'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Your Guide to What\'s Going On — Change Engine',
  description: 'What\'s happening in Houston civic life. Written so anyone can understand it. Curated. Local. Updated daily.',
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
    <>
      <IndexPageHero
        title="Your guide to what's going on."
        subtitle="Curated. Local. Updated daily."
        intro="News. Analysis. Community stories. Explainers about how Houston works. Every piece is reviewed by a human editor, rewritten at a sixth-grade reading level, and organized so you can find what matters to you. Pick your perspective below."
        color="#C75B2A"
        pattern="flower"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PersonaSelector />
      </div>
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
    </>
  )
}
