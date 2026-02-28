import Link from 'next/link'
import { searchAll } from '@/lib/data/search'
import { TranslatedContentGrid } from '@/components/exchange/TranslatedContentGrid'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q || ''
  const results = query ? await searchAll(query) : { content: [], officials: [], services: [] }
  const totalCount = results.content.length + results.officials.length + results.services.length

  // Fetch translations for non-English
  const langId = await getLangId()
  var officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  var serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const oIds = results.officials.map(function (o) { return o.official_id })
    const sIds = results.services.map(function (s) { return s.service_id })
    ;[officialTranslations, serviceTranslations] = await Promise.all([
      oIds.length > 0 ? fetchTranslationsForTable('elected_officials', oIds, langId) : {},
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
    ])
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
          <p className="text-brand-muted">Enter a search term to find resources, officials, and services.</p>
        )}
      </div>

      {query && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-muted mb-4">No results found for &ldquo;{query}&rdquo;</p>
          <Link href="/" className="text-brand-accent hover:underline">Back to home</Link>
        </div>
      )}

      {/* Content Results */}
      {results.content.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">
            Resources ({results.content.length})
          </h2>
          <TranslatedContentGrid items={results.content} />
        </section>
      )}

      {/* Officials Results */}
      {results.officials.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">
            Officials ({results.officials.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.officials.map(function (o) {
              var ot = officialTranslations[o.official_id]
              return (
                <OfficialCard
                  key={o.official_id}
                  name={o.official_name}
                  title={o.title}
                  party={o.party}
                  level={o.level}
                  email={o.email}
                  phone={o.office_phone}
                  website={o.website}
                  translatedTitle={ot?.title}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Services Results */}
      {results.services.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">
            Services ({results.services.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.services.map(function (svc) {
              var st = serviceTranslations[svc.service_id]
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
                  translatedName={st?.title}
                  translatedDescription={st?.summary}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
