import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES, CENTERS, BRAND } from '@/lib/constants'
import { getExchangeStats, getCenterCounts, getPathwayCounts, getLatestContent, getLifeSituations } from '@/lib/data/exchange'
import { CenterCard } from '@/components/exchange/CenterCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { NeighborhoodBanner } from '@/components/exchange/NeighborhoodBanner'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'The Change Engine — Community Life, Organized',
  description: 'Your guide to services, civic engagement, and community resources in Houston, Texas.',
}

export default async function HomePage() {
  const [stats, centerCounts, pathwayCounts, latestContent, situations] = await Promise.all([
    getExchangeStats(),
    getCenterCounts(),
    getPathwayCounts(),
    getLatestContent(6),
    getLifeSituations(),
  ])

  const featuredSituations = situations
    .filter(function (s) { return s.is_featured === 'Yes' || s.urgency_level === 'Critical' || s.urgency_level === 'High' })
    .slice(0, 6)

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-text text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{BRAND.tagline}</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Your civic platform for Houston. Find resources, connect with services, and participate in your community.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/pathways"
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND.accent }}
            >
              Explore Pathways
            </Link>
            <Link
              href="/help"
              className="px-6 py-3 bg-white text-brand-text rounded-lg text-sm font-semibold hover:bg-gray-100"
            >
              I Need Help
            </Link>
          </div>
        </div>
      </section>

      {/* Neighborhood Banner */}
      <NeighborhoodBanner />

      {/* 4 Centers */}
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

      {/* 7 Pathways */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-brand-text mb-6">Seven Pathways</h2>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {Object.entries(THEMES).map(function ([id, theme]) {
            return (
              <Link
                key={id}
                href={'/pathways/' + theme.slug}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: theme.color }}
              >
                <span>{theme.emoji}</span>
                <span>{theme.name}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {pathwayCounts[id] || 0}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* I Need Help */}
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
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Latest Content — uses TranslatedContentGrid for translation support */}
      {latestContent.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-brand-text mb-6">Latest Resources</h2>
          <TranslatedContentGrid items={latestContent} />
        </section>
      )}

      {/* Stats Bar */}
      <section className="bg-brand-text text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">{stats.resources}</div>
              <div className="text-sm text-gray-400 mt-1">Resources</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.services}</div>
              <div className="text-sm text-gray-400 mt-1">Services</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.officials}</div>
              <div className="text-sm text-gray-400 mt-1">Officials</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.learningPaths}</div>
              <div className="text-sm text-gray-400 mt-1">Learning Paths</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
