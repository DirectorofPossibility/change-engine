/**
 * @fileoverview Center detail page — editorial culture-guide style.
 *
 * Learning, Action, and Resource centers show content shelves.
 * Accountability center is a real accountability dashboard:
 * officials, active policies, spending, civic calendar, elections.
 *
 * @route GET /centers/:slug
 * @caching ISR with revalidate = 3600 (1 hour)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { ContentShelf, type ShelfItem } from '@/components/exchange/ContentShelf'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable, getNextElection } from '@/lib/data/exchange'
import { getOfficialsByZip } from '@/lib/data/officials'
import { getPoliciesByZip } from '@/lib/data/policies'
import { getUpcomingEvents } from '@/lib/data/events'
import { getEntitiesByCenter } from '@/lib/data/entity-graph'
import type { ContentPublished } from '@/lib/types/exchange'
import { ZipInput } from '@/components/exchange/ZipInput'
import {
  Phone, Mail, Globe as GlobeIcon, ExternalLink, ArrowRight,
  Calendar, Scale, Building2, DollarSign, Users, MapPin,
} from 'lucide-react'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'

// ── Design tokens ─────────────────────────────────────────────────────

const PARCHMENT_LIGHT = '#f4f5f7'

// ── Center metadata ──────────────────────────────────────────────────

const CENTER_META: Record<string, {
  motif: string
  tagline: string
  description: string
  question: string
  relatedLinks: Array<{ label: string; href: string }>
}> = {
  Learning: {
    motif: '/images/fol/vesica-piscis.svg',
    tagline: 'Knowledge is the first step.',
    description: 'Understand what is happening in your community. Read research, explore data, follow the news, and learn how the issues that shape Houston connect to your daily life.',
    question: 'How can I understand?',
    relatedLinks: [
      { label: 'News Feed', href: '/news' },
      { label: 'Library', href: '/library' },
      { label: 'Learning Paths', href: '/learning-paths' },
      { label: 'Search Everything', href: '/search' },
    ],
  },
  Action: {
    motif: '/images/fol/tripod-of-life.svg',
    tagline: 'Your energy can change things.',
    description: 'Put your energy into motion. Volunteer, attend events, sign petitions, join campaigns, and organize with your neighbors. Houston moves when you do.',
    question: 'How can I help?',
    relatedLinks: [
      { label: 'Events Calendar', href: '/events' },
      { label: 'Opportunities', href: '/opportunities' },
      { label: 'Organizations', href: '/organizations' },
      { label: 'Donate', href: '/donate' },
    ],
  },
  Resource: {
    motif: '/images/fol/seed-of-life.svg',
    tagline: 'Your community has resources waiting.',
    description: 'Discover what\u2019s available. Services, benefits, hotlines, and organizations ready to support you. Houston has resources waiting.',
    question: "What's available to me?",
    relatedLinks: [
      { label: 'Services', href: '/services' },
      { label: 'Organizations', href: '/organizations' },
      { label: 'Polling Places', href: '/polling-places' },
      { label: 'Search Everything', href: '/search' },
    ],
  },
  Accountability: {
    motif: '/images/fol/metatrons-cube.svg',
    tagline: 'Follow the trail.',
    description: 'Know who has power over your life and whether they are using it well. Track your elected officials, follow active legislation, see where federal money goes, and know when to show up.',
    question: 'Who is accountable to you?',
    relatedLinks: [
      { label: 'All Officials', href: '/officials' },
      { label: 'All Policies', href: '/policies' },
      { label: 'Elections', href: '/elections' },
      { label: 'TIRZ Zones', href: '/tirz' },
    ],
  },
}

// ── Route helpers ─────────────────────────────────────────────────────

function resolveCenter(slug: string) {
  for (const [name, config] of Object.entries(CENTERS)) {
    if (config.slug === slug) return { name, ...config }
  }
  return null
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const center = resolveCenter(slug)
  if (!center) return { title: 'Center Not Found' }
  const meta = CENTER_META[center.name]
  return {
    title: `${center.name} Center — The Community Exchange | The Change Engine`,
    description: meta?.description || `Explore ${center.name} resources in the Houston Community Exchange.`,
  }
}

export default async function CenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const center = resolveCenter(slug)
  if (!center) notFound()

  const meta = CENTER_META[center.name] || CENTER_META.Learning
  const centerColor = CENTER_COLORS[center.name] || '#8B7E74'

  // ── ACCOUNTABILITY CENTER: completely different page ──
  if (center.name === 'Accountability') {
    return <AccountabilityCenter meta={meta} centerColor={centerColor} />
  }

  // ── STANDARD CENTER: content shelves ──
  return <StandardCenter centerName={center.name} meta={meta} centerColor={centerColor} />
}


/* ═══════════════════════════════════════════════════════════════════════
   ACCOUNTABILITY CENTER — Real dashboard
   ═══════════════════════════════════════════════════════════════════════ */

