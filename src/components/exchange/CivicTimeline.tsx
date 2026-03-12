'use client'

/**
 * Vertical timeline of civic calendar events.
 * Past events are muted, current/active are brand-accent, future are outlined.
 */

import { Calendar, Clock, Vote } from 'lucide-react'

interface CivicEvent {
  event_id: string
  event_name: string
  event_type: string | null
  description_5th_grade: string | null
  date_start: string | null
  date_end: string | null
  is_deadline: string | null
  is_election: string | null
}

interface CivicTimelineProps {
  events: CivicEvent[]
}

function getEventIcon(event: CivicEvent) {
  if (event.is_election === 'Yes') return Vote
  if (event.is_deadline === 'Yes') return Clock
  return Calendar
}

function getEventStatus(event: CivicEvent): 'past' | 'active' | 'future' {
  const today = new Date().toISOString().split('T')[0]
  const start = event.date_start || ''
  const end = event.date_end || start

  if (end < today) return 'past'
  if (start <= today && today <= end) return 'active'
  return 'future'
}

export function CivicTimeline({ events }: CivicTimelineProps) {
  if (events.length === 0) return null

  const sorted = [...events].sort(function (a, b) {
    return (a.date_start || '').localeCompare(b.date_start || '')
  })

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brand-border" />

      <div className="space-y-4">
        {sorted.map(function (event) {
          const status = getEventStatus(event)
          const Icon = getEventIcon(event)
          const isPast = status === 'past'
          const isActive = status === 'active'

          const dotClass = isActive
            ? 'bg-brand-accent ring-4 ring-brand-accent/20'
            : isPast
              ? 'bg-brand-muted/40'
              : 'bg-white border-2 border-brand-accent'

          const textClass = isPast ? 'opacity-50' : ''

          return (
            <div key={event.event_id} className={'relative pl-10 ' + textClass}>
              {/* Dot */}
              <div className={'absolute left-2.5 top-1.5 w-3 h-3 rounded-full z-10 ' + dotClass} />

              <div className="bg-white border border-brand-border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} className={isActive ? 'text-brand-accent' : 'text-brand-muted'} />
                  <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">
                    {event.event_type || 'Event'}
                  </span>
                </div>
                <h4 className="font-semibold text-brand-text text-sm">{event.event_name}</h4>
                {event.date_start && (
                  <p className="text-xs text-brand-muted mt-1">
                    {new Date(event.date_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {event.date_end && event.date_end !== event.date_start && (
                      <span> — {new Date(event.date_end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </p>
                )}
                {event.description_5th_grade && (
                  <p className="text-xs text-brand-muted mt-1 line-clamp-2">{event.description_5th_grade}</p>
                )}
                {isActive && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent font-medium">
                    Happening now
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
