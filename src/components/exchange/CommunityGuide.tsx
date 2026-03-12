'use client'

/**
 * @fileoverview Community Exchange — culture guide to Houston civic life.
 *
 * Sections:
 *   0. Announcement bar (slim, monospace)
 *   1. The Cover (book cover, full viewport)
 *   2. The Lobby (4 intent centers — 2x2 grid)
 *   3. The Map (7 pathways — editorial layout)
 *   4. The Contents (table of contents — typographic list)
 *   5. The Pulse (latest news — editorial grid)
 *   6. Go Deeper (specialist tools — compact strip)
 *   Footer coda (locked copy + crisis lines)
 *
 * Design system: Georgia serif body/headings, Courier New monospace labels,
 * parchment palette, zero border-radius, no shadows, no emojis.
 */

import Link from 'next/link'
import Image from 'next/image'
import { HeroSearchInput } from './HeroSearchInput'

// ── Design tokens (locked) ───────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const PARCHMENT_LIGHT = '#F8F4EC'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const SAGE = '#5C7A5E'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'

const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

// ── Types ────────────────────────────────────────────────────────────────

interface NewsItem {
  id: string
  title_6th_grade: string
  summary_6th_grade?: string | null
  image_url?: string | null
  source_domain?: string | null
  published_at?: string | null
  content_type?: string | null
}

interface CommunityGuideProps {
  stats: {
    resources: number
    services: number
    officials: number
    policies: number
    organizations: number
    opportunities: number
    elections: number
    newsCount: number
  }
  latestContent: Array<Record<string, unknown>>
  newsFeed: NewsItem[]
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
  upcomingEvents?: Array<{
    id: string
    title: string
    date: string
    type: string | null
    location: string | null
    href: string
  }>
}

// ── Chapter divider ──────────────────────────────────────────────────────

