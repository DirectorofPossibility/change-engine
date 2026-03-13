'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Vote, MapPin } from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { FeatureOpener } from '@/components/templates/FeatureOpener'
import { DataStories } from '@/components/templates/DataStories'
import { CouchGrid } from '@/components/templates/CouchGrid'
import { ControlPanel } from '@/components/templates/ControlPanel'
import { SectionHeader } from '@/components/templates/SectionHeader'
import { FlowerOfLife } from '@/components/geo/sacred'
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
  /** Pathway accent color — derived from featured content's pathway on server */
  pathwayColor?: string
}

// ── Geo mapping for pathway instruments ──

const THEME_GEO: Record<string, string> = {
  THEME_01: 'flower_of_life',
  THEME_02: 'seed_of_life',
  THEME_03: 'hex_grid',
  THEME_04: 'concentric_rings',
  THEME_05: 'golden_spiral',
  THEME_06: 'torus',
  THEME_07: 'metatron_cube',
}

// ── Helpers ──

function formatDate(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
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
  pathwayColor,
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

  // Totals for data stories
  const totalArticles = stats.resources
  const totalServices = stats.services
  const totalOfficials = stats.officials

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

  // Build couch grid items from latest content
  const couchItems = latestContent.slice(0, 5).map(function (item, i) {
    const themeKey = item.pathway_primary as keyof typeof THEMES | null
    const themeName = themeKey ? THEMES[themeKey]?.name : undefined
    return {
      id: item.id,
      href: '/content/' + item.id,
      title: item.title_6th_grade || t('card.untitled'),
      dek: item.summary_6th_grade || undefined,
      type: themeName || item.center || undefined,
      meta: item.center || undefined,
      imageUrl: item.image_url || undefined,
      isFeature: i === 0,
    }
  })

  // Build pathway instruments for control panel
  const instruments = themeEntries.map(function ([id, theme]) {
    const count = pathwayCounts[id] ?? 0
    return {
      name: theme.name,
      href: '/pathways/' + theme.slug,
      geoType: THEME_GEO[id] || 'seed_of_life',
      themeColor: theme.color,
      levelsFilled: Math.min(5, Math.ceil((count / Math.max(1, totalArticles)) * 25)),
      totalLevels: 5,
      statusText: count + ' resources',
    }
  })

  // Build the featured lede text
  const featureLede = featuredContent
    ? (featuredContent.summary_6th_grade || featuredContent.title_6th_grade || '')
    : t('guide.tagline')
  // Use the server-derived pathway color, falling back to featured content's pathway
  const featureColor = pathwayColor
    || (featuredContent?.pathway_primary
      ? THEMES[featuredContent.pathway_primary as keyof typeof THEMES]?.color || '#1b5e8a'
      : '#1b5e8a')

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1080px] mx-auto px-6">

        {/* ═══ DATELINE BAR ═══ */}
        <div className="flex items-center justify-between py-4 border-b-2 border-ink">
          <div className="flex items-center gap-3">
            <span className="block w-6 h-px bg-faint" />
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-faint">
              Houston, Texas &middot; {formatDate('en-US')}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <form
              onSubmit={function (e) { e.preventDefault(); if (searchQuery.trim()) window.location.href = '/search?q=' + encodeURIComponent(searchQuery.trim()) }}
              className="hidden md:flex items-center"
            >
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={function (e) { setSearchQuery(e.target.value) }}
                  placeholder={t('guide.search_placeholder')}
                  className="pl-9 pr-3 py-1.5 text-[0.78rem] font-mono border border-rule bg-white focus:outline-none focus:border-blue w-[200px]"
                />
              </div>
            </form>
          </div>
        </div>

        {/* ═══ FEATURE OPENER ═══ */}
        {featuredContent && (
          <section>
            <FeatureOpener
              lede={featureLede}
              themeColor={featureColor}
              quotes={[
                {
                  quote: featuredContent.title_6th_grade || t('guide.masthead'),
                  source: featuredContent.pathway_primary
                    ? THEMES[featuredContent.pathway_primary as keyof typeof THEMES]?.name
                    : undefined,
                },
              ]}
            />
            <div className="py-3 border-b border-rule" style={{ borderWidth: '1.5px' }}>
              <Link
                href={'/content/' + featuredContent.id}
                className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-blue hover:underline"
              >
                Read the full story &rarr;
              </Link>
            </div>
          </section>
        )}

        {/* ═══ DATA STORIES ═══ */}
        <section>
          <DataStories
            themeColor={featureColor}
            stories={[
              { num: String(totalArticles), hed: 'Resources', copy: 'Articles, guides, and explainers curated for Houston.' },
              { num: String(totalServices), hed: 'Services', copy: 'Local services from the 211 network and community partners.' },
              { num: String(totalOfficials), hed: 'Officials', copy: 'Elected representatives tracked across every level of government.' },
            ]}
          />
        </section>

        {/* ═══ COUCH GRID — Latest Content ═══ */}
        {couchItems.length > 0 && (
          <section className="py-10">
            <SectionHeader
              kicker="From the Exchange"
              heading="Latest"
              headingEm="Reads"
              allHref="/search"
              allLabel="See all"
            />
            <CouchGrid
              items={couchItems}
              themeColor={featureColor}
              geoType={featuredContent?.pathway_primary ? (THEME_GEO[featuredContent.pathway_primary] || 'seed_of_life') : 'seed_of_life'}
            />
          </section>
        )}

        {/* ═══ CIVIC DESK ═══ */}
        <section className="py-10 border-t-2 border-ink">
          <SectionHeader
            kicker="Civic Intelligence"
            heading="The Civic"
            headingEm="Desk"
            allHref="/governance"
            allLabel="All civic"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-rule" style={{ borderWidth: '1.5px' }}>
            {/* Election countdown */}
            {upcomingElection && daysUntilElection > 0 && (
              <Link
                href="/elections"
                className="p-6 border-b border-rule hover:bg-paper transition-colors md:col-span-2"
                style={{ borderWidth: '1.5px' }}
              >
                <div className="flex items-center gap-4">
                  <Vote size={24} className="text-civic flex-shrink-0" />
                  <div>
                    <span className="font-display text-[2rem] font-black text-civic leading-none">
                      {daysUntilElection}
                    </span>
                    <span className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim ml-2">
                      days until election
                    </span>
                    <p className="font-body text-[0.82rem] text-dim mt-1">{upcomingElection.election_name}</p>
                  </div>
                </div>
              </Link>
            )}

            {/* Officials */}
            {civicHub.officials.slice(0, 4).map(function (official: any) {
              const levelColor: Record<string, string> = {
                Federal: '#1b5e8a', State: '#4a2870', County: '#4a2870', City: '#1a6b56',
              }
              const color = levelColor[official.level] || '#8a929e'
              return (
                <Link
                  key={official.official_id}
                  href={'/officials/' + official.official_id}
                  className="flex items-center gap-3 p-5 border-b border-r border-rule hover:bg-paper transition-colors"
                  style={{ borderWidth: '1.5px' }}
                >
                  <div
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center"
                    style={{ background: color + '15' }}
                  >
                    <span className="font-display font-black text-lg" style={{ color }}>
                      {official.official_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[0.85rem] font-bold text-ink truncate">{official.official_name}</p>
                    <p className="font-mono text-[0.6875rem] text-dim truncate">{official.title}</p>
                    {official.level && (
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color }}>
                        {official.level}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}

            {/* Policies */}
            {civicHub.policies.slice(0, 2).map(function (policy: any) {
              const s = (policy.status || '').toLowerCase()
              const statusColor = s === 'passed' || s === 'enacted' || s === 'signed' ? '#1a6b56'
                : s === 'pending' || s === 'introduced' ? '#4a2870'
                : s === 'failed' || s === 'vetoed' ? '#7a2018'
                : '#8a929e'
              return (
                <div
                  key={policy.policy_id}
                  className="p-5 border-b border-r border-rule"
                  style={{ borderWidth: '1.5px', borderLeft: `3px solid ${statusColor}` }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {policy.bill_number && (
                      <span className="font-mono text-[0.6875rem] text-dim">{policy.bill_number}</span>
                    )}
                    {policy.status && (
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: statusColor }}>
                        {policy.status}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-[0.85rem] font-bold text-ink line-clamp-2">{policy.policy_name}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ YOUR NEIGHBORHOOD ═══ */}
        <section className="py-10 border-t border-rule" style={{ borderWidth: '1.5px' }}>
          <SectionHeader
            kicker="Near You"
            heading="Your"
            headingEm="Neighborhood"
          />

          {!zip ? (
            <div className="border-2 border-ink p-8 text-center">
              <MapPin size={24} className="mx-auto mb-3 text-dim" />
              <p className="font-body text-[0.85rem] text-dim mb-4">{t('guide.neighborhood_prompt')}</p>
              <form onSubmit={handleZipSubmit} className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                <input
                  type="text"
                  value={zipInput}
                  onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                  placeholder={t('zip.enter')}
                  maxLength={5}
                  disabled={isLoading}
                  className="flex-1 font-mono text-[0.82rem] px-3 py-2 border border-rule bg-white focus:outline-none focus:border-blue"
                />
                <button
                  type="submit"
                  disabled={zipInput.length !== 5 || isLoading}
                  className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] font-semibold px-4 py-2 bg-ink text-white disabled:opacity-40"
                >
                  Go
                </button>
              </form>
            </div>
          ) : (
            <div>
              {neighborhood && (
                <p className="font-body text-[0.85rem] font-bold text-ink mb-4">
                  {neighborhood.neighborhood_name}
                  <span className="font-mono text-[0.6875rem] text-dim ml-2">{zip}</span>
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 border border-rule" style={{ borderWidth: '1.5px' }}>
                {nearbyServices.map(function (service) {
                  return (
                    <Link
                      key={service.service_id}
                      href={'/services/' + service.service_id}
                      className="block p-5 border-b border-r border-rule hover:bg-paper transition-colors"
                      style={{ borderWidth: '1.5px' }}
                    >
                      <p className="font-body text-[0.85rem] font-bold text-ink line-clamp-2">{service.service_name}</p>
                      {service.org_name && (
                        <p className="font-mono text-[0.6875rem] text-dim mt-1 italic">{service.org_name}</p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* ═══ LIFE IN HOUSTON ═══ */}
        {lifeSituations.length > 0 && (
          <section className="py-10 border-t border-rule" style={{ borderWidth: '1.5px' }}>
            <SectionHeader
              kicker="When life happens"
              heading="Life in"
              headingEm="Houston"
              allHref="/help"
              allLabel="All resources"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 border border-rule" style={{ borderWidth: '1.5px' }}>
              {lifeSituations.slice(0, 6).map(function (sit: any) {
                const urgencyColors: Record<string, string> = {
                  Critical: '#b03a2a', High: '#1b5e8a', Medium: '#4a2870', Low: '#1a6b56',
                }
                const color = urgencyColors[sit.urgency_level] || '#8a929e'
                return (
                  <Link
                    key={sit.situation_id}
                    href={'/help/' + sit.situation_slug}
                    className="group p-5 border-b border-r border-rule hover:bg-paper transition-colors"
                    style={{ borderWidth: '1.5px' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 flex-shrink-0" style={{ background: color }} />
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color }}>
                        {sit.urgency_level}
                      </span>
                    </div>
                    <h4 className="font-display text-[0.88rem] font-bold text-ink leading-tight mb-1 group-hover:text-blue transition-colors">
                      {sit.situation_name}
                    </h4>
                    {sit.description && (
                      <p className="font-body italic text-[0.75rem] text-dim line-clamp-2">{sit.description}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══ SEVEN PATHWAYS — Control Panel ═══ */}
        <section className="border-t-2 border-ink">
          <ControlPanel
            kicker="The Seven Pathways"
            heading="Explore by theme"
            instruments={instruments}
          />
        </section>

        {/* ═══ PATHWAY QUICK NAV ═══ */}
        <section className="py-10 border-t border-rule" style={{ borderWidth: '1.5px' }}>
          <SectionHeader
            kicker="Navigate"
            heading="All"
            headingEm="Pathways"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 border border-rule" style={{ borderWidth: '1.5px' }}>
            {themeEntries.map(function ([id, theme]) {
              const count = pathwayCounts[id] ?? 0
              return (
                <Link
                  key={id}
                  href={'/pathways/' + theme.slug}
                  className="group flex items-center gap-4 p-5 border-b border-r border-rule hover:bg-paper transition-colors"
                  style={{ borderWidth: '1.5px' }}
                >
                  <FlowerOfLife color={theme.color} size={28} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-[0.92rem] font-bold text-ink group-hover:text-blue transition-colors">
                      {theme.name}
                    </span>
                    <span className="font-mono text-[0.6875rem] text-dim ml-2">({count})</span>
                    <p className="font-body text-[0.75rem] text-dim line-clamp-1 mt-0.5">{theme.description}</p>
                  </div>
                  <span className="font-mono text-[0.6875rem] tracking-[0.1em] uppercase text-blue flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore &rarr;
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}
