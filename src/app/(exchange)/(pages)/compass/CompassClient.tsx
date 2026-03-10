'use client'

/**
 * CompassClient — Intent-based community discovery hub.
 *
 * Structure:
 * 1. Hero — Neighborhood welcome + ZIP input + intent cards
 * 2. Community Pulse — Live vertical timeline feed
 * 3. Your Representatives — Tight 4-column grid (if ZIP set)
 * 4. By the Numbers — Single elegant stats row
 * 5. Explore by Topic — 7-card pathway grid
 * 6. Quick Actions — Compact bottom bar
 * 7. Crisis footer bar
 */

import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, ChevronRight, Phone, Heart, Building2, ArrowRight,
  BookOpen, Vote, Compass, CalendarHeart, Library, Users,
  FileText, Scale, Briefcase, Leaf, Globe, Zap,
} from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { ZipInput } from '@/components/exchange/ZipInput'
import { THEMES } from '@/lib/constants'
import { GradientFOL } from '@/components/exchange/GradientFOL'
import type { CompassPreviewData } from '@/lib/types/exchange'

interface CompassClientProps {
  zip?: string
  stats: any
  pathwayCounts: Record<string, number>
  centerCounts: Record<string, number>
  bridges: Array<[string, string, number]>
  preview: CompassPreviewData
  recentNews: any[]
  nearbyServices: any[]
  nearbyOrgs: any[]
  zipOfficials: any[]
  upcomingEvents: any[]
  themeColors: string[]
}

const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string; description: string }][]

/* ── Intent cards ───────────────────────────────────────────────── */

const INTENTS = [
  {
    label: 'Find help or services',
    description: 'Browse nearby clinics, food banks, legal aid, and more.',
    href: '/services',
    color: '#38a169',
    Icon: Heart,
  },
  {
    label: 'See who represents me',
    description: 'Your elected officials from City Hall to Congress.',
    href: '/officials',
    color: '#805ad5',
    Icon: Building2,
  },
  {
    label: 'Learn about upcoming votes',
    description: 'Elections, deadlines, and where to cast your ballot.',
    href: '/elections',
    color: '#e53e3e',
    Icon: Vote,
  },
  {
    label: 'Explore my neighborhood',
    description: 'Maps, districts, and what is happening around you.',
    href: '/my-neighborhood',
    color: '#d69e2e',
    Icon: Compass,
  },
  {
    label: 'Find volunteer opportunities',
    description: 'Ways to give back and get involved locally.',
    href: '/events',
    color: '#3182ce',
    Icon: CalendarHeart,
  },
  {
    label: 'Read the latest research',
    description: 'News, policy briefs, and community analysis.',
    href: '/library',
    color: '#319795',
    Icon: Library,
  },
] as const

/* ── Helpers ────────────────────────────────────────────────────── */

function timeAgo(dateStr: string | null) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return mins + 'm ago'
  const hours = Math.floor(mins / 60)
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + 'd ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function categoryPill(item: any): { label: string; color: string } {
  if (item.content_type === 'event' || item.content_type === 'opportunity') return { label: 'Event', color: '#3182ce' }
  if (item.content_type === 'policy' || item.content_type === 'legislation') return { label: 'Policy', color: '#805ad5' }
  if (item.content_type === 'service') return { label: 'Service', color: '#38a169' }
  return { label: 'News', color: '#C75B2A' }
}

/* ── Pathway descriptions (short) ───────────────────────────────── */

const PATHWAY_SHORT: Record<string, string> = {
  THEME_01: 'Clinics, mental health, nutrition, and wellness.',
  THEME_02: 'Schools, childcare, youth, and family safety.',
  THEME_03: 'Housing, parks, libraries, and local initiatives.',
  THEME_04: 'Voting, advocacy, organizing, and civic power.',
  THEME_05: 'Jobs, benefits, credit, and small business.',
  THEME_06: 'Climate, energy, air quality, and green programs.',
  THEME_07: 'Bridging, dialogue, inclusion, and community trust.',
}

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Scale,
  THEME_05: Briefcase,
  THEME_06: Leaf,
  THEME_07: Globe,
}

/* ── Component ──────────────────────────────────────────────────── */

