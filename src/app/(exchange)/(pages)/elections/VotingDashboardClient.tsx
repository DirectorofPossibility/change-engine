'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'
import { ElectionResultsBar } from '@/components/exchange/ElectionResultsBar'
import { TurnoutGauge } from '@/components/exchange/TurnoutGauge'
import { CivicTimeline } from '@/components/exchange/CivicTimeline'
import { CommunityImpactCard } from '@/components/exchange/CommunityImpactCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { Search, ExternalLink, MapPin, ChevronRight } from 'lucide-react'

interface VotingDashboardClientProps {
  pastElections: any[]
  upcomingElections: any[]
  civicEvents: any[]
  recentCandidates: any[]
  recentBallotItems: any[]
  upcomingCandidates: any[]
  upcomingBallotItems: any[]
  officials: any[]
  zip?: string
}

export function VotingDashboardClient({
  pastElections,
  upcomingElections,
  civicEvents,
  recentCandidates,
  recentBallotItems,
  upcomingCandidates,
  upcomingBallotItems,
  officials,
  zip: initialZip,
}: VotingDashboardClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [zipInput, setZipInput] = useState(initialZip || '')

  const recentElection = pastElections.length > 0 ? pastElections[0] : null
  const nextElection = upcomingElections.length > 0 ? upcomingElections[0] : null

  // Group recent candidates by office_sought
  const candidateGroups = useMemo(function () {
    const groups: Record<string, any[]> = {}
    recentCandidates.forEach(function (c) {
      const key = c.office_sought || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })
    return groups
  }, [recentCandidates])

  // Group officials by level
  const officialsByLevel = useMemo(function () {
    const groups: Record<string, any[]> = { Federal: [], State: [], County: [], City: [] }
    officials.forEach(function (o) {
      const level = o.level || 'Other'
      if (!groups[level]) groups[level] = []
      groups[level].push(o)
    })
    return groups
  }, [officials])

  // Runoff candidates
  const runoffCandidates = useMemo(function () {
    return recentCandidates.filter(function (c) { return c.advanced_to_runoff === 'Yes' })
  }, [recentCandidates])

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      const params = new URLSearchParams(searchParams.toString())
      params.set('zip', zipInput)
      router.push('?' + params.toString())
    }
  }

  function handleZipClear() {
    setZipInput('')
    router.push('/elections')
  }

  return (
    <div className="space-y-10">
      {/* ── Section 0: ZIP Code Entry ── */}
      <section>
        <form onSubmit={handleZipSubmit} className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={zipInput}
              onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '')) }}
              placeholder={t('voting.zip_placeholder')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
            />
          </div>
          <button
            type="submit"
            disabled={zipInput.length !== 5}
            className="px-5 py-2.5 rounded-xl bg-brand-accent text-white font-medium hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('voting.zip_button')}
          </button>
          {initialZip && (
            <button
              type="button"
              onClick={handleZipClear}
              className="text-sm text-brand-muted hover:text-brand-accent"
            >
              Clear
            </button>
          )}
        </form>
        {initialZip && (
          <p className="text-sm text-brand-muted mt-2">
            Showing personalized info for <strong className="text-brand-text">{initialZip}</strong>
          </p>
        )}
      </section>

      {/* ── Section 1: What Just Happened ── */}
      {recentElection && (
        <section>
          <SectionHeading title={t('voting.what_happened')} color="#e53e3e" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Turnout */}
            {recentElection.turnout_pct != null && (
              <TurnoutGauge
                turnoutPct={recentElection.turnout_pct}
                electionName={recentElection.election_name}
              />
            )}

            {/* Community Impact */}
            {recentElection.community_impact_summary && (
              <div className="lg:col-span-2">
                <CommunityImpactCard summary={recentElection.community_impact_summary} />
              </div>
            )}
          </div>

          {/* Candidate Results */}
          {Object.keys(candidateGroups).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {Object.entries(candidateGroups).map(function ([office, cands]) {
                return (
                  <ElectionResultsBar
                    key={office}
                    office={office}
                    district={cands[0]?.district}
                    candidates={cands}
                  />
                )
              })}
            </div>
          )}

          {/* Runoff callout */}
          {runoffCandidates.length > 0 && nextElection && nextElection.election_type === 'Primary Runoff' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-brand-text text-sm mb-2">{t('voting.runoff_heading')}</h4>
              <p className="text-sm text-brand-muted mb-2">
                These candidates will face off in the {nextElection.election_name} on{' '}
                {nextElection.election_date && new Date(nextElection.election_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
              </p>
              <div className="flex flex-wrap gap-2">
                {runoffCandidates.map(function (c) {
                  return (
                    <span key={c.candidate_id} className="text-xs px-2 py-1 rounded-full bg-white border border-brand-border text-brand-text">
                      {c.candidate_name} ({c.party?.charAt(0)}) — {c.office_sought}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ballot Items */}
          {recentBallotItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">Propositions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentBallotItems.map(function (item) {
                  return (
                    <BallotItemCard
                      key={item.item_id}
                      name={item.item_name}
                      itemType={item.item_type}
                      description={item.description_5th_grade || item.description}
                      forArgument={item.for_argument}
                      againstArgument={item.against_argument}
                      fiscalImpact={item.fiscal_impact}
                      passed={item.passed}
                      voteForPct={item.vote_for_pct}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Link to full detail */}
          <div className="mt-4">
            <Link
              href={'/elections/' + recentElection.election_id}
              className="inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
            >
              {t('voting.view_details')} <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Section 2: What's Coming Up ── */}
      <section>
        <SectionHeading title={t('voting.whats_coming')} color="#3182ce" />

        {nextElection && (
          <div className="mb-6">
            <Link href={'/elections/' + nextElection.election_id}>
              <ElectionCountdown
                electionName={nextElection.election_name}
                electionDate={nextElection.election_date}
                earlyVotingStart={nextElection.early_voting_start}
                earlyVotingEnd={nextElection.early_voting_end}
                registrationDeadline={nextElection.registration_deadline}
                electionType={nextElection.election_type}
              />
            </Link>
          </div>
        )}

        {nextElection && nextElection.community_impact_summary && (
          <div className="mb-6">
            <CommunityImpactCard summary={nextElection.community_impact_summary} />
          </div>
        )}

        {/* Civic Timeline */}
        {civicEvents.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
              {t('voting.civic_timeline')}
            </h3>
            <CivicTimeline events={civicEvents} />
          </div>
        )}

        {/* Registration CTA */}
        {nextElection && nextElection.registration_deadline && (
          <div className="mt-6 bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-5 text-center">
            <p className="text-sm text-brand-text mb-3">
              Registration deadline:{' '}
              <strong>{new Date(nextElection.registration_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </p>
            <a
              href="https://www.votetexas.gov/register-to-vote/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-xl font-medium hover:bg-brand-accent/90 transition-colors"
            >
              {t('voting.register_cta')} <ExternalLink size={14} />
            </a>
          </div>
        )}
      </section>

      {/* ── Section 3: What's on the Ballot (upcoming) ── */}
      {(upcomingBallotItems.length > 0 || upcomingCandidates.length > 0) && (
        <section>
          <SectionHeading title={t('voting.whats_on_ballot')} color="#38a169" />

          {upcomingCandidates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Group upcoming candidates by office too */}
              {Object.entries(
                upcomingCandidates.reduce(function (acc: Record<string, any[]>, c: any) {
                  const key = c.office_sought || 'Other'
                  if (!acc[key]) acc[key] = []
                  acc[key].push(c)
                  return acc
                }, {} as Record<string, any[]>)
              ).map(function ([office, cands]) {
                return (
                  <ElectionResultsBar
                    key={office}
                    office={office}
                    district={(cands as any[])[0]?.district}
                    candidates={cands as any[]}
                  />
                )
              })}
            </div>
          )}

          {upcomingBallotItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingBallotItems.map(function (item) {
                return (
                  <div key={item.item_id}>
                    <BallotItemCard
                      name={item.item_name}
                      itemType={item.item_type}
                      description={item.description_5th_grade || item.description}
                      forArgument={item.for_argument}
                      againstArgument={item.against_argument}
                      fiscalImpact={item.fiscal_impact}
                      passed={item.passed}
                      voteForPct={item.vote_for_pct}
                    />
                    {item.community_impact_summary && (
                      <div className="mt-2">
                        <CommunityImpactCard summary={item.community_impact_summary} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {upcomingBallotItems.length === 0 && upcomingCandidates.length === 0 && (
            <p className="text-brand-muted text-sm py-6 text-center">{t('voting.no_upcoming_ballot')}</p>
          )}
        </section>
      )}

      {/* ── Section 4: Who Represents You ── */}
      <section>
        <SectionHeading title={t('voting.who_represents')} color="#805ad5" />

        {officials.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(officialsByLevel).map(function ([level, levelOfficials]) {
              if (levelOfficials.length === 0) return null
              return (
                <div key={level}>
                  <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">{level}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {levelOfficials.map(function (o) {
                      return (
                        <OfficialCard
                          key={o.official_id}
                          id={o.official_id}
                          name={o.official_name}
                          title={o.title}
                          party={o.party}
                          level={o.level}
                          email={o.email}
                          phone={o.office_phone}
                          website={o.website}
                          photoUrl={o.photo_url}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-border p-8 text-center">
            <MapPin size={24} className="mx-auto text-brand-muted mb-2" />
            <p className="text-brand-muted text-sm">{t('voting.enter_zip_officials')}</p>
          </div>
        )}
      </section>

      {/* ── Section 5: Your Voice Matters ── */}
      <section>
        <SectionHeading title={t('voting.your_voice')} color="#C75B2A" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.votetexas.gov/register-to-vote/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📋</span>
            </div>
            <h4 className="font-semibold text-brand-text text-sm mb-1">{t('voting.register_cta')}</h4>
            <p className="text-xs text-brand-muted">Check your registration status or register for the first time.</p>
          </a>

          <a
            href="https://www.votetexas.gov/voting/vote-by-mail.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">📬</span>
            </div>
            <h4 className="font-semibold text-brand-text text-sm mb-1">{t('voting.mail_ballot')}</h4>
            <p className="text-xs text-brand-muted">Learn if you qualify and how to request a mail-in ballot.</p>
          </a>

          <Link
            href="/officials"
            className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow text-center"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🏛️</span>
            </div>
            <h4 className="font-semibold text-brand-text text-sm mb-1">{t('voting.get_involved')}</h4>
            <p className="text-xs text-brand-muted">Contact your representatives and make your voice heard.</p>
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ── Helper: section heading with accent bar ── */

function SectionHeading({ title, color }: { title: string; color: string }) {
  return (
    <h2 className="text-xl font-bold font-serif text-brand-text flex items-center gap-2 mb-4">
      <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }} />
      {title}
    </h2>
  )
}
