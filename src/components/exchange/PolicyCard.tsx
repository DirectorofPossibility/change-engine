'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

interface PolicyCardProps {
  name: string
  summary: string | null
  billNumber: string | null
  status: string | null
  level: string | null
  sourceUrl: string | null
  translatedName?: string
  translatedSummary?: string
  onSelect?: () => void
}

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return 'bg-green-100 text-green-700'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return 'bg-yellow-100 text-yellow-700'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

export function PolicyCard({ name, summary, billNumber, status, level, sourceUrl, translatedName, translatedSummary, onSelect }: PolicyCardProps) {
  const { t } = useTranslation()
  const displayName = translatedName || name
  const displaySummary = translatedSummary || summary

  return (
    <div
      className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow"
      {...(onSelect ? { role: 'button', tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent<HTMLDivElement>) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }, style: { cursor: 'pointer' } } : {})}
    >
      <div className="flex items-center gap-2 mb-2">
        {billNumber && (
          <span className="text-xs font-mono text-brand-muted">{billNumber}</span>
        )}
        {status && (
          <span className={'text-xs px-2 py-0.5 rounded-lg font-medium ' + statusColor(status)}>
            {status}
          </span>
        )}
      </div>
      <h4 className="font-semibold text-brand-text text-sm mb-1 line-clamp-2">{displayName}</h4>
      {displaySummary && (
        <p className="text-xs text-brand-muted mb-2 line-clamp-2">{displaySummary}</p>
      )}
      <div className="flex items-center justify-between">
        {level && (
          <span className="text-xs text-brand-muted">{level}</span>
        )}
        {sourceUrl && (
          <Link
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-accent hover:underline"
          >
            {t('card.view_source')} &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
