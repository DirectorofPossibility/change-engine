import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { THEMES, CIVIC_DATA_REFERENCES } from '@/lib/constants'
import { ExternalLink, BarChart3 } from 'lucide-react'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Open Data — Change Engine',
  description: 'Platform transparency and statistics — see how the Change Engine organizes community knowledge across Houston.',
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
        gradientColor="#1a5030"
        title="Open Data"
        subtitle="Transparency in how we organize community knowledge"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Open Data' }]} />

        {/* Stats Grid */}
        <section className="mt-10">
          <h2 className="font-display text-2xl text-brand-text mb-6">Platform at a Glance</h2>
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
          <h2 className="font-display text-2xl text-brand-text mb-6">Data Sources</h2>
          <div className="bg-white border border-brand-border p-6">
            <p className="text-sm text-brand-muted mb-4">
              The Change Engine aggregates information from trusted public data sources to keep our community knowledge current and accurate.
            </p>
            <ul className="space-y-3">
              {DATA_SOURCES.map(function (source) {
                return (
                  <li key={source} className="flex items-center gap-3 text-brand-text">
                    <span
                      className="w-2 h-2 flex-shrink-0"
                      style={{ backgroundColor: '#1a5030' }}
                    />
                    <span className="text-sm">{source}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        {/* Civic Data Partner */}
        <section className="mt-14">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} style={{ color: '#1a5030' }} />
            <h2 className="font-display text-2xl text-brand-text">Civic Data</h2>
          </div>
          <div className="bg-white border border-brand-border p-6">
            <p className="text-sm text-brand-muted mb-4">
              For deeper neighborhood-level indicators on health, economy, education, housing, and environment across the Houston region, we recommend Understanding Houston — a civic data dashboard from the Greater Houston Community Foundation and the Kinder Institute at Rice University.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.understandinghouston.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1a5030' }}
              >
                <ExternalLink size={14} /> Understanding Houston
              </a>
              {Object.values(CIVIC_DATA_REFERENCES).flat().filter((ref, i, arr) =>
                arr.findIndex(r => r.url === ref.url) === i
              ).map(ref => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-2.5 px-4 text-sm text-brand-text hover:underline transition-colors"
                  style={{ border: '1px solid #dde1e8' }}
                >
                  <ExternalLink size={12} style={{ color: '#5c6474' }} />
                  {ref.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* 7 Pathways */}
        <section className="mt-14">
          <h2 className="font-display text-2xl text-brand-text mb-6">7 Pathways</h2>
          <div className="bg-white border border-brand-border divide-y divide-brand-border">
            {themes.map(function (theme) {
              return (
                <Link
                  key={theme.slug}
                  href={`/pathways/${theme.slug}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-brand-bg transition-colors"
                >
                  <span
                    className="w-3 h-3 flex-shrink-0"
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
