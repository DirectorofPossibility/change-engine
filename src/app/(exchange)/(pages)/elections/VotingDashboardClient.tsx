'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/lib/use-translation'
import { LanguageSwitcher } from '@/components/exchange/LanguageSwitcher'
import { ElectionResultsBar } from '@/components/exchange/ElectionResultsBar'
import { TurnoutGauge } from '@/components/exchange/TurnoutGauge'
import { CivicTimeline } from '@/components/exchange/CivicTimeline'
import { CommunityImpactCard } from '@/components/exchange/CommunityImpactCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { ElectionTimeline } from '@/components/exchange/ElectionTimeline'
import { MyBallot } from '@/components/exchange/MyBallot'
import CivicScorecard from '@/components/exchange/CivicScorecard'
import ElectionReminderSignup from '@/components/exchange/ElectionReminderSignup'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { MapPin, ExternalLink, ChevronRight, BookOpen, ClipboardCheck, Mail, Users } from 'lucide-react'
import { TranslatedTooltip } from '@/components/exchange/TranslatedTooltip'
import { TOOLTIPS } from '@/lib/tooltips'
import Image from 'next/image'

interface VotingDashboardClientProps {
  pastElections: any[]
  upcomingElections: any[]
  civicEvents: any[]
  recentCandidates: any[]
  recentBallotItems: any[]
  upcomingCandidates: any[]
  upcomingBallotItems: any[]
  officials: any[]
  relatedContent: any[]
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
  relatedContent,
  zip: initialZip,
}: VotingDashboardClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [zipInput, setZipInput] = useState(initialZip || '')

  const recentElection = pastElections.length > 0 ? pastElections[0] : null
  const nextElection = upcomingElections.length > 0 ? upcomingElections[0] : null

  const candidateGroups = useMemo(function () {
    const groups: Record<string, any[]> = {}
    recentCandidates.forEach(function (c) {
      const key = c.office_sought || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })
    return groups
  }, [recentCandidates])

  const officialsByLevel = useMemo(function () {
    const groups: Record<string, any[]> = { Federal: [], State: [], County: [], City: [] }
    officials.forEach(function (o) {
      const level = o.level || 'Other'
      if (!groups[level]) groups[level] = []
      groups[level].push(o)
    })
    return groups
  }, [officials])

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
    <div className="space-y-8">
      {/* ── Language toggle ── */}
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* ═══════════════════════════════════════════════════
          SECTION 1: What Just Happened
          ═══════════════════════════════════════════════════ */}
      {recentElection && (
        <section>
          <SectionHeading
            title={recentElection.election_name + ' Results'}
            color="#e53e3e"
          />

          {/* Turnout + Community Impact side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {recentElection.turnout_pct != null && (
              <TurnoutGauge
                turnoutPct={recentElection.turnout_pct}
                electionName={recentElection.election_name}
              />
            )}
            {recentElection.community_impact_summary && (
              <CommunityImpactCard summary={recentElection.community_impact_summary} />
            )}
          </div>

          {/* Race results */}
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

          {/* Runoff callout — bridge to next section */}
          {runoffCandidates.length > 0 && nextElection && nextElection.election_type === 'Primary Runoff' && (
            <div className="bg-amber-50 border border-amber-200 rounded-card p-4">
              <h4 className="font-semibold font-display text-brand-text text-sm mb-1">
                These races are heading to a runoff
              </h4>
              <p className="text-sm text-brand-muted mb-2">
                No candidate won a majority, so voters will decide again on{' '}
                {nextElection.election_date && new Date(nextElection.election_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
              </p>
              <div className="flex flex-wrap gap-2">
                {runoffCandidates.map(function (c) {
                  return (
                    <span key={c.candidate_id} className="text-xs px-2 py-1 bg-white border border-brand-border text-brand-text">
                      {c.candidate_name} ({c.party?.charAt(0)}) — {c.office_sought}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Propositions */}
          {recentBallotItems.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
                Propositions on the ballot
              </h3>
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

          <div className="mt-3">
            <Link
              href={'/elections/' + recentElection.election_id}
              className="inline-flex items-center gap-1 text-sm text-brand-accent hover:underline"
            >
              Full election details <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 2: What's Next (countdown + timeline + ballot + register)
          ═══════════════════════════════════════════════════ */}
      <section>
        <SectionHeading title="What's Next" color="#3182ce" />

        {nextElection ? (
          <div className="space-y-4">
            {/* Countdown card */}
            <div className="relative">
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
              <TranslatedTooltip tip={TOOLTIPS.election_countdown} position="bottom" />
            </div>

            {/* Visual deadline timeline */}
            <ElectionTimeline
              electionName={nextElection.election_name}
              electionDate={nextElection.election_date}
              registrationDeadline={nextElection.registration_deadline}
              earlyVotingStart={nextElection.early_voting_start}
              earlyVotingEnd={nextElection.early_voting_end}
              pollsOpen={nextElection.polls_open}
              pollsClose={nextElection.polls_close}
              registerUrl={nextElection.register_url || 'https://www.votetexas.gov/register-to-vote/'}
              findPollingUrl={nextElection.find_polling_url || 'https://www.harrisvotes.com/Polling-Locations'}
            />

            {nextElection.community_impact_summary && (
              <CommunityImpactCard summary={nextElection.community_impact_summary} />
            )}

            {/* What's on Your Ballot — personalized */}
            {upcomingCandidates.length > 0 && (
              <MyBallot
                candidates={upcomingCandidates}
                electionName={nextElection.election_name}
                electionDate={nextElection.election_date}
              />
            )}

            {/* Upcoming ballot items */}
            {(upcomingBallotItems.length > 0 || upcomingCandidates.length > 0) && (
              <div>
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
                  On the ballot
                </h3>
                {upcomingCandidates.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                )}
              </div>
            )}

            {/* Registration + vote-by-mail CTAs — inline, no emojis */}
            {nextElection.registration_deadline && (
              <div className="relative bg-brand-accent/5 border border-brand-accent/20 rounded-card p-5">
                <TranslatedTooltip tip={TOOLTIPS.registration_deadline} position="bottom" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-brand-text">
                      Registration deadline:{' '}
                      <strong>{new Date(nextElection.registration_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </p>
                    <p className="text-xs text-brand-muted mt-0.5">Make sure you're ready to vote.</p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href="https://www.votetexas.gov/register-to-vote/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-card text-sm font-medium hover:bg-brand-accent/90 transition-colors"
                    >
                      <ClipboardCheck size={14} />
                      Check your registration
                    </a>
                    <a
                      href="https://www.votetexas.gov/voting/vote-by-mail.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border text-brand-text rounded-card text-sm font-medium hover:shadow-sm transition-colors"
                    >
                      <Mail size={14} />
                      Vote by mail
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-brand-muted text-sm py-4">No upcoming elections scheduled right now. Check back soon.</p>
        )}

        {/* Civic Timeline */}
        {civicEvents.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Key dates ahead
            </h3>
            <CivicTimeline events={civicEvents} />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: Who Represents You (with ZIP input integrated)
          ═══════════════════════════════════════════════════ */}
      <section>
        <SectionHeading title="Who Represents You" color="#805ad5" />

        {/* ZIP input — warm and integrated */}
        <form onSubmit={handleZipSubmit} className="flex items-center gap-3 max-w-md mb-6">
          <div className="relative flex-1">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={zipInput}
              onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '')) }}
              placeholder="Enter your ZIP code"
              className="w-full pl-9 pr-4 py-2.5 rounded-card border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={zipInput.length !== 5}
            className="px-4 py-2.5 rounded-card bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Find my reps
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
          <p className="text-sm text-brand-muted mb-4">
            Showing representatives for <strong className="text-brand-text">{initialZip}</strong>
          </p>
        )}

        {officials.length > 0 ? (
          <div className="space-y-5">
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
            <div className="text-center pt-2">
              <Link href="/officials" className="text-sm text-brand-accent hover:underline">
                See all elected officials <ChevronRight size={14} className="inline" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-card border border-brand-border p-6 text-center">
            <MapPin size={20} className="mx-auto text-brand-muted mb-2" />
            <p className="text-brand-muted text-sm">Enter your ZIP code above to see who represents you at every level of government.</p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4: Related Reading (if we have content)
          ═══════════════════════════════════════════════════ */}
      {relatedContent.length > 0 && (
        <section>
          <SectionHeading title="Related Reading" color="#E8723A" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedContent.map(function (item) {
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="bg-white rounded-card border border-brand-border overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {item.image_url && (
                    <div className="h-32 overflow-hidden">
                      <Image
                        src={item.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                       width={800} height={400} />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-sm text-brand-text leading-snug mb-1 line-clamp-2">
                      {item.title_6th_grade}
                    </h4>
                    {item.summary_6th_grade && (
                      <p className="text-xs text-brand-muted line-clamp-2">{item.summary_6th_grade}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 5: Your Civic Journey + Get Reminders
          ═══════════════════════════════════════════════════ */}
      <section>
        <SectionHeading title="Your Civic Journey" color="#38a169" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CivicScorecard />
          <ElectionReminderSignup />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          Quick Action Links (replaces the old emoji cards)
          ═══════════════════════════════════════════════════ */}
      <section className="border-t border-brand-border pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.votetexas.gov/register-to-vote/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-card border border-brand-border p-4 hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={18} className="text-brand-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-text text-sm">Register to vote</h4>
              <p className="text-xs text-brand-muted">Check your status or register for the first time</p>
            </div>
          </a>

          <a
            href="https://www.votetexas.gov/voting/vote-by-mail.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-card border border-brand-border p-4 hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-text text-sm">Vote by mail</h4>
              <p className="text-xs text-brand-muted">See if you qualify and request a ballot</p>
            </div>
          </a>

          <Link
            href="/officials"
            className="flex items-center gap-3 bg-white rounded-card border border-brand-border p-4 hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-text text-sm">Contact your representatives</h4>
              <p className="text-xs text-brand-muted">Make your voice heard on the issues you care about</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

/* ── Section heading with accent bar ── */

function SectionHeading({ title, color }: { title: string; color: string }) {
  return (
    <h2 className="text-xl font-bold font-display text-brand-text flex items-center gap-2 mb-4">
      <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: color }} />
      {title}
    </h2>
  )
}
