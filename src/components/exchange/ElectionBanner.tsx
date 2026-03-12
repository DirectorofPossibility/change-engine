'use client'

import Link from 'next/link'
import { useState } from 'react'
import { X, Vote } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

/**
 * Urgent election banner. Shows when an election is upcoming or today.
 * Dismissible per session via state (not localStorage to keep it visible across tabs).
 *
 * Receives election data from the server layout — no hardcoded dates.
 * Falls back to a generic "Stay informed" banner if no upcoming election.
 */

export interface ElectionData {
  election_name: string
  election_date: string
  election_type: string | null
  polls_open: string | null
  polls_close: string | null
  find_polling_url: string | null
  register_url: string | null
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function ElectionBanner({ election }: { election: ElectionData | null }) {
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation()

  if (dismissed) return null

  // No upcoming election — show nothing (generic banner removed to reduce noise)
  if (!election) return null

  const daysUntil = getDaysUntil(election.election_date)

  // Only show if election is within 14 days
  if (daysUntil > 14 || daysUntil < 0) return null

  const isToday = daysUntil === 0
  const isTomorrow = daysUntil === 1

  const urgencyText = isToday
    ? t('election.today')
    : isTomorrow
      ? t('election.tomorrow')
      : t('election.in_days_prefix') + ' ' + daysUntil + ' ' + t('election.in_days_suffix')

  const urgencyColor = isToday || isTomorrow
    ? 'bg-red-700'
    : daysUntil <= 3
      ? 'bg-orange-600'
      : 'bg-brand-accent'

  const pollsTime = election.polls_open && election.polls_close
    ? `${election.polls_open} – ${election.polls_close}`
    : null

  return (
    <div className={`${urgencyColor} text-white relative`}>
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap min-w-0">
            <span className="flex-shrink-0 bg-white/20 px-2.5 py-1 text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
              <Vote size={14} />
              {urgencyText}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {election.election_name} — {formatDisplayDate(election.election_date)}
              </p>
              {pollsTime && (
                <p className="text-xs text-white/80">
                  {t('election.polls_open_prefix')} {pollsTime}. {t('election.polls_open_suffix')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Link
              href={election.find_polling_url || '/polling-places'}
              className="bg-white text-brand-text px-4 py-2 text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {t('election.find_polling')}
            </Link>
            {election.register_url && (
              <a
                href={election.register_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex bg-white/15 border border-white/30 px-3 py-2 text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap"
              >
                Check Registration
              </a>
            )}
            <a
              href="https://www.harrisvotes.com/SampleBallot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex bg-white/15 border border-white/30 px-3 py-2 text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              Sample Ballot
            </a>
            <Link
              href="/elections"
              className="hidden sm:inline-flex bg-white/15 border border-white/30 px-3 py-2 text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              {t('election.info')}
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss election banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
