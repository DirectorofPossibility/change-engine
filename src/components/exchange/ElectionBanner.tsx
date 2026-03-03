'use client'

import Link from 'next/link'
import { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Urgent election banner. Shows when an election is upcoming or today.
 * Dismissible per session via state (not localStorage to keep it visible across tabs).
 */

const ELECTION = {
  name: 'Texas Primary Election',
  date: '2026-03-03',
  displayDate: 'Tuesday, March 3',
  polls: '7:00 AM – 7:00 PM',
  findPollingPlace: 'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do',
  sampleBallot: 'https://www.harrisvotes.com/Polling-Locations',
  registerCheck: 'https://www.votetexas.gov/register-to-vote/',
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function ElectionBanner() {
  const [dismissed, setDismissed] = useState(false)
  const daysUntil = getDaysUntil(ELECTION.date)

  // Only show if election is within 14 days (past or future up to 0 = today)
  if (dismissed || daysUntil > 14 || daysUntil < 0) return null

  const isToday = daysUntil === 0
  const isTomorrow = daysUntil === 1

  const urgencyText = isToday
    ? 'TODAY — POLLS ARE OPEN'
    : isTomorrow
      ? 'TOMORROW'
      : `IN ${daysUntil} DAYS`

  const urgencyColor = isToday || isTomorrow
    ? 'bg-red-700'
    : daysUntil <= 3
      ? 'bg-orange-600'
      : 'bg-brand-accent'

  return (
    <div className={`${urgencyColor} text-white relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap min-w-0">
            <span className="flex-shrink-0 bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase">
              {urgencyText}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {ELECTION.name} — {ELECTION.displayDate}
              </p>
              {(isToday || isTomorrow) && (
                <p className="text-xs text-white/80">
                  Polls open {ELECTION.polls}. Vote at any polling location in your county.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/polling-places"
              className="bg-white text-brand-text px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Find Your Polling Place
            </Link>
            <Link
              href="/elections"
              className="hidden sm:inline-flex bg-white/15 border border-white/30 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/25 transition-colors whitespace-nowrap"
            >
              Election Info
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
