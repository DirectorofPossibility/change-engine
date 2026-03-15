/**
 * @fileoverview Homepage — A living guide to Houston's organizations.
 *
 * 5,000+ organizations as the backbone, each pathway a magazine section
 * mixing orgs, content, and opportunities. Asset-based framing throughout.
 * Houston photo hero, daily quote, FOL navigation.
 *
 * @route GET /
 * @caching ISR with revalidate = 3600
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getExchangeStats } from '@/lib/data/exchange'
import { getRandomQuote, getActivePromotions } from '@/lib/data/homepage'
import { getUpcomingEvents } from '@/lib/data/events'
import { getPathwayCounts as getEntityPathwayCounts } from '@/lib/data/entity-graph'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { InteractiveFOL } from '@/components/exchange/home/InteractiveFOL'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'
import { ArrowRight, Calendar, MapPin, Megaphone, Building2, HandHeart, Scale, UserCheck, Users, Sparkles } from 'lucide-react'
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

function getGreeting(): string {
  const hour = new Date().getUTCHours() - 6
  if (hour < 12) return 'Good morning, Houston'
  if (hour < 17) return 'Good afternoon, Houston'
  return 'Good evening, Houston'
}

export default async function ExchangeHomePage() {
  const supabase = await createClient()

  // Fetch pathway data: orgs, content, and opportunities mixed together
  const pathwayDataPromise = Promise.all(THEME_LIST.map(async function (t) {
    const [orgsResult, contentResult, oppsResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('org_id, org_name, description_5th_grade, logo_url, website, theme_id')
        .eq('theme_id', t.id)
        .not('description_5th_grade', 'is', null)
        .limit(4),
      supabase
        .from('content_published')
        .select('id, title_6th_grade, summary_6th_grade, image_url, pathway_primary, source_domain, published_at')
        .eq('is_active', true)
        .eq('pathway_primary', t.id)
        .order('published_at', { ascending: false })
        .limit(2),
      supabase
        .from('opportunities')
        .select('opportunity_id, opportunity_name, description_5th_grade, is_virtual, website, org_id')
        .eq('is_active', 'Yes')
        .limit(2),
    ])
    return {
      themeId: t.id,
      themeName: t.name,
      themeColor: t.color,
      themeSlug: t.slug,
      themeDescription: t.description,
      orgs: orgsResult.data || [],
      content: contentResult.data || [],
      opportunities: oppsResult.data || [],
    }
  }))

  const [stats, upcomingEvents, quote, promotions, entityPathwayCounts, pathwayData] = await Promise.all([
    getExchangeStats(),
    getUpcomingEvents(5),
    getRandomQuote(),
    getActivePromotions(undefined, 3),
    getEntityPathwayCounts(),
    pathwayDataPromise,
  ])

  const pathwayCounts: Record<string, number> = {}
  for (const [id, counts] of Object.entries(entityPathwayCounts)) {
    pathwayCounts[id] = counts.total
  }

  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)
  const greeting = getGreeting()

  // Only show pathways with content
  const livePathways = pathwayData.filter(function (p) { return p.orgs.length > 0 })

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
          HERO — Houston photo, greeting, org count, FOL
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <Image src="/images/hero/houston-skyline.jpg" alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
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
                <span className="text-xs font-mono text-white/30">7 pathways</span>
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
          PATHWAY MAGAZINE SECTIONS — The heart of the page
          Each pathway is a mini editorial section mixing orgs + content
         ══════════════════════════════════════════════════════════════════ */}
      {livePathways.map(function (pw, i) {
        const count = pathwayCounts[pw.themeId] || 0
        const isEven = i % 2 === 0
        const featuredOrg = pw.orgs[0]
        const moreOrgs = pw.orgs.slice(1)
        const featuredContent = pw.content[0]

        return (
          <section key={pw.themeId} style={{ background: isEven ? '#ffffff' : SIDEBAR_BG, borderBottom: `1px solid ${RULE}` }}>
            <div className="max-w-[1200px] mx-auto px-6 py-10">

              {/* Pathway header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-1" style={{ background: pw.themeColor + '15' }}>
                  <div className="w-4 h-4 rounded-sm" style={{ background: pw.themeColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <Link href={'/pathways/' + pw.themeSlug}>
                      <h2 className="font-display text-2xl font-black hover:underline" style={{ color: pw.themeColor }}>{pw.themeName}</h2>
                    </Link>
                    {count > 0 && <span className="text-xs font-mono" style={{ color: DIM }}>{count} resources</span>}
                  </div>
                  <p className="text-sm leading-relaxed mt-1 max-w-2xl" style={{ color: DIM }}>
                    {pw.themeDescription.split('.')[0]}.
                  </p>
                </div>
                <Link href={'/pathways/' + pw.themeSlug} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold flex-shrink-0 hover:underline mt-2" style={{ color: pw.themeColor }}>
                  Explore <ArrowRight size={14} />
                </Link>
              </div>

              {/* Mixed content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">

                {/* LEFT — Featured org with rich card */}
                <div className="space-y-4">
                  {featuredOrg && (
                    <Link
                      href={'/organizations/' + featuredOrg.org_id}
                      className="block rounded-xl overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-2px] group"
                      style={{ border: `1px solid ${RULE}`, background: isEven ? SIDEBAR_BG : '#ffffff' }}
                    >
                      {/* Gradient accent bar */}
                      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${pw.themeColor}, ${pw.themeColor}66)` }} />
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {featuredOrg.logo_url ? (
                            <Image src={featuredOrg.logo_url} alt="" width={56} height={56} className="w-14 h-14 rounded-xl object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: pw.themeColor + '12' }}>
                              <Building2 size={24} style={{ color: pw.themeColor }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] font-bold" style={{ color: pw.themeColor }}>Featured organization</span>
                            <h3 className="font-display text-lg font-bold leading-snug mt-1 group-hover:underline" style={{ color: INK }}>
                              {featuredOrg.org_name}
                            </h3>
                            {featuredOrg.description_5th_grade && (
                              <p className="text-sm leading-relaxed mt-2 line-clamp-3" style={{ color: DIM }}>
                                {featuredOrg.description_5th_grade}
                              </p>
                            )}
                            <span className="inline-flex items-center gap-1 text-sm font-semibold mt-3" style={{ color: pw.themeColor }}>
                              Learn about their work <ArrowRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Content from this pathway */}
                  {featuredContent && (
                    <Link
                      href={'/content/' + featuredContent.id}
                      className="flex gap-4 p-4 rounded-xl transition-all hover:shadow-md group"
                      style={{ border: `1px solid ${RULE}`, background: isEven ? SIDEBAR_BG : '#ffffff' }}
                    >
                      {featuredContent.image_url ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={featuredContent.image_url} alt="" width={160} height={160} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <FolFallback pathway={pw.themeId} height="h-full" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em]" style={{ color: DIM }}>Latest from {pw.themeName}</span>
                        <h4 className="text-sm font-bold leading-snug mt-0.5 line-clamp-2 group-hover:underline" style={{ color: INK }}>
                          {featuredContent.title_6th_grade}
                        </h4>
                        {featuredContent.summary_6th_grade && (
                          <p className="text-xs line-clamp-2 mt-1" style={{ color: DIM }}>{featuredContent.summary_6th_grade}</p>
                        )}
                      </div>
                    </Link>
                  )}
                </div>

                {/* RIGHT — More orgs + quick links */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[0.6rem] uppercase tracking-[0.14em] font-bold" style={{ color: DIM }}>More in {pw.themeName}</h4>
                  {moreOrgs.map(function (org: any) {
                    return (
                      <Link
                        key={org.org_id}
                        href={'/organizations/' + org.org_id}
                        className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:shadow-sm group"
                        style={{ background: isEven ? SIDEBAR_BG : '#ffffff', border: `1px solid ${RULE}` }}
                      >
                        {org.logo_url ? (
                          <Image src={org.logo_url} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: pw.themeColor + '10' }}>
                            <Building2 size={14} style={{ color: pw.themeColor }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold block leading-snug line-clamp-1 group-hover:underline" style={{ color: INK }}>
                            {org.org_name}
                          </span>
                          {org.description_5th_grade && (
                            <span className="text-xs line-clamp-1" style={{ color: DIM }}>{org.description_5th_grade}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}

                  {/* Pathway CTA */}
                  <Link
                    href={'/pathways/' + pw.themeSlug}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all hover:shadow-md"
                    style={{ background: pw.themeColor + '08', color: pw.themeColor, border: `1px solid ${pw.themeColor}25` }}
                  >
                    See all {pw.themeName} resources <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* ══════════════════════════════════════════════════════════════════
          THE THREADS THAT CONNECT — depth layers as braided context
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <Sparkles size={20} className="mx-auto mb-3 text-white/30" />
            <h2 className="font-display text-2xl font-black text-white mb-2">The threads that connect it all</h2>
            <p className="text-sm text-white/50 max-w-lg mx-auto">
              Behind every organization is a web of services, decisions, and people working to make Houston stronger. Here&apos;s how to pull on the threads.
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
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-sm font-bold text-white">{layer.label}</h3>
                  </div>
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
          COMING UP — what's happening next
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
          COMMUNITY VOICE — daily quote
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
