/**
 * @fileoverview Elected Officials listing page with ZIP code search.
 *
 * Displays all elected officials with filtering by government level,
 * preceded by a hero banner and ZIP code search to find your representatives.
 *
 * @datasource Supabase tables: elected_officials, translations, zip_codes
 * @caching ISR with `revalidate = 86400` (24 hours)
 * @route GET /officials
 */
import type { Metadata } from 'next'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { OfficialsPageClient } from './OfficialsPageClient'
import { PageHero } from '@/components/exchange/PageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Who Represents You',
  description: 'Find your elected officials at every level of government in Houston, Texas.',
}

export default async function OfficialsPage() {
  const { officials, levels, profiles } = await getOfficials()

  // Fetch translations for non-English
  const langId = await getLangId()
  const officialIds = officials.map(function (o) { return o.official_id })
  const translations = langId ? await fetchTranslationsForTable('elected_officials', officialIds, langId) : {}

  return (
    <div>
      {/* Hero banner */}
      <PageHero
        titleKey="officials.title"
        subtitleKey="officials.subtitle"
        backgroundImage="/images/hero/civic-engagement.svg"
        height="sm"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Officials' }]} />
        <OfficialsPageClient officials={officials} levels={levels} translations={translations} linkedinProfiles={profiles} />
      </div>
    </div>
  )
}
