/**
 * @fileoverview Homepage — Magazine-style editorial layout.
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
import { cookies } from 'next/headers'
import { getExchangeStats } from '@/lib/data/exchange'
import { getNewsFeed, getLatestContent } from '@/lib/data/content'
import { getRandomQuote, getActivePromotions } from '@/lib/data/homepage'
import { getUpcomingEvents } from '@/lib/data/events'
import { THEMES, MAP_CENTERS } from '@/lib/constants'
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
  title: 'The Change Engine — Your neighborhood field guide',
  description: 'Discover thousands of organizations doing incredible work in your community. Find services, get involved, and connect.',
}

const CITY_NAMES: Record<string, string> = {
  houston: 'Houston',
  'san-francisco': 'San Francisco',
  berkeley: 'Berkeley',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

function getGreeting(cityName: string): string {
  const hour = new Date().getUTCHours() - 6
  if (hour < 12) return `Good morning, ${cityName}`
  if (hour < 17) return `Good afternoon, ${cityName}`
  return `Good evening, ${cityName}`
}

export default async function ExchangeHomePage() {
  const cookieStore = await cookies()
  const citySlug = cookieStore.get('ce_city')?.value || 'houston'
  const cityName = CITY_NAMES[citySlug] || 'Houston'

  const [stats, newsFeed, latestContent, videos, upcomingEvents, quote, promotions] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 10),
    getLatestContent(8),
    getNewsFeed(undefined, 6, 'video'),
    getUpcomingEvents(5),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
  ])

  const greeting = getGreeting(cityName)

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

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          PROMOTIONS BANNER
         ══════════════════════════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <div style={{ background: promotions[0].color || ACCENT }}>
          <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone size={16} className="text-white/70 flex-shrink-0" />
              <span className="text-base font-semibold text-white truncate">{promotions[0].title}</span>
              {promotions[0].subtitle && <span className="text-base text-white/70 hidden sm:inline">— {promotions[0].subtitle}</span>}
            </div>
            {promotions[0].cta_href && (
              <Link href={promotions[0].cta_href} className="text-sm font-bold text-white/90 hover:text-white flex-shrink-0 underline underline-offset-2">
                {promotions[0].cta_text || 'Learn more'}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HERO — Houston skyline with search
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ minHeight: 420 }}>
        <Image src="/images/hero/houston-skyline.jpg" alt="City skyline" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-16 md:py-24 flex flex-col justify-end" style={{ minHeight: 420 }}>
          <p className="font-mono text-sm uppercase tracking-[0.12em] text-white/70 mb-4">The Change Engine</p>
          <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            {greeting}.
          </h1>
          <p className="text-xl text-white/95 mb-2 max-w-xl leading-relaxed">
            We got tired of doomscrolling and binge-watching while the world felt overwhelming. So we did something about it — we got involved with our community.
          </p>
          <p className="text-base text-white/80 mb-6 max-w-xl leading-relaxed">
            We built this tool to share that opportunity with you. Inside you&apos;ll find events, webinars, DIY toolkits, videos, and ways to connect with people doing real work in {cityName}. Get involved from your couch or out in the neighborhood.
          </p>

          <div className="max-w-lg">
            <HeroSearch />
          </div>

          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="text-sm font-mono text-white/60">Free forever</span>
            <span className="text-white/30">&middot;</span>
            <span className="text-sm font-mono text-white/60">EN &middot; ES &middot; VI</span>
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
                      <span className="inline-block px-3 py-1 rounded-sm font-mono text-sm uppercase tracking-[0.1em] font-bold text-white mb-3"
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
                    <p className="text-base text-white/80 line-clamp-2 max-w-lg">{heroMain.summary_6th_grade}</p>
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
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {t && (
                        <span className="inline-block px-2 py-0.5 rounded-sm font-mono text-sm uppercase tracking-[0.08em] font-bold text-white mb-1.5"
                          style={{ background: t.color }}
                        >
                          {t.name}
                        </span>
                      )}
                      <h4 className="font-display text-base font-bold text-white leading-snug line-clamp-3">
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
          QUICK LINKS — What you can find here
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { icon: HandHeart, label: 'Find Help', href: '/services' },
              { icon: UserCheck, label: 'Your Reps', href: '/officials' },
              { icon: Scale, label: 'Policy Tracker', href: '/policies' },
              { icon: Users, label: 'Get Involved', href: '/opportunities' },
              { icon: Calendar, label: 'Events', href: '/calendar' },
            ].map(function (layer) {
              const Icon = layer.icon
              return (
                <Link
                  key={layer.label}
                  href={layer.href}
                  className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                >
                  <Icon size={18} />
                  <span className="text-base font-semibold">{layer.label}</span>
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
              <h2 className="font-display text-2xl font-black" style={{ color: INK }}>Latest News</h2>
              <Link href="/news" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                See all <ArrowRight size={13} className="inline ml-0.5" />
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
                    <div className="w-[120px] h-[85px] flex-shrink-0 overflow-hidden relative rounded">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {t && (
                        <span className="font-mono text-sm uppercase tracking-wide font-bold" style={{ color: t.color }}>{t.name}</span>
                      )}
                      <h4 className="text-base font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                        {item.title_6th_grade}
                      </h4>
                      <span className="text-sm mt-1 block" style={{ color: DIM }}>{item.source_domain || ''}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right column — Featured Resources */}
          <div>
            <div className="flex items-center justify-between mb-5" style={{ borderBottom: `2px solid ${INK}`, paddingBottom: 8 }}>
              <h2 className="font-display text-2xl font-black" style={{ color: INK }}>Featured Resources</h2>
              <Link href="/resources" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                See all <ArrowRight size={13} className="inline ml-0.5" />
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
                    <div className="w-[120px] h-[85px] flex-shrink-0 overflow-hidden relative rounded">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" fill className="object-cover" />
                      ) : (
                        <FolFallback pathway={item.pathway_primary} height="h-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {t && (
                        <span className="font-mono text-sm uppercase tracking-wide font-bold" style={{ color: t.color }}>{t.name}</span>
                      )}
                      <h4 className="text-base font-bold leading-snug line-clamp-2 group-hover:underline" style={{ color: INK }}>
                        {item.title_6th_grade || item.title}
                      </h4>
                      <span className="text-sm mt-1 block" style={{ color: DIM }}>
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
          WHAT'S INSIDE — Friendly guide to the exchange
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="max-w-2xl mb-8">
            <h2 className="font-display text-3xl font-black" style={{ color: INK }}>What&apos;s Inside</h2>
            <p className="text-base mt-2" style={{ color: DIM }}>
              Think of this as a community field guide. We gather the best resources, events, and opportunities from organizations across {cityName} so you don&apos;t have to hunt for them.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Events & Webinars', desc: 'Workshops, community meetings, panels, and things happening near you — in person or online.', href: '/calendar', color: '#059669' },
              { title: 'DIY Toolkits & Guides', desc: 'Step-by-step resources you can use on your own time. Learn how things work, build skills, take action.', href: '/resources', color: '#C75B2A' },
              { title: 'Videos & Stories', desc: 'Short films, explainers, and stories from people in your community who are doing the work.', href: '/news?type=video', color: '#7c3aed' },
              { title: 'Services Near You', desc: 'Food, legal aid, counseling, housing — real help from real organizations, searchable by ZIP code.', href: '/services', color: '#0891b2' },
              { title: 'Ways to Get Involved', desc: 'Volunteer spots, advocacy campaigns, and opportunities that match the time you actually have.', href: '/opportunities', color: '#16a34a' },
              { title: 'Know Your Government', desc: 'Who represents you, what they&apos;re deciding, and how to make your voice heard — from City Hall to Congress.', href: '/action', color: '#dc2626' },
            ].map(function (card) {
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-white rounded-xl overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                  style={{ border: `1px solid ${RULE}` }}
                >
                  <div className="h-2" style={{ background: card.color }} />
                  <div className="p-5">
                    <h3 className="font-display text-lg font-black mb-1.5 group-hover:underline" style={{ color: INK }}>
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: DIM }}>
                      {card.desc}
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
            <h2 className="font-display text-2xl font-black" style={{ color: INK }}>Videos</h2>
            <Link href="/news?type=video" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
              See all <ArrowRight size={13} className="inline ml-0.5" />
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
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play size={24} fill={INK} style={{ color: INK, marginLeft: 2 }} />
                      </div>
                    </div>
                  </div>
                  {t && (
                    <span className="font-mono text-sm uppercase tracking-wide font-bold" style={{ color: t.color }}>{t.name}</span>
                  )}
                  <h4 className="text-base font-bold leading-snug line-clamp-2 group-hover:underline mt-1" style={{ color: INK }}>
                    {item.title_6th_grade}
                  </h4>
                  {item.summary_6th_grade && (
                    <p className="text-sm mt-1.5 line-clamp-2" style={{ color: DIM }}>{item.summary_6th_grade}</p>
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
              <h2 className="font-display text-2xl font-black" style={{ color: INK }}>Coming Up</h2>
              <Link href="/calendar" className="text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                Full calendar <ArrowRight size={13} className="inline ml-0.5" />
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
                      <div className="w-12 h-12 rounded-lg flex flex-col items-center justify-center" style={{ background: SIDEBAR_BG }}>
                        <span className="font-mono text-sm uppercase tracking-wider font-bold" style={{ color: DIM }}>{month}</span>
                        <span className="font-display text-lg font-black leading-none" style={{ color: INK }}>{day}</span>
                      </div>
                      <span className="text-sm font-mono" style={{ color: DIM }}>{weekday}</span>
                    </div>
                    <h4 className="text-base font-bold leading-snug line-clamp-2" style={{ color: INK }}>{event.title}</h4>
                    {event.location && (
                      <div className="flex items-center gap-1 text-sm mt-1.5" style={{ color: DIM }}>
                        <MapPin size={12} />
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
            <p className="font-mono text-sm uppercase tracking-[0.2em] mb-4" style={{ color: DIM }}>Quote of the Day</p>
            <blockquote className="font-display text-2xl md:text-3xl leading-relaxed italic mb-3" style={{ color: INK }}>
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            {quote.attribution && (
              <p className="text-base" style={{ color: DIM }}>— {quote.attribution}</p>
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER CODA ── */}
      <div style={{ background: '#ffffff', borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap text-sm font-mono" style={{ color: DIM }}>
              <span>EN &middot; ES &middot; VI</span>
              <span style={{ color: RULE }}>&middot;</span>
              <span>No ads</span>
              <span style={{ color: RULE }}>&middot;</span>
              <span>Free forever</span>
            </div>
            <Link href="/about" className="text-base font-semibold hover:underline" style={{ color: ACCENT }}>
              About The Change Engine <ArrowRight size={14} className="inline ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
