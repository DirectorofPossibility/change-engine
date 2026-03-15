/**
 * @fileoverview Homepage — Magazine-style editorial layout for Houston.
 *
 * Inspired by Greater Good Berkeley: hero content grid, two-column feeds,
 * pathway topic cards, video shelf, quote of the day.
 * Asset-based framing. Meet people where they are.
 *
 * @route GET /
 * @caching ISR with revalidate = 3600
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats } from '@/lib/data/exchange'
import { getNewsFeed, getLatestContent } from '@/lib/data/content'
import { getRandomQuote, getActivePromotions } from '@/lib/data/homepage'
import { getUpcomingEvents } from '@/lib/data/events'
import { getPathwayCounts as getEntityPathwayCounts } from '@/lib/data/entity-graph'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight, Calendar, MapPin, Megaphone, HandHeart, Scale, UserCheck, Users, Play } from 'lucide-react'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'
const ACCENT = '#C75B2A'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Change Engine — Your neighbor\u2019s guide to Houston',
  description: 'Discover 5,000+ organizations doing incredible work across Houston. Find services, get involved, and connect with your community.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

function getGreeting(): string {
  const hour = new Date().getUTCHours() - 6
  if (hour < 12) return 'Good morning, Houston'
  if (hour < 17) return 'Good afternoon, Houston'
  return 'Good evening, Houston'
}

export default async function ExchangeHomePage() {
  const [stats, newsFeed, latestContent, videos, upcomingEvents, quote, promotions, entityPathwayCounts] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 10),
    getLatestContent(8),
    getNewsFeed(undefined, 6, 'video'),
    getUpcomingEvents(5),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
    getEntityPathwayCounts(),
  ])

  const pathwayCounts: Record<string, number> = {}
  for (const [id, counts] of Object.entries(entityPathwayCounts)) {
    pathwayCounts[id] = counts.total
  }

  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)
  const greeting = getGreeting()

  // Sort content: items with images first, then without
  const allNews = (newsFeed || []) as any[]
  const withImages = allNews.filter(function (item: any) { return !!item.image_url })
  const withoutImages = allNews.filter(function (item: any) { return !item.image_url })
  const sortedFeed = [...withImages, ...withoutImages]

  // Hero grid: prioritize items with real images
  const heroItems = sortedFeed.slice(0, 5)
  const heroMain = heroItems[0]
  const heroSide = heroItems.slice(1, 5)

  // Latest / recent content for two-column section (can include no-image items)
  const recentNews = sortedFeed.slice(5, 11)
  const recentResources = (latestContent || []).slice(0, 6)

  // Pathways for topic cards (exclude "The Bigger We" center — show 6 outer pathways)
  const pathwayCards = THEME_LIST.filter(function (t) { return t.id !== 'THEME_07' })

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          PROMOTIONS BANNER
         ══════════════════════════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <div style={{ background: promotions[0].color || ACCENT }}>
          <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone size={14} className="text-white/70 flex-shrink-0" />
              <span className="text-sm font-semibold text-white truncate">{promotions[0].title}</span>
              {promotions[0].subtitle && <span className="text-sm text-white/70 hidden sm:inline">— {promotions[0].subtitle}</span>}
            </div>
            {promotions[0].cta_href && (
              <Link href={promotions[0].cta_href} className="text-xs font-bold text-white/90 hover:text-white flex-shrink-0 underline underline-offset-2">
                {promotions[0].cta_text || 'Learn more'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Houston skyline with search
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: 400 }}>
        <Image src="/images/hero/houston-skyline.jpg" alt="Houston skyline" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24 flex flex-col justify-end" style={{ minHeight: 400 }}>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/60 mb-4">The Change Engine</p>
          <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            {greeting}.
          </h1>
          <p className="text-xl text-white/90 mb-2 max-w-xl leading-relaxed font-display">
            <span className="text-white font-bold">{(stats.organizations || 0).toLocaleString()} organizations</span> are already building the Houston you want to live in.
          </p>
          <p className="text-sm text-white/60 mb-6 max-w-xl leading-relaxed">
            This is your guide to what they do, how to connect, and where you fit in.
          </p>

          <div className="max-w-lg">
            <HeroSearch />
          </div>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="text-xs font-mono text-white/50">{totalResources.toLocaleString()} resources</span>
            <span className="text-white/25">&middot;</span>
            <span className="text-xs font-mono text-white/50">3 languages</span>
            <span className="text-white/25">&middot;</span>
            <span className="text-xs font-mono text-white/50">Free forever</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HERO CONTENT GRID — 1 large + 4 small (Greater Good style)
         ══════════════════════════════════════════════════════════════════ */}
      {heroItems.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 pt-5 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-1">
            {/* Large featured item */}
            {heroMain && (
              <Link
                href={'/content/' + heroMain.id}
                className="block relative overflow-hidden group"
                style={{ minHeight: 420 }}
              >
                {heroMain.image_url ? (
                  <Image src={heroMain.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <FolFallback pathway={heroMain.pathway_primary} size="hero" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {(() => {
                    const t = THEME_LIST.find(function (th) { return th.id === heroMain.pathway_primary })
                    return t ? (
                      <span className="inline-block px-2.5 py-1 rounded-sm font-mono text-[0.55rem] uppercase tracking-[0.14em] font-bold text-white mb-3"
                        style={{ background: t.color }}
                      >
                        {t.name}
                      </span>
                    ) : null
                  })()}
                  <h3 className="font-display text-2xl md:text-3xl font-black text-white leading-snug mb-2">
                    {heroMain.title_6th_grade}
                  </h3>
                  {heroMain.summary_6th_grade && (
                    <p className="text-sm text-white/80 line-clamp-2 max-w-lg">{heroMain.summary_6th_grade}</p>
                  )}
                </div>
              </Link>
            )}

            {/* 2x2 grid of smaller items */}
            <div className="grid grid-cols-2 gap-1">
              {heroSide.map(function (item: any) {
                const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="block relative overflow-hidden group"
                    style={{ minHeight: 209 }}
                  >
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} size="hero" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {t && (
                        <span className="inline-block px-2 py-0.5 rounded-sm font-mono text-[0.5rem] uppercase tracking-[0.12em] font-bold text-white mb-1.5"
                          style={{ background: t.color }}
                        >
                          {t.name}
                        </span>
                      )}
                      <h4 className="font-display text-sm font-bold text-white leading-snug line-clamp-3">
                        {item.title_6th_grade}
                      </h4>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DEPTH LAYERS — Accent band (like newsletter signup bar)
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: HandHeart, label: 'Services', count: stats.services || 0, href: '/services' },
              { icon: UserCheck, label: 'Representatives', count: stats.officials || 0, href: '/officials' },
              { icon: Scale, label: 'Policies', count: stats.policies || 0, href: '/policies' },
              { icon: Users, label: 'Ways to Participate', count: stats.opportunities || 0, href: '/opportunities' },
              { icon: Calendar, label: 'Events', count: upcomingEvents?.length || 0, href: '/calendar' },
            ].map(function (layer) {
              const Icon = layer.icon
              return (
                <Link
                  key={layer.label}
                  href={layer.href}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={16} />
                  <span className="text-sm font-semibold">{layer.label}</span>
                  <span className="text-xs font-mono text-white/30">{layer.count.toLocaleString()}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN: Latest News + Recent Resources (Greater Good style)
         ══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left column — Latest News */}
          <div>
            <div className="flex items-center justify-between mb-5" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
              <h2 className="font-display text-xl font-black" style={{ color: INK }}>Latest News</h2>
              <Link href="/news" className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                See all <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>
            <div className="space-y-0">
              {recentNews.map(function (item: any, i: number) {
                const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex gap-4 py-4 group"
                    style={{ borderBottom: `1px solid ${RULE}` }}
                  >
                    <div className="w-[100px] h-[75px] flex-shrink-0 overflow-hidden relative rounded">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {t && (
                        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                      )}
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                        {item.title_6th_grade}
                      </h4>
                      <span className="text-xs mt-1 block" style={{ color: DIM }}>{item.source_domain || ''}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right column — Featured Resources */}
          <div>
            <div className="flex items-center justify-between mb-5" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
              <h2 className="font-display text-xl font-black" style={{ color: INK }}>Featured Resources</h2>
              <Link href="/resources" className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                See all <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>
            <div className="space-y-0">
              {recentResources.map(function (item: any) {
                const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex gap-4 py-4 group"
                    style={{ borderBottom: `1px solid ${RULE}` }}
                  >
                    <div className="w-[100px] h-[75px] flex-shrink-0 overflow-hidden relative rounded">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {t && (
                        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                      )}
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                        {item.title_6th_grade || item.title}
                      </h4>
                      <span className="text-xs mt-1 block" style={{ color: DIM }}>
                        {item.content_type ? item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1) : ''}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PATHWAYS — Topic cards (like "Keys to Well-Being")
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl font-black" style={{ color: INK }}>Explore by Pathway</h2>
            <p className="text-sm mt-2 max-w-lg mx-auto" style={{ color: DIM }}>
              Seven lenses into the work Houston organizations are doing. Each pathway connects you to services, news, officials, and ways to get involved.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pathwayCards.map(function (theme) {
              const count = pathwayCounts[theme.id] || 0
              return (
                <Link
                  key={theme.id}
                  href={'/pathways/' + theme.slug}
                  className="bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ border: `1px solid ${RULE}` }}
                >
                  {/* Colored header band with FOL pattern */}
                  <div className="h-24 relative overflow-hidden" style={{ background: theme.color }}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <FlowerOfLife color="#ffffff" size={120} />
                    </div>
                    <div className="absolute bottom-3 left-4">
                      <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-white/60">{count.toLocaleString()} resources</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-black mb-1 group-hover:underline" style={{ color: INK }}>
                      {theme.name}
                    </h3>
                    <p className="text-xs leading-relaxed line-clamp-3" style={{ color: DIM }}>
                      {theme.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          VIDEOS — 3-up shelf
         ══════════════════════════════════════════════════════════════════ */}
      {videos && videos.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-5" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
            <h2 className="font-display text-xl font-black" style={{ color: INK }}>Videos</h2>
            <Link href="/news?type=video" className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
              See all <ArrowRight size={11} className="inline ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(videos as any[]).slice(0, 3).map(function (item: any) {
              const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="block group"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3" style={{ aspectRatio: '16/9' }}>
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} size="hero" />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play size={20} fill={INK} style={{ color: INK, marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                  {t && (
                    <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                  )}
                  <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline mt-0.5" style={{ color: INK }}>
                    {item.title_6th_grade}
                  </h4>
                  {item.summary_6th_grade && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: DIM }}>{item.summary_6th_grade}</p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COMING UP — Events
         ══════════════════════════════════════════════════════════════════ */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="max-w-[1200px] mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-5" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
              <h2 className="font-display text-xl font-black" style={{ color: INK }}>Coming Up</h2>
              <Link href="/calendar" className="text-xs font-semibold hover:underline" style={{ color: ACCENT }}>
                Full calendar <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {upcomingEvents.map(function (event: any) {
                const eventDate = new Date(event.date)
                const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
                const day = eventDate.getDate()
                const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="p-4 rounded-xl transition-all hover:shadow-md hover:translate-y-[-2px] bg-white"
                    style={{ border: `1px solid ${RULE}` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center" style={{ background: SIDEBAR_BG }}>
                        <span className="font-mono text-[0.5rem] uppercase tracking-wider font-bold" style={{ color: DIM }}>{month}</span>
                        <span className="font-display text-base font-black leading-none" style={{ color: INK }}>{day}</span>
                      </div>
                      <span className="text-xs font-mono" style={{ color: DIM }}>{weekday}</span>
                    </div>
                    <h4 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: INK }}>{event.title}</h4>
                    {event.location && (
                      <div className="flex items-center gap-1 text-xs mt-1.5" style={{ color: DIM }}>
                        <MapPin size={9} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          QUOTE OF THE DAY
         ══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
          <div className="max-w-[700px] mx-auto px-6 py-12 text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] mb-4" style={{ color: DIM }}>Quote of the Day</p>
            <blockquote className="font-display text-2xl leading-relaxed italic mb-3" style={{ color: INK }}>
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            {quote.attribution && (
              <p className="text-sm" style={{ color: DIM }}>— {quote.attribution}</p>
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER CODA ── */}
      <div style={{ background: '#ffffff', borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap text-xs font-mono" style={{ color: DIM }}>
              <span>3 languages</span>
              <span style={{ color: RULE }}>&middot;</span>
              <span>Plain language</span>
              <span style={{ color: RULE }}>&middot;</span>
              <span>No ads</span>
              <span style={{ color: RULE }}>&middot;</span>
              <span>Free forever</span>
            </div>
            <Link href="/about" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
              About The Change Engine <ArrowRight size={12} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
