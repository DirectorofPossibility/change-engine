/**
 * @fileoverview Universal search page for The Change Engine.
 *
 * Uses the `searchAll()` helper to perform full-text search across 8 entity
 * types: content, services, officials, organizations, policies, life
 * situations, resources, and learning paths.  For non-English users the
 * page fetches per-entity translations in parallel via
 * `fetchTranslationsForTable`.  Results are rendered in a tabbed UI
 * (`SearchTabs`) with per-type cards.
 *
 * @datasource Supabase full-text search via `searchAll()`; translations
 *   table for i18n
 * @caching `dynamic = 'force-dynamic'` (no ISR; query-dependent)
 * @route GET /search?q=<query>
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { PAGE_INTROS, CENTER_COLORS, THEMES } from '@/lib/constants'
import { searchAll } from '@/lib/data/search'
import { PageHero } from '@/components/exchange/PageHero'
import { HeroSearchInput } from '@/components/exchange/HeroSearchInput'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { CompactCircleGraph } from '@/components/exchange/CompactCircleGraph'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { SearchTabs } from './SearchTabs'
import { SearchResultsHeader } from './SearchResultsHeader'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? 'Search: ' + q : 'Search',
    description: 'Search across all content, services, officials, and resources in the Community Exchange.',
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q || ''
  const results = query ? await searchAll(query) : { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  const totalCount = results.content.length + results.officials.length + results.services.length + results.organizations.length + results.policies.length + results.situations.length + results.resources.length + results.paths.length

  // ── Translations (non-English users) ──
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

  // ── Extract active pathways from results ──
  const THEME_ENTRIES = Object.entries(THEMES) as Array<[string, { name: string; color: string; slug: string }]>
  const slugToKey = Object.fromEntries(THEME_ENTRIES.map(function ([k, v]) { return [v.slug, k] }))
  const activePathwaySet = new Set<string>()
  results.content.forEach(function (c: any) {
    if (c.pathway_primary && slugToKey[c.pathway_primary]) activePathwaySet.add(slugToKey[c.pathway_primary])
  })
  results.paths.forEach(function (p: any) {
    if (p.theme_id) activePathwaySet.add(p.theme_id)
  })
  const searchPathways = Array.from(activePathwaySet)

  // ── Tab definitions ──
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

  // ── Per-tab result sections ──
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
            <Link key={org.org_id} href={'/organizations/' + org.org_id} className="block bg-white rounded-xl border-2 border-brand-border p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-brand-text text-sm mb-1">{t?.title || org.org_name}</h4>
              {(t?.summary || org.description_5th_grade) && (
                <p className="text-xs text-brand-muted line-clamp-2">{t?.summary || org.description_5th_grade}</p>
              )}
              {org.website && (
                <span className="text-xs text-brand-accent mt-2 inline-block">Visit website</span>
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
            <div key={r.resource_id} className="bg-white rounded-xl border-2 border-brand-border p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-brand-text text-sm mb-1 line-clamp-2">{r.resource_name}</h4>
              {r.description_5th_grade && (
                <p className="text-xs text-brand-muted line-clamp-2 mb-2">{r.description_5th_grade}</p>
              )}
              {r.source_url && (
                <Link href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent hover:underline">
                  View resource &rarr;
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
    <div>
      {!query && (
        <PageHero variant="editorial" titleKey="search.title" intro={PAGE_INTROS.search} height="sm" />
      )}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Search' }]} />
        <div className="mb-6 max-w-2xl">
          <HeroSearchInput />
        </div>
        <SearchResultsHeader query={query} totalCount={totalCount} />

        {totalCount > 0 && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 min-w-0">
              <SearchTabs tabs={tabs}>{sections}</SearchTabs>
            </div>
            {searchPathways.length > 0 && (
              <aside className="lg:w-72 shrink-0">
                <div className="bg-white rounded-xl border-2 border-brand-border p-4 lg:sticky lg:top-24">
                  <h3 className="font-serif text-sm font-semibold text-brand-text mb-1">Pathways in Results</h3>
                  <p className="text-[10px] text-brand-muted mb-2">{searchPathways.length} of 7 pathways represented</p>
                  <CompactCircleGraph activePathways={searchPathways} accentColor="#C75B2A" />
                  <div className="space-y-1.5 mt-2">
                    {THEME_ENTRIES.map(function ([key, theme]) {
                      const isActive = activePathwaySet.has(key)
                      if (!isActive) return null
                      return (
                        <Link key={key} href={'/pathways/' + theme.slug} className="flex items-center gap-1.5 text-xs text-brand-text hover:text-brand-accent transition-colors">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                          {theme.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
