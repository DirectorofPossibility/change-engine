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

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 text-center">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs uppercase tracking-widest mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl mb-4">
            Your guide to what's going on.
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg max-w-xl mx-auto leading-relaxed">
            Curated. Local. Updated daily.
          </p>
          <p style={{ color: MUTED }} className="text-sm max-w-lg mx-auto mt-4 leading-relaxed">
            News. Analysis. Community stories. Explainers about how Houston works. Every piece is reviewed by a human editor, rewritten at a sixth-grade reading level, and organized so you can find what matters to you. Pick your perspective below.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: INK }}>Guide</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
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
