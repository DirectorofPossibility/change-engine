'use client'

interface ElectionCountdownProps {
  electionName: string
  electionDate: string | null
  earlyVotingStart: string | null
  earlyVotingEnd: string | null
  registrationDeadline: string | null
  electionType: string | null
}

function getStatus(date: string | null, earlyStart: string | null, earlyEnd: string | null, regDeadline: string | null) {
  var today = new Date().toISOString().split('T')[0]
  if (!date) return { label: 'Date TBD', color: 'text-brand-muted' }
  if (today === date) return { label: 'ELECTION DAY — VOTE TODAY', color: 'text-red-600' }
  if (today > date) return { label: 'Election complete', color: 'text-brand-muted' }
  if (earlyStart && earlyEnd && today >= earlyStart && today <= earlyEnd) return { label: 'EARLY VOTING NOW', color: 'text-green-600' }
  if (regDeadline && today <= regDeadline) return { label: 'Register by ' + new Date(regDeadline + 'T00:00:00').toLocaleDateString(), color: 'text-brand-accent' }
  if (earlyStart && today < earlyStart) return { label: 'Early voting starts ' + new Date(earlyStart + 'T00:00:00').toLocaleDateString(), color: 'text-blue-600' }
  return { label: 'Upcoming', color: 'text-brand-accent' }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  var today = new Date()
  today.setHours(0, 0, 0, 0)
  var target = new Date(dateStr + 'T00:00:00')
  var diff = target.getTime() - today.getTime()
  if (diff < 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function ElectionCountdown({
  electionName, electionDate, earlyVotingStart, earlyVotingEnd,
  registrationDeadline, electionType,
}: ElectionCountdownProps) {
  var status = getStatus(electionDate, earlyVotingStart, earlyVotingEnd, registrationDeadline)
  var days = daysUntil(electionDate)

  return (
    <div className="bg-white rounded-xl border-2 border-brand-accent p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🗳️</span>
        <div>
          <h3 className="font-bold text-brand-text text-lg">{electionName}</h3>
          {electionType && <span className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-muted">{electionType}</span>}
        </div>
      </div>

      <p className={'font-semibold text-sm mb-4 ' + status.color}>{status.label}</p>

      {days != null && days > 0 && (
        <div className="bg-brand-bg rounded-lg p-3 text-center mb-4">
          <span className="text-3xl font-bold text-brand-accent">{days}</span>
          <span className="text-sm text-brand-muted ml-1">days until election</span>
        </div>
      )}

      <div className="space-y-2 text-sm">
        {electionDate && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Election Day</span>
            <span className="font-medium text-brand-text">{new Date(electionDate + 'T00:00:00').toLocaleDateString()}</span>
          </div>
        )}
        {earlyVotingStart && earlyVotingEnd && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Early Voting</span>
            <span className="font-medium text-brand-text">
              {new Date(earlyVotingStart + 'T00:00:00').toLocaleDateString()} – {new Date(earlyVotingEnd + 'T00:00:00').toLocaleDateString()}
            </span>
          </div>
        )}
        {registrationDeadline && (
          <div className="flex justify-between">
            <span className="text-brand-muted">Registration Deadline</span>
            <span className="font-medium text-brand-text">{new Date(registrationDeadline + 'T00:00:00').toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
