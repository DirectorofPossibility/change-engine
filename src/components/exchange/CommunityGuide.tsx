'use client'

/**
 * @fileoverview The Community Exchange — a culture guide to Houston.
 *
 * Modeled on a real city guidebook: voice, personality, recommendations,
 * neighborhood feel. Not a dashboard. Not a data display. A guide.
 */

import Link from 'next/link'
import Image from 'next/image'
import { HeroSearchInput } from './HeroSearchInput'

// ── Design tokens ────────────────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
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

interface LatestContentItem {
  id?: string | null
  inbox_id?: string | null
  title_6th_grade?: string | null
  summary_6th_grade?: string | null
  image_url?: string | null
  pathway_primary?: string | null
  center?: string | null
  resource_type?: string | null
  source_domain?: string | null
  published_at?: string | null
  [key: string]: unknown
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
  latestContent: LatestContentItem[]
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

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDayOfWeek(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
  } catch {
    return ''
  }
}

const today = new Date()
const todayStr = today.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

// ── Component ────────────────────────────────────────────────────────────

export function CommunityGuide({ stats, latestContent, newsFeed, quote, promotions, upcomingEvents }: CommunityGuideProps) {

  const hasEvents = upcomingEvents && upcomingEvents.length > 0
  const hasPromotions = promotions && promotions.length > 0

  return (
    <div style={{ background: PARCHMENT }}>

      {/* ════════════════════════════════════════════════════════════════
          THE COVER
          Like the front of a Monocle city guide or a Kinfolk issue.
          ════════════════════════════════════════════════════════════════ */}

      <section
        className="relative flex flex-col items-center justify-center text-center px-6"
        style={{ background: PARCHMENT, minHeight: '90vh' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image
            src="/images/fol/flower-full.svg"
            alt=""
            width={640}
            height={640}
            className="opacity-[0.05]"
            style={{ maxWidth: '80vw', height: 'auto' }}
          />
        </div>

        <div className="relative z-10 max-w-[640px] mx-auto">
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED, textTransform: 'uppercase', marginBottom: 48 }}>
            The Community Exchange
          </p>

          <h1 style={{
            fontFamily: SERIF,
            fontSize: 'clamp(42px, 8vw, 72px)',
            fontWeight: 'normal',
            lineHeight: 1.0,
            color: INK,
            marginBottom: 20,
          }}>
            Houston
          </h1>

          <p style={{
            fontFamily: SERIF,
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            fontStyle: 'italic',
            color: CLAY,
            marginBottom: 40,
          }}>
            A culture guide to civic life
          </p>

          <div style={{ width: 40, height: 1, background: CLAY, margin: '0 auto 40px' }} />

          <p style={{
            fontFamily: SERIF,
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            lineHeight: 1.7,
            color: MUTED,
            marginBottom: 48,
          }}>
            Everything you need to know your city, find what you need,
            and get involved — all in one place.
          </p>

          <div className="max-w-[360px] mx-auto mb-6">
            <HeroSearchInput />
          </div>

          <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em' }}>
            {stats.resources.toLocaleString()} resources &middot; {stats.organizations.toLocaleString()} orgs &middot; {stats.officials.toLocaleString()} officials
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.1em' }}>
          <a href="#today" className="hover:text-[#C4663A] transition-colors">&darr;</a>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TODAY IN HOUSTON
          The front page of the guide. What's happening right now.
          Events, announcements, the daily quote. This is the heartbeat.
          ════════════════════════════════════════════════════════════════ */}

      <section id="today" style={{ background: PARCHMENT_WARM }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
            Today in Houston
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, marginBottom: 32 }}>
            {todayStr}
          </p>

          {/* Quote of the day */}
          {quote && (
            <div className="mb-12">
              <blockquote>
                <p style={{ fontFamily: SERIF, fontSize: 'clamp(18px, 2.5vw, 24px)', fontStyle: 'italic', color: INK, lineHeight: 1.5, marginBottom: 12 }}>
                  &ldquo;{quote.quote_text}&rdquo;
                </p>
                {quote.attribution && (
                  <footer style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.04em' }}>
                    &mdash; {quote.attribution}
                  </footer>
                )}
              </blockquote>
            </div>
          )}

          {/* Coming up */}
          {hasEvents && (
            <div className="mb-10">
              <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase', marginBottom: 16 }}>
                Coming up
              </p>
              {upcomingEvents!.slice(0, 5).map(function (ev) {
                return (
                  <Link
                    key={ev.id}
                    href={ev.href}
                    className="group flex gap-4 py-3 transition-colors"
                    style={{ borderBottom: `1px solid rgba(196,102,58,0.12)` }}
                  >
                    <div className="text-center" style={{ minWidth: 44, flexShrink: 0 }}>
                      <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase' }}>
                        {formatDayOfWeek(ev.date)}
                      </p>
                      <p style={{ fontFamily: SERIF, fontSize: 18, color: CLAY }}>
                        {formatDate(ev.date).split(' ')[1]}
                      </p>
                    </div>
                    <div>
                      <p className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 16, color: INK, lineHeight: 1.3 }}>
                        {ev.title}
                      </p>
                      {ev.location && (
                        <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2, letterSpacing: '0.04em' }}>
                          {ev.location}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
              <div className="mt-4">
                <Link href="/events" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}>
                  Full calendar &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Announcements */}
          {hasPromotions && promotions!.map(function (promo) {
            return (
              <div
                key={promo.promo_id}
                className="mb-4 py-4"
                style={{ borderTop: `1px solid ${RULE_COLOR}`, borderBottom: `1px solid ${RULE_COLOR}` }}
              >
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: promo.color || CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
                  Announcement
                </p>
                <p style={{ fontFamily: SERIF, fontSize: 18, color: INK, marginBottom: 4 }}>
                  {promo.title}
                </p>
                {promo.description && (
                  <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 8 }}>
                    {promo.description}
                  </p>
                )}
                {promo.cta_href && (
                  <Link href={promo.cta_href} className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}>
                    {promo.cta_text || 'Learn more'} &rarr;
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW TO USE THIS GUIDE
          Four ways in. Not "centers" — orientations. What kind of
          reader are you today?
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
            How to use this guide
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', color: INK, lineHeight: 1.3, marginBottom: 8 }}>
            Start with what you need right now.
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            This guide is organized four ways. Pick the one that matches where you are today.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {([
              {
                href: '/centers/resources',
                motif: '/images/fol/seed-of-life.svg',
                q: 'I need something.',
                name: 'Resource Center',
                voice: 'Services, benefits, organizations, and help — find what is available to you.',
              },
              {
                href: '/centers/learning',
                motif: '/images/fol/vesica-piscis.svg',
                q: 'I want to understand.',
                name: 'Learning Center',
                voice: 'News, explainers, data, and context — understand how things work.',
              },
              {
                href: '/centers/action',
                motif: '/images/fol/tripod-of-life.svg',
                q: 'I want to do something.',
                name: 'Action Center',
                voice: 'Volunteer, organize, attend, donate — put your energy to work.',
              },
              {
                href: '/centers/accountability',
                motif: '/images/fol/metatrons-cube.svg',
                q: 'I want answers.',
                name: 'Accountability Center',
                voice: 'Officials, policies, spending, elections — follow the trail.',
              },
            ]).map(function (c) {
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className="group relative block overflow-hidden hover:bg-[#EDE7D8] transition-colors"
                  style={{ padding: 'clamp(24px, 3vw, 36px)', border: `1px solid rgba(196,102,58,0.08)` }}
                >
                  <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.04]" aria-hidden="true">
                    <Image src={c.motif} alt="" width={140} height={140} />
                  </div>
                  <div className="relative z-10">
                    <p style={{ fontFamily: SERIF, fontSize: 'clamp(17px, 2vw, 20px)', fontStyle: 'italic', color: CLAY, marginBottom: 10 }}>
                      &ldquo;{c.q}&rdquo;
                    </p>
                    <p style={{ fontFamily: SERIF, fontSize: 16, color: INK, marginBottom: 6 }}>
                      {c.name}
                    </p>
                    <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.5, marginBottom: 16 }}>
                      {c.voice}
                    </p>
                    <span className="group-hover:text-[#a8522e] transition-colors" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}>
                      Open &rarr;
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: RULE_COLOR }} />

      {/* ════════════════════════════════════════════════════════════════
          THE NEIGHBORHOODS — Seven lenses on community life
          Not "pathways" or abstract categories — these are the parts
          of life that matter. Presented like a travel guide's chapters.
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
            Browse by topic
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', color: INK, lineHeight: 1.3, marginBottom: 8 }}>
            Seven parts of community life.
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.6, marginBottom: 32 }}>
            Every resource, every official, every policy connects back to one of these.
          </p>

          {([
            { name: 'Health', slug: 'our-health', color: '#1a6b56', line: 'Clinics, mental health, nutrition, insurance, and the care networks that keep Houston going.' },
            { name: 'Families', slug: 'our-families', color: '#1e4d7a', line: 'Childcare, schools, housing assistance, and what it takes to keep a household together.' },
            { name: 'Neighborhood', slug: 'our-neighborhood', color: '#4a2870', line: 'Streets, parks, zoning, transit — the physical places we share and the plans that shape them.' },
            { name: 'Voice', slug: 'our-voice', color: '#7a2018', line: 'Voting, representatives, advocacy, civic education — how we make decisions together.' },
            { name: 'Money', slug: 'our-money', color: '#6a4e10', line: 'Jobs, financial help, small business support — income, opportunity, and what they open up.' },
            { name: 'Planet', slug: 'our-planet', color: '#1a5030', line: 'Flooding, air quality, green spaces, energy — protecting the ground we stand on.' },
            { name: 'The Bigger We', slug: 'the-bigger-we', color: '#1a3460', line: 'Root causes, long games, and the structural questions underneath everything else.' },
          ]).map(function (pw, i) {
            return (
              <Link
                key={pw.slug}
                href={'/pathways/' + pw.slug}
                className="group block py-5 transition-colors"
                style={{ borderBottom: i < 6 ? `1px solid rgba(196,102,58,0.12)` : 'none' }}
              >
                <div className="flex items-start gap-4">
                  <span className="mt-2" style={{ width: 10, height: 10, background: pw.color, flexShrink: 0 }} />
                  <div>
                    <p className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 19, color: INK, marginBottom: 4 }}>
                      {pw.name}
                    </p>
                    <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                      {pw.line}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div style={{ height: 1, background: RULE_COLOR }} />

      {/* ════════════════════════════════════════════════════════════════
          THE FRONT PAGE — News from Houston
          Lead story with image, secondary stories below. Like an
          actual newspaper front page, not a card grid.
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
            The front page
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', color: INK, lineHeight: 1.3, marginBottom: 32 }}>
            What is happening in Houston.
          </p>

          {newsFeed[0] && (
            <div className="mb-10">
              <Link href={'/content/' + newsFeed[0].id} className="group block">
                {newsFeed[0].image_url && (
                  <div className="mb-5 overflow-hidden">
                    <img src={newsFeed[0].image_url} alt="" className="w-full object-cover" style={{ maxHeight: 340 }} />
                  </div>
                )}
                <h3 className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 3vw, 30px)', color: INK, lineHeight: 1.2, marginBottom: 10 }}>
                  {newsFeed[0].title_6th_grade}
                </h3>
                {newsFeed[0].summary_6th_grade && (
                  <p style={{ fontFamily: SERIF, fontSize: 16, color: MUTED, lineHeight: 1.65 }}>
                    {newsFeed[0].summary_6th_grade.length > 300
                      ? newsFeed[0].summary_6th_grade.slice(0, 300) + '...'
                      : newsFeed[0].summary_6th_grade}
                  </p>
                )}
                {newsFeed[0].source_domain && (
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {newsFeed[0].source_domain}
                  </p>
                )}
              </Link>
            </div>
          )}

          {newsFeed.slice(1, 5).map(function (item) {
            return (
              <Link
                key={item.id}
                href={'/content/' + item.id}
                className="group flex gap-4 py-4 transition-colors"
                style={{ borderTop: `1px solid rgba(196,102,58,0.12)` }}
              >
                <div className="flex-1">
                  <h4 className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 16, color: INK, lineHeight: 1.35, marginBottom: 4 }}>
                    {item.title_6th_grade}
                  </h4>
                  {item.source_domain && (
                    <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {item.source_domain}
                    </p>
                  )}
                </div>
                {item.image_url && (
                  <img src={item.image_url} alt="" className="object-cover flex-shrink-0" style={{ width: 72, height: 72 }} />
                )}
              </Link>
            )
          })}

          <div className="mt-6">
            <Link href="/news" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}>
              Read more news &rarr;
            </Link>
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: RULE_COLOR }} />

      {/* ════════════════════════════════════════════════════════════════
          RECENT STORIES — Latest content from the library
          Three featured cards, then a collapsed list for the rest.
          ════════════════════════════════════════════════════════════════ */}

      {latestContent.length > 0 && (
        <section style={{ background: PARCHMENT_WARM }}>
          <div className="max-w-[720px] mx-auto px-6 py-16">

            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
              From the library
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', color: INK, lineHeight: 1.3, marginBottom: 32 }}>
              Recently published.
            </p>

            {latestContent.slice(0, 3).map(function (item, i) {
              const title = (item.title_6th_grade || '') as string
              const summary = (item.summary_6th_grade || '') as string
              const id = (item.id || '') as string
              return (
                <Link
                  key={id}
                  href={'/content/' + id}
                  className="group flex gap-4 py-4 transition-colors"
                  style={{ borderBottom: i < 2 ? `1px solid rgba(196,102,58,0.12)` : 'none' }}
                >
                  <div className="flex-1">
                    <h4 className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 17, color: INK, lineHeight: 1.3, marginBottom: 4 }}>
                      {title}
                    </h4>
                    {summary && (
                      <p className="line-clamp-2" style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                        {summary}
                      </p>
                    )}
                    {item.source_domain && (
                      <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {item.source_domain as string}
                      </p>
                    )}
                  </div>
                  {item.image_url && (
                    <img src={item.image_url as string} alt="" className="object-cover flex-shrink-0" style={{ width: 80, height: 80 }} />
                  )}
                </Link>
              )
            })}

            {latestContent.length > 3 && (
              <details className="mt-4">
                <summary style={{ fontFamily: MONO, fontSize: 11, color: CLAY, cursor: 'pointer', letterSpacing: '0.04em' }}>
                  + {latestContent.length - 3} more
                </summary>
                <div className="mt-2">
                  {latestContent.slice(3).map(function (item) {
                    const title = (item.title_6th_grade || '') as string
                    const id = (item.id || '') as string
                    return (
                      <Link key={id} href={'/content/' + id} className="group block py-3" style={{ borderBottom: `1px solid rgba(196,102,58,0.08)` }}>
                        <p className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                          {title}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}

            <div className="mt-6">
              <Link href="/news" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}>
                Browse the full library &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════
          THE INDEX — What is in this guide
          Like the table of contents in the back of a real guidebook.
          Dotted leaders, counts, page references.
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT }}>
        <div className="max-w-[720px] mx-auto px-6 py-16">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 6 }}>
            The index
          </p>
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 28px)', color: INK, lineHeight: 1.3, marginBottom: 32 }}>
            Everything in this guide.
          </p>

          {([
            { label: 'Services & Resources', count: stats.services.toLocaleString(), href: '/services' },
            { label: 'Organizations', count: stats.organizations.toLocaleString(), href: '/organizations' },
            { label: 'Elected Officials', count: stats.officials.toLocaleString(), href: '/officials' },
            { label: 'Policies & Legislation', count: stats.policies.toLocaleString(), href: '/policies' },
            { label: 'Opportunities', count: stats.opportunities.toLocaleString(), href: '/opportunities' },
            { label: 'Elections', count: stats.elections + ' tracked', href: '/elections' },
            { label: 'News & Articles', count: stats.newsCount.toLocaleString(), href: '/news' },
          ]).map(function (item, i) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-baseline gap-3 py-3"
                style={{ borderBottom: i < 6 ? `1px solid rgba(196,102,58,0.1)` : 'none' }}
              >
                <span className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 17, color: INK, flexShrink: 0 }}>
                  {item.label}
                </span>
                <span className="flex-1 border-b border-dotted" style={{ borderColor: 'rgba(122,114,101,0.25)', minWidth: 20 }} />
                <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED, flexShrink: 0 }}>
                  {item.count}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <div style={{ height: 1, background: RULE_COLOR }} />

      {/* ════════════════════════════════════════════════════════════════
          THE BACK PAGES — Deeper tools and experiences
          Like a guidebook's appendix or "don't miss" section.
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT_WARM }}>
        <div className="max-w-[720px] mx-auto px-6 py-14">

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: CLAY, textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>
            Don&rsquo;t miss
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-0">
            {([
              { label: 'Civic Compass', note: 'Personalized to your ZIP', href: '/compass' },
              { label: 'Knowledge Graph', note: 'See how it all connects', href: '/knowledge-graph' },
              { label: 'Three Good Things', note: 'Daily good news', href: '/goodthings' },
              { label: 'Call Your Senators', note: 'Direct line to D.C.', href: '/call-your-senators' },
              { label: 'Chat with Chance', note: 'Ask anything', href: '/chat' },
              { label: 'Teen Hub', note: 'For young Houstonians', href: '/teens' },
            ]).map(function (item) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block py-4 px-3 text-center hover:bg-[#F5F0E8] transition-colors"
                >
                  <p className="group-hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, fontSize: 15, color: INK, marginBottom: 3 }}>
                    {item.label}
                  </p>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.03em' }}>
                    {item.note}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          COLOPHON
          Every real guidebook has one.
          ════════════════════════════════════════════════════════════════ */}

      <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[580px] mx-auto px-6 py-14 text-center">
          <p style={{ fontFamily: SERIF, fontSize: 'clamp(15px, 1.8vw, 18px)', fontStyle: 'italic', color: MUTED, lineHeight: 1.7, marginBottom: 28 }}>
            We did not build anything new. We just made what already exists findable.
          </p>

          <div
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
            style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}
          >
            <a href="tel:988" className="hover:text-[#C4663A] transition-colors"><strong>988</strong> Crisis</a>
            <span style={{ color: CLAY }}>&middot;</span>
            <a href="tel:311" className="hover:text-[#C4663A] transition-colors"><strong>311</strong> City</a>
            <span style={{ color: CLAY }}>&middot;</span>
            <a href="tel:211" className="hover:text-[#C4663A] transition-colors"><strong>211</strong> Social Services</a>
            <span style={{ color: CLAY }}>&middot;</span>
            <a href="tel:7135282121" className="hover:text-[#C4663A] transition-colors"><strong>713-528-2121</strong> DV Hotline</a>
          </div>

          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>
            Built in Houston. For Houston.
          </p>
        </div>
      </section>

    </div>
  )
}
