'use client'

import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { useTranslation } from '@/lib/use-translation'

interface TickerTapeProps {
  election?: {
    election_name: string
    election_date: string
    find_polling_url: string | null
  } | null
}

/**
 * Announcements-only ticker tape.
 * Shows election countdown and other time-sensitive announcements.
 * Good Things content has been moved to the GoodThingsWidget.
 */
export function TickerTape({ election }: TickerTapeProps) {
  const { t } = useTranslation()

  // Build election ticker item
  const electionItem = election ? (function () {
    const d = new Date(election.election_date)
    const now = new Date()
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return null
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const daysLabel = diff === 0 ? t('ticker.today') : diff === 1 ? t('ticker.tomorrow') : diff + ' ' + t('ticker.days_away')
    return {
      text: election.election_name + ' — ' + dateStr + ' (' + daysLabel + ')',
      href: '/elections',
    }
  })() : null

  // Only render when there's an announcement to show
  if (!electionItem) return null

  return (
    <div className="bg-brand-bg-alt border-y border-brand-border overflow-hidden relative">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-brand-bg-alt z-10 flex items-center gap-2 px-4 py-2.5 border-r border-brand-border">
          <FlowerOfLifeIcon size={14} color="#C75B2A" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">{t('ticker.announcements')}</span>
        </div>

        {/* Scrolling announcement */}
        <Link
          href={electionItem.href}
          className="flex-1 overflow-hidden hover:bg-brand-border/30 transition-colors"
        >
          <div className="flex items-center whitespace-nowrap py-2.5 px-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: '#e53e3e' }} />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent">
                {electionItem.text}
              </span>
            </span>
          </div>
        </Link>
      </div>
    </div>
  )
}
