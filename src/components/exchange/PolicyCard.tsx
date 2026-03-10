'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'

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
  lastActionDate?: string | null
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

function recencyLabel(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + 'd ago'
  if (days < 30) return Math.floor(days / 7) + 'w ago'
  return null
}

export function PolicyCard({ name, summary, billNumber, status, level, sourceUrl, translatedName, translatedSummary, impactPreview, lastActionDate, onSelect }: PolicyCardProps) {
  const { t } = useTranslation()
  const displayName = translatedName || name
  const displaySummary = translatedSummary || summary
  const levelColor = (level && LEVEL_COLORS[level]) || DEFAULT_LEVEL_COLOR
  const recency = recencyLabel(lastActionDate)

  return (
    <div
      className="bg-white rounded-xl border border-brand-border overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group"
      style={{ boxShadow: '3px 3px 0 ' + levelColor + '20', ...(onSelect ? { cursor: 'pointer' } : {}) }}
      {...(onSelect ? { role: 'button', tabIndex: 0, onClick: onSelect, onKeyDown: function (e: React.KeyboardEvent<HTMLDivElement>) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } } } : {})}
    >
      {/* Level color bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: levelColor }} />

      <div className="p-4">
        {/* Top row: bill number + status + recency */}
        <div className="flex items-center gap-2 mb-2">
          {billNumber && (
            <span className="text-[11px] font-mono font-medium text-brand-muted bg-brand-bg px-1.5 py-0.5 rounded">{billNumber}</span>
          )}
          {status && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: statusDotColor(status) }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusDotColor(status) }} />
              {status}
            </span>
          )}
          {recency && (
            <span className="ml-auto text-[10px] font-mono font-bold text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">
              {recency}
            </span>
          )}
        </div>

        <h4 className="font-bold text-brand-text text-sm mb-1.5 line-clamp-2 leading-snug group-hover:text-brand-accent transition-colors">{displayName}</h4>

        {displaySummary && (
          <p className="text-xs text-brand-muted mb-2 line-clamp-2 leading-relaxed">{displaySummary}</p>
        )}

        {impactPreview && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2 line-clamp-1 border border-amber-200">{impactPreview}</p>
        )}

        <div className="flex items-center justify-between">
          {level && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: levelColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: levelColor }} />
              {level}
            </span>
          )}
          {sourceUrl && (
            <Link
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-accent hover:underline font-medium"
              onClick={function (e) { e.stopPropagation() }}
            >
              {t('card.view_source')} &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