export function CompassClient({
  zip, stats, pathwayCounts, centerCounts, bridges, preview,
  recentNews, nearbyServices, nearbyOrgs, zipOfficials, upcomingEvents, themeColors,
}: CompassClientProps) {
  const { neighborhood, councilDistrict } = useNeighborhood()

  const hasZip = !!zip
  const neighborhoodName = neighborhood?.neighborhood_name || (hasZip ? 'Your Area' : null)
  const totalItems = Object.values(pathwayCounts).reduce(function (sum, n) { return sum + n }, 0)

  return (
    <div className="relative bg-brand-bg min-h-screen">

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — Welcome + ZIP + Intent Cards
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Animated gradient FOL — background watermark */}
        <div className="absolute -top-8 -right-12 w-[280px] h-[280px] opacity-[0.06] pointer-events-none">
          <GradientFOL variant="full" spinDur={90} colorDur={14} />
        </div>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {/* Top row: welcome + ZIP */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
            <div className="flex-1">
              {/* Spectrum bar */}
              <div className="flex h-1 rounded-full overflow-hidden mb-5 max-w-[180px]">
                {themeColors.map(function (color, i) {
                  return <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                })}
              </div>

              {neighborhoodName ? (
                <>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-muted-light mb-2">
                    Your Community Portal
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                    Welcome to{' '}
                    <span className="text-brand-accent">{neighborhoodName}</span>
                  </h1>
                  <p className="text-base text-brand-muted mt-1 font-serif italic">
                    ZIP {zip}{councilDistrict ? ' \u2014 District ' + councilDistrict : ''}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-muted-light mb-2">
                    Community Exchange
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold leading-tight">
                    The Compass
                  </h1>
                  <p className="text-sm text-brand-muted mt-2 max-w-xl leading-relaxed">
                    Enter your address to unlock a personalized view of every official, service, and resource in your community.
                  </p>
                </>
              )}
            </div>

            {/* ZIP input */}
            <div className="lg:flex-shrink-0 lg:w-[300px]">
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mb-2">
                  {hasZip ? 'Change location' : 'Enter your address \u2014 street, city, zip'}
                </p>
                <ZipInput />
                {!hasZip && (
                  <p className="text-[11px] text-brand-muted mt-2">Enter your address above to find your representatives.</p>
                )}
                {hasZip && zipOfficials.length === 0 && nearbyServices.length === 0 && (
                  <p className="text-[11px] text-red-600 mt-2">We couldn&rsquo;t find that address. Try adding your zip code.</p>
                )}
              </div>
            </div>
          </div>

          {/* Intent cards: "What do you need today?" */}
          <div className="mb-2">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-brand-text mb-4">
              What do you need today?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {INTENTS.map(function (intent) {
                const IconComp = intent.Icon
                return (
                  <Link
                    key={intent.href}
                    href={intent.href}
                    className="bg-white rounded-xl border border-brand-border p-4 hover:border-brand-text transition-all group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" style={{ backgroundColor: intent.color }} />
                    <div className="flex items-start gap-3 pl-2">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: intent.color + '14' }}
                      >
                        <IconComp size={18} style={{ color: intent.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                          {intent.label}
                        </p>
                        <p className="text-[12px] text-brand-muted mt-0.5 leading-snug">
                          {intent.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom color bar */}
        <div className="flex h-1">
          {themeColors.map(function (color, i) {
            return <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          })}
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ═══════════════════════════════════════════════════════════
            2. COMMUNITY PULSE — Vertical Timeline Feed
            ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
              <Zap size={20} className="text-brand-accent" />
              Community Pulse
            </h2>
            {recentNews.length > 0 && (
              <Link href="/news" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                All news <ChevronRight size={14} />
              </Link>
            )}
          </div>

          {recentNews.length > 0 ? (
            <div className="relative pl-6 sm:pl-8">
              {/* Vertical line */}
              <div className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-px bg-brand-border" />

              <div className="space-y-4">
                {recentNews.slice(0, 8).map(function (item: any) {
                  const pill = categoryPill(item)
                  const theme = item.pathway_primary ? (THEMES as any)[item.pathway_primary] : null
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="block relative group"
                    >
                      {/* Dot */}
                      <div
                        className="absolute -left-6 sm:-left-8 top-2.5 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ring-brand-border group-hover:ring-brand-accent transition-all"
                        style={{ backgroundColor: theme?.color || pill.color }}
                      />

                      <div className="bg-white rounded-xl border border-brand-border p-4 hover:border-brand-text transition-all">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-brand-muted">
                            {timeAgo(item.published_at)}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: pill.color + '14', color: pill.color }}
                          >
                            {pill.label}
                          </span>
                          {item.source_domain && (
                            <span className="text-[10px] font-mono text-brand-muted">
                              {item.source_domain}
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                          {item.title_6th_grade || item.title}
                        </h3>
                        {item.summary_6th_grade && (
                          <p className="text-[12px] text-brand-muted mt-1 line-clamp-1 leading-snug">
                            {item.summary_6th_grade}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-brand-border p-8 text-center">
              <FileText size={28} className="mx-auto text-brand-muted-light mb-2" />
              <p className="text-sm text-brand-muted">No recent community updates yet. Check back soon.</p>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════════════════════
            3. YOUR REPRESENTATIVES (if ZIP set)
            ═══════════════════════════════════════════════════════════ */}
        {hasZip && zipOfficials.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text flex items-center gap-2">
                <Building2 size={20} className="text-[#805ad5]" />
                Your Representatives
              </h2>
              <Link href="/officials" className="text-sm text-brand-accent hover:underline flex items-center gap-1">
                See all representatives <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {zipOfficials.slice(0, 8).map(function (o: any) {
                const levelColors: Record<string, string> = { Federal: '#805ad5', State: '#3182ce', County: '#38a169', City: '#dd6b20' }
                const ringColor = levelColors[o.level] || '#5A6178'
                const partyColors: Record<string, string> = { Republican: '#e53e3e', Democrat: '#3182ce', Independent: '#38a169' }
                const partyDot = partyColors[o.party] || '#9ca3af'
                return (
                  <Link
                    key={o.official_id}
                    href={'/officials/' + o.official_id}
                    className="bg-white rounded-xl border border-brand-border p-3 hover:border-brand-text transition-all group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" style={{ backgroundColor: ringColor }} />
                    <div className="flex items-center gap-2.5 pl-2">
                      <div className="w-10 h-10 rounded-full flex-shrink-0 p-[2px]" style={{ backgroundColor: ringColor }}>
                        {o.photo_url ? (
                          <Image src={o.photo_url} alt="" className="w-full h-full rounded-full object-cover ring-2 ring-white" width={80} height={80} />
                        ) : (
                          <div className="w-full h-full rounded-full bg-brand-bg flex items-center justify-center ring-2 ring-white">
                            <span className="text-sm font-bold text-brand-muted">{o.official_name?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors truncate">
                          {o.official_name}
                        </p>
                        <p className="text-[10px] text-brand-muted truncate">{o.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: partyDot }} />
                          <p className="text-[10px] font-mono font-bold uppercase" style={{ color: ringColor }}>{o.level}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════
            4. BY THE NUMBERS — Community Stats Row
            ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="bg-white rounded-xl border border-brand-border p-5 sm:p-6">
            <h2 className="font-serif text-lg font-bold text-brand-text mb-4">By the Numbers</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
              {[
                { icon: BookOpen, label: 'Resources', value: stats?.resources || totalItems, color: '#C75B2A' },
                { icon: Building2, label: 'Officials', value: stats?.officials || 0, color: '#805ad5' },
                { icon: Heart, label: 'Services', value: stats?.services || 0, color: '#38a169' },
                { icon: Users, label: 'Organizations', value: stats?.organizations || 0, color: '#dd6b20' },
                { icon: Vote, label: 'Elections', value: upcomingEvents.length || 4, color: '#e53e3e' },
                { icon: Compass, label: 'Pathways', value: 7, color: '#3182ce' },
              ].map(function (stat) {
                const StatIcon = stat.icon
                return (
                  <div key={stat.label} className="text-center">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: stat.color + '14' }}
                    >
                      <StatIcon size={18} style={{ color: stat.color }} />
                    </div>
                    <p className="text-xl sm:text-2xl font-serif font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted-light mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            5. EXPLORE BY TOPIC — Pathway Grid
            ═══════════════════════════════════════════════════════════ */}
        <section>
          <h2 className="font-serif text-xl font-bold text-brand-text mb-1">Explore by Topic</h2>
          <p className="text-sm text-brand-muted mb-4">Seven lenses on community life. Each pathway connects resources, services, officials, and news.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {themeEntries.map(function ([id, theme]) {
              const count = pathwayCounts[id] || 0
              const PathwayIcon = PATHWAY_ICONS[id] || BookOpen
              return (
                <Link
                  key={id}
                  href={'/pathways/' + theme.slug}
                  className="bg-white rounded-xl border border-brand-border overflow-hidden hover:border-brand-text transition-all group relative"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all" style={{ backgroundColor: theme.color }} />
                  <div className="p-4 pl-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <PathwayIcon size={16} style={{ color: theme.color }} />
                      <h3 className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                        {theme.name}
                      </h3>
                      {count > 0 && (
                        <span className="ml-auto text-[10px] font-mono text-brand-muted bg-brand-bg px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-brand-muted leading-snug">
                      {PATHWAY_SHORT[id] || theme.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            6. QUICK ACTIONS — Compact bottom bar
            ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="bg-white rounded-xl border border-brand-border p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {[
                { href: '/services', label: 'Find Services', icon: Heart, color: '#38a169' },
                { href: '/officials', label: 'Representatives', icon: Building2, color: '#805ad5' },
                { href: '/elections', label: 'Elections & Voting', icon: Vote, color: '#e53e3e' },
                { href: '/library', label: 'Research Library', icon: BookOpen, color: '#3182ce' },
                { href: '/chat', label: 'Ask Chance', icon: Zap, color: '#319795' },
                { href: '/call-your-senators', label: 'Call Your Senators', icon: Phone, color: '#dd6b20' },
              ].map(function (action) {
                const ActionIcon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
                  >
                    <ActionIcon size={14} style={{ color: action.color }} className="flex-shrink-0" />
                    <span className="hidden sm:inline">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            7. CRISIS HOTLINES — Small footer bar
            ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="bg-brand-bg/80 rounded-xl border border-brand-border px-4 py-3">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] font-mono text-brand-muted">
              <span className="font-bold uppercase tracking-wider text-brand-muted-light">Need help now?</span>
              <span>Mental Health Crisis: <strong className="text-brand-text">988</strong></span>
              <span>City Services: <strong className="text-brand-text">311</strong></span>
              <span>Social Services: <strong className="text-brand-text">211</strong></span>
              <span>DV Hotline: <strong className="text-brand-text">713-528-2121</strong></span>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
