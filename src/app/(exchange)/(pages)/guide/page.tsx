/**
 * @fileoverview Magazine-style guide page — aggregates ALL content types.
 *
 * Server component with ISR (600s revalidation). Parallel-fetches all
 * data sources and passes them to the GuidePage client component.
 *
 * Design: dark gradient masthead → editorial sections (feature opener,
 * data stories, couch grid, control panel). Matches page-system.html spec.
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
import { THEMES } from '@/lib/constants'
import { GuidePage } from '@/components/exchange/GuidePage'
import { PersonaSelector } from '@/components/exchange/PersonaSelector'
import { Geo } from '@/components/geo/sacred'

// Map theme IDs to geo types for the masthead background
const THEME_GEO: Record<string, string> = {
  THEME_01: 'flower_of_life',
  THEME_02: 'seed_of_life',
  THEME_03: 'hex_grid',
  THEME_04: 'concentric_rings',
  THEME_05: 'golden_spiral',
  THEME_06: 'torus',
  THEME_07: 'metatron_cube',
}

// Simple color helpers
function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.max(0, Math.floor(r * 0.25)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(g * 0.25)).toString(16).padStart(2, '0')}${Math.max(0, Math.floor(b * 0.25)).toString(16).padStart(2, '0')}`
}

function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `#${Math.min(255, Math.floor(r + (255 - r) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(g + (255 - g) * 0.55)).toString(16).padStart(2, '0')}${Math.min(255, Math.floor(b + (255 - b) * 0.55)).toString(16).padStart(2, '0')}`
}

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

  // Derive masthead color from featured content's pathway
  const featuredPathway = featuredContent?.pathway_primary as string | null
  const themeEntry = featuredPathway ? (THEMES as Record<string, { name: string; color: string; slug: string }>)[featuredPathway] : null
  const mastColor = themeEntry?.color || '#1b5e8a'
  const mastDk = darken(mastColor)
  const mastLt = lighten(mastColor)
  const mastGeo = featuredPathway ? (THEME_GEO[featuredPathway] || 'flower_of_life') : 'flower_of_life'
  const mastThemeName = themeEntry?.name || null

  return (
    <div className="min-h-screen bg-white">
      {/* ═══ DARK GRADIENT MASTHEAD — color shifts per featured pathway ═══ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(158deg, ${mastDk} 0%, #0d1117 50%, ${mastColor} 100%)`,
          padding: '3.5rem 1.5rem 3rem',
        }}
      >
        {/* Background geo SVGs — geo type matches pathway */}
        <div
          className="absolute pointer-events-none animate-[spin_120s_linear_infinite]"
          style={{
            top: '50%', right: '-60px',
            transform: 'translateY(-50%)',
            width: '380px', height: '380px', opacity: 0.1,
          }}
        >
          <Geo type={mastGeo} size={380} color="#ffffff" opacity={0.6} />
        </div>
        <div
          className="absolute pointer-events-none animate-[spin_90s_linear_infinite_reverse]"
          style={{
            bottom: '-60px', left: '-40px',
            width: '240px', height: '240px', opacity: 0.05,
          }}
        >
          <Geo type="seed_of_life" size={240} color="#ffffff" opacity={0.5} />
        </div>

        <div className="max-w-[1080px] mx-auto relative z-[2]">
          {/* Dateline */}
          <div className="flex items-center gap-3 mb-3">
            <span className="block w-6 h-px" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.24em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Change Engine &middot; Community Exchange
              {mastThemeName && <> &middot; Featuring {mastThemeName}</>}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black leading-[0.95] tracking-[-0.025em] text-white mb-5"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}
          >
            Your guide to{' '}
            <em className="block" style={{ color: mastLt }}>
              what&apos;s going on.
            </em>
          </h1>

          {/* Rule */}
          <div className="w-[50px] h-[2px] mb-5" style={{ background: 'rgba(255,255,255,0.3)' }} />

          {/* Deck */}
          <p
            className="font-body italic text-base leading-[1.7] max-w-[560px] mb-8"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            News. Analysis. Community stories. Explainers about how Houston works.
            Every piece is reviewed by a human editor, rewritten at a sixth-grade reading level,
            and organized so you can find what matters to you.
          </p>

          {/* Stats */}
          <div
            className="flex flex-wrap max-w-[640px]"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}
          >
            {[
              { num: String(stats.resources), desc: 'Resources' },
              { num: String(stats.services), desc: 'Services' },
              { num: String(stats.officials), desc: 'Officials' },
              { num: '7', desc: 'Pathways' },
            ].map((s, i, arr) => (
              <div
                key={i}
                className="flex-1 min-w-[140px] px-6 py-4"
                style={{
                  borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.12)' : undefined,
                }}
              >
                <span
                  className="font-display font-black text-[2rem] leading-none block"
                  style={{ color: mastLt }}
                >
                  {s.num}
                </span>
                <span
                  className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] mt-1 block"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persona selector */}
      <div className="max-w-[1080px] mx-auto px-6 py-6 border-b border-rule" style={{ borderWidth: '1.5px' }}>
        <PersonaSelector />
      </div>

      {/* Client component with editorial sections */}
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
        pathwayColor={mastColor}
      />
    </div>
  )
}
