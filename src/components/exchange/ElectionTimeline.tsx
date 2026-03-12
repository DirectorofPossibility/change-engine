'use client'

import { CheckCircle2, Circle, MapPin, UserCheck, Vote, ExternalLink } from 'lucide-react'

interface ElectionTimelineProps {
  electionName: string
  electionDate: string
  registrationDeadline?: string | null
  earlyVotingStart?: string | null
  earlyVotingEnd?: string | null
  pollsOpen?: string | null
  pollsClose?: string | null
  registerUrl?: string | null
  findPollingUrl?: string | null
}

interface Milestone {
  key: string
  label: string
  date: string
  secondaryLabel?: string
}

function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getDaysDiff(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseDate(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getDaysLabel(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days > 1) return `${days} days away`
  if (days === -1) return '1 day ago'
  return `${Math.abs(days)} days ago`
}

type MilestoneStatus = 'past' | 'current' | 'future'

function getMilestoneStatus(dateStr: string, endDateStr?: string): MilestoneStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = parseDate(dateStr)
  const endDate = endDateStr ? parseDate(endDateStr) : date

  if (today.getTime() > endDate.getTime()) return 'past'
  if (today.getTime() >= date.getTime() && today.getTime() <= endDate.getTime()) return 'current'
  return 'future'
}

type ElectionPhase = 'pre-registration' | 'pre-early-voting' | 'early-voting' | 'pre-election' | 'election-day' | 'post-election'

function getPhase(props: ElectionTimelineProps): ElectionPhase {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  if (todayStr > props.electionDate) return 'post-election'
  if (todayStr === props.electionDate) return 'election-day'
  if (props.earlyVotingStart && props.earlyVotingEnd && todayStr >= props.earlyVotingStart && todayStr <= props.earlyVotingEnd) return 'early-voting'
  if (props.earlyVotingStart && todayStr < props.earlyVotingStart) {
    if (props.registrationDeadline && todayStr <= props.registrationDeadline) return 'pre-registration'
    return 'pre-early-voting'
  }
  if (props.registrationDeadline && todayStr <= props.registrationDeadline) return 'pre-registration'
  return 'pre-election'
}

function StatusDot({ status }: { status: MilestoneStatus }) {
  if (status === 'past') {
    return (
      <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-brand-sand">
        <CheckCircle2 size={18} className="text-brand-muted" />
      </div>
    )
  }
  if (status === 'current') {
    return (
      <div className="relative z-10 flex items-center justify-center w-8 h-8">
        <span className="absolute inset-0 rounded-full bg-brand-success/20 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-brand-success/10" />
        <div className="relative w-8 h-8 rounded-full bg-brand-success flex items-center justify-center">
          <Circle size={10} className="text-white fill-white" />
        </div>
      </div>
    )
  }
  return (
    <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 border-brand-accent bg-white">
      <Circle size={8} className="text-brand-accent fill-brand-accent" />
    </div>
  )
}

