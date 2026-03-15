/**
 * @fileoverview Homepage — Community Exchange.
 *
 * Warm, neighbor-friendly design. Interactive FOL hero, Three Centers,
 * magazine-style latest content, and seven pathway directory.
 *
 * @route GET /
 * @caching ISR with revalidate = 3600
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats, getLatestContent } from '@/lib/data/exchange'
import { getPathwayCounts as getEntityPathwayCounts } from '@/lib/data/entity-graph'
import { THEMES, THREE_CENTERS } from '@/lib/constants'
import { Geo } from '@/components/geo/sacred'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight } from 'lucide-react'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'
const HERO_COLOR = '#0d1117'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Community Exchange — Your neighbor\u2019s guide to Houston | The Change Lab',
  description: 'Everything free, everything local. Find resources, get involved, and explore what Houston has to offer across seven community pathways.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

const CENTER_LIST = Object.values(THREE_CENTERS)

/* Warm, neighbor-friendly names for the three centers */
const CENTER_FRIENDLY: Record<string, { name: string; tagline: string; description: string }> = {
  learning: {
    name: 'Stay Informed',
    tagline: 'Know what\u2019s happening around you',
    description: 'News, stories, and explainers about what\u2019s going on in Houston \u2014 written so everyone can follow along.',
  },
  action: {
    name: 'Get Involved',
    tagline: 'Show up for your community',
    description: 'Volunteer spots, upcoming votes, town halls, and ways to make your voice heard right now.',
  },
  resources: {
    name: 'Find Help',
    tagline: 'See what\u2019s available to you',
    description: 'Free services, local organizations, and support for Houston families \u2014 all in one place.',
  },
}

