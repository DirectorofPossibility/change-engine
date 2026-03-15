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
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {query}
        </h1>
        <p style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          {totalCount} {totalCount !== 1 ? t('search.results') : t('search.result')}
        </p>
      </div>

      {totalCount === 0 && (
        <div className="text-center py-12">
          <p style={{ color: "#5c6474", marginBottom: '1.5rem' }}>{t('search.no_results')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/help" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontSize: '0.875rem', border: '1px solid #dde1e8',  }}>{t('nav.help')}</Link>
            <Link href="/services" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontSize: '0.875rem', border: '1px solid #dde1e8',  }}>{t('search.find_services')}</Link>
            <Link href="/pathways" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontSize: '0.875rem', border: '1px solid #dde1e8',  }}>{t('search.browse_pathways')}</Link>
            <Link href="/officials/lookup" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontSize: '0.875rem', border: '1px solid #dde1e8',  }}>{t('search.find_reps')}</Link>
          </div>
        </div>
      )}
    </>
  )
}
