/**
 * @fileoverview Homepage — Daily Community Briefing.
 *
 * Living, breathing front page that changes every day.
 * Time-aware greeting, daily quote, news + upcoming events,
 * Three Centers with real content, seven pathways, and community voice.
 *
 * @route GET /
 * @caching ISR with revalidate = 3600
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats } from '@/lib/data/exchange'
import { getNewsFeed } from '@/lib/data/content'
import { getRandomQuote, getActivePromotions } from '@/lib/data/homepage'
import { getUpcomingEvents } from '@/lib/data/events'
import { getPathwayCounts as getEntityPathwayCounts } from '@/lib/data/entity-graph'
import { THEMES, THREE_CENTERS } from '@/lib/constants'
import { Geo, FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight, Calendar, MapPin, Newspaper, Heart, Search, Megaphone, HandHeart, BookOpen } from 'lucide-react'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'
const HERO_COLOR = '#0d1117'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'The Change Engine — Your neighbor\u2019s guide to Houston',
  description: 'Everything free, everything local. Find resources, get involved, and explore what Houston has to offer across seven community pathways.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })
const CENTER_LIST = Object.values(THREE_CENTERS)

const CENTER_META: Record<string, { name: string; tagline: string; icon: typeof BookOpen }> = {
  learning: { name: 'Stay Informed', tagline: 'News, stories & context', icon: BookOpen },
  action: { name: 'Get Involved', tagline: 'Volunteer, vote & show up', icon: Megaphone },
  resources: { name: 'Find Help', tagline: 'Services, orgs & support', icon: HandHeart },
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() - 6 // CST rough
  if (hour < 12) return 'Good morning, Houston'
  if (hour < 17) return 'Good afternoon, Houston'
  return 'Good evening, Houston'
}

export default async function ExchangeHomePage() {
  const [stats, newsFeed, upcomingEvents, quote, promotions, entityPathwayCounts] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 5),
    getUpcomingEvents(4),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
    getEntityPathwayCounts(),
  ])

  const pathwayCounts: Record<string, number> = {}
  for (const [id, counts] of Object.entries(entityPathwayCounts)) {
    pathwayCounts[id] = counts.total
  }

  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)

  const centerCounts: Record<string, number> = {
    resources: (stats.services || 0) + (stats.organizations || 0),
    action: (stats.opportunities || 0) + (stats.officials || 0),
    learning: (stats.resources || 0) + (stats.policies || 0),
  }

  const featuredNews = newsFeed?.[0]
  const moreNews = newsFeed?.slice(1, 5) || []
  const greeting = getGreeting()

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          PROMOTIONS BANNER (time-sensitive alerts)
         ══════════════════════════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <div style={{ background: promotions[0].color || '#1b5e8a' }}>
          <div className="max-w-[1080px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
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
          GRADIENT HERO — Daily Greeting + Search + FOL
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${HERO_COLOR} 0%, ${HERO_COLOR}dd 40%, ${HERO_COLOR}55 100%)` }}
      >
        {/* Texture layers */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={500} />
        </div>

        <div className="relative z-10 max-w-[1080px] mx-auto px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-8 items-center">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/40 mb-4">
                The Change Engine
              </p>
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-3"
                style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}
              >
                {greeting}.
              </h1>

              {/* Daily quote */}
              {quote && (
                <blockquote className="text-white/60 leading-relaxed mb-6 max-w-lg italic" style={{ fontSize: '1.05rem' }}>
                  &ldquo;{quote.quote_text.length > 140 ? quote.quote_text.slice(0, 140) + '...' : quote.quote_text}&rdquo;
                  {quote.attribution && (
                    <span className="text-white/40 not-italic text-sm ml-2">— {quote.attribution}</span>
                  )}
                </blockquote>
              )}

              <HeroSearch />

              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="text-xs font-mono text-white/30 tracking-wide">{totalResources.toLocaleString()} resources</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30 tracking-wide">{stats.organizations || 0} organizations</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30 tracking-wide">Updated daily</span>
              </div>
            </div>

            {/* FOL navigation */}
            <div className="hidden md:block">
              <InteractiveFOL pathwayCounts={pathwayCounts} />
            </div>
          </div>

          <div className="md:hidden mt-6">
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

      {/* ══════════════════════════════════════════════════════════════════
          WHAT'S HAPPENING — News + Upcoming Events (two-column)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

          {/* LEFT — News */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Newspaper size={16} style={{ color: DIM }} />
              <h2 className="font-display text-xl font-bold" style={{ color: INK }}>What&apos;s Happening</h2>
              <div className="flex-1 h-px ml-2" style={{ background: RULE }} />
              <Link href="/news" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
                All news <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>

            {/* Featured article */}
            {featuredNews && (
              <Link
                href={'/content/' + featuredNews.id}
                className="block overflow-hidden rounded-xl transition-all hover:shadow-lg hover:translate-y-[-2px] mb-4"
                style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
              >
                {featuredNews.image_url ? (
                  <div className="h-[200px] overflow-hidden rounded-t-xl">
                    <Image src={featuredNews.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                  </div>
                ) : (
                  <FolFallback pathway={featuredNews.pathway_primary} size="hero" />
                )}
                <div className="p-5">
                  {(() => {
                    const t = THEME_LIST.find(function (th) { return th.id === featuredNews.pathway_primary })
                    return t ? (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                      </div>
                    ) : null
                  })()}
                  <h3 className="font-display text-lg font-bold leading-snug mb-1.5" style={{ color: INK }}>
                    {featuredNews.title_6th_grade}
                  </h3>
                  {featuredNews.summary_6th_grade && (
                    <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: DIM }}>
                      {featuredNews.summary_6th_grade}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${RULE}` }}>
                    <span className="text-xs font-mono" style={{ color: DIM }}>{featuredNews.source_domain || ''}</span>
                    <span className="text-sm font-semibold text-blue">Read &rsaquo;</span>
                  </div>
                </div>
              </Link>
            )}

            {/* More headlines */}
            <div className="space-y-1">
              {moreNews.map(function (item: any) {
                const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex items-start gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-white group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: t?.color || DIM }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: INK }}>
                        {item.title_6th_grade}
                      </span>
                      <span className="text-xs font-mono ml-2" style={{ color: DIM }}>{item.source_domain || ''}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* RIGHT — Upcoming Events */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Calendar size={16} style={{ color: DIM }} />
              <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Coming Up</h2>
              <div className="flex-1 h-px ml-2" style={{ background: RULE }} />
              <Link href="/calendar" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
                Full calendar <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents.map(function (event: any) {
                const eventDate = new Date(event.date)
                const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
                const day = eventDate.getDate()
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="flex gap-4 p-4 rounded-xl transition-all hover:shadow-md hover:translate-y-[-1px]"
                    style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                  >
                    {/* Date block */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg flex flex-col items-center justify-center" style={{ background: SIDEBAR_BG }}>
                      <span className="font-mono text-[0.6rem] uppercase tracking-wider font-bold" style={{ color: DIM }}>{month}</span>
                      <span className="font-display text-xl font-black leading-none" style={{ color: INK }}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-snug line-clamp-2 mb-1" style={{ color: INK }}>
                        {event.title}
                      </h4>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: DIM }}>
                          <MapPin size={10} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      {event.type && (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full font-mono text-[0.55rem] uppercase tracking-wider" style={{ background: SIDEBAR_BG, color: DIM }}>
                          {event.type}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              }) : (
                <div className="text-center py-8 rounded-xl" style={{ background: '#ffffff', border: `1px solid ${RULE}` }}>
                  <Calendar size={24} className="mx-auto mb-2" style={{ color: RULE }} />
                  <p className="text-sm" style={{ color: DIM }}>Check the <Link href="/calendar" className="text-blue font-semibold hover:underline">full calendar</Link> for upcoming events</p>
                </div>
              )}
            </div>

            {/* Quick stats sidebar */}
            <div className="mt-6 p-4 rounded-xl" style={{ background: SIDEBAR_BG, border: `1px solid ${RULE}` }}>
              <h3 className="font-mono text-[0.6rem] uppercase tracking-[0.14em] font-bold mb-3" style={{ color: DIM }}>At a Glance</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Services', value: stats.services || 0, href: '/services' },
                  { label: 'Organizations', value: stats.organizations || 0, href: '/organizations' },
                  { label: 'Officials', value: stats.officials || 0, href: '/officials' },
                  { label: 'Opportunities', value: stats.opportunities || 0, href: '/opportunities' },
                ].map(function (s) {
                  return (
                    <Link key={s.label} href={s.href} className="group">
                      <div className="font-display text-lg font-bold group-hover:text-blue transition-colors" style={{ color: INK }}>{s.value.toLocaleString()}</div>
                      <div className="text-xs" style={{ color: DIM }}>{s.label}</div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          THREE DOORS — Centers with gradient cards
         ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-6">
            <Search size={16} style={{ color: DIM }} />
            <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Where do you want to start?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {CENTER_LIST.map(function (c) {
              const count = centerCounts[c.slug] || 0
              const meta = CENTER_META[c.slug]
              const Icon = meta?.icon || BookOpen
              return (
                <Link
                  key={c.slug}
                  href={c.href}
                  className="relative overflow-hidden transition-all hover:shadow-xl hover:translate-y-[-3px] hover:scale-[1.02] group rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${c.color} 0%, ${c.color}cc 60%, ${c.color}88 100%)` }}
                >
                  {/* Texture */}
                  <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                  <div className="absolute top-[-40%] right-[-20%] w-[200px] h-[200px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

                  {/* Geo watermark */}
                  <div className="absolute bottom-[-30px] right-[-20px] w-[160px] h-[160px] pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" aria-hidden="true" style={{ opacity: 0.1 }}>
                    <Geo type={c.geoType} color="#ffffff" opacity={1} />
                  </div>

                  <div className="relative z-10 p-6">
                    <div className="w-11 h-11 mb-4 flex items-center justify-center rounded-lg" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                      <Icon size={22} className="text-white/90" />
                    </div>

                    <h3 className="font-display text-xl font-black text-white mb-1">{meta?.name || c.name}</h3>
                    <p className="text-sm text-white/70 mb-4">{meta?.tagline || c.tagline}</p>

                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                      {count > 0 && <span className="text-xs font-mono text-white/40">{count.toLocaleString()}</span>}
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:gap-2.5 transition-all">
                        Explore <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SEVEN PATHWAYS — Compact scrollable row
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-5">
          <Heart size={16} style={{ color: DIM }} />
          <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Seven Ways In</h2>
          <div className="flex-1 h-px ml-2" style={{ background: RULE }} />
          <Link href="/compass" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
            Open Compass <ArrowRight size={11} className="inline ml-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {THEME_LIST.map(function (t) {
            const count = pathwayCounts[t.id] || 0
            return (
              <Link
                key={t.id}
                href={'/pathways/' + t.slug}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:shadow-md hover:translate-y-[-1px] group"
                style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
              >
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: t.color + '15' }}>
                  <div className="w-3 h-3 rounded-sm" style={{ background: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold block" style={{ color: INK }}>{t.name}</span>
                  {count > 0 && <span className="text-xs font-mono" style={{ color: DIM }}>{count}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COMMUNITY VOICE — Daily quote + warmth
         ══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <div style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
          <div className="max-w-[700px] mx-auto px-6 py-12 text-center">
            <div className="w-10 h-10 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: `${INK}10` }}>
              <FlowerOfLife color={INK} size={20} />
            </div>
            <blockquote className="font-display text-lg leading-relaxed italic mb-3" style={{ color: INK }}>
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            {quote.attribution && (
              <p className="text-sm font-mono" style={{ color: DIM }}>— {quote.attribution}</p>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER CODA ── */}
      <div style={{ background: '#ffffff', borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-8">
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
            <Link href="/about" className="text-sm font-semibold text-blue hover:underline">
              About The Change Engine <ArrowRight size={12} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
