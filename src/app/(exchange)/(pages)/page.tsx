/**
 * @fileoverview Homepage — The Community Exchange.
 *
 * V2: Pathway-first design with Interactive Flower of Life as hero navigation,
 * 3 Centers grid (Resource, Action, Library), and magazine-style latest content.
 *
 * @route GET /
 * @caching ISR with revalidate = 600 (10 minutes)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats, getLatestContent } from '@/lib/data/exchange'
import { getPathwayCounts as getEntityPathwayCounts } from '@/lib/data/entity-graph'
import { THEMES, THREE_CENTERS } from '@/lib/constants'
import { Geo } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Community Exchange — Houston, Texas | The Change Engine',
  description: 'Your culture guide to Houston — explore resources, services, and civic power across seven community pathways.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

const CENTER_LIST = Object.values(THREE_CENTERS)


export default async function ExchangeHomePage() {
  const [stats, latestContent, entityPathwayCounts] = await Promise.all([
    getExchangeStats(),
    getLatestContent(4),
    getEntityPathwayCounts(),
  ])

  // Flatten entity counts to total per pathway for FOL and directory
  const pathwayCounts: Record<string, number> = {}
  for (const [id, counts] of Object.entries(entityPathwayCounts)) {
    pathwayCounts[id] = counts.total
  }

  const featured = latestContent?.[0]
  const sideItems = latestContent?.slice(1, 4) || []

  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)

  // Map entity counts to centers for display
  const centerCounts: Record<string, number> = {
    resources: (stats.services || 0) + (stats.organizations || 0),
    action: (stats.opportunities || 0) + (stats.officials || 0),
    learning: (stats.resources || 0) + (stats.policies || 0),
  }

  return (
    <div>
      {/* ── HERO — Flower of Life Navigation ── */}
      <section className="relative overflow-hidden" style={{ background: '#1a1a2e' }}>
        {/* Subtle FOL watermarks */}
        <div className="absolute left-[-120px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/flower-full.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="absolute right-[-120px] top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/flower-full.svg" alt="" width={500} height={500} className="opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-[1152px] mx-auto px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_540px] gap-8 items-center">
            {/* Left — copy + search */}
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] font-semibold mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Houston, Texas
              </p>
              <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-tight mb-4" style={{ color: 'white' }}>
                Community life, <span style={{ color: '#C75B2A' }}>organized.</span>
              </h1>
              <p className="font-serif text-xl italic mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Seven pathways into the resources, services, and civic power that make Houston stronger
              </p>

              {/* Search bar — inline, submits to /search */}
              <HeroSearch />

              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Choose a pathway to explore &rarr;
              </p>
            </div>

            {/* Right — Interactive Flower of Life */}
            <div className="hidden md:block">
              <InteractiveFOL pathwayCounts={pathwayCounts} />
            </div>
          </div>

          {/* Mobile FOL — full width below md */}
          <div className="md:hidden mt-8">
            <InteractiveFOL pathwayCounts={pathwayCounts} />
          </div>
        </div>

        {/* Pathway spectrum bar */}
        <div className="flex h-1">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E2DDD5' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-4">
          {/* Primary stats row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{totalResources.toLocaleString()}</span>
                <span className="text-[12px]" style={{ color: '#6B6560' }}>resources</span>
              </div>
              <div className="w-px h-6 hidden sm:block" style={{ background: '#E2DDD5' }} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{stats.officials || 0}</span>
                <span className="text-[12px]" style={{ color: '#6B6560' }}>officials</span>
              </div>
              <div className="w-px h-6 hidden sm:block" style={{ background: '#E2DDD5' }} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>{stats.organizations || 0}</span>
                <span className="text-[12px]" style={{ color: '#6B6560' }}>organizations</span>
              </div>
              <div className="w-px h-6 hidden sm:block" style={{ background: '#E2DDD5' }} />
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-2xl font-bold" style={{ color: '#1A1A1A' }}>7</span>
                <span className="text-[12px]" style={{ color: '#6B6560' }}>pathways</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#2D8659' }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: '#2D8659' }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#2D8659' }} />
              </span>
              Updated daily
            </span>
          </div>
          {/* Civic credibility strip */}
          <div className="flex items-center gap-3 mt-2 flex-wrap text-[11px]" style={{ color: '#9B9590' }}>
            <span>4 levels of government</span>
            <span style={{ color: '#D5D0CA' }}>&middot;</span>
            <span>3 languages</span>
            <span style={{ color: '#D5D0CA' }}>&middot;</span>
            <span>6th-grade reading level</span>
            <span style={{ color: '#D5D0CA' }}>&middot;</span>
            <span>Zero ads</span>
            <span style={{ color: '#D5D0CA' }}>&middot;</span>
            <span>Free forever</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1152px] mx-auto px-8">

        {/* ── THREE CENTERS ── */}
        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-4xl" style={{ color: '#1A1A1A' }}>Three Centers</h2>
              <p className="text-[14px] mt-1" style={{ color: '#6B6560' }}>Every pathway leads to one of these doorways</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CENTER_LIST.map(function (c) {
              const count = centerCounts[c.slug] || 0
              return (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="relative bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  {/* Color accent top */}
                  <div className="h-1.5" style={{ background: c.color }} />

                  {/* FOL background graphic */}
                  <div className="absolute top-0 right-0 w-[180px] h-[180px] pointer-events-none" aria-hidden="true">
                    <div
                      className="absolute inset-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.12]"
                      style={{ opacity: 0.06, transform: 'translate(30%, -20%)' }}
                    >
                      <Geo type={c.geoType} color={c.color} opacity={1} />
                    </div>
                  </div>

                  {/* Radial glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 80% 20%, ${c.color}10 0%, transparent 60%)`,
                    }}
                  />

                  <div className="relative z-10 p-5">
                    {/* Instrument-style geo mark with ring */}
                    <div className="w-[52px] h-[52px] mb-4 relative">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        {/* Outer ring */}
                        <circle cx="50" cy="50" r="46" fill="none" stroke={`${c.color}20`} strokeWidth="2" />
                        {/* Inner ring */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke={`${c.color}10`} strokeWidth="1" />
                        {/* Decorative dots at cardinal points */}
                        {[0, 90, 180, 270].map(function (angle) {
                          const rad = (angle * Math.PI) / 180
                          return (
                            <circle
                              key={angle}
                              cx={50 + 46 * Math.cos(rad)}
                              cy={50 + 46 * Math.sin(rad)}
                              r="2"
                              fill={`${c.color}30`}
                            />
                          )
                        })}
                      </svg>
                      {/* Sacred geometry centered inside */}
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ opacity: 0.5 }}>
                        <div className="w-[55%]">
                          <Geo type={c.geoType} color={c.color} opacity={1} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-[16px] font-bold" style={{ color: '#1A1A1A' }}>{c.name}</h3>
                      {count > 0 && <span className="text-[11px] font-mono" style={{ color: '#9B9590' }}>{count.toLocaleString()}</span>}
                    </div>
                    <p className="text-[13px] italic mb-2" style={{ color: c.color }}>{c.tagline}</p>
                    <p className="text-[13px] leading-relaxed mb-3" style={{ color: '#6B6560' }}>{c.description}</p>
                    <span className="text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: c.color }}>Enter &rarr;</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Section divider */}
        <hr className="border-0 h-px" style={{ background: 'linear-gradient(to right, #E2DDD5, rgba(226,221,213,0.6), transparent)' }} />

        {/* ── WHAT'S NEW — MAGAZINE LAYOUT ── */}
        <section className="py-12 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-4xl" style={{ color: '#1A1A1A' }}>What&apos;s New</h2>
              <p className="text-[14px] mt-1" style={{ color: '#6B6560' }}>Recently published for the Houston community</p>
            </div>
            <Link href="/news" className="inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: '#C75B2A' }}>
              See all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
            {/* Featured card */}
            {featured && (
              <Link
                href={'/content/' + featured.id}
                className="bg-white border overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px]"
                style={{ borderColor: '#E2DDD5' }}
              >
                {featured.image_url ? (
                  <div className="h-[220px] overflow-hidden">
                    <Image src={featured.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                  </div>
                ) : (
                  <FolFallback pathway={featured.pathway_primary} size="hero" />
                )}
                <div className="p-4">
                  <h4 className="font-serif text-[16px] font-bold leading-snug mb-1.5" style={{ color: '#1A1A1A' }}>
                    {featured.title_6th_grade || (featured as any).title}
                  </h4>
                  {(featured as any).summary_6th_grade && (
                    <p className="text-[14px] line-clamp-2" style={{ color: '#6B6560' }}>{(featured as any).summary_6th_grade.length > 150 ? (featured as any).summary_6th_grade.slice(0, 150) + '...' : (featured as any).summary_6th_grade}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(226,221,213,0.5)' }}>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const fTheme = THEME_LIST.find(function (t) { return t.id === featured.pathway_primary })
                        return fTheme ? (
                          <>
                            <span className="w-2 h-2 rounded-full" style={{ background: fTheme.color }} />
                            <span className="text-[12px]" style={{ color: '#6B6560' }}>{fTheme.name}</span>
                          </>
                        ) : null
                      })()}
                    </div>
                    <span className="text-[12px] font-semibold" style={{ color: '#C75B2A' }}>Read more &rsaquo;</span>
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
                    className="flex bg-white border overflow-hidden transition-all hover:shadow-md group"
                    style={{ borderColor: '#E2DDD5' }}
                  >
                    {item.image_url ? (
                      <div className="w-[110px] flex-shrink-0 overflow-hidden">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                      </div>
                    ) : (
                      <div className="w-[110px] flex-shrink-0 overflow-hidden">
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      </div>
                    )}
                    <div className="flex-1 p-3.5 min-w-0">
                      {theme && (
                        <div className="flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider font-semibold" style={{ color: theme.color }}>
                          {theme.name}
                        </div>
                      )}
                      <h4 className="text-[14px] font-bold leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>
                        {item.title_6th_grade || item.title}
                      </h4>
                      {item.summary_6th_grade && (
                        <p className="text-[13px] mt-1 line-clamp-2" style={{ color: '#6B6560' }}>{item.summary_6th_grade.length > 150 ? item.summary_6th_grade.slice(0, 150) + '...' : item.summary_6th_grade}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[12px]" style={{ color: '#6B6560' }}>{item.source_domain || ''}</span>
                        <span className="text-[13px] font-semibold" style={{ color: '#C75B2A' }}>Open &rsaquo;</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── PATHWAY DIRECTORY ── */}
        <section className="py-12 pb-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-serif text-4xl" style={{ color: '#1A1A1A' }}>Seven Pathways</h2>
              <p className="text-[14px] mt-1" style={{ color: '#6B6560' }}>Every issue connects to a pathway. Pick one to start exploring.</p>
            </div>
            <Link href="/compass" className="inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: '#1b5e8a' }}>
              Use the Compass <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_LIST.map(function (t) {
              const count = pathwayCounts[t.id] || 0
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="flex items-center gap-3 bg-white border px-4 py-3.5 transition-all hover:shadow-md hover:translate-y-[-1px] group"
                  style={{ borderColor: '#E2DDD5' }}
                >
                  <div className="w-3 h-3 flex-shrink-0" style={{ background: t.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[14px] font-bold block" style={{ color: '#1A1A1A' }}>{t.name}</span>
                    <span className="text-[12px] line-clamp-1" style={{ color: '#6B6560' }}>{t.description.split('.')[0]}.</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[11px] font-mono flex-shrink-0" style={{ color: '#9B9590' }}>{count}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
