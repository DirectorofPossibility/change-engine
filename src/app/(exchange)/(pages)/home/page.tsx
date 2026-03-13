/**
 * @fileoverview Homepage — editorial civic briefing.
 *
 * Newspaper-style front page showing the full depth of the platform:
 * - Masthead with date, personalized greeting, pathway spectrum
 * - Lead story + secondary headlines
 * - Election countdown + upcoming events sidebar
 * - Your representatives (if ZIP set)
 * - From the Library (KB documents)
 * - Community resources (services, organizations)
 * - Seven pathways exploration bar
 * - Platform stats
 *
 * @route GET /home
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getExchangeStats } from '@/lib/data/homepage'
import { getRandomQuote } from '@/lib/data/homepage'
import { getNewsFeed } from '@/lib/data/content'
import { getUpcomingEvents } from '@/lib/data/events'
import { getNextElection } from '@/lib/data/elections'
import { getOfficialsByZip } from '@/lib/data/officials'
import { getNeighborhoodByZip } from '@/lib/data/geography'
import { getPublishedDocuments } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Change Engine — Houston Civic Guide',
  description: 'Your community guide to Houston civic life. Officials, services, policies, events, and more — all in one place.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.18)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || ''

  const [stats, news, upcomingEvents, nextElection, neighborhood, zipOfficials, libraryData, quote] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 9),
    getUpcomingEvents(5),
    getNextElection(),
    zip ? getNeighborhoodByZip(zip) : Promise.resolve(null),
    zip ? getOfficialsByZip(zip) : Promise.resolve(null),
    getPublishedDocuments(1, 4),
    getRandomQuote(),
  ])

  const yourReps = zipOfficials
    ? [...zipOfficials.federal, ...zipOfficials.state, ...zipOfficials.county, ...zipOfficials.city].slice(0, 6)
    : []

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const editionNum = `Vol. I, No. ${Math.floor((now.getTime() - new Date('2026-01-01').getTime()) / (1000 * 60 * 60 * 24))}`

  const pathwayList = Object.entries(THEMES).map(([id, t]) => ({
    id,
    name: (t as any).name,
    color: (t as any).color,
    slug: (t as any).slug,
  }))

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">

      {/* ── MASTHEAD ── */}
      <header style={{ background: PARCHMENT_WARM, borderBottom: `2px solid ${INK}` }}>
        <div className="max-w-[1060px] mx-auto px-6 pt-6 pb-5">
          {/* Top line */}
          <div className="flex items-center justify-between">
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
              {editionNum}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
              Houston, Texas
            </p>
          </div>

          {/* Thin rule */}
          <div className="my-2" style={{ height: 1, background: RULE_COLOR }} />

          {/* Nameplate */}
          <div className="text-center">
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(32px, 6vw, 52px)', color: INK, lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 700 }}>
              The Change Engine
            </h1>
            <p className="mt-1" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, fontStyle: 'italic' }}>
              Your community guide to Houston civic life
            </p>
          </div>

          {/* Bottom line with date */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1" style={{ height: 2, background: INK }} />
            <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: INK, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {dateStr}
            </p>
            <div className="flex-1" style={{ height: 2, background: INK }} />
          </div>

          {/* Personalized greeting */}
          {zip && neighborhood && (
            <p className="text-center mt-2" style={{ fontFamily: SERIF, fontSize: 15, color: MUTED }}>
              {greeting}, <span style={{ color: CLAY, fontWeight: 600 }}>{neighborhood.neighborhood_name || zip}</span>
            </p>
          )}

          {/* Pathway spectrum bar */}
          <div className="flex mt-3 gap-px overflow-hidden" style={{ borderRadius: 2, height: 4 }}>
            {pathwayList.map(pw => (
              <Link key={pw.id} href={`/pathways/${pw.slug}`} className="flex-1 hover:opacity-80 transition-opacity" style={{ background: pw.color }} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1060px] mx-auto px-6 py-6">

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">

          {/* ═══ LEFT COLUMN ═══ */}
          <div>

            {/* ── LEAD STORY ── */}
            {news.length > 0 && (
              <section>
                <SectionHead label="The Wire" href="/news" linkLabel="All news" />

                {/* Lead */}
                <Link href={`/content/${news[0].id}`} className="block group mb-5">
                  {news[0].image_url && (
                    <div className="relative aspect-[2.2/1] mb-3 overflow-hidden">
                      <Image
                        src={news[0].image_url}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  )}
                  <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 3.5vw, 30px)', color: INK, lineHeight: 1.2 }} className="group-hover:underline">
                    {news[0].title_6th_grade || 'Untitled'}
                  </h2>
                  {news[0].summary_6th_grade && (
                    <p className="mt-1.5 line-clamp-3" style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.65 }}>
                      {news[0].summary_6th_grade}
                    </p>
                  )}
                  <p className="mt-1.5" style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {news[0].source_domain} &middot; {formatDate(news[0].published_at)}
                  </p>
                </Link>

                {/* Secondary stories — 2 column grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {news.slice(1, 5).map(item => (
                    <Link key={item.id} href={`/content/${item.id}`} className="group block" style={{ borderTop: `1px solid ${RULE_COLOR}`, paddingTop: 10 }}>
                      <h3 style={{ fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.35 }} className="group-hover:underline line-clamp-2">
                        {item.title_6th_grade || 'Untitled'}
                      </h3>
                      {item.summary_6th_grade && (
                        <p className="mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                          {item.summary_6th_grade}
                        </p>
                      )}
                      <p className="mt-1" style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                        {item.source_domain} &middot; {formatDate(item.published_at)}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Third tier — compact list */}
                {news.length > 5 && (
                  <div className="mt-4" style={{ borderTop: `1px solid ${RULE_COLOR}`, paddingTop: 10 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {news.slice(5, 9).map(item => (
                        <Link key={item.id} href={`/content/${item.id}`} className="group flex items-baseline gap-2 py-1">
                          <span style={{ fontFamily: SERIF, fontSize: 8, color: CLAY }}>&bull;</span>
                          <span style={{ fontFamily: SERIF, fontSize: 13, color: INK }} className="group-hover:underline line-clamp-1">
                            {item.title_6th_grade || 'Untitled'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── PULL QUOTE ── */}
            {quote && (
              <div className="my-8 py-5 px-6" style={{ borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
                <p style={{ fontFamily: SERIF, fontSize: 18, color: INK, lineHeight: 1.5, fontStyle: 'italic', textAlign: 'center' }}>
                  &ldquo;{quote.quote_text}&rdquo;
                </p>
                {quote.attribution && (
                  <p className="mt-2 text-center" style={{ fontFamily: MONO, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    &mdash; {quote.attribution}
                  </p>
                )}
              </div>
            )}

            {/* ── YOUR REPRESENTATIVES ── */}
            {yourReps.length > 0 && (
              <section className="mt-6">
                <SectionHead label="Your Representatives" href="/officials" linkLabel="All officials" />
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {yourReps.map((rep: any) => (
                    <Link key={rep.official_id} href={`/officials/${rep.official_id}`} className="group block text-center p-2" style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }}>
                      {rep.photo_url ? (
                        <Image src={rep.photo_url} alt="" width={48} height={48} className="rounded-full mx-auto mb-1.5 object-cover" style={{ width: 48, height: 48 }} />
                      ) : (
                        <div className="w-12 h-12 rounded-full mx-auto mb-1.5 flex items-center justify-center" style={{ background: RULE_COLOR }}>
                          <span style={{ fontFamily: SERIF, fontSize: 18, color: MUTED }}>{(rep.official_name || '?')[0]}</span>
                        </div>
                      )}
                      <p style={{ fontFamily: SERIF, fontSize: 11, color: INK, lineHeight: 1.2 }} className="group-hover:underline line-clamp-1">
                        {rep.official_name}
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {rep.title || rep.level}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── FROM THE LIBRARY ── */}
            {libraryData.documents.length > 0 && (
              <section className="mt-8">
                <SectionHead label="From the Library" href="/library" linkLabel="Browse library" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {libraryData.documents.map((doc: any) => (
                    <Link key={doc.id} href={`/library/doc/${doc.id}`} className="group block p-4" style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }}>
                      <p style={{ fontFamily: MONO, fontSize: 9, color: CLAY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {doc.page_count ? `${doc.page_count} pages` : 'Research'}
                      </p>
                      <h3 className="mt-1 group-hover:underline line-clamp-2" style={{ fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.3 }}>
                        {doc.title}
                      </h3>
                      {doc.summary && (
                        <p className="mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                          {doc.summary}
                        </p>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{ fontFamily: MONO, fontSize: 9, color: MUTED, background: 'rgba(196,102,58,0.08)', padding: '1px 6px', borderRadius: 2 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── EXPLORE BY PATHWAY ── */}
            <section className="mt-8">
              <SectionHead label="Seven Pathways" href="/pathways" linkLabel="Explore all" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pathwayList.map(pw => (
                  <Link
                    key={pw.id}
                    href={`/pathways/${pw.slug}`}
                    className="group flex items-center gap-2 px-3 py-3 transition-colors hover:opacity-90"
                    style={{ background: pw.color + '12', border: `1px solid ${pw.color}30` }}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: pw.color }} />
                    <span style={{ fontFamily: SERIF, fontSize: 13, color: INK }} className="group-hover:underline">
                      {pw.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
          <aside className="space-y-6">

            {/* ── ELECTION COUNTDOWN ── */}
            {nextElection && (
              <div style={{ background: INK, color: '#fff' }} className="p-5">
                <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Next Election
                </p>
                <p className="mt-2" style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.25 }}>
                  {nextElection.election_name}
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span style={{ fontFamily: SERIF, fontSize: 42, lineHeight: 1 }}>
                    {daysUntil(nextElection.election_date)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    days
                  </span>
                </div>
                <p className="mt-1" style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {formatDate(nextElection.election_date)}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    href="/elections"
                    className="flex-1 text-center py-2 text-xs uppercase tracking-wider transition-colors"
                    style={{ fontFamily: MONO, border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
                  >
                    Details
                  </Link>
                  <Link
                    href="/polling-places"
                    className="flex-1 text-center py-2 text-xs uppercase tracking-wider transition-colors"
                    style={{ fontFamily: MONO, border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
                  >
                    Polling places
                  </Link>
                </div>
              </div>
            )}

            {/* ── COMING UP ── */}
            <div>
              <SidebarHead label="Coming Up" href="/calendar" linkLabel="Calendar" />
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2.5">
                  {upcomingEvents.map((evt: any) => (
                    <div key={evt.id || evt.event_id} style={{ borderLeft: `3px solid ${CLAY}`, paddingLeft: 10 }}>
                      <p style={{ fontFamily: MONO, fontSize: 10, color: CLAY, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {formatDate(evt.date || evt.start_datetime)}
                      </p>
                      <p style={{ fontFamily: SERIF, fontSize: 13, color: INK, lineHeight: 1.3 }}>
                        {evt.title || evt.event_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, fontStyle: 'italic' }}>No upcoming events</p>
              )}
            </div>

            {/* ── CIVIC TOOLS ── */}
            <div>
              <SidebarHead label="Civic Tools" />
              <div className="space-y-0">
                {[
                  { href: '/officials/lookup', label: 'Find Your Reps', desc: 'Look up by address' },
                  { href: '/services', label: 'Services Directory', desc: `${stats.services.toLocaleString()} resources` },
                  { href: '/geography', label: 'Interactive Map', desc: 'Explore by geography' },
                  { href: '/compass', label: 'Civic Compass', desc: 'Personalized quiz' },
                  { href: '/call-your-senators', label: 'Call Your Senators', desc: 'Make your voice heard' },
                  { href: '/library/chat', label: 'Ask the Library', desc: 'AI research assistant' },
                ].map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-baseline justify-between py-2 group"
                    style={{ borderBottom: `1px solid ${RULE_COLOR}` }}
                  >
                    <span style={{ fontFamily: SERIF, fontSize: 13, color: INK }} className="group-hover:underline">
                      {tool.label}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}>
                      {tool.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── BY THE NUMBERS ── */}
            <div style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }} className="p-4">
              <p className="mb-3" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', color: CLAY, textTransform: 'uppercase' }}>
                By the Numbers
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { n: stats.officials, label: 'Officials' },
                  { n: stats.services, label: 'Services' },
                  { n: stats.policies, label: 'Policies' },
                  { n: stats.organizations, label: 'Organizations' },
                  { n: stats.resources, label: 'Articles' },
                  { n: stats.opportunities, label: 'Opportunities' },
                ].map(s => (
                  <div key={s.label}>
                    <span style={{ fontFamily: SERIF, fontSize: 20, color: INK }}>{s.n.toLocaleString()}</span>
                    <span className="block" style={{ fontFamily: MONO, fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── ABOUT ── */}
            <div className="text-center pt-2">
              <p style={{ fontFamily: SERIF, fontSize: 12, fontStyle: 'italic', color: MUTED, lineHeight: 1.6 }}>
                The Change Engine is a civic platform connecting Houston residents with resources, services, and civic participation.
              </p>
              <div className="flex justify-center gap-4 mt-3">
                <Link href="/about" style={{ fontFamily: MONO, fontSize: 10, color: CLAY, textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                  About
                </Link>
                <Link href="/contact" style={{ fontFamily: MONO, fontSize: 10, color: CLAY, textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                  Contact
                </Link>
                <Link href="/donate" style={{ fontFamily: MONO, fontSize: 10, color: CLAY, textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                  Support
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* ── FOOTER COLOPHON ── */}
        <div className="mt-10 mb-6" style={{ height: 2, background: INK }} />
        <div className="text-center pb-6">
          <p style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
            A project of <a href="https://www.thechangelab.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: CLAY }}>The Change Lab</a>. Built in Houston with love.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Section heading helpers ── */

function SectionHead({ label, href, linkLabel }: { label: string; href?: string; linkLabel?: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', color: CLAY, textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </h2>
        {href && linkLabel && (
          <Link href={href} style={{ fontFamily: MONO, fontSize: 10, color: MUTED }} className="hover:underline uppercase tracking-wider">
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
      <div style={{ height: 2, background: INK, marginBottom: 14 }} />
    </>
  )
}

function SidebarHead({ label, href, linkLabel }: { label: string; href?: string; linkLabel?: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <h3 style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.15em', color: CLAY, textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </h3>
        {href && linkLabel && (
          <Link href={href} style={{ fontFamily: MONO, fontSize: 10, color: MUTED }} className="hover:underline uppercase tracking-wider">
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
      <div style={{ height: 1, background: RULE_COLOR, marginBottom: 8 }} />
    </>
  )
}
