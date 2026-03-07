'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart, Users, MapPin, Megaphone, Wallet, Leaf, Globe,
  Search, ChevronRight, BookOpen, GraduationCap, Scale,
  Vote, Compass, Phone, Activity, Landmark,
} from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { ExchangeStats, ServiceWithOrg } from '@/lib/types/exchange'

// ── Types ──

interface GuidePageProps {
  stats: ExchangeStats
  latestContent: Array<any>
  featuredContent: any | null
  lifeSituations: Array<any>
  learningPaths: Array<any>
  guides: Array<any>
  services: ServiceWithOrg[]
  civicHub: {
    officials: Array<any>
    policies: Array<any>
    elections: Array<any>
    levels: Array<any>
    upcomingElection: any | null
  }
  sdgs: Array<any>
  sdohDomains: Array<any>
  pathwayCounts: Record<string, number>
}

// ── Constants ──

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Megaphone,
  THEME_05: Wallet,
  THEME_06: Leaf,
  THEME_07: Globe,
}

const DISCOVER_LINKS = [
  { label: 'discover.local_resources', icon: Phone, href: '/services' },
  { label: 'discover.officials', icon: Users, href: '/officials' },
  { label: 'discover.policy', icon: Scale, href: '/policies' },
  { label: 'discover.guides', icon: BookOpen, href: '/guides' },
  { label: 'discover.available_resources', icon: Compass, href: '/help' },
  { label: 'discover.topics', icon: Activity, href: '/explore' },
  { label: 'discover.learning', icon: GraduationCap, href: '/learn' },
  { label: 'discover.neighborhoods', icon: MapPin, href: '/super-neighborhoods' },
  { label: 'discover.foundations', icon: Landmark, href: '/foundations' },
]

const PATHWAY_GRADIENTS: Record<string, { from: string; to: string }> = {
  THEME_01: { from: '#e53e3e', to: '#c53030' },
  THEME_02: { from: '#dd6b20', to: '#c05621' },
  THEME_03: { from: '#d69e2e', to: '#b7791f' },
  THEME_04: { from: '#38a169', to: '#2f855a' },
  THEME_05: { from: '#3182ce', to: '#2b6cb0' },
  THEME_06: { from: '#319795', to: '#2c7a7b' },
  THEME_07: { from: '#805ad5', to: '#6b46c1' },
}

// ── Helpers ──

function SectionHeader({ title, icon: Icon }: { title: string; icon?: typeof Heart }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-0.5 bg-brand-accent" />
      {Icon && <Icon size={18} style={{ color: BRAND.accent }} />}
      <h2 className="font-serif text-2xl text-brand-text">{title}</h2>
    </div>
  )
}

function formatDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: undefined,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

// ── Main Component ──

