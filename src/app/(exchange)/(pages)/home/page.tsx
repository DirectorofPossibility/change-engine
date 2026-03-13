/**
 * @fileoverview Homepage — newspaper-style civic briefing.
 *
 * Shows the full depth of the platform at a glance:
 * - ZIP prompt (if not set) or personalized greeting
 * - Latest news headlines
 * - Upcoming events + election countdown
 * - 7 pathways as a compact bar
 * - Platform stats
 * - Quick links to key tools (map, officials, services, etc.)
 *
 * @route GET /home
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getExchangeStats } from '@/lib/data/homepage'
import { getNewsFeed } from '@/lib/data/content'
import { getUpcomingEvents } from '@/lib/data/events'
import { getNextElection } from '@/lib/data/elections'
import { getOfficialsByZip } from '@/lib/data/officials'
import { getNeighborhoodByZip } from '@/lib/data/geography'
import { THEMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Community Guide — Change Engine',
  description: 'Your personalized guide to Houston civic life. Officials, services, policies, events, and more.',
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

  // Parallel data fetch
  const [stats, news, upcomingEvents, nextElection, neighborhood, zipOfficials] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 6),
    getUpcomingEvents(4),
    getNextElection(),
    zip ? getNeighborhoodByZip(zip) : Promise.resolve(null),
    zip ? getOfficialsByZip(zip) : Promise.resolve(null),
  ])

  const yourReps = zipOfficials
    ? [...zipOfficials.federal, ...zipOfficials.state, ...zipOfficials.county, ...zipOfficials.city].slice(0, 4)
    : []

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const pathwayList = Object.entries(THEMES).map(([id, t]) => ({
    id,
    name: (t as any).name,
    color: (t as any).color,
    slug: (t as any).slug,
  }))

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">

      {/* ── MASTHEAD ── */}
      <header style={{ background: PARCHMENT_WARM, borderBottom: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[1000px] mx-auto px-6 pt-8 pb-6">
          {/* Date line */}
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: MUTED, textTransform: 'uppercase' }}>
            {dateStr}
          </p>

          {/* Title */}
          <h1 className="mt-3" style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 5vw, 44px)', color: INK, lineHeight: 1.1 }}>
            {zip && neighborhood
              ? <>{greeting}, <span style={{ color: CLAY }}>{neighborhood.neighborhood_name || zip}</span></>
              : 'Your Houston Community Guide'
            }
          </h1>

          <p className="mt-2" style={{ fontFamily: SERIF, fontSize: 16, color: MUTED, maxWidth: 520, lineHeight: 1.6 }}>
            {zip
              ? 'Here\u2019s what\u2019s happening in your area today.'
              : 'Officials, services, policies, events \u2014 everything civic, in one place. Set your ZIP code to personalize.'
            }
          </p>

          {/* Pathway spectrum bar */}
          <div className="flex mt-5 gap-px overflow-hidden" style={{ borderRadius: 2, height: 4 }}>
            {pathwayList.map(pw => (
              <div key={pw.id} className="flex-1" style={{ background: pw.color }} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto px-6 py-8">

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">

          {/* ═══ LEFT COLUMN — Headlines + Content ═══ */}
          <div>

            {/* ── THE WIRE — Latest News ── */}
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                  The Wire
                </h2>
                <Link href="/news" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }} className="hover:underline uppercase tracking-wider">
                  All news &rarr;
                </Link>
              </div>
              <div style={{ height: 2, background: INK, marginBottom: 16 }} />

              {news.length > 0 && (
                <>
                  {/* Lead story */}
                  <Link href={`/content/${news[0].id}`} className="block group mb-6">
                    {news[0].image_url && (
                      <div className="relative aspect-[2/1] mb-3 overflow-hidden">
                        <Image
                          src={news[0].image_url}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    )}
                    <h3 style={{ fontFamily: SERIF, fontSize: 'clamp(20px, 3vw, 26px)', color: INK, lineHeight: 1.25 }} className="group-hover:underline">
                      {news[0].title_6th_grade || 'Untitled'}
                    </h3>
                    {news[0].summary_6th_grade && (
                      <p className="mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.6 }}>
                        {news[0].summary_6th_grade}
                      </p>
                    )}
                    <p className="mt-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                      {news[0].source_domain} &middot; {formatDate(news[0].published_at)}
                    </p>
                  </Link>

                  {/* Secondary stories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {news.slice(1, 5).map(item => (
                      <Link key={item.id} href={`/content/${item.id}`} className="group block">
                        <div style={{ borderTop: `1px solid ${RULE_COLOR}`, paddingTop: 12 }}>
                          <h4 style={{ fontFamily: SERIF, fontSize: 15, color: INK, lineHeight: 1.35 }} className="group-hover:underline">
                            {item.title_6th_grade || 'Untitled'}
                          </h4>
                          <p className="mt-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                            {item.source_domain} &middot; {formatDate(item.published_at)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* ── YOUR REPRESENTATIVES (if ZIP set) ── */}
            {yourReps.length > 0 && (
              <section className="mt-10">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                    Your Representatives
                  </h2>
                  <Link href="/officials" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }} className="hover:underline uppercase tracking-wider">
                    All officials &rarr;
                  </Link>
                </div>
                <div style={{ height: 1, background: RULE_COLOR, marginBottom: 12 }} />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {yourReps.map((rep: any) => (
                    <Link key={rep.official_id} href={`/officials/${rep.official_id}`} className="group block text-center p-3" style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }}>
                      {rep.photo_url ? (
                        <Image src={rep.photo_url} alt="" width={56} height={56} className="rounded-full mx-auto mb-2 object-cover" style={{ width: 56, height: 56 }} />
                      ) : (
                        <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: RULE_COLOR }}>
                          <span style={{ fontFamily: SERIF, fontSize: 20, color: MUTED }}>{(rep.official_name || '?')[0]}</span>
                        </div>
                      )}
                      <p style={{ fontFamily: SERIF, fontSize: 13, color: INK, lineHeight: 1.3 }} className="group-hover:underline">
                        {rep.official_name}
                      </p>
                      <p style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {rep.title || rep.level}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── EXPLORE BY TOPIC ── */}
            <section className="mt-10">
              <h2 className="mb-3" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                Explore by Topic
              </h2>
              <div style={{ height: 1, background: RULE_COLOR, marginBottom: 12 }} />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pathwayList.map(pw => (
                  <Link
                    key={pw.id}
                    href={`/pathways/${pw.slug}`}
                    className="group flex items-center gap-2 px-3 py-3 transition-colors"
                    style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: pw.color }} />
                    <span style={{ fontFamily: SERIF, fontSize: 14, color: INK }} className="group-hover:underline">
                      {pw.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* ═══ RIGHT COLUMN — Sidebar ═══ */}
          <aside className="space-y-8">

            {/* ── ELECTION COUNTDOWN ── */}
            {nextElection && (
              <div style={{ background: INK, color: '#fff' }} className="p-5">
                <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                  Next Election
                </p>
                <p className="mt-2" style={{ fontFamily: SERIF, fontSize: 18 }}>
                  {nextElection.election_name}
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span style={{ fontFamily: SERIF, fontSize: 36, lineHeight: 1 }}>
                    {daysUntil(nextElection.election_date)}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    days
                  </span>
                </div>
                <p className="mt-2" style={{ fontFamily: MONO, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {formatDate(nextElection.election_date)}
                </p>
                <Link
                  href="/elections"
                  className="inline-block mt-3 px-4 py-2 text-xs uppercase tracking-wider transition-colors"
                  style={{ fontFamily: MONO, border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  Election details &rarr;
                </Link>
              </div>
            )}

            {/* ── COMING UP ── */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <h3 style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                  Coming Up
                </h3>
                <Link href="/calendar" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }} className="hover:underline uppercase tracking-wider">
                  Calendar &rarr;
                </Link>
              </div>
              <div style={{ height: 1, background: RULE_COLOR, marginBottom: 8 }} />

              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((evt: any) => (
                    <div key={evt.id || evt.event_id} style={{ borderLeft: `3px solid ${CLAY}`, paddingLeft: 10 }}>
                      <p style={{ fontFamily: MONO, fontSize: 11, color: CLAY }}>
                        {formatDate(evt.date || evt.start_datetime)}
                      </p>
                      <p style={{ fontFamily: SERIF, fontSize: 14, color: INK, lineHeight: 1.35 }}>
                        {evt.title || evt.event_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, fontStyle: 'italic' }}>
                  No upcoming events
                </p>
              )}
            </div>

            {/* ── QUICK TOOLS ── */}
            <div>
              <h3 className="mb-2" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                Quick Tools
              </h3>
              <div style={{ height: 1, background: RULE_COLOR, marginBottom: 8 }} />

              <div className="space-y-1">
                {[
                  { href: '/geography', label: 'Interactive Map', desc: 'Explore by geography' },
                  { href: '/officials/lookup', label: 'Find Your Reps', desc: 'Enter ZIP, see who represents you' },
                  { href: '/services', label: 'Find Services', desc: `${stats.services} community resources` },
                  { href: '/compass', label: 'Civic Compass', desc: 'Personalized guide' },
                  { href: '/call-your-senators', label: 'Call Your Senators', desc: 'Make your voice heard' },
                  { href: '/polling-places', label: 'Polling Places', desc: 'Find where to vote' },
                ].map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-baseline justify-between py-2 group"
                    style={{ borderBottom: `1px solid ${RULE_COLOR}` }}
                  >
                    <span style={{ fontFamily: SERIF, fontSize: 14, color: INK }} className="group-hover:underline">
                      {tool.label}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED }}>
                      {tool.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── BY THE NUMBERS ── */}
            <div style={{ background: PARCHMENT_WARM, border: `1px solid ${RULE_COLOR}` }} className="p-5">
              <h3 className="mb-3" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
                By the Numbers
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: stats.officials, label: 'Officials' },
                  { n: stats.services, label: 'Services' },
                  { n: stats.policies, label: 'Policies' },
                  { n: stats.organizations, label: 'Organizations' },
                  { n: stats.resources, label: 'Articles' },
                  { n: stats.opportunities, label: 'Opportunities' },
                ].map(s => (
                  <div key={s.label}>
                    <span style={{ fontFamily: SERIF, fontSize: 22, color: INK }}>{s.n.toLocaleString()}</span>
                    <span className="block" style={{ fontFamily: MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* ── FOOTER RULE ── */}
        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
        <div className="text-center pb-8">
          <p style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: MUTED }}>
            Change Engine is a project of <a href="https://www.thechangelab.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: CLAY }}>The Change Lab</a>. Built in Houston.
          </p>
        </div>
      </div>
    </div>
  )
}
