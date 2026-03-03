import Link from 'next/link'
import type { Metadata } from 'next'
import { searchAll } from '@/lib/data/search'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { SearchTabs } from './SearchTabs'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  var { q } = await searchParams
  return {
    title: q ? 'Search: ' + q : 'Search',
    description: 'Search across all content, services, officials, and resources in The Change Engine.',
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  var { q } = await searchParams
  var query = q || ''
  var results = query ? await searchAll(query) : { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  var totalCount = results.content.length + results.officials.length + results.services.length + results.organizations.length + results.policies.length + results.situations.length + results.resources.length + results.paths.length

  // Fetch translations for non-English
  var langId = await getLangId()
  var officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  var serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  var orgTranslations: Record<string, { title?: string; summary?: string }> = {}
  var policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    var oIds = results.officials.map(function (o) { return o.official_id })
    var sIds = results.services.map(function (s) { return s.service_id })
    var orgIds = results.organizations.map(function (o) { return o.org_id })
    var polIds = results.policies.map(function (p) { return p.policy_id })
    var [ot, st, orgt, pt] = await Promise.all([
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

  var tabs = [
    { key: 'content', label: 'Content', count: results.content.length },
    { key: 'services', label: 'Services', count: results.services.length },
    { key: 'officials', label: 'Officials', count: results.officials.length },
    { key: 'organizations', label: 'Organizations', count: results.organizations.length },
    { key: 'policies', label: 'Policies', count: results.policies.length },
    { key: 'situations', label: 'Help', count: results.situations.length },
    { key: 'resources', label: 'Resources', count: results.resources.length },
    { key: 'paths', label: 'Learning', count: results.paths.length },
  ]

  var sections: Record<string, React.ReactNode> = {
    content: (
      <TranslatedContentGrid items={results.content} />
    ),
    services: (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.services.map(function (svc) {
          var t = serviceTranslations[svc.service_id]
          return (
            <ServiceCard
              key={svc.service_id}
              name={svc.service_name}
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
          var t = officialTranslations[o.official_id]
          return (
            <OfficialCard
              key={o.official_id}
              id={o.official_id}
              name={o.official_name}
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
          var t = orgTranslations[org.org_id]
          return (
            <Link key={org.org_id} href={'/organizations/' + org.org_id} className="block bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
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
          var t = policyTranslations[p.policy_id]
          return (
            <PolicyCard
              key={p.policy_id}
              name={p.policy_name}
              summary={p.summary_5th_grade}
              billNumber={p.bill_number}
              status={p.status}
              level={p.level}
              sourceUrl={null}
              translatedName={t?.title}
              translatedSummary={t?.summary}
            />
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
              name={s.situation_name}
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
            <div key={r.resource_id} className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
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
            <Link key={p.path_id} href={'/learn/' + p.path_id}>
              <LearningPathCard
                name={p.path_name}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text mb-2">Search Results</h1>
        {query ? (
          <p className="text-brand-muted">
            {totalCount} result{totalCount !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <p className="text-brand-muted">Enter a search term to find content, services, officials, and more.</p>
        )}
      </div>

      {query && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-muted mb-4">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-brand-muted mb-6">Try different keywords or browse our categories:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/help" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">I Need Help</Link>
            <Link href="/services" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">Find Services</Link>
            <Link href="/pathways" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">Browse Pathways</Link>
            <Link href="/officials/lookup" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">Find My Reps</Link>
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <SearchTabs tabs={tabs}>{sections}</SearchTabs>
      )}
    </div>
  )
}
