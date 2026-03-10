'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'

interface SearchResultsHeaderProps {
  query: string
  totalCount: number
}

export function SearchResultsHeader({ query, totalCount }: SearchResultsHeaderProps) {
  const { t } = useTranslation()

  if (!query) {
    return null
  }

  return (
    <>
      <div className="mb-8">
        {/* Show the search term as the page title */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mb-2">
          {query}
        </h1>
        <p className="text-brand-muted">
          {totalCount} {totalCount !== 1 ? t('search.results') : t('search.result')}
        </p>
      </div>

      {totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-muted mb-6">{t('search.no_results')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/help" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">{t('nav.help')}</Link>
            <Link href="/services" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">{t('search.find_services')}</Link>
            <Link href="/pathways" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">{t('search.browse_pathways')}</Link>
            <Link href="/officials/lookup" className="px-4 py-2 bg-white border border-brand-border rounded-lg text-sm text-brand-text hover:bg-brand-bg">{t('search.find_reps')}</Link>
          </div>
        </div>
      )}
    </>
  )
}
