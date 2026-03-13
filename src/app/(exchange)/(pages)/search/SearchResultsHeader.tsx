'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'

const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
        <h1 style={{ fontFamily: SERIF, fontSize: '2rem', color: INK, marginBottom: '0.5rem' }}>
          {query}
        </h1>
        <p style={{ fontFamily: MONO, fontSize: '0.75rem', color: MUTED }}>
          {totalCount} {totalCount !== 1 ? t('search.results') : t('search.result')}
        </p>
      </div>

      {totalCount === 0 && (
        <div className="text-center py-12">
          <p style={{ fontFamily: SERIF, color: MUTED, marginBottom: '1.5rem' }}>{t('search.no_results')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/help" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontFamily: MONO, fontSize: '0.7rem', border: '1px solid ' + RULE_COLOR, color: INK }}>{t('nav.help')}</Link>
            <Link href="/services" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontFamily: MONO, fontSize: '0.7rem', border: '1px solid ' + RULE_COLOR, color: INK }}>{t('search.find_services')}</Link>
            <Link href="/pathways" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontFamily: MONO, fontSize: '0.7rem', border: '1px solid ' + RULE_COLOR, color: INK }}>{t('search.browse_pathways')}</Link>
            <Link href="/officials/lookup" className="px-4 py-2 text-sm hover:opacity-80" style={{ fontFamily: MONO, fontSize: '0.7rem', border: '1px solid ' + RULE_COLOR, color: INK }}>{t('search.find_reps')}</Link>
          </div>
        </div>
      )}
    </>
  )
}
