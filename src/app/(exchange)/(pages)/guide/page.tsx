/**
 * @fileoverview Magazine-style guide page — aggregates ALL content types.
 *
 * Server component with ISR (600s revalidation). Parallel-fetches all
 * data sources and passes them to the GuidePage client component.
 */
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
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
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.06]" />
        </div>
        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest mb-4 text-faint">
            Change Engine
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-4 text-white tracking-tight">
            Your guide to what&apos;s going on.
          </h1>
          <p className="font-body text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Curated. Local. Updated daily.
          </p>
          <p className="text-sm max-w-lg mx-auto mt-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            News. Analysis. Community stories. Explainers about how Houston works. Every piece is reviewed by a human editor, rewritten at a sixth-grade reading level, and organized so you can find what matters to you. Pick your perspective below.
          </p>
        </div>
      </section>

      <div className="max-w-[1080px] mx-auto px-6 py-8">
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
    </div>
  )
}
