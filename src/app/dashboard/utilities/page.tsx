/**
 * @fileoverview Unified Utilities page with tabs for Translations, Fidelity,
 * Taxonomy, and LinkedIn review.
 *
 * @route GET /dashboard/utilities
 */

import type { Metadata } from 'next'
import { getTranslationStats, getTranslationsWithContent, getFidelityOverview, getThemesWithFocusAreas } from '@/lib/data/dashboard'
import { UtilitiesClient } from './UtilitiesClient'
import { TranslationsClient } from '../translations/TranslationsClient'
import { FidelityClient } from '../fidelity/FidelityClient'
import { TaxonomyClient } from '../taxonomy/TaxonomyClient'
import LinkedInReviewPage from '../linkedin/page'

export const metadata: Metadata = {
  title: 'Utilities — Pipeline Admin',
  description: 'Translation, fidelity, taxonomy, and LinkedIn tools.',
}

export const dynamic = 'force-dynamic'

export default async function UtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab || 'translations'

  let content: React.ReactNode = null

  if (tab === 'translations') {
    const [stats, data] = await Promise.all([
      getTranslationStats(),
      getTranslationsWithContent(),
    ])
    content = (
      <TranslationsClient
        stats={stats}
        published={data.published}
        translations={data.translations}
      />
    )
  } else if (tab === 'fidelity') {
    let overview: Awaited<ReturnType<typeof getFidelityOverview>> = []
    try {
      overview = await getFidelityOverview()
    } catch (err) {
      console.error('getFidelityOverview error:', err)
    }
    content = <FidelityClient overview={overview} />
  } else if (tab === 'taxonomy') {
    const data = await getThemesWithFocusAreas()
    content = (
      <TaxonomyClient
        themes={data.themes}
        focusAreas={data.focusAreas}
        sdgs={data.sdgs}
        sdoh={data.sdoh}
        ntee={data.ntee}
        airs={data.airs}
      />
    )
  } else if (tab === 'linkedin') {
    content = <LinkedInReviewPage />
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Utilities</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data quality tools, translations, taxonomy management, and LinkedIn verification.
        </p>
      </div>
      <UtilitiesClient activeTab={tab}>
        {content}
      </UtilitiesClient>
    </div>
  )
}