async function AccountabilityCenter({ meta, centerColor }: { meta: typeof CENTER_META.Accountability; centerColor: string }) {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || undefined
  const supabase = await createClient()

  // Parallel data fetch
  const [
    officialsByZip,
    policiesByZip,
    allPoliciesResult,
    spendingResult,
    civicEventsResult,
    nextElection,
    accountabilityContent,
  ] = await Promise.all([
    zip ? getOfficialsByZip(zip) : Promise.resolve(null),
    zip ? getPoliciesByZip(zip) : Promise.resolve({ federal: [], state: [], city: [] }),
    // Recent policies across all levels
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number, last_action_date, last_action')
      .eq('is_published', true)
      .order('last_action_date', { ascending: false })
      .limit(10),
    // Federal spending entries — filtered by ZIP districts when available
    (async () => {
      if (zip) {
        const byZip = await getPoliciesByZip(zip)
        const allZipPolicies = [...byZip.federal, ...byZip.state, ...byZip.city]
        const spending = allZipPolicies.filter((p: any) => p.policy_type && p.policy_type.includes('Spending'))
        if (spending.length > 0) return { data: spending.slice(0, 6) }
      }
      // Fallback: all federal spending
      return supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, impact_statement, level, status, last_action_date')
        .eq('level', 'Federal')
        .like('policy_type', '%Spending%')
        .order('last_action_date', { ascending: false })
        .limit(6)
    })(),
    // Upcoming civic calendar events (meetings, hearings)
    supabase
      .from('civic_calendar')
      .select('event_id, event_name, event_type, description_5th_grade, date_start, time_start, location_name, is_virtual, virtual_url')
      .eq('is_active', 'Yes')
      .gte('date_start', new Date().toISOString().split('T')[0])
      .order('date_start', { ascending: true })
      .limit(6),
    getNextElection(),
    // Content tagged to Accountability center
    supabase
      .from('content_published')
      .select('id, slug, title_6th_grade, summary_6th_grade, pathway_primary, source_domain, published_at, image_url')
      .eq('is_active', true)
      .eq('center', 'Accountability')
      .order('published_at', { ascending: false })
      .limit(6),
  ])

  const officials = officialsByZip
  const allOfficials = officials ? [...officials.federal, ...officials.state, ...officials.county, ...officials.city] : []
  const policies = policiesByZip
  const allUserPolicies = [...(policies.federal || []), ...(policies.state || []), ...(policies.city || [])]
  const recentPolicies = allPoliciesResult.data || []
  const spending = (spendingResult as any).data || []
  const civicEvents = civicEventsResult.data || []
  const content = accountabilityContent.data || []

  // Group officials by level for display
  const LEVEL_ORDER = ['City', 'County', 'State', 'Federal']

  return (
    <div style={{ background: '#ffffff' }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none" aria-hidden="true">
          <Image src={meta.motif} alt="" width={500} height={500} className="opacity-[0.06] mr-[-60px]" />
        </div>
        <div style={{ height: 3, background: centerColor }} />
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-20">
          <nav aria-label="Breadcrumb">
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/" className="hover:underline" style={{ color: "#5c6474" }}>Guide</Link>
              <span style={{ color: "#5c6474" }}> / </span>
              <Link href="/centers" className="hover:underline" style={{ color: "#5c6474" }}>Centers</Link>
              <span style={{ color: "#5c6474" }}> / </span>
              <span style={{ color: "#1b5e8a" }}>Accountability</span>
            </p>
          </nav>

          <p className="mt-8" style={{ fontSize: 12, letterSpacing: '0.12em', color: centerColor, textTransform: 'uppercase' }}>
            Accountability Center
          </p>

          <h1 className="mt-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15, maxWidth: 600 }}>
            {meta.question}
          </h1>

          <p className="mt-4" style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontStyle: 'italic', color: "#5c6474", maxWidth: 520 }}>
            {meta.tagline}
          </p>

          <p className="mt-6" style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 560, opacity: 0.85 }}>
            {meta.description}
          </p>

          <div className="mt-8" style={{ width: 60, height: 2, background: centerColor }} />
        </div>
      </section>

      {/* ── ZIP PROMPT (if no ZIP) or neighborhood label ── */}
      <section style={{ background: "#f4f5f7", borderBottom: `1px solid ${'#dde1e8'}` }}>
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          {zip ? (
            <div className="flex items-center gap-3">
              <MapPin size={16} style={{ color: "#1b5e8a" }} />
              <span style={{ fontSize: 15,  }}>
                Showing accountability data for ZIP <strong style={{ color: "#1b5e8a" }}>{zip}</strong>
              </span>
              <span style={{ fontSize: 11, color: "#5c6474", marginLeft: 'auto' }}>
                Change your ZIP to update
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p style={{ fontSize: 15,  }}>
                  Enter your ZIP code to see <strong>your</strong> officials, <strong>your</strong> policies, and <strong>your</strong> power structure.
                </p>
              </div>
              <div className="sm:w-[260px]">
                <ZipInput />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-12">

        {/* ═══════════════════════════════════════════════════════════════
            1. WHO HAS POWER — Your Officials
            ═══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
                Who Has Power Over You
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
                {zip ? 'Your Elected Officials' : 'Elected Officials'}
              </h2>
            </div>
            <Link
              href="/officials"
              className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: "#1b5e8a" }}
            >
              All officials <ArrowRight size={12} />
            </Link>
          </div>

          {allOfficials.length > 0 ? (
            <>
              {LEVEL_ORDER.map(level => {
                const levelOfficials = allOfficials.filter(o => o.level === level)
                if (levelOfficials.length === 0) return null
                const levelColors: Record<string, string> = { Federal: '#1b5e8a', State: '#6a4e10', County: '#7a2018', City: '#4a2870' }
                const lColor = levelColors[level] || '#5c6474'
                return (
                  <div key={level} className="mb-6">
                    <p className="mb-2" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: lColor }}>
                      {level}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {levelOfficials.map((o: any) => (
                        <Link
                          key={o.official_id}
                          href={'/officials/' + o.official_id}
                          className="flex items-center gap-3 p-4 group transition-colors"
                          style={{ background: '#fff', border: '1px solid #dde1e8', borderLeft: `3px solid ${lColor}` }}
                        >
                          <div className="w-11 h-11 flex-shrink-0 overflow-hidden bg-paper">
                            {o.photo_url ? (
                              <Image src={o.photo_url} alt="" width={44} height={44} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ fontWeight: 700, fontSize: 16, color: "#5c6474" }}>
                                {o.official_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block group-hover:underline truncate" style={{ fontSize: 14, fontWeight: 600,  }}>
                              {o.official_name}
                            </span>
                            <span className="block truncate" style={{ fontSize: 11, color: "#5c6474" }}>
                              {o.title}{o.party ? ' · ' + o.party : ''}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {o.office_phone && (
                                <span className="inline-flex items-center gap-1" style={{ fontSize: 10, color: "#1b5e8a" }}>
                                  <Phone size={9} /> {o.office_phone}
                                </span>
                              )}
                              {o.email && (
                                <span className="inline-flex items-center gap-1" style={{ fontSize: 10, color: "#1b5e8a" }}>
                                  <Mail size={9} /> Email
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="p-6 text-center" style={{ background: '#f4f5f7', border: '1px solid #dde1e8' }}>
              <Building2 size={28} className="mx-auto mb-2" style={{ color: "#5c6474" }} />
              <p style={{ fontSize: 15, color: "#5c6474" }}>
                Enter your ZIP code above to see every official who represents you — from City Hall to Congress.
              </p>
              <Link
                href="/officials"
                className="inline-flex items-center gap-1 mt-3 transition-colors hover:opacity-70"
                style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: "#1b5e8a" }}
              >
                Browse all officials <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            2. WHAT THEY'RE DECIDING — Active Policies
            ═══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
                What They&rsquo;re Deciding
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
                {allUserPolicies.length > 0 ? 'Policies That Affect You' : 'Recent Policy Activity'}
              </h2>
            </div>
            <Link
              href="/policies"
              className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: "#1b5e8a" }}
            >
              All policies <ArrowRight size={12} />
            </Link>
          </div>

          {(() => {
            const displayPolicies = allUserPolicies.length > 0 ? allUserPolicies.slice(0, 8) : recentPolicies.slice(0, 8)
            const statusColors: Record<string, string> = {
              Active: '#1a6b56', Introduced: '#1e4d7a', Passed: '#1a6b56',
              Enacted: '#1a6b56', Failed: '#7a2018', Vetoed: '#7a2018',
            }
            return (
              <div style={{ border: '1px solid #dde1e8' }}>
                {displayPolicies.map((p: any, i: number) => (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    className="block p-4 transition-colors group"
                    style={{ background: '#fff', borderTop: i > 0 ? `1px solid ${'#dde1e8'}` : undefined }}
                  >
                    <div className="flex items-start gap-3">
                      <Scale size={16} className="flex-shrink-0 mt-1" style={{ color: statusColors[p.status] || '#5c6474' }} />
                      <div className="flex-1 min-w-0">
                        <span className="block group-hover:underline" style={{ fontSize: 15, fontWeight: 600 }}>
                          {p.title_6th_grade || p.policy_name}
                        </span>
                        {p.summary_5th_grade && (
                          <span className="block mt-1 line-clamp-2" style={{ fontSize: 13, lineHeight: 1.6, color: "#5c6474" }}>
                            {p.summary_5th_grade}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-2" style={{ fontSize: 11, color: "#5c6474" }}>
                          <span className="uppercase">{p.level}</span>
                          {p.status && (
                            <span className="px-1.5 py-0.5" style={{ background: (statusColors[p.status] || '#5c6474') + '18', color: statusColors[p.status] || '#5c6474', fontWeight: 600 }}>
                              {p.status}
                            </span>
                          )}
                          {p.bill_number && <span>{p.bill_number}</span>}
                          {p.last_action_date && (
                            <span>Updated {new Date(p.last_action_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          })()}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            3. WHERE THE MONEY GOES — Federal Spending
            ═══════════════════════════════════════════════════════════════ */}
        {spending.length > 0 && (
          <section>
            <div className="mb-5">
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
                Where the Money Goes
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
                Federal Spending in Harris County
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {spending.map((s: any) => (
                <Link
                  key={s.policy_id}
                  href={'/policies/' + s.policy_id}
                  className="block p-4 transition-colors group"
                  style={{ background: '#fff', border: '1px solid #dde1e8' }}
                >
                  <div className="flex items-start gap-3">
                    <DollarSign size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#1a6b56' }} />
                    <div className="min-w-0">
                      <span className="block group-hover:underline" style={{ fontSize: 14, fontWeight: 600,  }}>
                        {s.title_6th_grade || s.policy_name}
                      </span>
                      {s.impact_statement && (
                        <span className="block mt-1 line-clamp-2" style={{ fontSize: 12, lineHeight: 1.5, color: "#5c6474" }}>
                          {s.impact_statement}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            4. WHEN TO SHOW UP — Civic Calendar & Elections
            ═══════════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
                When to Show Up
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
                Meetings, Hearings &amp; Elections
              </h2>
            </div>
            <Link
              href="/calendar"
              className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
              style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: "#1b5e8a" }}
            >
              Full calendar <ArrowRight size={12} />
            </Link>
          </div>

          {/* Next election callout */}
          {nextElection && (
            <Link
              href="/elections"
              className="block p-5 mb-4 transition-colors group"
              style={{ background: '#f4f5f7', border: `2px solid ${centerColor}` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ background: centerColor + '18' }}>
                  <Users size={20} style={{ color: centerColor }} />
                </div>
                <div>
                  <span className="block group-hover:underline" style={{ fontSize: 17, fontWeight: 600 }}>
                    {nextElection.election_name}
                  </span>
                  <span className="block mt-1" style={{ fontSize: 11, color: centerColor }}>
                    {new Date(nextElection.election_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' '}&middot; {Math.max(0, Math.ceil((new Date(nextElection.election_date).getTime() - Date.now()) / 86400000))} days away
                  </span>
                </div>
              </div>
            </Link>
          )}

          {/* Civic events */}
          {civicEvents.length > 0 ? (
            <div style={{ border: '1px solid #dde1e8' }}>
              {civicEvents.map((e: any, i: number) => (
                <div
                  key={e.event_id}
                  className="p-4"
                  style={{ background: '#fff', borderTop: i > 0 ? `1px solid ${'#dde1e8'}` : undefined }}
                >
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="flex-shrink-0 mt-1" style={{ color: "#1b5e8a" }} />
                    <div className="min-w-0">
                      <span className="block" style={{ fontSize: 14, fontWeight: 600,  }}>
                        {e.event_name}
                      </span>
                      <div className="flex items-center gap-3 mt-1" style={{ fontSize: 11, color: "#5c6474" }}>
                        {e.date_start && (
                          <span>
                            {new Date(e.date_start + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {e.time_start && ' at ' + e.time_start}
                          </span>
                        )}
                        {e.location_name && <span>&middot; {e.location_name}</span>}
                        {e.is_virtual === 'Yes' && <span style={{ color: "#1b5e8a" }}>&middot; Virtual</span>}
                      </div>
                      {e.description_5th_grade && (
                        <span className="block mt-1 line-clamp-1" style={{ fontSize: 13, color: "#5c6474" }}>
                          {e.description_5th_grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center" style={{ background: '#f4f5f7', border: '1px solid #dde1e8' }}>
              <Calendar size={24} className="mx-auto mb-2" style={{ color: "#5c6474" }} />
              <p style={{ fontSize: 14, color: "#5c6474" }}>No upcoming government meetings scheduled.</p>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            5. HOW TO MAKE THEM LISTEN — Tools & Actions
            ═══════════════════════════════════════════════════════════════ */}
        <section>
          <p className="mb-3" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
            How to Make Them Listen
          </p>
          <h2 className="mb-5" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
            Your Tools
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { href: '/officials/lookup', label: 'Find Your Reps', description: 'Look up every official by address or ZIP', icon: Building2, color: '#1b5e8a' },
              { href: '/call-your-senators', label: 'Call Your Senators', description: 'Scripts and phone numbers ready to go', icon: Phone, color: '#7a2018' },
              { href: '/elections', label: 'Elections & Voting', description: 'Deadlines, polling places, and what is on your ballot', icon: Users, color: '#1a6b56' },
              { href: '/districts', label: 'Your Districts', description: 'See every district boundary that covers your address', icon: MapPin, color: '#4a2870' },
            ].map(tool => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="block p-5 transition-colors group"
                  style={{ background: '#fff', border: '1px solid #dde1e8', borderTop: `3px solid ${tool.color}` }}
                >
                  <Icon size={20} className="mb-3" style={{ color: tool.color }} />
                  <span className="block group-hover:underline" style={{ fontSize: 15, fontWeight: 600 }}>
                    {tool.label}
                  </span>
                  <span className="block mt-1" style={{ fontSize: 13, lineHeight: 1.5, color: "#5c6474" }}>
                    {tool.description}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════
            6. FROM THE EXCHANGE — Accountability content
            ═══════════════════════════════════════════════════════════════ */}
        {content.length > 0 && (
          <section>
            <p className="mb-3" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: "#1b5e8a" }}>
              From the Exchange
            </p>
            <h2 className="mb-5" style={{ fontSize: 'clamp(20px, 3vw, 28px)',  }}>
              Accountability Stories &amp; Research
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.map((c: any) => {
                const pw = c.pathway_primary ? (THEMES as any)[c.pathway_primary] : null
                return (
                  <Link
                    key={c.id}
                    href={'/content/' + (c.slug || c.id)}
                    className="block group transition-colors"
                    style={{ background: '#fff', border: '1px solid #dde1e8' }}
                  >
                    {c.image_url ? (
                      <div className="w-full h-36 overflow-hidden" style={{ borderBottom: `1px solid ${'#dde1e8'}` }}>
                        <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-2" style={{ background: pw?.color || centerColor }} />
                    )}
                    <div className="p-4">
                      {pw && (
                        <span className="block mb-1.5" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: pw.color }}>
                          {pw.name}
                        </span>
                      )}
                      <span className="block group-hover:underline" style={{ fontSize: 15, lineHeight: 1.35, fontWeight: 600 }}>
                        {c.title_6th_grade}
                      </span>
                      {c.summary_6th_grade && (
                        <span className="block mt-1.5 line-clamp-2" style={{ fontSize: 13, lineHeight: 1.5, color: "#5c6474" }}>
                          {c.summary_6th_grade}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* ── RELATED LINKS ── */}
      <section style={{ background: "#f4f5f7", borderTop: `1px solid ${'#dde1e8'}` }}>
        <div className="max-w-[1000px] mx-auto px-6 py-12">
          <p style={{ fontSize: 11, letterSpacing: '0.1em', color: "#1b5e8a", textTransform: 'uppercase', marginBottom: 20 }}>
            Go deeper
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {meta.relatedLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="group block py-4 px-5 transition-all bg-white"
                style={{ border: '1px solid #dde1e8' }}
              >
                <span className="block group-hover:underline" style={{ fontSize: 16 }}>
                  {link.label}
                </span>
                <span className="block mt-1 group-hover:text-[#a8522e] transition-colors" style={{ fontSize: 13, fontStyle: 'italic', color: "#1b5e8a" }}>
                  Explore &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <div className="max-w-[900px] mx-auto px-6">
        <PageCrossLinks preset="explore" />
      </div>

      {/* ── CODA ── */}
      <div className="text-center py-10 bg-paper">
        <Link href="/centers" className="hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
          &larr; Back to Centers
        </Link>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════════════════════════════
   STANDARD CENTER — Content shelves (Learning, Action, Resource)
   ═══════════════════════════════════════════════════════════════════════ */

async function StandardCenter({ centerName, meta, centerColor }: { centerName: string; meta: typeof CENTER_META.Learning; centerColor: string }) {
  const entities = await getEntitiesByCenter(centerName, {
    content: 60,
    services: 8,
    orgs: 12,
    policies: 6,
    officials: 8,
    opportunities: 6,
  })

  const items = entities.content as ContentPublished[]
  const featuredItem = items.find(item => item.image_url) || items[0] || null

  const byPathway: Record<string, ContentPublished[]> = {}
  items.forEach(item => {
    const pw = item.pathway_primary || 'unknown'
    if (!byPathway[pw]) byPathway[pw] = []
    byPathway[pw].push(item)
  })
  const sortedPathways = Object.entries(byPathway).sort((a, b) => b[1].length - a[1].length)

  const langId = await getLangId()
  const inboxIds = items.map(i => i.inbox_id).filter((id): id is string => id != null)
  const translations = langId && inboxIds.length > 0 ? await fetchTranslationsForTable('content_published', inboxIds, langId) : {}

  // Content type badges
  const CONTENT_TYPE_LABELS: Record<string, string> = {
    article: 'Articles', report: 'Reports', video: 'Videos', event: 'Events',
    tool: 'Tools', course: 'Courses', guide: 'Guides', campaign: 'Campaigns',
  }

  return (
    <div style={{ background: '#ffffff' }}>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "#f4f5f7", minHeight: 420 }}>
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none" aria-hidden="true">
          <Image src={meta.motif} alt="" width={500} height={500} className="opacity-[0.06] mr-[-60px]" />
        </div>
        <div style={{ height: 3, background: centerColor }} />
        <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-24">
          <nav aria-label="Breadcrumb">
            <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/" className="hover:underline" style={{ color: "#5c6474" }}>Guide</Link>
              <span style={{ color: "#5c6474" }}> / </span>
              <Link href="/centers" className="hover:underline" style={{ color: "#5c6474" }}>Centers</Link>
              <span style={{ color: "#5c6474" }}> / </span>
              <span style={{ color: "#1b5e8a" }}>{centerName}</span>
            </p>
          </nav>
          <p className="mt-8" style={{ fontSize: 12, letterSpacing: '0.12em', color: centerColor, textTransform: 'uppercase' }}>
            {centerName} Center &middot; {entities.counts.total.toLocaleString()} resources
          </p>
          <h1 className="mt-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15, maxWidth: 600 }}>
            {meta.question}
          </h1>
          <p className="mt-4" style={{ fontSize: 'clamp(16px, 2vw, 20px)', fontStyle: 'italic', color: "#5c6474", maxWidth: 520 }}>
            {meta.tagline}
          </p>
          <p className="mt-6" style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 560, opacity: 0.85 }}>
            {meta.description}
          </p>

          {/* Entity counts strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-8">
            {[
              { label: 'Content', count: entities.counts.content, href: '#content' },
              { label: 'Organizations', count: entities.counts.organizations, href: '#organizations' },
              { label: 'Services', count: entities.counts.services, href: '#services' },
              { label: 'Policies', count: entities.counts.policies, href: '#policies' },
              { label: 'Officials', count: entities.counts.officials, href: '#officials' },
              { label: 'Opportunities', count: entities.counts.opportunities, href: '#opportunities' },
            ].filter(s => s.count > 0).map(s => (
              <a key={s.label} href={s.href} className="flex items-baseline gap-1.5 hover:underline" style={{ color: centerColor }}>
                <span className="text-xl font-bold">{s.count}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: '#5c6474' }}>{s.label}</span>
              </a>
            ))}
          </div>

          <div className="mt-6" style={{ width: 60, height: 2, background: centerColor }} />
        </div>
      </section>

      {/* Content type breakdown */}
      {Object.keys(entities.contentByType).length > 1 && (
        <section style={{ background: "#f4f5f7", borderBottom: `1px solid ${'#dde1e8'}` }}>
          <div className="max-w-[1000px] mx-auto px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(entities.contentByType)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([type, items]) => (
                  <span key={type} className="inline-flex items-center gap-1 text-xs border px-2.5 py-1" style={{ borderColor: '#dde1e8' }}>
                    <span className="font-bold">{items.length}</span>
                    <span style={{ color: '#5c6474' }}>{CONTENT_TYPE_LABELS[type] || type}</span>
                  </span>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured lead */}
      {featuredItem && (
        <section style={{ background: "#f4f5f7", borderBottom: `1px solid ${'#dde1e8'}` }}>
          <div className="max-w-[1000px] mx-auto px-6 py-12">
            <p style={{ fontSize: 11, letterSpacing: '0.1em', color: "#1b5e8a", textTransform: 'uppercase', marginBottom: 20 }}>
              Latest in {centerName}
            </p>
            <Link href={'/content/' + featuredItem.id} className="group block">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 items-start">
                <div>
                  {featuredItem.pathway_primary && THEMES[featuredItem.pathway_primary as keyof typeof THEMES] && (
                    <p className="mb-3" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEMES[featuredItem.pathway_primary as keyof typeof THEMES].color }}>
                      {THEMES[featuredItem.pathway_primary as keyof typeof THEMES].name}
                      {featuredItem.content_type && <span> &middot; {featuredItem.content_type}</span>}
                    </p>
                  )}
                  <h2 className="group-hover:underline" style={{ fontSize: 'clamp(22px, 3vw, 30px)', lineHeight: 1.25, marginBottom: 12 }}>
                    {featuredItem.title_6th_grade}
                  </h2>
                  {featuredItem.summary_6th_grade && (
                    <p style={{ fontSize: 15, color: "#5c6474", lineHeight: 1.7, maxWidth: 480 }}>
                      {featuredItem.summary_6th_grade.length > 200 ? featuredItem.summary_6th_grade.slice(0, 200) + '...' : featuredItem.summary_6th_grade}
                    </p>
                  )}
                  <span className="inline-block mt-5 group-hover:text-[#a8522e] transition-colors" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
                    Read more &rarr;
                  </span>
                </div>
                {featuredItem.image_url && (
                  <div className="hidden md:block overflow-hidden" style={{ border: '1px solid #dde1e8' }}>
                    <Image src={featuredItem.image_url} alt="" width={680} height={400} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]" style={{ maxHeight: 260 }} />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          ORGANIZATIONS — the primary objects
          ═══════════════════════════════════════════════════════════════ */}
      {entities.organizations.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 py-12" id="organizations" style={{ borderBottom: '1px solid #dde1e8' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>
                Organizations
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
                Who&rsquo;s Doing the Work
              </h2>
            </div>
            <Link href="/organizations" className="inline-flex items-center gap-1 transition-colors hover:opacity-70" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1b5e8a' }}>
              All organizations <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.organizations.map((org: any) => {
              const theme = org.theme_id ? (THEMES as any)[org.theme_id] : null
              return (
                <Link key={org.org_id} href={'/organizations/' + org.org_id} className="group block transition-colors" style={{ background: '#fff', border: '1px solid #dde1e8' }}>
                  <div className="h-1.5" style={{ background: theme?.color || centerColor }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {org.logo_url ? (
                        <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-paper">
                          <Image src={org.logo_url} alt="" width={40} height={40} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-paper" style={{ fontSize: 16, fontWeight: 700, color: '#5c6474' }}>
                          {org.org_name?.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="block group-hover:underline truncate" style={{ fontSize: 15, fontWeight: 600 }}>{org.org_name}</span>
                        {org.city && <span className="block text-[11px]" style={{ color: '#5c6474' }}>{org.city}</span>}
                      </div>
                    </div>
                    {org.description_5th_grade && (
                      <p className="mt-2 line-clamp-2" style={{ fontSize: 13, lineHeight: 1.5, color: '#5c6474' }}>{org.description_5th_grade}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES
          ═══════════════════════════════════════════════════════════════ */}
      {entities.services.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 py-12" id="services" style={{ borderBottom: '1px solid #dde1e8' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>
                211 Services
              </p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>
                Available Right Now
              </h2>
            </div>
            <Link href="/services" className="inline-flex items-center gap-1 transition-colors hover:opacity-70" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1b5e8a' }}>
              All services <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-0" style={{ border: '1px solid #dde1e8' }}>
            {entities.services.map((svc: any, i: number) => (
              <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block p-4 group transition-colors" style={{ background: '#fff', borderTop: i > 0 ? '1px solid #dde1e8' : undefined }}>
                <span className="block group-hover:underline" style={{ fontSize: 15, fontWeight: 600 }}>{svc.service_name}</span>
                {svc.description_5th_grade && (
                  <span className="block mt-1 line-clamp-2" style={{ fontSize: 13, lineHeight: 1.5, color: '#5c6474' }}>{svc.description_5th_grade}</span>
                )}
                <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: 11, color: '#5c6474' }}>
                  {svc.city && <span>{svc.city}</span>}
                  {svc.phone && <span className="inline-flex items-center gap-1"><Phone size={9} /> {svc.phone}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          POLICIES + OFFICIALS (two-column)
          ═══════════════════════════════════════════════════════════════ */}
      {(entities.policies.length > 0 || entities.officials.length > 0) && (
        <section className="max-w-[1100px] mx-auto px-6 py-12" id="policies" style={{ borderBottom: '1px solid #dde1e8' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Policies */}
            {entities.policies.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>Policies</p>
                    <h3 className="mt-1" style={{ fontSize: 20 }}>What&rsquo;s Being Decided</h3>
                  </div>
                  <Link href="/policies" className="inline-flex items-center gap-1 hover:opacity-70" style={{ fontSize: 11, textTransform: 'uppercase', color: '#1b5e8a' }}>
                    All <ArrowRight size={12} />
                  </Link>
                </div>
                <div style={{ border: '1px solid #dde1e8' }}>
                  {entities.policies.map((p: any, i: number) => (
                    <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-3 group" style={{ borderTop: i > 0 ? '1px solid #dde1e8' : undefined }}>
                      <span className="block group-hover:underline" style={{ fontSize: 14, fontWeight: 600 }}>{p.title_6th_grade || p.policy_name}</span>
                      <div className="flex items-center gap-2 mt-1" style={{ fontSize: 10, color: '#5c6474' }}>
                        <span className="uppercase">{p.level}</span>
                        {p.status && <span className="px-1 py-0.5" style={{ background: '#1a6b5618', color: '#1a6b56', fontWeight: 600 }}>{p.status}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Officials */}
            {entities.officials.length > 0 && (
              <div id="officials">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>Officials</p>
                    <h3 className="mt-1" style={{ fontSize: 20 }}>Who&rsquo;s Responsible</h3>
                  </div>
                  <Link href="/officials" className="inline-flex items-center gap-1 hover:opacity-70" style={{ fontSize: 11, textTransform: 'uppercase', color: '#1b5e8a' }}>
                    All <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {entities.officials.map((o: any) => (
                    <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-2 p-3 group" style={{ background: '#fff', border: '1px solid #dde1e8' }}>
                      <div className="w-9 h-9 flex-shrink-0 overflow-hidden bg-paper">
                        {o.photo_url ? (
                          <Image src={o.photo_url} alt="" width={36} height={36} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 14, fontWeight: 700, color: '#5c6474' }}>{o.official_name?.charAt(0)}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block group-hover:underline truncate" style={{ fontSize: 13, fontWeight: 600 }}>{o.official_name}</span>
                        <span className="block truncate" style={{ fontSize: 10, color: '#5c6474' }}>{o.title}{o.party ? ' · ' + o.party : ''}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          OPPORTUNITIES
          ═══════════════════════════════════════════════════════════════ */}
      {entities.opportunities.length > 0 && (
        <section className="max-w-[1100px] mx-auto px-6 py-12" id="opportunities" style={{ borderBottom: '1px solid #dde1e8' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>Opportunities</p>
              <h2 className="mt-1" style={{ fontSize: 'clamp(20px, 3vw, 28px)' }}>Ways to Get Involved</h2>
            </div>
            <Link href="/opportunities" className="inline-flex items-center gap-1 hover:opacity-70" style={{ fontSize: 11, textTransform: 'uppercase', color: '#1b5e8a' }}>
              All opportunities <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entities.opportunities.map((opp: any) => (
              <div key={opp.opportunity_id} className="p-4" style={{ background: '#fff', border: '1px solid #dde1e8' }}>
                <span className="block" style={{ fontSize: 15, fontWeight: 600 }}>{opp.opportunity_name}</span>
                {opp.description_5th_grade && (
                  <span className="block mt-1 line-clamp-2" style={{ fontSize: 13, color: '#5c6474' }}>{opp.description_5th_grade}</span>
                )}
                <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11, color: '#5c6474' }}>
                  {opp.city && <span>{opp.city}</span>}
                  {opp.is_virtual === 'Yes' && <span style={{ color: '#1b5e8a' }}>Virtual</span>}
                  {opp.start_date && <span>{new Date(opp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                </div>
                {opp.registration_url && (
                  <a href={opp.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 hover:underline" style={{ fontSize: 12, color: '#1b5e8a' }}>
                    Register <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT — organized by pathway, all types (articles, videos, reports, etc.)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-6 py-12" id="content">
        <p className="mb-2" style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: centerColor }}>
          Content &middot; All Types
        </p>
        <div className="space-y-10">
          {sortedPathways.map(([themeId, pwItems]) => {
            const theme = THEMES[themeId as keyof typeof THEMES]
            if (!theme || pwItems.length === 0) return null
            const shelfItems: ShelfItem[] = pwItems.map(item => ({
              type: 'content' as const,
              id: item.inbox_id || item.id,
              title: item.title_6th_grade,
              summary: item.summary_6th_grade,
              pathway: item.pathway_primary,
              center: item.center,
              sourceUrl: item.source_url,
              publishedAt: item.published_at,
              imageUrl: item.image_url,
              href: '/content/' + item.id,
            }))
            return (
              <div key={themeId} id={'pathway-' + themeId}>
                <div className="mb-2 flex items-center gap-3">
                  <span className="w-3 h-3 flex-shrink-0" style={{ background: theme.color }} />
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', color: theme.color, textTransform: 'uppercase' }}>
                    {theme.name} &middot; {pwItems.length} resources
                  </p>
                </div>
                <ContentShelf
                  title={theme.name}
                  question={theme.description?.slice(0, 100)}
                  color={theme.color}
                  items={shelfItems}
                  translations={translations}
                  seeAllHref={'/pathways/' + theme.slug}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* Related links */}
      <section style={{ background: "#f4f5f7", borderTop: `1px solid ${'#dde1e8'}` }}>
        <div className="max-w-[1000px] mx-auto px-6 py-12">
          <p style={{ fontSize: 11, letterSpacing: '0.1em', color: "#1b5e8a", textTransform: 'uppercase', marginBottom: 20 }}>Go deeper</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {meta.relatedLinks.map(link => (
              <Link key={link.href} href={link.href} className="group block py-4 px-5 transition-all bg-white" style={{ border: '1px solid #dde1e8' }}>
                <span className="block group-hover:underline" style={{ fontSize: 16 }}>{link.label}</span>
                <span className="block mt-1 group-hover:text-[#a8522e] transition-colors" style={{ fontSize: 13, fontStyle: 'italic', color: "#1b5e8a" }}>Explore &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-links */}
      <div className="max-w-[900px] mx-auto px-6">
        <PageCrossLinks preset="explore" />
      </div>

      <div className="text-center py-10 bg-paper">
        <Link href="/centers" className="hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
          &larr; Back to Centers
        </Link>
      </div>
    </div>
  )
}
