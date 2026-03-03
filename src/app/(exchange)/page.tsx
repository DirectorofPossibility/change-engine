/**
 * @fileoverview Homepage for The Change Engine community platform.
 *
 * Fetches aggregate stats, center/pathway counts, latest content, featured
 * life-situations, and geo-coded map markers (services, voting locations,
 * organizations) via parallel Supabase queries.
 *
 * @datasource Supabase tables: content, services_211, elected_officials,
 *   organizations, policies, life_situations, voting_locations, translations
 * @caching ISR with `revalidate = 1800` (30 minutes)
 * @route GET /
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES, CENTERS, BRAND } from '@/lib/constants'
import { getExchangeStats, getCenterCounts, getPathwayCounts, getLatestContent, getLifeSituations, getLangId, fetchTranslationsForTable, getServicesWithCoords, getVotingLocationsWithCoords, getOrganizationsWithCoords } from '@/lib/data/exchange'
import { CenterCard } from '@/components/exchange/CenterCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { NeighborhoodBanner } from '@/components/exchange/NeighborhoodBanner'
import { HomeMap } from '@/components/exchange/HomeMap'
import type { MarkerData } from '@/components/maps'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'The Change Engine — Community Life, Organized',
  description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function HomePage() {
  const [stats, centerCounts, pathwayCounts, latestContent, situations, sampleServices, sampleVoting, sampleOrgs] = await Promise.all([
    getExchangeStats(),
    getCenterCounts(),
    getPathwayCounts(),
    getLatestContent(6),
    getLifeSituations(),
    getServicesWithCoords(),
    getVotingLocationsWithCoords(),
    getOrganizationsWithCoords(),
  ])

  const featuredSituations = situations
    .filter(function (s) { return s.is_featured === 'Yes' || s.urgency_level === 'Critical' || s.urgency_level === 'High' })
    .slice(0, 6)

  // Build home page map markers (sample from each type, filtering to those with coords)
  const homeMarkers: MarkerData[] = [
    ...sampleServices
      .filter(s => s.latitude != null && s.longitude != null)
      .slice(0, 30)
      .map(s => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        link: '/services/' + s.service_id,
      })),
    ...sampleVoting
      .filter(v => v.latitude != null && v.longitude != null)
      .slice(0, 20)
      .map(v => ({
        id: 'vote-' + v.location_id,
        lat: v.latitude as number,
        lng: v.longitude as number,
        title: v.location_name,
        type: 'voting' as const,
        address: [v.address, v.city].filter(Boolean).join(', '),
      })),
    ...sampleOrgs
      .filter(o => o.latitude != null && o.longitude != null)
      .slice(0, 20)
      .map(o => ({
        id: 'org-' + o.org_id,
        lat: o.latitude as number,
        lng: o.longitude as number,
        title: o.org_name,
        type: 'organization' as const,
        link: '/organizations/' + o.org_id,
      })),
  ]

  const langId = await getLangId()
  const situationTranslations = langId && featuredSituations.length > 0
    ? await fetchTranslationsForTable('life_situations', featuredSituations.map(s => s.situation_id), langId)
    : {}

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-brand-text text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Houston, Texas</p>
          <h1 className="text-3xl sm:text-5xl font-bold mb-3">{BRAND.tagline}</h1>
          <p className="text-base text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
            Find resources, know your representatives, and participate in shaping your community.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/pathways"
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: BRAND.accent }}
            >
              Explore Pathways
            </Link>
            <Link
              href="/help"
              className="px-5 py-2.5 bg-white text-brand-text rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              I Need Help
            </Link>
            <Link
              href="/officials"
              className="px-5 py-2.5 bg-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/20 border border-white/20 transition-colors"
            >
              Find Your Reps
            </Link>
          </div>
        </div>
      </section>

      {/* ── Neighborhood Banner ── */}
      <NeighborhoodBanner />

      {/* ── Houston at a Glance Map ── */}
      <HomeMap markers={homeMarkers} />

      {/* ── 4 Centers ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Four Centers of Community Life</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CENTERS).map(function ([name, config]) {
            return (
              <CenterCard
                key={name}
                name={name}
                emoji={config.emoji}
                question={config.question}
                slug={config.slug}
                count={centerCounts[name] || 0}
              />
            )
          })}
        </div>
      </section>

      {/* ── 7 Pathways ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Seven Pathways</h2>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {Object.entries(THEMES).map(function ([id, theme]) {
            return (
              <Link
                key={id}
                href={'/pathways/' + theme.slug}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.color }}
              >
                <span>{theme.emoji}</span>
                <span>{theme.name}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {pathwayCounts[id] || 0}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── I Need Help ── */}
      {featuredSituations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-text">I Need Help</h2>
            <Link href="/help" className="text-sm text-brand-accent hover:underline">
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredSituations.map(function (s) {
              return (
                <LifeSituationCard
                  key={s.situation_id}
                  name={s.situation_name}
                  slug={s.situation_slug}
                  description={s.description_5th_grade}
                  urgency={s.urgency_level}
                  iconName={s.icon_name}
                  translatedName={situationTranslations[s.situation_id]?.title}
                  translatedDescription={situationTranslations[s.situation_id]?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ── Latest Resources ── */}
      {latestContent.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-brand-text mb-6">Latest Resources</h2>
          <TranslatedContentGrid items={latestContent} />
        </section>
      )}

      {/* ── Stats Bar ── */}
      <section className="bg-brand-text text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: stats.resources, label: 'Resources' },
              { value: stats.officials, label: 'Officials' },
              { value: stats.organizations ?? 0, label: 'Organizations' },
              { value: stats.policies ?? 0, label: 'Policies' },
            ].filter(s => s.value > 0).map(s => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.value.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
