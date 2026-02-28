import type { Metadata } from 'next'
import { getOfficials, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { OfficialsClient } from './OfficialsClient'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Elected Officials</h1>
      <p className="text-brand-muted mb-8">
        Find and contact your elected representatives at every level of government.
      </p>

      <OfficialsClient officials={officials} levels={levels} translations={translations} />
    </div>
  )
}
