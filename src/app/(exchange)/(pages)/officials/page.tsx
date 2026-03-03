/**
 * @fileoverview Elected Officials listing page with civic engagement hero banner.
 *
 * Displays all elected officials with filtering by government level,
 * preceded by a hero banner with civic engagement imagery. Fetches
 * officials data and optional translations for non-English display.
 *
 * @datasource Supabase tables: elected_officials, translations
 * @caching ISR with `revalidate = 86400` (24 hours)
 * @route GET /officials
 */
import type { Metadata } from 'next'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { OfficialsClient } from './OfficialsClient'
import { PageHero } from '@/components/exchange/PageHero'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Who Represents You',
  description: 'Find your elected officials at every level of government in Houston, Texas.',
}

export default async function OfficialsPage() {
  const { officials, levels } = await getOfficials()

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
        <OfficialsClient officials={officials} levels={levels} translations={translations} />
      </div>
    </div>
  )
}
