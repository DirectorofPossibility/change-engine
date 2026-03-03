/**
 * @fileoverview Translated search results header and empty/zero-results states.
 */
'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface SearchResultsHeaderProps {
  query: string
  totalCount: number
}

/**
 * Renders the translated search results heading, count, and zero-results fallback.
 */
export function SearchResultsHeader({ query, totalCount }: SearchResultsHeaderProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text mb-2">{t('search.title')}</h1>
        {query ? (
          <p className="text-brand-muted">
            {totalCount} {totalCount !== 1 ? t('search.results') : t('search.result')} {t('search.for')} &ldquo;{query}&rdquo;
          </p>
        ) : (
          <p className="text-brand-muted">{t('search.empty')}</p>
        )}
      </div>

      {query && totalCount === 0 && (
        <div className="text-center py-12">
          <p className="text-brand-muted mb-4">{t('search.no_results')} &ldquo;{query}&rdquo;</p>
          <p className="text-sm text-brand-muted mb-6">{t('search.try_different')}</p>
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
