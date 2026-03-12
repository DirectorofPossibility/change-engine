'use client'

import { useTranslation } from '@/lib/use-translation'

interface ElectionCountdownProps {
  electionName: string
  electionDate: string | null
  earlyVotingStart: string | null
  earlyVotingEnd: string | null
  registrationDeadline: string | null
  electionType: string | null
}

function getStatus(date: string | null, earlyStart: string | null, earlyEnd: string | null, regDeadline: string | null, t: (key: string) => string) {
  const today = new Date().toISOString().split('T')[0]
  if (!date) return { label: t('countdown.date_tbd'), color: 'text-faint' }
  if (today === date) return { label: t('countdown.vote_today'), color: 'text-civic' }
  if (today > date) return { label: t('countdown.complete'), color: 'text-faint' }
  if (earlyStart && earlyEnd && today >= earlyStart && today <= earlyEnd) return { label: t('countdown.early_voting_now'), color: 'text-[#1a6b56]' }
  if (regDeadline && today <= regDeadline) return { label: t('countdown.register_by') + ' ' + new Date(regDeadline + 'T00:00:00').toLocaleDateString(), color: 'text-blue' }
  if (earlyStart && today < earlyStart) return { label: t('countdown.early_voting_starts') + ' ' + new Date(earlyStart + 'T00:00:00').toLocaleDateString(), color: 'text-blue' }
  return { label: t('countdown.upcoming'), color: 'text-blue' }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  const diff = target.getTime() - today.getTime()
  if (diff < 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function ElectionCountdown({
  electionName, electionDate, earlyVotingStart, earlyVotingEnd,
  registrationDeadline, electionType,
}: ElectionCountdownProps) {
  const { t } = useTranslation()
  const status = getStatus(electionDate, earlyVotingStart, earlyVotingEnd, registrationDeadline, t)
  const days = daysUntil(electionDate)

  return (
    <div className="border-2 border-ink bg-white">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <div>
          <h3 className="font-display text-lg font-bold text-ink">{electionName}</h3>
          {electionType && (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint">{electionType}</span>
          )}
        </div>
        {days != null && days > 0 && (
          <div className="text-right">
            <span className="font-display text-3xl font-bold text-blue">{days}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-dim ml-1.5">{t('countdown.days_until')}</span>
          </div>
        )}
      </div>

      <div className="px-5 py-3">
        <p className={'font-mono text-[12px] uppercase tracking-[0.06em] mb-3 ' + status.color}>{status.label}</p>

        <div className="space-y-1.5 font-body text-[.85rem]">
          {electionDate && (
            <div className="flex justify-between">
              <span className="text-dim">{t('countdown.election_day')}</span>
              <span className="font-medium text-ink">{new Date(electionDate + 'T00:00:00').toLocaleDateString()}</span>
            </div>
          )}
          {earlyVotingStart && earlyVotingEnd && (
            <div className="flex justify-between">
              <span className="text-dim">{t('countdown.early_voting')}</span>
              <span className="font-medium text-ink">
                {new Date(earlyVotingStart + 'T00:00:00').toLocaleDateString()} – {new Date(earlyVotingEnd + 'T00:00:00').toLocaleDateString()}
              </span>
            </div>
          )}
          {registrationDeadline && (
            <div className="flex justify-between">
              <span className="text-dim">{t('countdown.registration_deadline')}</span>
              <span className="font-medium text-ink">{new Date(registrationDeadline + 'T00:00:00').toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
