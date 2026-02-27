import { getTranslationStats, getTranslationsWithContent } from '@/lib/data/dashboard'
import { TranslationsClient } from './TranslationsClient'

export default async function TranslationsPage() {
  const [stats, data] = await Promise.all([
    getTranslationStats(),
    getTranslationsWithContent(),
  ])
  return (
    <TranslationsClient
      stats={stats}
      published={data.published}
      translations={data.translations}
    />
  )
}