export function GuidePage({
  stats,
  latestContent,
  featuredContent,
  lifeSituations,
  learningPaths,
  guides,
  services,
  civicHub,
  sdgs,
  sdohDomains,
  pathwayCounts,
}: GuidePageProps) {
  const { t } = useTranslation()
  const { zip, neighborhood, lookupZip, isLoading } = useNeighborhood()
  const [zipInput, setZipInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      lookupZip(zipInput)
      setZipInput('')
    }
  }

  // Total counts for stats ticker
  const totalArticles = stats.resources
  const totalServices = stats.services
  const totalOfficials = stats.officials
  const totalGuides = (guides ?? []).length
  const totalPaths = stats.learningPaths

  // Neighborhood-filtered services
  const nearbyServices = zip
    ? services.filter(function (s) { return s.zip_code === zip }).slice(0, 6)
    : services.slice(0, 6)

  // Election countdown
  const upcomingElection = civicHub.upcomingElection
  let daysUntilElection = 0
  if (upcomingElection?.election_date) {
    const elDate = new Date(upcomingElection.election_date)
    const now = new Date()
    daysUntilElection = Math.ceil((elDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pb-20">

        {/* ═══ A. MASTHEAD ═══ */}
        <header className="pt-8 pb-2">
          <div className="h-0.5 bg-brand-accent mb-4" />
          <div className="text-center">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-brand-text tracking-tight">
              {t('guide.masthead')}
            </h1>
            <p className="text-sm text-brand-muted mt-2 tracking-wide">
              Houston, Texas &nbsp;|&nbsp; {formatDate('en-US')} &nbsp;|&nbsp; {t('guide.volume')}
            </p>
            <p className="font-serif italic text-brand-muted text-lg mt-1">
              {t('guide.tagline')}
            </p>
          </div>
          <div className="h-px bg-brand-border mt-4" />
        </header>

        {/* ═══ B. FEATURED STORY ═══ */}
        {featuredContent && (
          <section className="my-8">
            <Link href={'/content/' + featuredContent.id} className="block group">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="lg:col-span-3 relative h-64 lg:h-auto min-h-[240px]">
                  {featuredContent.image_url ? (
                    <img
                      src={featuredContent.image_url}
                      alt={featuredContent.title_6th_grade || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${
                          PATHWAY_GRADIENTS[featuredContent.pathway_primary]?.from ?? BRAND.muted
                        }, ${
                          PATHWAY_GRADIENTS[featuredContent.pathway_primary]?.to ?? BRAND.text
                        })`,
                      }}
                    />
                  )}
                </div>
                {/* Text */}
                <div className="lg:col-span-2 p-6 flex flex-col justify-center">
                  {featuredContent.pathway_primary && (
                    <span
                      className="text-xs font-semibold uppercase tracking-wide mb-3"
                      style={{
                        color: THEMES[featuredContent.pathway_primary as keyof typeof THEMES]?.color ?? BRAND.accent,
                        borderLeft: `3px solid ${THEMES[featuredContent.pathway_primary as keyof typeof THEMES]?.color ?? BRAND.accent}`,
                        paddingLeft: '6px',
                      }}
                    >
                      {THEMES[featuredContent.pathway_primary as keyof typeof THEMES]?.name ?? t('guide.featured')}
                    </span>
                  )}
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-text leading-tight mb-3">
                    {featuredContent.title_6th_grade || t('card.untitled')}
                  </h2>
                  <p className="text-brand-muted leading-relaxed line-clamp-4 mb-4">
                    {featuredContent.summary_6th_grade || ''}
                  </p>
                  <span className="text-sm font-semibold" style={{ color: BRAND.accent }}>
                    {t('card.read_more')} &rarr;
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* ═══ C. STATS TICKER ═══ */}
        <div className="border-y border-brand-border py-3 my-6 flex items-center justify-center gap-4 sm:gap-8 flex-wrap text-center">
          {[
            { n: totalArticles, l: 'Articles' },
            { n: totalServices, l: 'Services' },
            { n: totalOfficials, l: 'Officials' },
            { n: totalGuides, l: 'Guides' },
            { n: totalPaths, l: 'Paths' },
          ].map(function (s, i, arr) {
            return (
              <span key={s.l} className="inline-flex items-center gap-1">
                <span className="font-serif text-lg font-bold text-brand-text tabular-nums">{s.n}</span>
                <span className="text-xs uppercase tracking-wide text-brand-muted">{s.l}</span>
                {i < arr.length - 1 && <span className="text-brand-border ml-3 hidden sm:inline">|</span>}
              </span>
            )
          })}
        </div>

        {/* ═══ D. TWO-COLUMN LAYOUT ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── MAIN COLUMN (8/12) ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* ═══ E. IN THE SPOTLIGHT ═══ */}
            <section>
              <SectionHeader title={t('guide.spotlight')} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.spotlight_subtitle')}</p>

              {latestContent.length > 0 && (
                <div className="space-y-4">
                  {/* First card large */}
                  {(() => {
                    const item = latestContent[0]
                    const themeKey = item.pathway_primary as keyof typeof THEMES | null
                    const color = themeKey ? THEMES[themeKey]?.color : BRAND.muted
                    return (
                      <Link href={'/content/' + item.id} className="group block">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow">
                          <div className="h-48 sm:h-auto relative overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}30, ${color}60)` }} />
                            )}
                          </div>
                          <div className="p-5 flex flex-col justify-center">
                            {themeKey && (
                              <span className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color, borderLeft: `3px solid ${color}`, paddingLeft: '6px' }}>
                                {THEMES[themeKey]?.name}
                              </span>
                            )}
                            {item.center && (
                              <span className="text-xs text-brand-muted italic mb-2">{item.center}</span>
                            )}
                            <h3 className="font-serif text-xl font-bold text-brand-text leading-tight mb-2 line-clamp-2">
                              {item.title_6th_grade || t('card.untitled')}
                            </h3>
                            <p className="text-sm text-brand-muted line-clamp-3">{item.summary_6th_grade || ''}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })()}

                  {/* Remaining cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {latestContent.slice(1, 7).map(function (item: any) {
                      const themeKey = item.pathway_primary as keyof typeof THEMES | null
                      const color = themeKey ? THEMES[themeKey]?.color : BRAND.muted
                      return (
                        <Link key={item.id} href={'/content/' + item.id} className="group block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow">
                          {item.image_url && (
                            <div className="h-32 overflow-hidden">
                              <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="p-4" style={{ borderLeft: `3px solid ${color}` }}>
                            {themeKey && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
                                {THEMES[themeKey]?.name}
                              </span>
                            )}
                            <h4 className="font-semibold text-brand-text text-sm leading-snug mt-1 line-clamp-2">
                              {item.title_6th_grade || t('card.untitled')}
                            </h4>
                            {item.center && (
                              <span className="text-[10px] text-brand-muted italic mt-1 block">{item.center}</span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ═══ F. CIVIC DESK ═══ */}
            <section>
              <SectionHeader title={t('guide.civic_desk')} icon={Scale} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.civic_subtitle')}</p>

              <div className="space-y-4">
                {/* Election countdown */}
                {upcomingElection && daysUntilElection > 0 && (
                  <Link href="/elections" className="block bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow" style={{ borderLeft: `4px solid ${BRAND.accent}` }}>
                    <div className="flex items-center gap-4">
                      <Vote size={28} style={{ color: BRAND.accent }} />
                      <div>
                        <p className="font-serif text-xl font-bold text-brand-text">
                          {daysUntilElection} {t('guide.days_until_election')}
                        </p>
                        <p className="text-sm text-brand-muted">{upcomingElection.election_name}</p>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Officials grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {civicHub.officials.slice(0, 4).map(function (official: any) {
                    const levelColor = ({
                      Federal: '#3182ce', State: '#805ad5', County: '#d69e2e', City: '#38a169',
                    } as Record<string, string>)[official.level] || BRAND.muted
                    return (
                      <Link key={official.official_id} href={'/officials/' + official.official_id} className="flex items-center gap-3 bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: levelColor + '15' }}>
                          <span className="text-lg font-bold" style={{ color: levelColor }}>{official.official_name?.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-text text-sm truncate">{official.official_name}</p>
                          <p className="text-xs text-brand-muted truncate">{official.title}</p>
                          {official.level && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: levelColor }}>
                              {official.level}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Policies */}
                {civicHub.policies.slice(0, 3).map(function (policy: any) {
                  const statusColor = (() => {
                    const s = (policy.status || '').toLowerCase()
                    if (s === 'passed' || s === 'enacted' || s === 'signed') return '#38a169'
                    if (s === 'pending' || s === 'introduced') return '#d69e2e'
                    if (s === 'failed' || s === 'vetoed') return '#e53e3e'
                    return BRAND.muted
                  })()
                  return (
                    <div key={policy.policy_id} className="bg-white rounded-xl border border-brand-border p-4" style={{ borderLeft: `3px solid ${statusColor}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        {policy.bill_number && <span className="text-xs font-mono text-brand-muted">{policy.bill_number}</span>}
                        {policy.status && (
                          <span className="text-xs font-medium inline-flex items-center gap-1.5" style={{ color: statusColor }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                            {policy.status}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-brand-text text-sm line-clamp-2">{policy.policy_name}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ═══ G. YOUR NEIGHBORHOOD ═══ */}
            <section>
              <SectionHeader title={t('guide.your_neighborhood')} icon={MapPin} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.neighborhood_subtitle')}</p>

              {!zip ? (
                <div className="bg-white rounded-xl border border-brand-border p-6 text-center">
                  <p className="text-brand-muted mb-3">{t('guide.neighborhood_prompt')}</p>
                  <form onSubmit={handleZipSubmit} className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                    <input
                      type="text"
                      value={zipInput}
                      onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                      placeholder={t('zip.enter')}
                      maxLength={5}
                      disabled={isLoading}
                      className="flex-1 text-sm px-3 py-2 border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                    />
                    <button type="submit" disabled={zipInput.length !== 5 || isLoading} className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-brand-accent text-white disabled:opacity-40">
                      Go
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-3">
                  {neighborhood && (
                    <p className="text-sm font-semibold text-brand-text mb-2">
                      {neighborhood.neighborhood_name} &middot; <span className="text-brand-muted font-normal">{zip}</span>
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {nearbyServices.map(function (service) {
                      return (
                        <Link key={service.service_id} href={'/services/' + service.service_id} className="block bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${BRAND.accent}` }}>
                          <p className="font-semibold text-brand-text text-sm line-clamp-2">{service.service_name}</p>
                          {service.org_name && (
                            <p className="text-xs text-brand-muted mt-1 italic">{service.org_name}</p>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* ═══ H. LEARN & GROW ═══ */}
            <section>
              <SectionHeader title={t('guide.learn_grow')} icon={GraduationCap} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.learn_subtitle')}</p>

              <div className="space-y-6">
                {/* Learning paths as numbered rows */}
                {learningPaths.slice(0, 4).map(function (path: any, i: number) {
                  const theme = path.theme_id ? THEMES[path.theme_id as keyof typeof THEMES] : null
                  const num = String(i + 1).padStart(2, '0')
                  return (
                    <Link key={path.path_id} href={'/learn/' + (path.slug || path.path_id)} className="group flex items-start gap-4 hover:bg-white/60 p-3 rounded-lg transition-colors -mx-3">
                      <span className="font-serif text-3xl font-bold text-brand-border leading-none">{num}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {theme && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                          )}
                          <h4 className="font-semibold text-brand-text">{path.path_name || path.name}</h4>
                        </div>
                        {path.description && <p className="text-sm text-brand-muted line-clamp-2">{path.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted">
                          {path.difficulty && (
                            <span className="inline-flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${path.difficulty === 'Beginner' ? 'bg-green-500' : path.difficulty === 'Advanced' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                              {path.difficulty}
                            </span>
                          )}
                          {path.module_count != null && <span>{path.module_count} modules</span>}
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Guides */}
                {guides.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {guides.slice(0, 3).map(function (guide: any) {
                      const theme = guide.theme_id ? THEMES[guide.theme_id as keyof typeof THEMES] : null
                      return (
                        <Link key={guide.guide_id} href={'/guides/' + guide.slug} className="group block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow">
                          {guide.hero_image_url && (
                            <div className="h-28 overflow-hidden">
                              <img src={guide.hero_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="p-4">
                            {theme && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.color }}>
                                {theme.name}
                              </span>
                            )}
                            <h4 className="font-semibold text-brand-text text-sm mt-1 line-clamp-2">{guide.title}</h4>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* ═══ I. LIFE IN HOUSTON ═══ */}
            <section>
              <SectionHeader title={t('guide.life_houston')} icon={Heart} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.life_subtitle')}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lifeSituations.slice(0, 6).map(function (sit: any) {
                  const urgencyColors: Record<string, string> = {
                    Critical: '#e53e3e', High: '#dd6b20', Medium: '#d69e2e', Low: '#38a169',
                  }
                  const color = urgencyColors[sit.urgency_level] || BRAND.muted
                  return (
                    <Link key={sit.situation_id} href={'/help/' + sit.situation_slug} className="group block bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow" style={{ borderTop: `3px solid ${color}` }}>
                      <div className="p-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: color + '15' }}>
                          <span className="text-lg" style={{ color }}>{sit.icon_name ? '●' : '○'}</span>
                        </div>
                        <h4 className="font-semibold text-brand-text text-sm mb-1">{sit.situation_name}</h4>
                        {sit.description && <p className="text-xs text-brand-muted line-clamp-2 italic">{sit.description}</p>}
                        {sit.urgency_level && (
                          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-medium" style={{ color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {sit.urgency_level}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* ═══ J. THE BIGGER PICTURE ═══ */}
            <section>
              <SectionHeader title={t('guide.bigger_picture')} icon={Globe} />

              {/* SDGs */}
              <div className="mb-8">
                <h3 className="font-serif text-lg font-semibold text-brand-text mb-3">{t('guide.sdg_heading')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sdgs.map(function (sdg: any) {
                    return (
                      <Link key={sdg.sdg_id} href={'/explore?sdg=SDG_' + sdg.sdg_number} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white transition-colors">
                        <span
                          className="w-5 h-5 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: sdg.sdg_color || '#3182ce' }}
                        />
                        <span className="text-sm text-brand-text">
                          <span className="font-semibold">{sdg.sdg_number}.</span> {sdg.sdg_name}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* SDOH */}
              <div>
                <h3 className="font-serif text-lg font-semibold text-brand-text mb-3">{t('guide.sdoh_heading')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sdohDomains.map(function (sdoh: any) {
                    return (
                      <Link key={sdoh.sdoh_code} href={'/explore?sdoh=' + encodeURIComponent(sdoh.sdoh_code)} className="block p-3 rounded-lg hover:bg-white transition-colors" style={{ borderLeft: '3px solid #38a169' }}>
                        <p className="text-sm font-semibold text-brand-text">{sdoh.sdoh_name}</p>
                        {sdoh.sdoh_description && (
                          <p className="text-xs text-brand-muted mt-0.5">{sdoh.sdoh_description}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* ═══ K. SEVEN PATHWAYS ═══ */}
            <section>
              <SectionHeader title={t('guide.seven_pathways')} />
              <p className="text-sm text-brand-muted italic mb-4">{t('guide.pathways_subtitle')}</p>

              <div className="space-y-2">
                {themeEntries.map(function ([id, theme]) {
                  const count = pathwayCounts[id] ?? 0
                  const Icon = PATHWAY_ICONS[id] || Globe
                  return (
                    <Link key={id} href={'/pathways/' + theme.slug} className="group flex items-center gap-4 p-3 rounded-lg hover:bg-white transition-colors -mx-3">
                      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                      <Icon size={20} style={{ color: theme.color }} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-brand-text text-sm">{theme.name}</span>
                        <span className="text-xs text-brand-muted ml-2">({count})</span>
                        <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">{theme.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-brand-muted flex-shrink-0 group-hover:text-brand-accent transition-colors" />
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ── SIDEBAR (4/12) ── */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-4 space-y-6">

              {/* Search */}
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <form onSubmit={function (e) { e.preventDefault(); if (searchQuery.trim()) window.location.href = '/search?q=' + encodeURIComponent(searchQuery.trim()) }}>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={function (e) { setSearchQuery(e.target.value) }}
                      placeholder={t('guide.search_placeholder')}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
                    />
                  </div>
                </form>
              </div>

              {/* Language */}
              <div className="bg-white rounded-xl border border-brand-border p-4 flex items-center justify-between">
                <span className="text-xs text-brand-muted uppercase tracking-wide font-semibold">Language</span>
                <LanguageSwitcher />
              </div>

              {/* Quick links */}
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-brand-muted mb-3 font-serif">
                  {t('guide.quick_links')}
                </h3>
                <div className="space-y-1">
                  {DISCOVER_LINKS.map(function (link) {
                    return (
                      <Link key={link.href} href={link.href} className="flex items-center gap-2 py-1.5 text-sm text-brand-muted hover:text-brand-accent transition-colors">
                        <link.icon size={14} style={{ color: BRAND.accent }} />
                        {t(link.label)}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Pathway mini-nav */}
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-xs font-bold tracking-[0.14em] uppercase text-brand-muted mb-3 font-serif">
                  {t('guide.all_pathways')}
                </h3>
                <div className="space-y-1">
                  {themeEntries.map(function ([id, theme]) {
                    const Icon = PATHWAY_ICONS[id] || Globe
                    const count = pathwayCounts[id] ?? 0
                    return (
                      <Link key={id} href={'/pathways/' + theme.slug} className="flex items-center gap-2 py-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors">
                        <span className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                        <Icon size={14} style={{ color: theme.color }} />
                        <span className="flex-1 truncate">{theme.name}</span>
                        <span className="text-xs text-brand-muted">({count})</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