function ChapterDivider({ label }: { label: string }) {
  return (
    <div className="w-full py-10 text-center" style={{ background: PARCHMENT }}>
      <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase' }}>
        {label}
      </p>
      <div className="mx-auto mt-3" style={{ width: '100%', maxWidth: 900, height: 1, background: RULE_COLOR }} />
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────

export function CommunityGuide({ stats, newsFeed, quote }: CommunityGuideProps) {

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 0 — ANNOUNCEMENT BAR
  // ═══════════════════════════════════════════════════════════════════════

  const announcementBar = (
    <div
      className="w-full text-center py-2.5 px-4"
      style={{ background: PARCHMENT_WARM, borderBottom: `1px solid ${RULE_COLOR}` }}
    >
      <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: INK }}>
        City of Houston Council District C Special Election — April 4, 2026
      </p>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1 — THE COVER
  // ═══════════════════════════════════════════════════════════════════════

  const theCover = (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6"
      style={{ background: PARCHMENT, minHeight: '85vh' }}
    >
      {/* FOL background motif */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
        <Image
          src="/images/fol/flower-full.svg"
          alt=""
          width={600}
          height={600}
          className="opacity-[0.09]"
          style={{ maxWidth: '70vw', height: 'auto' }}
        />
      </div>

      <div className="relative z-10 max-w-[780px] mx-auto">
        {/* Dateline */}
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase', marginBottom: 40 }}>
          Community Exchange &middot; Houston, Texas
        </p>

        {/* Headline */}
        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(48px, 7vw, 80px)',
            fontWeight: 'normal',
            lineHeight: 1.05,
            color: INK,
            marginBottom: 28,
          }}
        >
          This is the way in.
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 'clamp(16px, 2vw, 20px)',
            lineHeight: 1.6,
            color: MUTED,
            maxWidth: 560,
            margin: '0 auto 40px',
          }}
        >
          Houston has everything — the organizations, the services, the people doing the work. This is how you find your part in it.
        </p>

        {/* Stats */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
          style={{ fontFamily: MONO, fontSize: 14, color: MUTED }}
        >
          <span>{stats.resources.toLocaleString()} resources</span>
          <span style={{ color: CLAY }}>&middot;</span>
          <span>{stats.organizations.toLocaleString()} organizations</span>
          <span style={{ color: CLAY }}>&middot;</span>
          <span>{stats.officials.toLocaleString()} officials</span>
        </div>

        {/* CTA */}
        <a
          href="#lobby"
          className="inline-block mb-8 transition-colors"
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            color: '#fff',
            background: CLAY,
            padding: '14px 32px',
            border: 'none',
            borderRadius: 0,
            cursor: 'pointer',
          }}
          onMouseEnter={function (e) { e.currentTarget.style.background = '#a8522e' }}
          onMouseLeave={function (e) { e.currentTarget.style.background = CLAY }}
        >
          Where do you want to start?
        </a>

        {/* Search */}
        <div className="max-w-sm mx-auto">
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
            Or search everything
          </p>
          <HeroSearchInput />
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2 — THE LOBBY (4 centers)
  // ═══════════════════════════════════════════════════════════════════════

  const CENTERS = [
    {
      slug: 'learning',
      motif: '/images/fol/vesica-piscis.svg',
      label: 'CHAPTER: LEARNING',
      count: 210,
      headline: 'Learning Center',
      description: 'You want to understand. How does this work? What are your rights? Knowledge is the first step.',
      bg: PARCHMENT_LIGHT,
    },
    {
      slug: 'resources',
      motif: '/images/fol/seed-of-life.svg',
      label: 'CHAPTER: RESOURCES',
      count: 24,
      headline: 'Resource Center',
      description: 'You need something. A service, a benefit, a helping hand. Your community has resources waiting.',
      bg: PARCHMENT_WARM,
    },
    {
      slug: 'action',
      motif: '/images/fol/tripod-of-life.svg',
      label: 'CHAPTER: ACTION',
      count: 32,
      headline: 'Action Center',
      description: "You are ready to do something. Volunteer, organize, show up. Your energy can change things.",
      bg: '#F0EBE1',
    },
    {
      slug: 'accountability',
      motif: '/images/fol/metatrons-cube.svg',
      label: 'CHAPTER: ACCOUNTABILITY',
      count: 3,
      headline: 'Accountability Center',
      description: 'You want answers. Who represents you? What policies affect your life? Follow the trail.',
      bg: PARCHMENT,
    },
  ]

  const theLobby = (
    <section id="lobby" style={{ background: PARCHMENT }}>
      <div className="max-w-[1100px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {CENTERS.map(function (center) {
            return (
              <Link
                key={center.slug}
                href={'/centers/' + center.slug}
                className="group relative block overflow-hidden transition-all"
                style={{
                  background: center.bg,
                  border: '1px solid transparent',
                  padding: 'clamp(32px, 4vw, 48px)',
                  minHeight: 280,
                }}
                onMouseEnter={function (e) {
                  e.currentTarget.style.borderColor = CLAY
                  e.currentTarget.style.background = PARCHMENT_WARM
                }}
                onMouseLeave={function (e) {
                  e.currentTarget.style.borderColor = 'transparent'
                  e.currentTarget.style.background = center.bg
                }}
              >
                {/* FOL watermark */}
                <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.07]" aria-hidden="true">
                  <Image src={center.motif} alt="" width={200} height={200} />
                </div>

                <div className="relative z-10">
                  {/* Label */}
                  <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 16 }}>
                    {center.label} &middot; {center.count} resources
                  </p>

                  {/* Headline */}
                  <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.5vw, 28px)', color: INK, marginBottom: 12, lineHeight: 1.2 }}>
                    {center.headline}
                  </h3>

                  {/* Description */}
                  <p style={{ fontFamily: SERIF, fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>
                    {center.description}
                  </p>

                  {/* Page reference */}
                  <span
                    className="group-hover:text-[#a8522e] transition-colors"
                    style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                  >
                    Turn to page &rarr;
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3 — THE MAP (7 pathways)
  // ═══════════════════════════════════════════════════════════════════════

  const PATHWAYS = [
    { name: 'Health', slug: 'our-health', count: 24, desc: 'The doctors, clinics, mental health resources, and care networks that keep us going' },
    { name: 'Families', slug: 'our-families', count: 27, desc: 'Childcare, housing, family services — what it takes to keep a household stable' },
    { name: 'Neighborhood', slug: 'our-neighborhood', count: 16, desc: 'Streets, parks, zoning, and local planning — the physical place we share' },
    { name: 'Voice', slug: 'our-voice', count: 64, desc: 'Voting, officials, advocacy, civic education — how we make decisions together' },
    { name: 'Money', slug: 'our-money', count: 12, desc: 'Jobs, financial assistance, and economic opportunity — income and what it opens up' },
    { name: 'Planet', slug: 'our-planet', count: 11, desc: 'Environment, green spaces, sustainability — how we protect where we live' },
    { name: 'The Bigger We', slug: 'the-bigger-we', count: 115, desc: 'Root causes, long games, and structural questions — why things are the way they are' },
  ]

  const theMap = (
    <section style={{ background: PARCHMENT }}>
      <div className="max-w-[1100px] mx-auto px-6 pb-16">
        {/* Asymmetric layout: 4 top, 3 bottom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {PATHWAYS.slice(0, 4).map(function (pw) {
            return (
              <Link
                key={pw.slug}
                href={'/pathways/' + pw.slug}
                className="group block relative transition-all"
                style={{
                  border: `1px solid rgba(196,102,58,0.12)`,
                  padding: 'clamp(24px, 3vw, 36px)',
                  borderBottom: '2px solid transparent',
                }}
                onMouseEnter={function (e) { e.currentTarget.style.borderBottomColor = CLAY }}
                onMouseLeave={function (e) { e.currentTarget.style.borderBottomColor = 'transparent' }}
              >
                <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, position: 'absolute', top: 16, right: 16 }}>
                  {pw.count}
                </span>
                <h3
                  className="group-hover:text-[#C4663A] transition-colors"
                  style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.5vw, 26px)', color: INK, marginBottom: 8, lineHeight: 1.2 }}
                >
                  {pw.name}
                </h3>
                <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                  {pw.desc}
                </p>
              </Link>
            )
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
          {PATHWAYS.slice(4).map(function (pw) {
            return (
              <Link
                key={pw.slug}
                href={'/pathways/' + pw.slug}
                className="group block relative transition-all"
                style={{
                  border: `1px solid rgba(196,102,58,0.12)`,
                  padding: 'clamp(24px, 3vw, 36px)',
                  borderBottom: '2px solid transparent',
                }}
                onMouseEnter={function (e) { e.currentTarget.style.borderBottomColor = CLAY }}
                onMouseLeave={function (e) { e.currentTarget.style.borderBottomColor = 'transparent' }}
              >
                <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED, position: 'absolute', top: 16, right: 16 }}>
                  {pw.count}
                </span>
                <h3
                  className="group-hover:text-[#C4663A] transition-colors"
                  style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 2.5vw, 26px)', color: INK, marginBottom: 8, lineHeight: 1.2 }}
                >
                  {pw.name}
                </h3>
                <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                  {pw.desc}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4 — THE CONTENTS (table of contents)
  // ═══════════════════════════════════════════════════════════════════════

  const CONTENTS = [
    { label: 'Services & Resources', count: stats.services.toString(), href: '/services' },
    { label: 'Organizations', count: stats.organizations.toLocaleString(), href: '/organizations' },
    { label: 'Elected Officials', count: stats.officials.toLocaleString(), href: '/officials' },
    { label: 'Elections & Voting', count: stats.elections + ' tracked', href: '/elections' },
    { label: 'News & Library', count: stats.newsCount.toLocaleString() + ' articles', href: '/news' },
    { label: 'Opportunities', count: stats.opportunities.toString(), href: '/opportunities' },
  ]

  const theContents = (
    <section style={{ background: PARCHMENT_LIGHT }}>
      <div className="max-w-[780px] mx-auto px-6 pb-16">
        <div>
          {CONTENTS.map(function (item, i) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-baseline gap-3 py-4 transition-colors"
                style={{ borderBottom: i < CONTENTS.length - 1 ? `1px solid rgba(196,102,58,0.15)` : 'none' }}
              >
                <span
                  className="group-hover:text-[#C4663A] transition-colors"
                  style={{ fontFamily: SERIF, fontSize: 18, color: INK, flexShrink: 0 }}
                >
                  {item.label}
                </span>
                <span className="flex-1 border-b border-dotted" style={{ borderColor: 'rgba(122,114,101,0.3)', minWidth: 20 }} />
                <span style={{ fontFamily: MONO, fontSize: 14, color: MUTED, flexShrink: 0 }}>
                  {item.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5 — THE PULSE (latest news)
  // ═══════════════════════════════════════════════════════════════════════

  const lead = newsFeed[0] as NewsItem | undefined
  const secondary = newsFeed.slice(1, 5) as NewsItem[]

  const thePulse = (
    <section style={{ background: PARCHMENT }}>
      <div className="max-w-[1100px] mx-auto px-6 pb-16">
        {/* Date */}
        <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginBottom: 24 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {lead && (
          <div className="mb-8">
            <Link href={'/content/' + lead.id} className="group block">
              {lead.image_url && (
                <div className="mb-4 overflow-hidden" style={{ maxHeight: 320 }}>
                  <img
                    src={lead.image_url}
                    alt=""
                    className="w-full object-cover"
                    style={{ maxHeight: 320 }}
                  />
                </div>
              )}
              <h3
                className="group-hover:text-[#C4663A] transition-colors"
                style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 3vw, 32px)', color: INK, lineHeight: 1.25, marginBottom: 8 }}
              >
                {lead.title_6th_grade}
              </h3>
              {lead.summary_6th_grade && (
                <p style={{ fontFamily: SERIF, fontSize: 16, color: MUTED, lineHeight: 1.6 }}>
                  {lead.summary_6th_grade}
                </p>
              )}
              {lead.source_domain && (
                <p style={{ fontFamily: MONO, fontSize: 11, color: MUTED, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {lead.source_domain}
                </p>
              )}
            </Link>
          </div>
        )}

        {secondary.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {secondary.map(function (item) {
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="group block py-4 pr-4"
                  style={{ borderTop: `1px solid rgba(196,102,58,0.15)` }}
                >
                  <h4
                    className="group-hover:text-[#C4663A] transition-colors line-clamp-3"
                    style={{ fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.4, marginBottom: 4 }}
                  >
                    {item.title_6th_grade}
                  </h4>
                  {item.source_domain && (
                    <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.source_domain}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        {/* All news link */}
        <div className="text-right mt-6">
          <Link
            href="/news"
            className="inline-block transition-colors hover:text-[#a8522e]"
            style={{ fontFamily: MONO, fontSize: 12, color: CLAY, letterSpacing: '0.06em' }}
          >
            All news &rarr;
          </Link>
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6 — GO DEEPER (specialist tools)
  // ═══════════════════════════════════════════════════════════════════════

  const DEEP_LINKS = [
    { label: 'Civic Compass', desc: 'Find who represents you', href: '/compass' },
    { label: 'Knowledge Graph', desc: 'See how everything connects', href: '/knowledge-graph' },
    { label: 'Call Your Senators', desc: 'Your senators, right now', href: '/call-your-senators' },
    { label: 'Three Good Things', desc: "What is going right", href: '/goodthings' },
    { label: 'Chat with Chance', desc: 'Ask anything', href: '/chat' },
  ]

  const goDeeper = (
    <section style={{ background: PARCHMENT_WARM }}>
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
          {DEEP_LINKS.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group text-center transition-colors"
                style={{ maxWidth: 160 }}
              >
                <p
                  className="group-hover:text-[#C4663A] transition-colors"
                  style={{ fontFamily: SERIF, fontSize: 15, color: INK, marginBottom: 2 }}
                >
                  {item.label}
                </p>
                <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.04em' }}>
                  {item.desc}
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER CODA
  // ═══════════════════════════════════════════════════════════════════════

  const footerCoda = (
    <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
      <div className="max-w-[780px] mx-auto px-6 py-14 text-center">
        <p style={{ fontFamily: SERIF, fontSize: 'clamp(16px, 2vw, 20px)', fontStyle: 'italic', color: MUTED, lineHeight: 1.6, marginBottom: 24 }}>
          We did not build anything new. We just made what already exists findable.
        </p>

        {/* Crisis lines */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 mb-8"
          style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}
        >
          <a href="tel:988" className="hover:text-[#C4663A] transition-colors"><strong>988</strong> Crisis</a>
          <span style={{ color: CLAY }}>&middot;</span>
          <a href="tel:311" className="hover:text-[#C4663A] transition-colors"><strong>311</strong> City</a>
          <span style={{ color: CLAY }}>&middot;</span>
          <a href="tel:211" className="hover:text-[#C4663A] transition-colors"><strong>211</strong> Social Services</a>
          <span style={{ color: CLAY }}>&middot;</span>
          <a href="tel:7135282121" className="hover:text-[#C4663A] transition-colors"><strong>713-528-2121</strong> DV Hotline</a>
        </div>

        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: MUTED, textTransform: 'uppercase' }}>
          Built in Houston. For Houston.
        </p>
      </div>
    </section>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div style={{ background: PARCHMENT }}>
      {announcementBar}
      {theCover}
      <ChapterDivider label="&mdash; Chapter One &mdash;" />
      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[1100px] mx-auto px-6 pt-4 pb-6">
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, textAlign: 'center' }}>
            Where do you want to start?
          </h2>
        </div>
      </section>
      {theLobby}
      <ChapterDivider label="&mdash; Chapter Two &mdash;" />
      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[1100px] mx-auto px-6 pt-4 pb-6">
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, textAlign: 'center' }}>
            Seven parts of community life
          </h2>
        </div>
      </section>
      {theMap}
      <ChapterDivider label="&mdash; Chapter Three &mdash;" />
      <section style={{ background: PARCHMENT_LIGHT }}>
        <div className="max-w-[780px] mx-auto px-6 pt-4 pb-6">
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, textAlign: 'center' }}>
            Everything in the guide
          </h2>
        </div>
      </section>
      {theContents}
      <ChapterDivider label="&mdash; Chapter Four &mdash;" />
      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[1100px] mx-auto px-6 pt-4 pb-6">
          <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, textAlign: 'center' }}>
            What is happening in Houston
          </h2>
        </div>
      </section>
      {thePulse}
      {goDeeper}
      {footerCoda}
    </div>
  )
}