export default async function ExchangeHomePage() {
  const [stats, latestContent, entityPathwayCounts] = await Promise.all([
    getExchangeStats(),
    getLatestContent(4),
    getEntityPathwayCounts(),
  ])

  const pathwayCounts: Record<string, number> = {}
  for (const [id, counts] of Object.entries(entityPathwayCounts)) {
    pathwayCounts[id] = counts.total
  }

  const featured = latestContent?.[0]
  const sideItems = latestContent?.slice(1, 4) || []

  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)

  const centerCounts: Record<string, number> = {
    resources: (stats.services || 0) + (stats.organizations || 0),
    action: (stats.opportunities || 0) + (stats.officials || 0),
    learning: (stats.resources || 0) + (stats.policies || 0),
  }

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${HERO_COLOR} 0%, ${HERO_COLOR}dd 40%, ${HERO_COLOR}55 100%)` }}
      >
        {/* Texture layers — matches brand template */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={500} />
        </div>
        <div className="absolute right-[-80px] bottom-[-60px] pointer-events-none opacity-[0.03]" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_480px] gap-8 items-center">
            {/* Left — copy + search */}
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/40 mb-5">
                Houston, Texas
              </p>
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
              >
                Your neighbor&apos;s guide<br />to <span className="text-blue">everything local.</span>
              </h1>
              <p className="text-lg text-white/60 mb-8 max-w-md leading-relaxed">
                Find free resources, get involved in your community, and explore what Houston has to offer — all in one place.
              </p>

              <HeroSearch />

              <p className="text-sm text-white/40 mt-4 font-mono tracking-wide">
                Or pick a pathway below to start exploring &rarr;
              </p>
            </div>

            {/* Right — Interactive Flower of Life */}
            <div className="hidden md:block">
              <InteractiveFOL pathwayCounts={pathwayCounts} />
            </div>
          </div>

          {/* Mobile FOL */}
          <div className="md:hidden mt-8">
            <InteractiveFOL pathwayCounts={pathwayCounts} />
          </div>
        </div>

        {/* Pathway spectrum bar */}
        <div className="flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div style={{ background: SIDEBAR_BG, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold" style={{ color: INK }}>{totalResources.toLocaleString()}</span>
                <span className="text-sm" style={{ color: DIM }}>things you can use</span>
              </div>
              <div className="w-px h-6 hidden sm:block" style={{ background: RULE }} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold" style={{ color: INK }}>{stats.organizations || 0}</span>
                <span className="text-sm" style={{ color: DIM }}>local organizations</span>
              </div>
              <div className="w-px h-6 hidden sm:block" style={{ background: RULE }} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-2xl font-bold" style={{ color: INK }}>7</span>
                <span className="text-sm" style={{ color: DIM }}>ways to explore</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-[#2D8659] font-mono tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping bg-[#2D8659]" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2D8659]" />
              </span>
              Updated daily
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs font-mono tracking-wide" style={{ color: DIM }}>
            <span>3 languages</span>
            <span style={{ color: RULE }}>&middot;</span>
            <span>Plain language</span>
            <span style={{ color: RULE }}>&middot;</span>
            <span>No ads</span>
            <span style={{ color: RULE }}>&middot;</span>
            <span>Free forever</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6">

        {/* ── THREE CENTERS ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold" style={{ color: INK }}>How can we help?</h2>
              <p className="text-sm mt-1" style={{ color: DIM }}>Pick a starting point — we&apos;ll show you what&apos;s here for you.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CENTER_LIST.map(function (c) {
              const count = centerCounts[c.slug] || 0
              const friendly = CENTER_FRIENDLY[c.slug]
              return (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="relative overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group rounded-lg"
                  style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                >
                  {/* Color accent top */}
                  <div className="h-1.5 rounded-t-lg" style={{ background: c.color }} />

                  {/* FOL background graphic */}
                  <div className="absolute top-0 right-0 w-[160px] h-[160px] pointer-events-none" aria-hidden="true">
                    <div
                      className="absolute inset-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.12]"
                      style={{ opacity: 0.06, transform: 'translate(30%, -20%)' }}
                    >
                      <Geo type={c.geoType} color={c.color} opacity={1} />
                    </div>
                  </div>

                  <div className="relative z-10 p-5">
                    <div className="w-10 h-10 mb-3 flex items-center justify-center" style={{ opacity: 0.4 }}>
                      <Geo type={c.geoType} color={c.color} opacity={1} />
                    </div>

                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-base font-bold" style={{ color: INK }}>{friendly?.name || c.name}</h3>
                      {count > 0 && <span className="text-xs font-mono" style={{ color: DIM }}>{count.toLocaleString()}</span>}
                    </div>
                    <p className="text-sm italic mb-2" style={{ color: c.color }}>{friendly?.tagline || c.tagline}</p>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: DIM }}>{friendly?.description || c.description}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: c.color }}>
                      Explore <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Section divider */}
        <hr className="border-0 h-px" style={{ background: RULE }} />

        {/* ── WHAT'S NEW ── */}
        <section className="py-12 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold" style={{ color: INK }}>What&apos;s New</h2>
              <p className="text-sm mt-1" style={{ color: DIM }}>The latest from around Houston</p>
            </div>
            <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:text-ink transition-colors">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            {/* Featured card */}
            {featured && (
              <Link
                href={'/content/' + featured.id}
                className="overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] rounded-lg"
                style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
              >
                {featured.image_url ? (
                  <div className="h-[220px] overflow-hidden rounded-t-lg">
                    <Image src={featured.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                  </div>
                ) : (
                  <FolFallback pathway={featured.pathway_primary} size="hero" />
                )}
                <div className="p-5">
                  <h4 className="text-base font-bold leading-snug mb-1.5" style={{ color: INK }}>
                    {featured.title_6th_grade || (featured as any).title}
                  </h4>
                  {(featured as any).summary_6th_grade && (
                    <p className="text-sm line-clamp-2" style={{ color: DIM }}>{(featured as any).summary_6th_grade.length > 150 ? (featured as any).summary_6th_grade.slice(0, 150) + '...' : (featured as any).summary_6th_grade}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${RULE}` }}>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const fTheme = THEME_LIST.find(function (t) { return t.id === featured.pathway_primary })
                        return fTheme ? (
                          <>
                            <span className="w-2 h-2 rounded-full" style={{ background: fTheme.color }} />
                            <span className="text-xs font-mono" style={{ color: DIM }}>{fTheme.name}</span>
                          </>
                        ) : null
                      })()}
                    </div>
                    <span className="text-sm font-semibold text-blue">Read more &rsaquo;</span>
                  </div>
                </div>
              </Link>
            )}

            {/* Stacked list */}
            <div className="flex flex-col gap-4">
              {sideItems.map(function (item: any) {
                const theme = THEME_LIST.find(function (t) { return t.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex overflow-hidden transition-all hover:shadow-md group rounded-lg"
                    style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                  >
                    {item.image_url ? (
                      <div className="w-[110px] flex-shrink-0 overflow-hidden rounded-l-lg">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                      </div>
                    ) : (
                      <div className="w-[110px] flex-shrink-0 overflow-hidden rounded-l-lg">
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      </div>
                    )}
                    <div className="flex-1 p-3.5 min-w-0">
                      {theme && (
                        <div className="flex items-center gap-1.5 mb-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] font-semibold" style={{ color: theme.color }}>
                          {theme.name}
                        </div>
                      )}
                      <h4 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: INK }}>
                        {item.title_6th_grade || item.title}
                      </h4>
                      {item.summary_6th_grade && (
                        <p className="text-sm mt-1 line-clamp-2" style={{ color: DIM }}>{item.summary_6th_grade.length > 150 ? item.summary_6th_grade.slice(0, 150) + '...' : item.summary_6th_grade}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-mono" style={{ color: DIM }}>{item.source_domain || ''}</span>
                        <span className="text-sm font-semibold text-blue">Read &rsaquo;</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Section divider */}
        <hr className="border-0 h-px" style={{ background: RULE }} />

        {/* ── SEVEN PATHWAYS ── */}
        <section className="py-12 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-display text-3xl font-bold" style={{ color: INK }}>Seven Ways In</h2>
              <p className="text-sm mt-1" style={{ color: DIM }}>Pick a topic that matters to you and see what&apos;s here.</p>
            </div>
            <Link href="/compass" className="inline-flex items-center gap-1 text-sm font-semibold text-blue hover:text-ink transition-colors">
              Open the Compass <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_LIST.map(function (t) {
              const count = pathwayCounts[t.id] || 0
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="flex items-center gap-3 px-4 py-3.5 transition-all hover:shadow-md hover:translate-y-[-1px] group rounded-lg"
                  style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                >
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: t.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold block" style={{ color: INK }}>{t.name}</span>
                    <span className="text-sm line-clamp-1" style={{ color: DIM }}>{t.description.split('.')[0]}.</span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs font-mono flex-shrink-0" style={{ color: DIM }}>{count}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

      </div>

      {/* ── FOOTER CODA ── */}
      <div style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-8 text-center">
          <p className="text-sm" style={{ color: DIM }}>
            Built for Houston. Free forever. <Link href="/about" className="font-semibold text-blue hover:underline">Learn more about The Change Engine &rarr;</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