export function ElectionTimeline(props: ElectionTimelineProps) {
  const {
    electionName,
    electionDate,
    registrationDeadline,
    earlyVotingStart,
    earlyVotingEnd,
    pollsOpen,
    pollsClose,
    registerUrl,
    findPollingUrl,
  } = props

  const phase = getPhase(props)

  // Build milestones from available dates
  const milestones: Milestone[] = []

  if (registrationDeadline) {
    milestones.push({
      key: 'registration',
      label: 'Registration Deadline',
      date: registrationDeadline,
    })
  }

  if (earlyVotingStart) {
    milestones.push({
      key: 'early-start',
      label: 'Early Voting Starts',
      date: earlyVotingStart,
    })
  }

  if (earlyVotingEnd) {
    milestones.push({
      key: 'early-end',
      label: 'Early Voting Ends',
      date: earlyVotingEnd,
    })
  }

  milestones.push({
    key: 'election',
    label: 'Election Day',
    date: electionDate,
    secondaryLabel: pollsOpen && pollsClose ? `${pollsOpen} - ${pollsClose}` : undefined,
  })

  // CTA based on phase
  function renderCTA() {
    switch (phase) {
      case 'pre-registration':
        return registerUrl ? (
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold text-sm hover:bg-brand-accent-hover transition-colors shadow-card"
          >
            <UserCheck size={18} />
            Register to Vote
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold text-sm">
            <UserCheck size={18} />
            Register to Vote
          </span>
        )

      case 'early-voting':
        return findPollingUrl ? (
          <a
            href={findPollingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-success text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-card"
          >
            <MapPin size={18} />
            Find Early Voting Locations
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-brand-success text-white font-semibold text-sm">
            <MapPin size={18} />
            Early Voting Is Open
          </span>
        )

      case 'election-day':
        return findPollingUrl ? (
          <a
            href={findPollingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors shadow-card animate-pulse"
          >
            <Vote size={18} />
            Find Your Polling Place
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold text-sm animate-pulse">
            <Vote size={18} />
            It&apos;s Election Day!
          </span>
        )

      case 'post-election':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-bg-alt text-brand-muted font-medium text-sm">
            <CheckCircle2 size={16} />
            Election Complete
          </span>
        )

      default:
        return findPollingUrl ? (
          <a
            href={findPollingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white font-semibold text-sm hover:bg-brand-accent-hover transition-colors shadow-card"
          >
            <MapPin size={18} />
            Find Your Polling Place
            <ExternalLink size={14} />
          </a>
        ) : null
    }
  }

  return (
    <div className="bg-white border border-brand-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-brand-bg border-b border-brand-border">
        <div className="flex items-center gap-3">
          <Vote size={20} className="text-brand-accent" />
          <div>
            <h3 className="font-bold text-brand-text text-lg leading-tight">{electionName}</h3>
            <p className="text-sm text-brand-muted">{formatDate(electionDate)}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-6">
        {/* Desktop: horizontal layout */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between">
            {/* Connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-brand-border" />
            {/* Progress line */}
            {(() => {
              const pastCount = milestones.filter(function (m) {
                return getMilestoneStatus(m.date) === 'past'
              }).length
              const currentIdx = milestones.findIndex(function (m) {
                return getMilestoneStatus(m.date) === 'current'
              })
              const progressIdx = currentIdx >= 0 ? currentIdx : pastCount - 1
              if (progressIdx < 0) return null
              const pct = ((progressIdx + 0.5) / (milestones.length - 1)) * 100
              return (
                <div
                  className="absolute top-4 left-4 h-0.5 bg-brand-accent transition-all duration-500"
                  style={{ width: `min(${pct}%, calc(100% - 2rem))` }}
                />
              )
            })()}

            {milestones.map(function (milestone) {
              const status = milestone.key === 'early-start' && earlyVotingEnd
                ? getMilestoneStatus(milestone.date, earlyVotingEnd)
                : getMilestoneStatus(milestone.date)
              const days = getDaysDiff(milestone.date)

              return (
                <div key={milestone.key} className="relative flex flex-col items-center text-center flex-1">
                  <StatusDot status={status} />
                  <p className="mt-3 text-sm font-semibold text-brand-text leading-tight">
                    {milestone.label}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {formatShortDate(milestone.date)}
                  </p>
                  <p className={'mt-0.5 text-xs font-medium ' + (
                    status === 'current' ? 'text-brand-success' :
                    status === 'past' ? 'text-brand-muted' :
                    'text-brand-accent'
                  )}>
                    {getDaysLabel(days)}
                  </p>
                  {milestone.secondaryLabel && (
                    <p className="mt-0.5 text-xs text-brand-muted-light">
                      {milestone.secondaryLabel}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: vertical layout */}
        <div className="md:hidden relative">
          {/* Vertical connecting line */}
          <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-brand-border" />

          <div className="space-y-6">
            {milestones.map(function (milestone) {
              const status = milestone.key === 'early-start' && earlyVotingEnd
                ? getMilestoneStatus(milestone.date, earlyVotingEnd)
                : getMilestoneStatus(milestone.date)
              const days = getDaysDiff(milestone.date)

              return (
                <div key={milestone.key} className="relative flex items-start gap-4">
                  <StatusDot status={status} />
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-brand-text leading-tight">
                      {milestone.label}
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {formatDate(milestone.date)}
                    </p>
                    <p className={'text-xs font-medium mt-0.5 ' + (
                      status === 'current' ? 'text-brand-success' :
                      status === 'past' ? 'text-brand-muted' :
                      'text-brand-accent'
                    )}>
                      {getDaysLabel(days)}
                    </p>
                    {milestone.secondaryLabel && (
                      <p className="text-xs text-brand-muted-light mt-0.5">
                        {milestone.secondaryLabel}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 pt-4 border-t border-brand-border flex justify-center">
          {renderCTA()}
        </div>
      </div>
    </div>
  )
}
