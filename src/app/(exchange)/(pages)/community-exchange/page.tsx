import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { ArrowRight, Search, MapPin, Users, Globe, BookOpen, Calendar, Scale, Megaphone, Heart } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { getLatestContent, getResourceFeed, getNewsFeed } from '@/lib/data/content'
import { getUpcomingEvents } from '@/lib/data/events'
import { getExchangeStats } from '@/lib/data/homepage'
import { getOrganizations } from '@/lib/data/organizations'
import { FolFallback } from '@/components/ui/FolFallback'
import { HeroSearch } from '@/components/exchange/home/HeroSearch'

/* ── Design Tokens ── */
const INK = '#0d1117'
const DIM = '#5c6474'
const RULE = '#c9ced6'
const ACCENT = '#C75B2A'
const WARM_BG = '#FAF8F5'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Community Exchange — The Change Engine',
  description: 'The knowledge, the networks, the entry points — all in one place. Explore organizations, services, news, events, and civic resources in your community.',
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export default async function CommunityExchangePage() {
  const cookieStore = await cookies()
  const citySlug = cookieStore.get('ce_city')?.value || 'houston'

  const [stats, latestNews, resources, events, orgs] = await Promise.all([
    getExchangeStats(),
    getNewsFeed(undefined, 6),
    getResourceFeed(6),
    getUpcomingEvents(5),
    getOrganizations({ limit: 8, citySlug }),
  ])

  const statItems = [
    { label: 'Organizations', value: stats.organizations, href: '/organizations', icon: Users },
    { label: 'Services', value: stats.services, href: '/services', icon: Globe },
    { label: 'Resources', value: stats.resources, href: '/explore', icon: BookOpen },
    { label: 'Officials', value: stats.officials, href: '/officials', icon: Scale },
    { label: 'Policies', value: stats.policies, href: '/policies', icon: Scale },
    { label: 'Opportunities', value: stats.opportunities, href: '/opportunities', icon: Heart },
  ]

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════════
          HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${INK} 0%, #1a2332 50%, #2a1a0a 100%)`, minHeight: 480 }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 6L6 0M-1 1L1-1M5 7L7 5\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '6px 6px' }} />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.06]" style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }} />

        <div className="relative z-10 max-w-[1100px] mx-auto px-6 py-16 md:py-24">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-white/40 mb-4">The Community Exchange</p>
          <h1 className="font-display font-black text-white leading-[1.08] tracking-[-0.02em] mb-6"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}
          >
            Houston&apos;s always been built<br className="hidden sm:block" /> by people who showed up.
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-8">
            The knowledge, the networks, the entry points — they exist. We just put them in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mb-10">
            <div className="flex-1">
              <HeroSearch />
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-bold text-white transition-all hover:scale-105 flex-shrink-0"
              style={{ background: ACCENT }}
            >
              <Search size={14} /> Search everything
            </Link>
          </div>

          {/* Stats ribbon */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {statItems.map(function (s) {
              return (
                <Link key={s.label} href={s.href} className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors group">
                  <s.icon size={13} />
                  <span className="font-mono text-sm font-bold text-white/70 group-hover:text-white">{s.value.toLocaleString()}</span>
                  <span className="text-xs">{s.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Theme color bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex h-[3px]">
          {THEME_LIST.map(function (t) {
            return <div key={t.id} className="flex-1" style={{ background: (t as any).color }} />
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PATHWAYS — quick nav
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: WARM_BG, borderBottom: `2px solid ${RULE}` }}>
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider mr-2" style={{ color: DIM }}>Pathways</span>
            {THEME_LIST.map(function (t) {
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + (t as any).slug}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:shadow-md hover:-translate-y-px"
                  style={{ background: (t as any).color + '14', color: (t as any).color, border: `1px solid ${(t as any).color}25` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: (t as any).color }} />
                  {(t as any).name}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          LATEST NEWS
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Fresh from the community</h2>
              <p className="text-sm mt-1" style={{ color: DIM }}>News, stories, and updates from Houston organizations</p>
            </div>
            <Link href="/news" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
              All news <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(latestNews as any[]).slice(0, 6).map(function (item: any) {
              const themeColor = item.pathway_primary ? (THEMES as any)[item.pathway_primary]?.color : ACCENT
              return (
                <Link
                  key={item.id}
                  href={'/content/' + (item.slug || item.id)}
                  className="group border-2 rounded-lg overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg bg-white"
                  style={{ borderColor: RULE }}
                >
                  <div className="h-36 overflow-hidden bg-gray-50">
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" width={400} height={144} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <FolFallback pathway={item.pathway_primary} height="h-full" />
                    )}
                  </div>
                  <div className="p-4">
                    {item.content_type && (
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2" style={{ background: (themeColor || ACCENT) + '14', color: themeColor || ACCENT }}>
                        {item.content_type}
                      </span>
                    )}
                    <h3 className="text-sm font-bold leading-snug group-hover:text-[#C75B2A] transition-colors line-clamp-2" style={{ color: INK }}>
                      {item.title_6th_grade}
                    </h3>
                    {item.summary_6th_grade && (
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: DIM }}>
                        {item.summary_6th_grade.length > 100 ? item.summary_6th_grade.slice(0, 100) + '...' : item.summary_6th_grade}
                      </p>
                    )}
                    {item.published_at && (
                      <p className="text-[10px] mt-2 font-mono" style={{ color: DIM }}>
                        {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {item.source_org_name ? ' · ' + item.source_org_name : ''}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          RESOURCES — guides, tools, kits
         ══════════════════════════════════════════════════════════════════ */}
      {(resources as any[]).length > 0 && (
        <section style={{ background: WARM_BG, borderTop: `2px solid ${RULE}` }}>
          <div className="max-w-[1100px] mx-auto px-6 py-12">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Resources &amp; tools</h2>
                <p className="text-sm mt-1" style={{ color: DIM }}>Guides, kits, videos, and courses you can use right now</p>
              </div>
              <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                Browse all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(resources as any[]).slice(0, 6).map(function (item: any) {
                const themeColor = item.pathway_primary ? (THEMES as any)[item.pathway_primary]?.color : '#3D7A7A'
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + (item.slug || item.id)}
                    className="group flex items-start gap-3 p-4 border-2 rounded-lg bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderColor: RULE }}
                  >
                    <div className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0" style={{ background: (themeColor || '#3D7A7A') + '14' }}>
                      <BookOpen size={20} style={{ color: themeColor || '#3D7A7A' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.content_type && (
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: themeColor || '#3D7A7A' }}>
                          {item.content_type.replace(/_/g, ' ')}
                        </span>
                      )}
                      <h3 className="text-sm font-bold leading-snug group-hover:text-[#C75B2A] transition-colors line-clamp-2 mt-0.5" style={{ color: INK }}>
                        {item.title_6th_grade}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ORGANIZATIONS — who's doing the work
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white" style={{ borderTop: `2px solid ${RULE}` }}>
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Organizations doing the work</h2>
              <p className="text-sm mt-1" style={{ color: DIM }}>{stats.organizations.toLocaleString()} nonprofits, agencies, and community groups</p>
            </div>
            <Link href="/organizations" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(orgs as any[]).slice(0, 8).map(function (org: any) {
              return (
                <Link
                  key={org.org_id}
                  href={'/organizations/' + org.org_id}
                  className="group flex items-center gap-3 p-3 border-2 rounded-lg bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: RULE }}
                >
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt="" width={40} height={40} className="w-10 h-10 rounded object-contain bg-gray-50 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: ACCENT + '12' }}>
                      <span className="font-display font-bold text-base" style={{ color: ACCENT }}>{org.org_name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold leading-snug group-hover:text-[#C75B2A] transition-colors line-clamp-2" style={{ color: INK }}>
                      {org.org_name}
                    </h3>
                    {org.org_type && <p className="text-[10px] mt-0.5" style={{ color: DIM }}>{org.org_type}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          EVENTS — what's happening
         ══════════════════════════════════════════════════════════════════ */}
      {(events as any[]).length > 0 && (
        <section style={{ background: WARM_BG, borderTop: `2px solid ${RULE}` }}>
          <div className="max-w-[1100px] mx-auto px-6 py-12">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Coming up</h2>
                <p className="text-sm mt-1" style={{ color: DIM }}>Events, meetings, and deadlines</p>
              </div>
              <Link href="/calendar" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: ACCENT }}>
                Full calendar <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {(events as any[]).slice(0, 5).map(function (evt: any, i: number) {
                const date = evt.event_date || evt.date_start
                const dateObj = date ? new Date(date) : null
                return (
                  <div
                    key={evt.event_id || evt.id || i}
                    className="flex items-center gap-4 p-4 border-2 rounded-lg bg-white transition-all hover:shadow-md"
                    style={{ borderColor: RULE }}
                  >
                    {dateObj && (
                      <div className="w-14 h-14 flex flex-col items-center justify-center flex-shrink-0 rounded" style={{ background: ACCENT + '10' }}>
                        <span className="text-[10px] font-bold uppercase" style={{ color: ACCENT }}>{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                        <span className="text-xl font-display font-black leading-none" style={{ color: ACCENT }}>{dateObj.getDate()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold line-clamp-1" style={{ color: INK }}>{evt.event_name || evt.title}</h3>
                      {(evt.location || evt.venue) && (
                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: DIM }}>
                          <MapPin size={10} /> {evt.location || evt.venue}
                        </p>
                      )}
                    </div>
                    {(evt.registration_url || evt.source_url) && (
                      <a href={evt.registration_url || evt.source_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:opacity-80 flex-shrink-0"
                        style={{ background: ACCENT + '14', color: ACCENT }}>
                        Details
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          QUICK LINKS — entry points
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white" style={{ borderTop: `2px solid ${RULE}` }}>
        <div className="max-w-[1100px] mx-auto px-6 py-12">
          <h2 className="font-display text-2xl font-bold mb-6" style={{ color: INK }}>Entry points</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Organizations', href: '/organizations', icon: Users, color: '#C65D28' },
              { label: 'Services', href: '/services', icon: Globe, color: '#0d9488' },
              { label: 'Officials', href: '/officials', icon: Scale, color: '#6366f1' },
              { label: 'Events', href: '/calendar', icon: Calendar, color: '#dc2626' },
              { label: 'Opportunities', href: '/opportunities', icon: Heart, color: '#059669' },
              { label: 'Policies', href: '/policies', icon: BookOpen, color: '#7a2018' },
            ].map(function (link) {
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all hover:-translate-y-1 hover:shadow-lg text-center"
                  style={{ borderColor: RULE }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: link.color + '14' }}>
                    <link.icon size={22} style={{ color: link.color }} />
                  </div>
                  <span className="text-xs font-bold group-hover:text-[#C75B2A] transition-colors" style={{ color: INK }}>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CLOSER
         ══════════════════════════════════════════════════════════════════ */}
      <section style={{ background: INK }}>
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center">
          <p className="font-display text-2xl md:text-3xl font-black text-white leading-tight mb-4">
            The work is already happening.<br />Now you know where to find it.
          </p>
          <p className="text-base text-white/50 mb-8 max-w-lg mx-auto">
            Every organization, service, official, and resource in one place — connected by the issues that matter to your community.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: ACCENT }}
            >
              Search everything <ArrowRight size={14} />
            </Link>
            <Link
              href="/pathways/health"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white/60 hover:text-white transition-colors border border-white/20"
            >
              Start with a pathway
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
