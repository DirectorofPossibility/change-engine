'use client'

/**
 * @fileoverview Community Guide -- the civic & social concierge.
 *
 * Editorial design system: Fraunces (display), Libre Baskerville (body),
 * DM Mono (labels/meta). No border-radius, no box-shadows, no emojis.
 * Geo SVGs from sacred geometry library for visual marks.
 *
 * Sections:
 *   1. Masthead (dark gradient, stats, search + ZIP)
 *   2. Featured Promotion (GAP 1)
 *   3. Quote (GAP 2)
 *   4. Pathway Grid (7 pathways)
 *   5. News Wire (one-line feed) + Upcoming Events
 *   6. Always Available (crisis lines)
 */

import Link from 'next/link'
import { HeroZipInput } from './HeroZipInput'
import { HeroSearchInput } from './HeroSearchInput'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { SeedOfLife, FlowerOfLife } from '@/components/geo/sacred'
import { ArrowRight, Calendar } from 'lucide-react'

// ── Colors ──────────────────────────────────────────────────────────────

const INK = '#0d1117'
const PAPER = '#f4f5f7'
const DIM = '#5c6474'
const RULE = '#dde1e8'
const BLUE = '#1b5e8a'
const TEAL = '#7ec8e3'

// ── Types ───────────────────────────────────────────────────────────────

interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: string | null
  location: string | null
  href: string
}

interface CommunityGuideProps {
  stats: {
    resources: number
    services: number
    officials: number
    policies: number
    organizations: number
  }
  latestContent: Array<Record<string, unknown>>
  quote?: {
    quote_text: string
    attribution?: string
    source_url?: string
  } | null
  promotions?: Array<{
    promo_id: string
    title: string
    subtitle?: string
    description?: string
    cta_text?: string
    cta_href?: string
    color?: string
  }>
  upcomingEvents?: UpcomingEvent[]
}

// ── Pathway geo marks ───────────────────────────────────────────────────

const PATHWAY_GEOS: Record<string, React.ComponentType<{ color?: string; size?: number; opacity?: number; animated?: boolean; className?: string }>> = {
  THEME_01: SeedOfLife,
  THEME_02: SeedOfLife,
  THEME_03: SeedOfLife,
  THEME_04: SeedOfLife,
  THEME_05: SeedOfLife,
  THEME_06: SeedOfLife,
  THEME_07: FlowerOfLife,
}

// ── Component ───────────────────────────────────────────────────────────

