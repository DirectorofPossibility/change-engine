/**
 * @fileoverview Homepage — Organization-Centric Community Guide.
 *
 * 5,000+ Houston organizations as the backbone, organized by 7 pathways.
 * Services, legislation, officials, and opportunities braided in as depth layers.
 * Houston photo hero, daily quote, FOL navigation, live content.
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
import { ArrowRight, Calendar, MapPin, Megaphone, HandHeart, BookOpen, Users, Building2, Scale, UserCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
const CENTER_LIST = Object.values(THREE_CENTERS)

const CENTER_META: Record<string, { name: string; tagline: string; icon: typeof BookOpen }> = {
  learning: { name: 'Stay Informed', tagline: 'News, stories & context', icon: BookOpen },
  action: { name: 'Get Involved', tagline: 'Volunteer, vote & show up', icon: Megaphone },
  resources: { name: 'Find Help', tagline: 'Services, orgs & support', icon: HandHeart },
}

function getGreeting(): string {
  const hour = new Date().getUTCHours() - 6
  if (hour < 12) return 'Good morning, Houston'
  if (hour < 17) return 'Good afternoon, Houston'
  return 'Good evening, Houston'
}

export default async function ExchangeHomePage() {
  const supabase = await createClient()

  const [stats, newsFeed, upcomingEvents, quote, promotions, entityPathwayCounts, orgsByPathway] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 5),
    getUpcomingEvents(4),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
    getEntityPathwayCounts(),
    // Featured orgs: 2 per pathway (14 total)
    Promise.all(THEME_LIST.map(async function (t) {
      const { data } = await supabase
        .from('organizations')
        .select('org_id, org_name, description_5th_grade, logo_url, website, theme_id')
        .eq('theme_id', t.id)
        .not('description_5th_grade', 'is', null)
        .order('org_name')
        .limit(3)
      return { themeId: t.id, themeName: t.name, themeColor: t.color, themeSlug: t.slug, orgs: data || [] }
    })),
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

  // Filter to pathways that have orgs
  const pathwaysWithOrgs = orgsByPathway.filter(function (p) { return p.orgs.length > 0 })

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          PROMOTIONS BANNER
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
          HERO — Houston photo background + greeting + FOL
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Houston background image */}
        <Image
          src="/images/hero/houston-skyline.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        {/* Texture layers */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-center">
            {/* Left — copy + search */}
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/40 mb-4">
                The Change Engine
              </p>
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-3"
                style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}
              >
                {greeting}.
              </h1>

              <p className="text-lg text-white/70 mb-2 max-w-lg leading-relaxed">
                Your neighbor&apos;s guide to <span className="text-white font-semibold">{(stats.organizations || 0).toLocaleString()}+ organizations</span> doing incredible work across Houston.
              </p>
              <p className="text-sm text-white/50 mb-6 max-w-lg">
                Explore by pathway, find services, see who represents you, and discover ways to connect.
              </p>

              {/* Daily quote */}
              {quote && (
                <blockquote className="text-white/50 leading-relaxed mb-6 max-w-lg italic text-sm border-l-2 border-white/20 pl-4">
                  &ldquo;{quote.quote_text.length > 120 ? quote.quote_text.slice(0, 120) + '...' : quote.quote_text}&rdquo;
                  {quote.attribution && (
                    <span className="text-white/30 not-italic ml-1">— {quote.attribution}</span>
                  )}
                </blockquote>
              )}

              <HeroSearch />

              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <span className="text-xs font-mono text-white/30 tracking-wide">{totalResources.toLocaleString()} resources</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30 tracking-wide">7 pathways</span>
                <span className="text-white/15">&middot;</span>
                <span className="text-xs font-mono text-white/30 tracking-wide">Updated daily</span>
              </div>
            </div>

            {/* Right — FOL (50% bigger, no labels) */}
            <div className="hidden md:block">
              <InteractiveFOL pathwayCounts={pathwayCounts} />
            </div>
          </div>

          <div className="md:hidden mt-6">
            <InteractiveFOL pathwayCounts={pathwayCounts} />
          </div>
        </div>

        {/* Pathway spectrum bar */}
        <div className="relative z-10 flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: t.color }} />
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ORGANIZATIONS BY PATHWAY — The backbone of the site
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} style={{ color: DIM }} />
          <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Organizations by Pathway</h2>
        </div>
        <p className="text-sm mb-8" style={{ color: DIM }}>
          {(stats.organizations || 0).toLocaleString()} organizations aligned across seven community pathways.
          <Link href="/organizations" className="text-blue font-semibold ml-1 hover:underline">Browse all &rsaquo;</Link>
        </p>

        <div className="space-y-6">
          {pathwaysWithOrgs.map(function (pw) {
            const count = pathwayCounts[pw.themeId] || 0
            return (
              <div key={pw.themeId} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${RULE}` }}>
                {/* Pathway header */}
                <div className="flex items-center gap-3 px-5 py-3" style={{ background: pw.themeColor + '08', borderBottom: `1px solid ${RULE}` }}>
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: pw.themeColor }} />
                  <Link href={'/pathways/' + pw.themeSlug} className="font-display text-base font-bold hover:underline" style={{ color: INK }}>
                    {pw.themeName}
                  </Link>
                  {count > 0 && <span className="text-xs font-mono" style={{ color: DIM }}>{count} resources</span>}
                  <div className="flex-1" />
                  <Link href={'/pathways/' + pw.themeSlug} className="text-xs font-mono font-semibold hover:underline" style={{ color: pw.themeColor }}>
                    Explore pathway <ArrowRight size={10} className="inline ml-0.5" />
                  </Link>
                </div>

                {/* Org cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3" style={{ borderTop: `1px solid ${RULE}` }}>
                  {pw.orgs.map(function (org: any) {
                    return (
                      <Link
                        key={org.org_id}
                        href={'/organizations/' + org.org_id}
                        className="flex items-start gap-3 p-4 hover:bg-white/80 transition-colors group"
                        style={{ borderRight: `1px solid ${RULE}` }}
                      >
                        {org.logo_url ? (
                          <Image src={org.logo_url} alt="" width={36} height={36} className="w-9 h-9 rounded-lg object-contain flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: pw.themeColor + '15' }}>
                            <Building2 size={16} style={{ color: pw.themeColor }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold leading-snug line-clamp-1 group-hover:text-blue transition-colors" style={{ color: INK }}>
                            {org.org_name}
                          </h4>
                          {org.description_5th_grade && (
                            <p className="text-xs line-clamp-2 mt-0.5 leading-relaxed" style={{ color: DIM }}>
                              {org.description_5th_grade}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DEPTH LAYERS — Services, Officials, Policies, Opportunities
         ══════════════════════════════════════════════════════════════════ */}
      <div style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-10">
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Go Deeper</h2>
          <p className="text-sm mb-6" style={{ color: DIM }}>Beyond organizations — the systems, services, and people that shape Houston.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: HandHeart, label: 'Services', count: stats.services || 0, href: '/services', color: '#16a34a', desc: 'Free programs & community resources' },
              { icon: UserCheck, label: 'Officials', count: stats.officials || 0, href: '/officials', color: '#1b5e8a', desc: 'Who represents you at every level' },
              { icon: Scale, label: 'Policies', count: stats.policies || 0, href: '/policies', color: '#7a2018', desc: 'Legislation that affects your community' },
              { icon: Users, label: 'Opportunities', count: stats.opportunities || 0, href: '/opportunities', color: '#4a2870', desc: 'Volunteer, attend & participate' },
            ].map(function (layer) {
              const Icon = layer.icon
              return (
                <Link
                  key={layer.label}
                  href={layer.href}
                  className="p-5 rounded-xl transition-all hover:shadow-md hover:translate-y-[-2px] group"
                  style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                >
                  <div className="w-10 h-10 mb-3 rounded-lg flex items-center justify-center" style={{ background: layer.color + '12' }}>
                    <Icon size={20} style={{ color: layer.color }} />
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-sm font-bold" style={{ color: INK }}>{layer.label}</h3>
                    <span className="font-display text-lg font-bold" style={{ color: layer.color }}>{layer.count.toLocaleString()}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: DIM }}>{layer.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: layer.color }}>
                    Explore <ArrowRight size={10} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          WHAT'S HAPPENING + COMING UP — Two-column
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8">

          {/* LEFT — News */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <BookOpen size={16} style={{ color: DIM }} />
              <h2 className="font-display text-xl font-bold" style={{ color: INK }}>What&apos;s Happening</h2>
              <div className="flex-1 h-px ml-2" style={{ background: RULE }} />
              <Link href="/news" className="text-xs font-mono font-semibold text-blue hover:underline tracking-wide">
                All news <ArrowRight size={11} className="inline ml-0.5" />
              </Link>
            </div>

            {featuredNews && (
              <Link
                href={'/content/' + featuredNews.id}
                className="block overflow-hidden rounded-xl transition-all hover:shadow-lg hover:translate-y-[-2px] mb-4"
                style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
              >
                {featuredNews.image_url ? (
                  <div className="h-[180px] overflow-hidden rounded-t-xl">
                    <Image src={featuredNews.image_url} alt="" className="w-full h-full object-cover" width={800} height={400} />
                  </div>
                ) : (
                  <FolFallback pathway={featuredNews.pathway_primary} size="hero" />
                )}
                <div className="p-4">
                  {(() => {
                    const t = THEME_LIST.find(function (th) { return th.id === featuredNews.pathway_primary })
                    return t ? (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] font-bold" style={{ color: t.color }}>{t.name}</span>
                      </div>
                    ) : null
                  })()}
                  <h3 className="font-display text-base font-bold leading-snug mb-1" style={{ color: INK }}>
                    {featuredNews.title_6th_grade}
                  </h3>
                  {featuredNews.summary_6th_grade && (
                    <p className="text-sm line-clamp-2" style={{ color: DIM }}>{featuredNews.summary_6th_grade}</p>
                  )}
                </div>
              </Link>
            )}

            <div className="space-y-1">
              {moreNews.map(function (item: any) {
                const t = THEME_LIST.find(function (th) { return th.id === item.pathway_primary })
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-white"
                  >
                    <span className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: t?.color || DIM }} />
                    <span className="text-sm font-semibold leading-snug line-clamp-2" style={{ color: INK }}>
                      {item.title_6th_grade}
                    </span>
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
                Calendar <ArrowRight size={11} className="inline ml-0.5" />
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
                    className="flex gap-3 p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center" style={{ background: SIDEBAR_BG }}>
                      <span className="font-mono text-[0.55rem] uppercase tracking-wider font-bold" style={{ color: DIM }}>{month}</span>
                      <span className="font-display text-lg font-black leading-none" style={{ color: INK }}>{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: INK }}>{event.title}</h4>
                      {event.location && (
                        <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: DIM }}>
                          <MapPin size={9} />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                )
              }) : (
                <div className="text-center py-8 rounded-xl" style={{ background: '#ffffff', border: `1px solid ${RULE}` }}>
                  <Calendar size={24} className="mx-auto mb-2" style={{ color: RULE }} />
                  <p className="text-sm" style={{ color: DIM }}>Check the <Link href="/calendar" className="text-blue font-semibold hover:underline">full calendar</Link></p>
                </div>
              )}
            </div>

            {/* Three Centers — compact version */}
            <div className="mt-6 space-y-2">
              {CENTER_LIST.map(function (c) {
                const count = centerCounts[c.slug] || 0
                const meta = CENTER_META[c.slug]
                const Icon = meta?.icon || BookOpen
                return (
                  <Link
                    key={c.slug}
                    href={c.href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md group"
                    style={{ background: '#ffffff', border: `1px solid ${RULE}` }}
                  >
                    <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: c.color + '12' }}>
                      <Icon size={18} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold block" style={{ color: INK }}>{meta?.name || c.name}</span>
                      <span className="text-xs" style={{ color: DIM }}>{meta?.tagline}</span>
                    </div>
                    {count > 0 && <span className="text-xs font-mono" style={{ color: DIM }}>{count.toLocaleString()}</span>}
                    <ArrowRight size={14} style={{ color: RULE }} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

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
