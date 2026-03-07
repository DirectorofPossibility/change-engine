'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'

interface PolicyCardProps {
  name: string
  summary: string | null
  billNumber: string | null
  status: string | null
  level: string | null
  sourceUrl: string | null
  translatedName?: string
  translatedSummary?: string
  impactPreview?: string | null
  onSelect?: () => void
}

function statusDotColor(status: string | null): string {
  if (!status) return '#9B9590'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return '#2D8659'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return '#C47D1A'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#C53030'
  return '#9B9590'
}

function statusTextColor(status: string | null): string {
  if (!status) return '#6B6560'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return '#2D8659'
  if (s === 'pending' || s === 'introduced' || s === 'in committee') return '#C47D1A'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return '#C53030'
  return '#6B6560'
}

export function PolicyCard({ name, summary, billNumber, status, level, sourceUrl, translatedName, translatedSummary, impactPreview, onSelect }: PolicyCardProps) {
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
          <Link href={'/search?q=' + encodeURIComponent(status)} className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: statusTextColor(status) }} onClick={function (e) { e.stopPropagation() }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDotColor(status) }} />
            {status}
          </Link>
        )}
      </div>
      <h4 className="font-semibold text-brand-text text-sm mb-1 line-clamp-2">{displayName}</h4>
      {displaySummary && (
        <p className="text-xs text-brand-muted mb-2 line-clamp-2">{displaySummary}</p>
      )}
      {impactPreview && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mb-2 line-clamp-1">{impactPreview}</p>
      )}
      <div className="flex items-center justify-between">
        {level && (
          <Link href={'/search?q=' + encodeURIComponent(level)} className="text-xs text-brand-muted hover:text-brand-accent transition-colors" onClick={function (e) { e.stopPropagation() }}>
            {level}
          </Link>
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
