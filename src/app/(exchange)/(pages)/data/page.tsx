import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { THEMES, CIVIC_DATA_REFERENCES } from '@/lib/constants'
import { ExternalLink, BarChart3 } from 'lucide-react'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Open Data — Change Engine',
  description: 'Platform transparency and statistics -- see how the Change Engine organizes community knowledge across Houston.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    { label: 'Published Resources', count: contentResult.count ?? 0 },
    { label: 'Elected Officials', count: officialsResult.count ?? 0 },
    { label: 'Policies Tracked', count: policiesResult.count ?? 0 },
    { label: 'Services Available', count: servicesResult.count ?? 0 },
    { label: 'Organizations', count: organizationsResult.count ?? 0 },
    { label: 'Opportunities', count: opportunitiesResult.count ?? 0 },
    { label: 'Focus Areas', count: focusAreasResult.count ?? 0 },
    { label: 'Learning Paths', count: learningPathsResult.count ?? 0 },
  ]

  const themes = Object.values(THEMES)

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ background: PARCHMENT_WARM }}>
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            Open Data
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            Transparency in how we organize community knowledge
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Open Data</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* ── PLATFORM AT A GLANCE ── */}
        <section>
          <div className="flex items-baseline justify-between mb-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
            <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>Platform at a Glance</h2>
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{stats.length} categories</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(function (stat) {
              return (
                <div key={stat.label}>
                  <span style={{ fontFamily: SERIF, color: INK, fontSize: '2rem', fontWeight: 'bold', display: 'block', lineHeight: 1.1 }}>
                    {stat.count.toLocaleString()}
                  </span>
                  <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{stat.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── DATA SOURCES ── */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between mb-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
            <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>Data Sources</h2>
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">{DATA_SOURCES.length} sources</span>
          </div>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm mb-4">
            The Change Engine aggregates information from trusted public data sources to keep our community knowledge current and accurate.
          </p>
          <ul className="space-y-2">
            {DATA_SOURCES.map(function (source) {
              return (
                <li key={source} className="flex items-center gap-3" style={{ color: INK }}>
                  <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: CLAY }} />
                  <span style={{ fontFamily: SERIF }} className="text-sm">{source}</span>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ── CIVIC DATA ── */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
            <BarChart3 size={18} style={{ color: CLAY }} />
            <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>Civic Data</h2>
          </div>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm mb-4">
            For deeper neighborhood-level indicators on health, economy, education, housing, and environment across the Houston region, we recommend Understanding Houston -- a civic data dashboard from the Greater Houston Community Foundation and the Kinder Institute at Rice University.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.understandinghouston.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-[0.08em] font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ fontFamily: MONO, background: CLAY }}
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
                className="inline-flex items-center gap-2 py-2.5 px-4 text-sm hover:underline transition-colors"
                style={{ color: INK, border: '1px solid ' + RULE_COLOR }}
              >
                <ExternalLink size={12} style={{ color: MUTED }} />
                {ref.label}
              </a>
            ))}
          </div>
        </section>

        {/* ── 7 PATHWAYS ── */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between mb-6" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.75rem' }}>
            <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }}>7 Pathways</h2>
            <span style={{ fontFamily: MONO, color: MUTED }} className="text-xs">7 themes</span>
          </div>
          <div style={{ border: '1px solid ' + RULE_COLOR }}>
            {themes.map(function (theme, i) {
              return (
                <Link
                  key={theme.slug}
                  href={'/pathways/' + theme.slug}
                  className="flex items-center gap-3 px-5 py-4 hover:underline transition-colors"
                  style={{ borderBottom: i < themes.length - 1 ? '1px dotted ' + RULE_COLOR : 'none' }}
                >
                  <span className="w-3 h-3 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                  <span style={{ fontFamily: SERIF, color: INK }} className="text-sm font-semibold">{theme.name}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── FOOTER NOTE ── */}
        <section className="mt-12 mb-8">
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-sm leading-relaxed">
            All data is refreshed daily through automated pipelines. Community members can submit resources through our suggestion form.
          </p>
        </section>
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
