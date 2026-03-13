/**
 * @fileoverview Homepage — editorial civic briefing.
 *
 * Structure:
 * 1. Hero — dark ink, "THIS IS THE WAY IN." at display scale
 * 2. Stat block — newspaper data table
 * 3. Two-column newspaper layout (news wire + sidebar)
 * 4. Representatives, Library, Pathways
 * 5. Proof section — dark background, More in Common research
 * 6. Roadmap — where this is going
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
    <div className="min-h-screen">

      {/* ════════════════════════════════════════════
          HERO — Dark ink, display headline
          ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: '#0d1117' }}>
        {/* FOL motif — large, right side, subtle */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg
            viewBox="0 0 400 400"
            className="absolute"
            style={{
              right: '-5%',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 'min(500px, 80vw)',
              height: 'min(500px, 80vw)',
              opacity: 0.07,
            }}
          >
            {/* Seed of Life / Flower of Life pattern */}
            <circle cx="200" cy="200" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="200" cy="120" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="200" cy="280" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="269" cy="160" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="269" cy="240" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="131" cy="160" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
            <circle cx="131" cy="240" r="80" fill="none" stroke="#f4f5f7" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative max-w-[1080px] mx-auto px-6 py-16 sm:py-24 lg:py-32">
          <h1
            style={{
                            fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
            }}
          >
            THIS IS THE WAY IN.
          </h1>

          <div className="max-w-[640px] mt-6 sm:mt-8 space-y-4">
            <p
              style={{
                                fontSize: 'clamp(16px, 2vw, 20px)',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.6,
              }}
            >
              Houston has everything &mdash; the organizations, the officials, the resources, the people doing the work.
            </p>
            <p
              style={{
                                fontSize: 'clamp(16px, 2vw, 20px)',
                fontStyle: 'italic',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.6,
              }}
            >
              Most people never find it. Not because they don&rsquo;t care. Because nobody showed them the door.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-8 sm:mt-10">
            <Link
              href="/pathways"
              className="inline-block transition-opacity hover:opacity-90"
              style={{
                background: '#1b5e8a',
                color: '#FFFFFF',
                                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.75rem 1.5rem',
              }}
            >
              Find your way in
            </Link>
            <Link
              href="/about"
              style={{
                                fontSize: 'clamp(14px, 1.5vw, 16px)',
                color: 'rgba(255,255,255,0.5)',
              }}
              className="hover:underline"
            >
              What is this? &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          STAT BLOCK — Newspaper data table
          ════════════════════════════════════════════ */}
      <section style={{ background: "#f4f5f7", borderBottom: `1px solid ${'#dde1e8'}` }}>
        <div className="max-w-[1080px] mx-auto px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { n: stats.organizations, label: 'Organizations' },
              { n: stats.officials, label: 'Officials' },
              { n: stats.services, label: 'Services' },
              { n: stats.resources, label: 'Resources' },
            ].map(s => (
              <div key={s.label}>
                <span
                  style={{
                                        fontSize: 'clamp(36px, 5vw, 56px)',
                    fontWeight: 400,
                                        lineHeight: 1,
                    display: 'block',
                  }}
                >
                  {s.n.toLocaleString()}
                </span>
                <span
                  style={{
                                        fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: "#5c6474",
                    display: 'block',
                    marginTop: '0.25rem',
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            {[
              { n: 7, label: 'Pathways' },
              { n: 18, label: 'Counties' },
              { n: 3, label: 'Languages' },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span style={{ fontSize: 20, fontWeight: 400,  }}>{s.n}</span>
                <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: "#5c6474" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4" style={{ fontSize: 14, fontStyle: 'italic', color: "#5c6474" }}>
            Everything here already existed. We just made it findable.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          MASTHEAD — Edition, date, greeting
          ════════════════════════════════════════════ */}
      <div style={{ background: "#f4f5f7", borderBottom: `2px solid #0d1117` }}>
        <div className="max-w-[1080px] mx-auto px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 10, letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
              {editionNum}
            </p>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
              Houston, Texas
            </p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1" style={{ height: 2, background: '#0d1117' }} />
            <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {dateStr}
            </p>
            <div className="flex-1" style={{ height: 2, background: '#0d1117' }} />
          </div>
          {zip && neighborhood && (
            <p className="text-center mt-2" style={{ fontSize: 15, color: "#5c6474" }}>
              {greeting}, <span style={{ color: "#1b5e8a", fontWeight: 600 }}>{neighborhood.neighborhood_name || zip}</span>
            </p>
          )}
          {/* Pathway spectrum bar */}
          <div className="flex mt-3 gap-px overflow-hidden" style={{ height: 4 }}>
            {pathwayList.map(pw => (
              <Link key={pw.id} href={`/pathways/${pw.slug}`} className="flex-1 hover:opacity-80 transition-opacity" style={{ background: pw.color }} />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          NEWSPAPER — Two-column editorial layout
          ════════════════════════════════════════════ */}
      <div className="bg-paper">
        <div className="max-w-[1080px] mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">

            {/* LEFT COLUMN */}
            <div>

              {/* ── LEAD STORY ── */}
              {news.length > 0 && (
                <section>
                  <SectionHead label="The Wire" href="/news" linkLabel="All news" />

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
                    <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', lineHeight: 1.2 }} className="group-hover:underline">
                      {news[0].title_6th_grade || 'Untitled'}
                    </h2>
                    {news[0].summary_6th_grade && (
                      <p className="mt-1.5 line-clamp-3" style={{ fontSize: 15, color: "#5c6474", lineHeight: 1.65 }}>
                        {news[0].summary_6th_grade}
                      </p>
                    )}
                    <p className="mt-1.5" style={{ fontSize: 10, color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {news[0].source_domain} &middot; {formatDate(news[0].published_at)}
                    </p>
                  </Link>

                  {/* Secondary stories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {news.slice(1, 5).map(item => (
                      <Link key={item.id} href={`/content/${item.id}`} className="group block" style={{ borderTop: `1px solid ${'#dde1e8'}`, paddingTop: 10 }}>
                        <h3 style={{ fontSize: 15, lineHeight: 1.35 }} className="group-hover:underline line-clamp-2">
                          {item.title_6th_grade || 'Untitled'}
                        </h3>
                        {item.summary_6th_grade && (
                          <p className="mt-1 line-clamp-2" style={{ fontSize: 13, color: "#5c6474", lineHeight: 1.5 }}>
                            {item.summary_6th_grade}
                          </p>
                        )}
                        <p className="mt-1" style={{ fontSize: 10, color: "#5c6474" }}>
                          {item.source_domain} &middot; {formatDate(item.published_at)}
                        </p>
                      </Link>
                    ))}
                  </div>

                  {/* Third tier — compact */}
                  {news.length > 5 && (
                    <div className="mt-4" style={{ borderTop: `1px solid ${'#dde1e8'}`, paddingTop: 10 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {news.slice(5, 9).map(item => (
                          <Link key={item.id} href={`/content/${item.id}`} className="group flex items-baseline gap-2 py-1">
                            <span style={{ fontSize: 8, color: "#1b5e8a" }}>&bull;</span>
                            <span style={{ fontSize: 13,  }} className="group-hover:underline line-clamp-1">
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
                <div className="my-8 py-5 px-6" style={{ borderTop: `2px solid #0d1117`, borderBottom: `2px solid #0d1117` }}>
                  <p style={{ fontSize: 18, lineHeight: 1.5, fontStyle: 'italic', textAlign: 'center' }}>
                    &ldquo;{quote.quote_text}&rdquo;
                  </p>
                  {quote.attribution && (
                    <p className="mt-2 text-center" style={{ fontSize: 11, color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                      <Link key={rep.official_id} href={`/officials/${rep.official_id}`} className="group block text-center p-2" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
                        {rep.photo_url ? (
                          <Image src={rep.photo_url} alt="" width={48} height={48} className="rounded-full mx-auto mb-1.5 object-cover" style={{ width: 48, height: 48 }} />
                        ) : (
                          <div className="w-12 h-12 rounded-full mx-auto mb-1.5 flex items-center justify-center" style={{ background: '#dde1e8' }}>
                            <span style={{ fontSize: 18, color: "#5c6474" }}>{(rep.official_name || '?')[0]}</span>
                          </div>
                        )}
                        <p style={{ fontSize: 11, lineHeight: 1.2 }} className="group-hover:underline line-clamp-1">
                          {rep.official_name}
                        </p>
                        <p style={{ fontSize: 9, color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                      <Link key={doc.id} href={`/library/doc/${doc.id}`} className="group block p-4" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
                        <p style={{ fontSize: 9, color: "#1b5e8a", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {doc.page_count ? `${doc.page_count} pages` : 'Research'}
                        </p>
                        <h3 className="mt-1 group-hover:underline line-clamp-2" style={{ fontSize: 15, lineHeight: 1.3 }}>
                          {doc.title}
                        </h3>
                        {doc.summary && (
                          <p className="mt-1 line-clamp-2" style={{ fontSize: 12, color: "#5c6474", lineHeight: 1.5 }}>
                            {doc.summary}
                          </p>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 3).map((tag: string) => (
                              <span key={tag} style={{ fontSize: 9, color: "#5c6474", background: 'rgba(196,102,58,0.08)', padding: '1px 6px' }}>
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
                      <div className="w-3 h-3 flex-shrink-0" style={{ background: pw.color }} />
                      <span style={{ fontSize: 13,  }} className="group-hover:underline">
                        {pw.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN — Sidebar */}
            <aside className="space-y-6">

              {/* ── ELECTION COUNTDOWN ── */}
              {nextElection && (
                <div style={{ background: '#0d1117', color: '#fff' }} className="p-5">
                  <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                    Next Election
                  </p>
                  <p className="mt-2" style={{ fontSize: 17, lineHeight: 1.25 }}>
                    {nextElection.election_name}
                  </p>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span style={{ fontSize: 42, lineHeight: 1 }}>
                      {daysUntil(nextElection.election_date)}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      days
                    </span>
                  </div>
                  <p className="mt-1" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                    {formatDate(nextElection.election_date)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href="/elections"
                      className="flex-1 text-center py-2 text-xs uppercase tracking-wider transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
                    >
                      Details
                    </Link>
                    <Link
                      href="/polling-places"
                      className="flex-1 text-center py-2 text-xs uppercase tracking-wider transition-colors"
                      style={{ border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
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
                      <div key={evt.id || evt.event_id} style={{ borderLeft: `3px solid #1b5e8a`, paddingLeft: 10 }}>
                        <p style={{ fontSize: 10, color: "#1b5e8a", textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {formatDate(evt.date || evt.start_datetime)}
                        </p>
                        <p style={{ fontSize: 13, lineHeight: 1.3 }}>
                          {evt.title || evt.event_name}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: "#5c6474", fontStyle: 'italic' }}>No upcoming events</p>
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
                      style={{ borderBottom: `1px solid ${'#dde1e8'}` }}
                    >
                      <span style={{ fontSize: 13,  }} className="group-hover:underline">
                        {tool.label}
                      </span>
                      <span style={{ fontSize: 9, color: "#5c6474" }}>
                        {tool.desc}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* ── ABOUT ── */}
              <div className="text-center pt-2">
                <p style={{ fontSize: 12, fontStyle: 'italic', color: "#5c6474", lineHeight: 1.6 }}>
                  The Change Engine is a civic platform connecting Houston residents with resources, services, and civic participation.
                </p>
                <div className="flex justify-center gap-4 mt-3">
                  <Link href="/about" style={{ fontSize: 10, color: "#1b5e8a", textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                    About
                  </Link>
                  <Link href="/contact" style={{ fontSize: 10, color: "#1b5e8a", textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                    Contact
                  </Link>
                  <Link href="/donate" style={{ fontSize: 10, color: "#1b5e8a", textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:underline">
                    Support
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          PROOF SECTION — Dark background, research
          ════════════════════════════════════════════ */}
      <section style={{ background: '#0d1117' }}>
        <div className="max-w-[1080px] mx-auto px-6 py-14 sm:py-20">
          <div className="max-w-[720px]">
            <p
              style={{
                                fontSize: 'clamp(20px, 3vw, 28px)',
                color: '#FFFFFF',
                lineHeight: 1.35,
                fontWeight: 400,
              }}
            >
              Most people want to help.<br />
              The #1 barrier is a lack of opportunity.
            </p>

            <p className="mt-6" style={{ fontSize: 'clamp(15px, 1.8vw, 17px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
              In 2025, More in Common surveyed 6,000 Americans on social connection. Houston outperformed the national average on every measure of willingness to connect across difference.
            </p>
          </div>

          {/* Pull quote */}
          <div className="my-10 sm:my-14 py-6" style={{ borderTop: `1px solid rgba(255,255,255,0.15)`, borderBottom: `1px solid rgba(255,255,255,0.15)` }}>
            <p
              style={{
                                fontSize: 'clamp(22px, 3.5vw, 32px)',
                color: '#FFFFFF',
                lineHeight: 1.3,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              &ldquo;The problem was never motivation.<br />
              It was always the on-ramp.&rdquo;
            </p>
          </div>

          <Link
            href="/library/doc/4c4505ec-6dc3-4c6c-a4a2-10f754a79073"
            style={{
                            fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: "#1b5e8a",
            }}
            className="hover:underline"
          >
            Read the research &rarr;
          </Link>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          ROADMAP — Where this is going
          ════════════════════════════════════════════ */}
      <section className="bg-paper">
        <div className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16">
          <h2
            style={{
                            fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 400,
                            marginBottom: '2rem',
            }}
          >
            Where this is going
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              {
                quarter: 'Q2 2026',
                text: 'Full Change Engine launch \u2014 164 focus areas, mapped to 7 themes and 17 UN SDGs. Every topic connected to resources, officials, news, and action.',
              },
              {
                quarter: 'Q3 2026',
                text: '18-county neighborhood build-out. Granular data for every Houston neighborhood \u2014 who represents you, what\u2019s available, what\u2019s happening.',
              },
              {
                quarter: 'Q4 2026',
                text: 'Mobile-optimized experience. 211 API integration for real-time service availability. National replication framework.',
              },
              {
                quarter: '2027',
                text: 'The first city outside Houston runs this model.',
              },
            ].map(item => (
              <div key={item.quarter} style={{ borderLeft: `3px solid #1b5e8a`, paddingLeft: 16 }}>
                <p style={{ fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: "#1b5e8a", fontWeight: 700 }}>
                  {item.quarter}
                </p>
                <p className="mt-2" style={{ fontSize: 15, lineHeight: 1.6 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/partner"
              className="inline-block transition-opacity hover:opacity-90"
              style={{
                background: '#1b5e8a',
                color: '#FFFFFF',
                                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0.625rem 1.25rem',
              }}
            >
              Partner with us
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER COLOPHON ── */}
      <div className="bg-paper">
        <div className="max-w-[1080px] mx-auto px-6">
          <div style={{ height: 2, background: '#0d1117' }} />
          <div className="text-center py-6">
            <p style={{ fontSize: 13, fontStyle: 'italic', color: "#5c6474" }}>
              A project of <a href="https://www.thechangelab.net" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#1b5e8a" }}>The Change Lab</a>. Built in Houston with love.
            </p>
          </div>
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
        <h2 style={{ fontSize: 11, letterSpacing: '0.15em', color: "#1b5e8a", textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </h2>
        {href && linkLabel && (
          <Link href={href} style={{ fontSize: 10, color: "#5c6474" }} className="hover:underline uppercase tracking-wider">
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
      <div style={{ height: 2, background: '#0d1117', marginBottom: 14 }} />
    </>
  )
}

function SidebarHead({ label, href, linkLabel }: { label: string; href?: string; linkLabel?: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between mb-1">
        <h3 style={{ fontSize: 10, letterSpacing: '0.15em', color: "#1b5e8a", textTransform: 'uppercase', fontWeight: 700 }}>
          {label}
        </h3>
        {href && linkLabel && (
          <Link href={href} style={{ fontSize: 10, color: "#5c6474" }} className="hover:underline uppercase tracking-wider">
            {linkLabel} &rarr;
          </Link>
        )}
      </div>
      <div style={{ height: 1, background: '#dde1e8', marginBottom: 8 }} />
    </>
  )
}
