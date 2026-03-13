/**
 * @fileoverview Universal search page — editorial culture guide treatment.
 *
 * @datasource Supabase full-text search via `searchAll()`; translations table for i18n
 * @caching `dynamic = 'force-dynamic'` (no ISR; query-dependent)
 * @route GET /search?q=<query>
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import { searchAll, searchByTaxonomy } from '@/lib/data/search'
import type { TaxonomyFilter } from '@/lib/data/search'
import { HeroSearchInput } from '@/components/exchange/HeroSearchInput'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { SearchTabs } from './SearchTabs'
import { SearchResultsHeader } from './SearchResultsHeader'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 300

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; label?: string }> }): Promise<Metadata> {
  const { q, label } = await searchParams
  const title = label || (q ? 'Search: ' + q : 'Search')
  return {
    title,
    description: 'Search across all content, services, officials, and resources in the Change Engine.',
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sdg?: string; sdoh?: string; gov_level?: string; action_type?: string; time?: string; label?: string }>
}) {
  const params = await searchParams
  const query = params.q || ''
  const label = params.label || ''

  const taxFilter: TaxonomyFilter = {}
  if (params.sdg) taxFilter.sdg = params.sdg
  if (params.sdoh) taxFilter.sdoh = params.sdoh
  if (params.gov_level) taxFilter.gov_level = params.gov_level
  if (params.action_type) taxFilter.action_type = params.action_type
  if (params.time) taxFilter.time = params.time
  const hasTaxFilter = Object.keys(taxFilter).length > 0

  const emptyResults = { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  const results = hasTaxFilter
    ? await searchByTaxonomy(taxFilter)
    : query
      ? await searchAll(query)
      : emptyResults
  const totalCount = results.content.length + results.officials.length + results.services.length + results.organizations.length + results.policies.length + results.situations.length + results.resources.length + results.paths.length

  const langId = await getLangId()
  let officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  let orgTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const oIds = results.officials.map(function (o) { return o.official_id })
    const sIds = results.services.map(function (s) { return s.service_id })
    const orgIds = results.organizations.map(function (o) { return o.org_id })
    const polIds = results.policies.map(function (p) { return p.policy_id })
    const [ot, st, orgt, pt] = await Promise.all([
      oIds.length > 0 ? fetchTranslationsForTable('elected_officials', oIds, langId) : {},
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
      orgIds.length > 0 ? fetchTranslationsForTable('organizations', orgIds, langId) : {},
      polIds.length > 0 ? fetchTranslationsForTable('policies', polIds, langId) : {},
    ])
    officialTranslations = ot
    serviceTranslations = st
    orgTranslations = orgt
    policyTranslations = pt
  }

  const tabs = [
    { key: 'content', labelKey: 'search.tab_content', count: results.content.length, center: 'Learning' },
    { key: 'services', labelKey: 'search.tab_services', count: results.services.length, center: 'Resource' },
    { key: 'officials', labelKey: 'search.tab_officials', count: results.officials.length, center: 'Accountability' },
    { key: 'organizations', labelKey: 'search.tab_organizations', count: results.organizations.length, center: 'Resource' },
    { key: 'policies', labelKey: 'search.tab_policies', count: results.policies.length, center: 'Accountability' },
    { key: 'situations', labelKey: 'search.tab_help', count: results.situations.length, center: 'Action' },
    { key: 'resources', labelKey: 'search.tab_resources', count: results.resources.length, center: 'Action' },
    { key: 'paths', labelKey: 'search.tab_learning', count: results.paths.length, center: 'Learning' },
  ]

  const sections: Record<string, React.ReactNode> = {
    content: (
      <TranslatedContentGrid items={results.content} />
    ),
    services: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.services.map(function (svc) {
          const t = serviceTranslations[svc.service_id]
          return (
            <ServiceCard
              key={svc.service_id}
              name={svc.service_name || ''}
              orgName={svc.org_name}
              description={svc.description_5th_grade}
              phone={svc.phone}
              address={svc.address}
              city={svc.city}
              state={svc.state}
              zipCode={svc.zip_code}
              website={svc.website}
              translatedName={t?.title}
              translatedDescription={t?.summary}
            />
          )
        })}
      </div>
    ),
    officials: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.officials.map(function (o) {
          const t = officialTranslations[o.official_id]
          return (
            <OfficialCard
              key={o.official_id}
              id={o.official_id}
              name={o.official_name || ''}
              title={o.title}
              party={o.party}
              level={o.level}
              email={o.email}
              phone={o.office_phone}
              website={o.website}
              translatedTitle={t?.title}
            />
          )
        })}
      </div>
    ),
    organizations: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.organizations.map(function (org) {
          const t = orgTranslations[org.org_id]
          return (
            <Link key={org.org_id} href={'/organizations/' + org.org_id} className="block p-4 hover:opacity-80 transition-opacity" style={{ border: '1px solid ' + RULE_COLOR }}>
              <h4 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '0.9rem', color: INK, marginBottom: '0.25rem' }}>{t?.title || org.org_name}</h4>
              {(t?.summary || org.description_5th_grade) && (
                <p className="line-clamp-2" style={{ fontFamily: SERIF, fontSize: '0.8rem', color: MUTED }}>{t?.summary || org.description_5th_grade}</p>
              )}
              {org.website && (
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, marginTop: '0.5rem', display: 'inline-block' }}>Visit website</span>
              )}
            </Link>
          )
        })}
      </div>
    ),
    policies: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.policies.map(function (p) {
          const t = policyTranslations[p.policy_id]
          return (
            <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
              <PolicyCard
                name={p.title_6th_grade || p.policy_name || ''}
                summary={p.summary_6th_grade || p.summary_5th_grade}
                billNumber={p.bill_number}
                status={p.status}
                level={p.level}
                sourceUrl={p.source_url}
                translatedName={t?.title}
                translatedSummary={t?.summary}
              />
            </Link>
          )
        })}
      </div>
    ),
    situations: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.situations.map(function (s) {
          return (
            <LifeSituationCard
              key={s.situation_id}
              name={s.situation_name || ''}
              slug={s.situation_slug}
              description={s.description_5th_grade}
              urgency={s.urgency_level}
              iconName={s.icon_name}
            />
          )
        })}
      </div>
    ),
    resources: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.resources.map(function (r: any) {
          return (
            <div key={r.resource_id} className="p-4" style={{ border: '1px solid ' + RULE_COLOR }}>
              <h4 className="line-clamp-2" style={{ fontFamily: SERIF, fontWeight: 600, fontSize: '0.9rem', color: INK, marginBottom: '0.25rem' }}>{r.resource_name}</h4>
              {r.description_5th_grade && (
                <p className="line-clamp-2 mb-2" style={{ fontFamily: SERIF, fontSize: '0.8rem', color: MUTED }}>{r.description_5th_grade}</p>
              )}
              {r.source_url && (
                <Link href={r.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY }}>
                  View resource
                </Link>
              )}
            </div>
          )
        })}
      </div>
    ),
    paths: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.paths.map(function (p) {
          return (
            <Link key={p.path_id} href={'/learn/' + ((p as any).slug || p.path_id)}>
              <LearningPathCard
                name={p.path_name || ''}
                description={p.description_5th_grade}
                themeId={p.theme_id}
                difficulty={p.difficulty_level}
                moduleCount={null}
                estimatedMinutes={null}
              />
            </Link>
          )
        })}
      </div>
    ),
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      {!query && (
        <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
              The Change Engine
            </p>
            <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
              Search
            </h1>
            <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              Find services, officials, policies, organizations, and more across the Change Engine.
            </p>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Search</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="mb-6 max-w-2xl">
          <HeroSearchInput />
        </div>
        <SearchResultsHeader query={label || query} totalCount={totalCount} />

        {totalCount > 0 && (
          <SearchTabs tabs={tabs}>{sections}</SearchTabs>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
