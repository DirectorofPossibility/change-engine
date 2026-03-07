import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { THEMES } from '@/lib/constants'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Open Data — Community Exchange',
  description: 'Platform transparency and statistics — see how the Community Exchange organizes community knowledge across Houston.',
}

const DATA_SOURCES = [
  'Congress.gov',
  'Google Civic API',
  'Texas Legislature Online',
  'City of Houston Legistar',
  'Harris County Legistar',
  '211 Texas',
  'RSS Feeds',
  'Community Submissions',
]

export default async function OpenDataPage() {
  const supabase = await createClient()

  const [
    contentResult,
    officialsResult,
    policiesResult,
    servicesResult,
    organizationsResult,
    opportunitiesResult,
    focusAreasResult,
    learningPathsResult,
  ] = await Promise.all([
    supabase.from('content_published').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('elected_officials').select('*', { count: 'exact', head: true }),
    supabase.from('policies').select('*', { count: 'exact', head: true }),
    supabase.from('services_211').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('focus_areas').select('*', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Published Resources', count: contentResult.count ?? 0, color: THEMES.THEME_01.color },
    { label: 'Elected Officials', count: officialsResult.count ?? 0, color: THEMES.THEME_04.color },
    { label: 'Policies Tracked', count: policiesResult.count ?? 0, color: THEMES.THEME_05.color },
    { label: 'Services Available', count: servicesResult.count ?? 0, color: THEMES.THEME_03.color },
    { label: 'Organizations', count: organizationsResult.count ?? 0, color: THEMES.THEME_02.color },
    { label: 'Opportunities', count: opportunitiesResult.count ?? 0, color: THEMES.THEME_06.color },
    { label: 'Focus Areas', count: focusAreasResult.count ?? 0, color: THEMES.THEME_07.color },
    { label: 'Learning Paths', count: learningPathsResult.count ?? 0, color: THEMES.THEME_05.color },
  ]

  const themes = Object.values(THEMES)

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="metatron"
        gradientColor="#319795"
        title="Open Data"
        subtitle="Transparency in how we organize community knowledge"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Open Data' }]} />

        {/* Stats Grid */}
        <section className="mt-10">
          <h2 className="font-serif text-2xl text-brand-text mb-6">Platform at a Glance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.map(function (stat) {
              return (
                <div key={stat.label} className="card-stat">
                  <span
                    className="block font-hand text-[42px] font-bold leading-none mb-1.5"
                    style={{ color: stat.color }}
                  >
                    {stat.count.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-brand-muted">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Data Sources */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-brand-text mb-6">Data Sources</h2>
          <div className="bg-white border-2 border-brand-border rounded-lg p-6">
            <p className="text-sm text-brand-muted mb-4">
              The Community Exchange aggregates information from trusted public data sources to keep our community knowledge current and accurate.
            </p>
            <ul className="space-y-3">
              {DATA_SOURCES.map(function (source) {
                return (
                  <li key={source} className="flex items-center gap-3 text-brand-text">
                    <span
                      className="w-2 h-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: '#319795' }}
                    />
                    <span className="text-sm">{source}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* 7 Pathways */}
        <section className="mt-14">
          <h2 className="font-serif text-2xl text-brand-text mb-6">7 Pathways</h2>
          <div className="bg-white border-2 border-brand-border rounded-lg divide-y divide-brand-border">
            {themes.map(function (theme) {
              return (
                <Link
                  key={theme.slug}
                  href={`/pathways/${theme.slug}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-brand-bg transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-sm font-semibold text-brand-text">{theme.name}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Footer Note */}
        <section className="mt-14 mb-8">
          <p className="text-sm text-brand-muted leading-relaxed">
            All data is refreshed daily through automated pipelines. Community members can submit resources through our suggestion form.
          </p>
        </section>
      </div>
    </div>
  )
}
