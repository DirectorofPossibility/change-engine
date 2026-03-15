/**
 * @fileoverview Homepage — Discovery feed for Houston.
 *
 * Visual, thumbnail-driven content grid. Every item has an image.
 * Organizations are the backbone but surfaced through content, not lists.
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
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight, Calendar, MapPin, Megaphone, HandHeart, Scale, UserCheck, Users, Sparkles } from 'lucide-react'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

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
  const [stats, newsFeed, latestContent, upcomingEvents, quote, promotions, entityPathwayCounts] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 6),
    getLatestContent(8),
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

  // Build a visual feed: mix news + resources, every item gets a thumbnail
  const allContent = [
    ...(newsFeed || []).map(function (item: any) { return { ...item, _type: 'news' } }),
    ...(latestContent || []).map(function (item: any) { return { ...item, _type: 'resource' } }),
  ]
  // Dedupe by id, interleave types
  const seen = new Set<string>()
  const feed: any[] = []
  const news = allContent.filter(function (item) { return item._type === 'news' })
  const resources = allContent.filter(function (item) { return item._type === 'resource' })
  let ni = 0, ri = 0
  while (feed.length < 12 && (ni < news.length || ri < resources.length)) {
    // Alternate: 2 news, 1 resource
    for (let j = 0; j < 2 && ni < news.length; j++) {
      if (!seen.has(news[ni].id)) { seen.add(news[ni].id); feed.push(news[ni]) }
      ni++
    }
    if (ri < resources.length) {
      if (!seen.has(resources[ri].id)) { seen.add(resources[ri].id); feed.push(resources[ri]) }
      ri++
    }
  }

  const heroItem = feed[0]
  const gridItems = feed.slice(1, 9)

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          PROMOTIONS BANNER
         ══════════════════════════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <div style={{ background: promotions[0].color || '#1b5e8a' }}>
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
          HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <Image src="/images/hero/houston-skyline.jpg" alt="" fill className="object-cover opacity-[0.10]" priority />
        <div className="absolute inset-0 bg-black" style={{ zIndex: -1 }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-center">
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/40 mb-4">The Change Engine</p>
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}
              >
                {greeting}.
              </h1>
              <p className="text-xl text-white/80 mb-2 max-w-lg leading-relaxed font-display">
                <span className="text-white font-bold">{(stats.organizations || 0).toLocaleString()} organizations</span> are already building the Houston you want to live in.
              </p>
              <p className="text-sm text-white/50 mb-6 max-w-lg leading-relaxed">
                This is your guide to what they do, how to connect, and where you fit in.
              </p>

              <HeroSearch />

              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="text-xs font-mono text-white/30">{totalResources.toLocaleString()} resources</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30">3 languages</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30">Free forever</span>
              </div>
            </div>

            <div className="hidden md:block">
              <InteractiveFOL pathwayCounts={pathwayCounts} />
            </div>
          </div>
          <div className="md:hidden mt-6">
            <InteractiveFOL pathwayCounts={pathwayCounts} />
          </div>
        </div>

        <div className="relative z-10 flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          DISCOVERY FEED — Visual content grid, every item has a thumbnail
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} style={{ color: DIM }} />
          <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Discover what&apos;s happening</h2>
          <div className="flex-1 h-px ml-3" style={{ background: RULE }} />
          <Link href="/news" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
            See all <ArrowRight size={11} className="inline ml-0.5" />
          </Link>
        </div>

        {/* Hero feature + grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 mb-5">
          {/* Big featured item */}
          {heroItem && (
            <Link
              href={'/content/' + heroItem.id}
              className="block rounded-xl overflow-hidden transition-all hover:shadow-xl hover:translate-y-[-2px] group"
              style={{ border: `1px solid ${RULE}` }}
            >
              <div className="h-[280px] overflow-hidden relative">
                {heroItem.image_url ? (
                  <Image src={heroItem.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <FolFallback pathway={heroItem.pathway_primary} size="hero" />
                )}
                {/* Gradient overlay for text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {(() => {
                    const t = THEME_LIST.find(function (th) { return th.id === heroItem.pathway_primary })
                    return t ? (
                      <span className="inline-block px-2.5 py-1 rounded-full font-mono text-[0.55rem] uppercase tracking-[0.14em] font-bold text-white mb-2"
                        style={{ background: t.color + 'cc' }}
                      >
                        {t.name}
                      </span>
                    ) : null
                  })()}
                  <h3 className="font-display text-xl font-black text-white leading-snug mb-1">
                    {heroItem.title_6th_grade || heroItem.title}
                  </h3>
                  {heroItem.summary_6th_grade && (
                    <p className="text-sm text-white/70 line-clamp-2">{heroItem.summary_6th_grade}</p>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* Stacked items with thumbnails */}
          <div className="space-y-3">
            {gridItems.slice(0, 3).map(function (item: any) {
              const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="flex gap-3 rounded-xl overflow-hidden transition-all hover:shadow-md group"
                  style={{ border: `1px solid ${RULE}`, background: '#ffffff' }}
                >
                  <div className="w-[120px] h-[90px] flex-shrink-0 overflow-hidden relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill className="object-cover" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} height="h-full" />
                    )}
                  </div>
                  <div className="flex-1 py-2.5 pr-3 min-w-0">
                    {t && (
                      <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                    )}
                    <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                      {item.title_6th_grade || item.title}
                    </h4>
                    <span className="text-xs font-mono mt-1 block" style={{ color: DIM }}>{item.source_domain || ''}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Second row — 4-up thumbnail grid */}
        {gridItems.length > 3 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {gridItems.slice(3, 7).map(function (item: any) {
              const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="block rounded-xl overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ border: `1px solid ${RULE}`, background: '#ffffff' }}
                >
                  <div className="h-[140px] overflow-hidden relative">
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} size="hero" />
                    )}
                  </div>
                  <div className="p-3">
                    {t && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        <span className="font-mono text-[0.5rem] uppercase tracking-[0.12em] font-bold" style={{ color: t.color }}>{t.name}</span>
                      </div>
                    )}
                    <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                      {item.title_6th_grade || item.title}
                    </h4>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          THE THREADS — depth layers on dark background
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <Sparkles size={20} className="mx-auto mb-3 text-white/30" />
            <h2 className="font-display text-2xl font-black text-white mb-2">Pull on a thread</h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto">
              Behind every story is a web of people, services, and decisions. Here&apos;s how to follow the connections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: HandHeart, label: 'Services', count: stats.services || 0, href: '/services', color: '#16a34a', question: 'What help is available near me?' },
              { icon: UserCheck, label: 'Your Representatives', count: stats.officials || 0, href: '/officials', color: '#3b82f6', question: 'Who speaks for my neighborhood?' },
              { icon: Scale, label: 'Policies & Legislation', count: stats.policies || 0, href: '/policies', color: '#ef4444', question: 'What decisions are being made?' },
              { icon: Users, label: 'Ways to Participate', count: stats.opportunities || 0, href: '/opportunities', color: '#a855f7', question: 'How can I show up?' },
            ].map(function (layer) {
              const Icon = layer.icon
              return (
                <Link
                  key={layer.label}
                  href={layer.href}
                  className="p-5 rounded-xl transition-all hover:translate-y-[-3px] hover:shadow-xl group"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <Icon size={22} className="mb-3" style={{ color: layer.color }} />
                  <p className="text-white/40 text-xs italic mb-2">{layer.question}</p>
                  <h3 className="text-sm font-bold text-white mb-1">{layer.label}</h3>
                  <span className="font-display text-2xl font-black" style={{ color: layer.color }}>{layer.count.toLocaleString()}</span>
                  <span className="block text-xs text-white/30 mt-2 group-hover:text-white/50 transition-colors">
                    Explore <ArrowRight size={10} className="inline ml-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          COMING UP
         ══════════════════════════════════════════════════════════════════ */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="flex items-center gap-2 mb-5">
            <Calendar size={16} style={{ color: DIM }} />
            <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Coming Up</h2>
            <div className="flex-1 h-px ml-2" style={{ background: RULE }} />
            <Link href="/calendar" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
              Full calendar <ArrowRight size={11} className="inline ml-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {upcomingEvents.map(function (event: any) {
              const eventDate = new Date(event.date)
              const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
              const day = eventDate.getDate()
              const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
              return (
                <Link
                  key={event.id}
                  href={event.href}
                  className="p-4 rounded-xl transition-all hover:shadow-md hover:translate-y-[-2px]"
                  style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
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
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COMMUNITY VOICE
         ══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <div style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
          <div className="max-w-[700px] mx-auto px-6 py-10 text-center">
            <div className="w-8 h-8 mx-auto mb-3 flex items-center justify-center rounded-full" style={{ background: `${INK}08` }}>
              <FlowerOfLife color={INK} size={16} />
            </div>
            <blockquote className="font-display text-lg leading-relaxed italic mb-2" style={{ color: INK }}>
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
            <Link href="/about" className="text-sm font-semibold text-blue hover:underline">
              About The Change Engine <ArrowRight size={12} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