export function CommunityGuide({ stats, latestContent, quote, promotions, upcomingEvents }: CommunityGuideProps) {
  const { t } = useTranslation()

  const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, slug: theme.slug }
  })

  const statItems = [
    { value: stats.services, label: t('guide.stat_services') },
    { value: stats.officials, label: t('guide.stat_officials') },
    { value: stats.organizations, label: t('guide.stat_organizations') },
    { value: stats.policies, label: t('guide.stat_policies') || 'policies tracked' },
  ]

  return (
    <div className="relative">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO BAR -- tagline strip below nav, above masthead
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="w-full text-center px-6 py-6 sm:py-8"
        style={{ backgroundColor: '#EDEAE3', borderBottom: '1px solid #d9d4cb' }}
      >
        <p
          className="font-display font-bold leading-snug tracking-tight mb-1"
          style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', color: '#2C2C2C' }}
        >
          Your Houston. Every neighborhood. Every language.
        </p>
        <p
          className="font-body max-w-2xl mx-auto leading-relaxed"
          style={{ fontSize: 'clamp(0.85rem, 1.2vw, 1rem)', color: '#5c5548' }}
        >
          The Change Engine connects residents to resources, news, and civic life — organized by the things that matter most to you.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 -- MASTHEAD
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(170deg, ${INK} 0%, ${BLUE} 100%)` }}
      >
        {/* Geo background element */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <SeedOfLife
            color="#ffffff"
            size={500}
            opacity={0.1}
            animated
          />
        </div>

        <div className="relative z-10 max-w-[820px] mx-auto px-6 py-20 lg:py-28 text-center">
          {/* Dateline */}
          <p
            className="font-mono text-[0.6rem] uppercase tracking-[0.08em] mb-5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            Houston, Texas &middot; {t('guide.masthead')} &middot; {t('guide.volume')}
          </p>

          {/* H1 */}
          <h1
            className="font-display leading-[1.08] tracking-tight mb-6"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
              fontWeight: 900,
              color: '#ffffff',
            }}
          >
            {t('guide.title')}
          </h1>

          {/* Rule */}
          <div
            className="mx-auto mb-6"
            style={{ width: 50, height: 2, background: 'rgba(255,255,255,0.3)' }}
          />

          {/* Deck */}
          <p
            className="font-body italic text-lg leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {t('guide.subtitle')}
          </p>

          {/* Search + ZIP */}
          <div className="max-w-md mx-auto space-y-3 mb-12">
            <HeroSearchInput />
            <HeroZipInput />
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {statItems.map(function (stat, i) {
              return (
                <div
                  key={i}
                  className="px-5 py-3"
                  style={{ border: '1.5px solid rgba(255,255,255,0.15)' }}
                >
                  <span
                    className="font-display block leading-none mb-1"
                    style={{ fontSize: '2rem', fontWeight: 900, color: TEAL }}
                  >
                    {stat.value.toLocaleString()}
                  </span>
                  <span
                    className="font-mono block uppercase tracking-[0.08em]"
                    style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)' }}
                  >
                    {stat.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 -- FEATURED PROMOTION (GAP 1)
         ═══════════════════════════════════════════════════════════════════ */}
      {promotions && promotions.length > 0 && (
        <section
          style={{
            borderTop: `2px solid ${INK}`,
            borderBottom: `2px solid ${INK}`,
          }}
        >
          <div className="max-w-[1100px] mx-auto px-6 py-8">
            {promotions.slice(0, 1).map(function (promo) {
              return (
                <div
                  key={promo.promo_id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h2
                      className="font-display mb-1"
                      style={{ fontSize: '1.4rem', fontWeight: 700, color: INK }}
                    >
                      {promo.title}
                    </h2>
                    {promo.subtitle && (
                      <p className="font-body" style={{ fontSize: '0.95rem', color: DIM }}>
                        {promo.subtitle}
                      </p>
                    )}
                  </div>
                  {promo.cta_href && (
                    <Link
                      href={promo.cta_href}
                      className="font-mono uppercase tracking-[0.08em] inline-flex items-center gap-2 flex-shrink-0"
                      style={{ fontSize: '0.7rem', color: BLUE, fontWeight: 600 }}
                    >
                      {promo.cta_text || t('detail.learn_more')} <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 -- QUOTE (GAP 2)
         ═══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <section className="max-w-[820px] mx-auto px-6 py-12">
          <blockquote
            className="font-body italic leading-relaxed"
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
              color: DIM,
              borderLeft: `3px solid ${BLUE}`,
              paddingLeft: '1.25rem',
            }}
          >
            {quote.quote_text}
          </blockquote>
          {quote.attribution && (
            <p
              className="font-mono uppercase tracking-[0.08em] mt-3"
              style={{ fontSize: '0.62rem', color: DIM, paddingLeft: '1.25rem' }}
            >
              -- {quote.attribution}
            </p>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3B -- ENGAGEMENT LADDER (4 Centers)
         ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1.5px solid ${RULE}` }}>
        <div className="max-w-[1100px] mx-auto px-6 py-14">
          <p
            className="font-mono uppercase tracking-[0.08em] mb-3"
            style={{ fontSize: '0.62rem', color: DIM }}
          >
            How do you want to engage?
          </p>
          <h2
            className="font-display mb-10"
            style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', fontWeight: 900, color: INK }}
          >
            Four ways in
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {([
              { name: 'Learning', slug: 'learning', question: 'How can I understand?', color: '#4a2870' },
              { name: 'Action', slug: 'action', question: 'How can I help?', color: '#7a2018' },
              { name: 'Resource', slug: 'resources', question: "What's available to me?", color: '#6a4e10' },
              { name: 'Accountability', slug: 'accountability', question: 'Who makes decisions?', color: '#1a3460' },
            ]).map(function (center) {
              return (
                <Link
                  key={center.name}
                  href={'/centers/' + center.slug}
                  className="group flex flex-col p-6 transition-colors hover:bg-white"
                  style={{
                    border: `1px solid ${RULE}`,
                    borderTop: `3px solid ${center.color}`,
                  }}
                >
                  <p
                    className="font-display mb-2"
                    style={{ fontSize: '1.15rem', fontWeight: 700, color: INK }}
                  >
                    {center.name}
                  </p>
                  <p
                    className="font-body italic text-sm mb-4"
                    style={{ color: DIM }}
                  >
                    {center.question}
                  </p>
                  <span
                    className="font-mono uppercase tracking-[0.08em] mt-auto inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ fontSize: '0.6rem', color: center.color, fontWeight: 600 }}
                  >
                    {t('guide.explore')} <ArrowRight size={12} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 -- PATHWAY GRID
         ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1.5px solid ${RULE}` }}>
        <div className="max-w-[1100px] mx-auto px-6 py-14 lg:py-18">
          {/* Section header */}
          <p
            className="font-mono uppercase tracking-[0.08em] mb-3"
            style={{ fontSize: '0.62rem', color: DIM }}
          >
            {t('guide.pathways_label')}
          </p>
          <h2
            className="font-display mb-10"
            style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: INK }}
          >
            {t('guide.pathways_heading')}
          </h2>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
            {PATHWAY_LIST.map(function (pw) {
              const GeoMark = PATHWAY_GEOS[pw.id] || SeedOfLife
              return (
                <Link
                  key={pw.id}
                  href={'/pathways/' + pw.slug}
                  className="group relative flex flex-col items-start p-6 transition-colors"
                  style={{
                    border: `1px solid ${RULE}`,
                    borderTop: `3px solid ${pw.color}`,
                  }}
                >
                  <div className="mb-4">
                    <GeoMark color={pw.color} size={36} opacity={0.7} />
                  </div>
                  <h3
                    className="font-display mb-3"
                    style={{ fontSize: '1.15rem', fontWeight: 700, color: INK }}
                  >
                    {pw.name}
                  </h3>
                  <span
                    className="font-mono uppercase tracking-[0.08em] mt-auto inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ fontSize: '0.6rem', color: pw.color, fontWeight: 600 }}
                  >
                    {t('guide.explore')} <ArrowRight size={12} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 -- THE WIRE + UPCOMING EVENTS (one-line feeds)
         ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1.5px solid ${RULE}`, background: PAPER }}>
        <div className="max-w-[1100px] mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* News wire — compact one-line feed */}
            <div style={{ borderRight: `1px solid ${RULE}` }} className="pr-0 lg:pr-8">
              <div className="flex items-center justify-between mb-4">
                <p
                  className="font-mono uppercase tracking-[0.08em]"
                  style={{ fontSize: '0.62rem', color: DIM }}
                >
                  {t('guide.latest_label')}
                </p>
                <Link
                  href="/news"
                  className="font-mono uppercase tracking-[0.08em] inline-flex items-center gap-1"
                  style={{ fontSize: '0.56rem', color: BLUE, fontWeight: 600 }}
                >
                  {t('guide.all_news')} <ArrowRight size={10} />
                </Link>
              </div>

              <div className="space-y-0">
                {latestContent.slice(0, 6).map(function (item: any) {
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="group flex items-baseline gap-3 py-2.5 transition-colors hover:bg-white px-2 -mx-2"
                      style={{ borderBottom: `1px solid ${RULE}` }}
                    >
                      <span
                        className="font-mono uppercase tracking-[0.08em] flex-shrink-0"
                        style={{ fontSize: '0.5rem', color: DIM, minWidth: '3rem' }}
                      >
                        {item.published_at
                          ? new Date(item.published_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                      <span
                        className="font-body text-sm line-clamp-1 group-hover:underline"
                        style={{ color: INK }}
                      >
                        {item.title_6th_grade as string}
                      </span>
                      {item.source_url && (
                        <span
                          className="font-mono uppercase tracking-[0.08em] flex-shrink-0 hidden sm:inline"
                          style={{ fontSize: '0.48rem', color: BLUE }}
                        >
                          source
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Upcoming events — compact one-line feed */}
            <div className="pl-0 lg:pl-8 mt-8 lg:mt-0">
              <div className="flex items-center justify-between mb-4">
                <p
                  className="font-mono uppercase tracking-[0.08em]"
                  style={{ fontSize: '0.62rem', color: DIM }}
                >
                  Coming Up
                </p>
                <Link
                  href="/calendar"
                  className="font-mono uppercase tracking-[0.08em] inline-flex items-center gap-1"
                  style={{ fontSize: '0.56rem', color: BLUE, fontWeight: 600 }}
                >
                  Full Calendar <ArrowRight size={10} />
                </Link>
              </div>

              {upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-0">
                  {upcomingEvents.map(function (event) {
                    const eventDate = new Date(event.date)
                    return (
                      <Link
                        key={event.id}
                        href={event.href}
                        className="group flex items-baseline gap-3 py-2.5 transition-colors hover:bg-white px-2 -mx-2"
                        style={{ borderBottom: `1px solid ${RULE}` }}
                      >
                        <span
                          className="font-mono uppercase tracking-[0.08em] flex-shrink-0"
                          style={{ fontSize: '0.5rem', color: DIM, minWidth: '3rem' }}
                        >
                          {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span
                          className="font-body text-sm line-clamp-1 group-hover:underline"
                          style={{ color: INK }}
                        >
                          {event.title}
                        </span>
                        {event.location && (
                          <span
                            className="font-mono uppercase tracking-[0.08em] flex-shrink-0 hidden sm:inline"
                            style={{ fontSize: '0.48rem', color: DIM }}
                          >
                            {event.location}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="font-body text-sm italic" style={{ color: DIM }}>
                  No upcoming events right now. Check the <Link href="/calendar" className="underline" style={{ color: BLUE }}>calendar</Link> for past events and civic deadlines.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 -- ALWAYS AVAILABLE (crisis lines)
         ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: `1.5px solid ${RULE}`, background: PAPER }}>
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <p
            className="font-mono uppercase tracking-[0.08em] mb-3 text-center"
            style={{ fontSize: '0.62rem', color: DIM }}
          >
            {t('guide.always_available')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0">
            {[
              { number: '988', label: t('guide.line_988'), desc: t('guide.line_988_desc') },
              { number: '311', label: t('guide.line_311'), desc: t('guide.line_311_desc') },
              { number: '211', label: t('guide.line_211'), desc: t('guide.line_211_desc') },
              { number: '1-800-799-7233', label: t('guide.dv_hotline'), desc: t('guide.dv_hotline_desc') },
            ].map(function (line) {
              return (
                <a
                  key={line.number}
                  href={'tel:' + line.number}
                  className="flex flex-col items-center p-5 transition-colors hover:bg-white"
                  style={{ border: `1px solid ${RULE}` }}
                >
                  <span
                    className="font-display block mb-2"
                    style={{ fontSize: '1.6rem', fontWeight: 900, color: INK }}
                  >
                    {line.number}
                  </span>
                  <span
                    className="font-mono uppercase tracking-[0.08em] text-center"
                    style={{ fontSize: '0.52rem', color: DIM }}
                  >
                    {line.label}
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
