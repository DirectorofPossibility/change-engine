/**
 * @fileoverview Homepage for The Change Engine community platform.
 *
 * Features a redesigned layout with:
 *  - Full-width hero with Houston skyline SVG, gradient overlay, and floating stats circles
 *  - Horizontal scrollable pathway circles (Yelp-style category browsing)
 *  - Circular center cards with SVG images and resource count badges
 *  - Content cards with gradient placeholder images
 *  - Stats bar with circular badge motif
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
import Image from 'next/image'
import { THEMES, CENTERS, BRAND } from '@/lib/constants'
import { getExchangeStats, getCenterCounts, getPathwayCounts, getLatestContent, getLifeSituations, getLangId, fetchTranslationsForTable, getServicesWithCoords, getVotingLocationsWithCoords, getOrganizationsWithCoords } from '@/lib/data/exchange'
import { CenterCard } from '@/components/exchange/CenterCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { NeighborhoodBanner } from '@/components/exchange/NeighborhoodBanner'
import { HomeMap } from '@/components/exchange/HomeMap'
import { HomepageHero } from '@/components/exchange/HomepageHero'
import { HomeSectionHeading, HomeResourcesHeading, HomeStatLabel, HomeCommunityGlance } from '@/components/exchange/HomepageSections'
import { PathwayCircle } from '@/components/exchange/PathwayCircle'
import { StatsCircle } from '@/components/exchange/StatsCircle'
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

  /** Stat entries filtered to non-zero values for the stats bar. */
  const statEntries = [
    { value: stats.resources, labelKey: 'home.stats_resources', color: '#C75B2A' },
    { value: stats.officials, labelKey: 'home.stats_officials', color: '#38a169' },
    { value: stats.organizations ?? 0, labelKey: 'home.stats_organizations', color: '#3182ce' },
    { value: stats.policies ?? 0, labelKey: 'home.stats_policies', color: '#805ad5' },
  ].filter(s => s.value > 0)

  return (
    <div>
      {/* ── Hero with Houston Skyline ── */}
      <section className="relative overflow-hidden">
        {/* TODO: Replace with real Houston photography */}
        <div className="relative h-[480px] sm:h-[540px]">
          <Image
            src="/images/hero/houston-skyline.svg"
            alt="Houston skyline"
            fill
            className="object-cover"
            priority
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

          {/* Hero text content */}
          <HomepageHero />
        </div>

        {/* Floating stats circles overlapping hero bottom edge */}
        {statEntries.length > 0 && (
          <div className="relative -mt-14 z-10 max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              {statEntries.map(s => (
                <div key={s.labelKey} className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center
                               border-4 shadow-xl bg-white"
                    style={{ borderColor: s.color }}
                  >
                    <span className="text-lg sm:text-2xl font-bold text-brand-text leading-none">
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                  <HomeStatLabel labelKey={s.labelKey} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Neighborhood Banner ── */}
      <NeighborhoodBanner />

      {/* ── Pathway Circles (Yelp-style category browsing) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HomeSectionHeading titleKey="home.seven_pathways" subtitleKey="home.pathways_subtitle" />
        <div className="flex gap-6 sm:gap-8 overflow-x-auto pb-4 scrollbar-hide">
          {Object.entries(THEMES).map(function ([id, theme]) {
            return (
              <PathwayCircle
                key={id}
                id={id}
                name={theme.name}
                color={theme.color}
                slug={theme.slug}
                emoji={theme.emoji}
                count={pathwayCounts[id] || 0}
              />
            )
          })}
        </div>
      </section>

      {/* ── 4 Centers — Circular badge layout ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <HomeSectionHeading titleKey="home.four_centers" subtitleKey="home.centers_subtitle" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {/* ── Houston at a Glance Map ── */}
      <HomeMap markers={homeMarkers} />

      {/* ── Available Resources ── */}
      {featuredSituations.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <HomeResourcesHeading />
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
          <HomeSectionHeading titleKey="home.latest_resources" subtitleKey="home.latest_subtitle" />
          <TranslatedContentGrid items={latestContent} />
        </section>
      )}

      {/* ── Stats Bar with Circle Motif ── */}
      <section className="bg-brand-text text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <HomeCommunityGlance />
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            {statEntries.map(s => (
              <StatsCircle
                key={s.labelKey}
                value={s.value}
                labelKey={s.labelKey}
                accentColor={s.color}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
