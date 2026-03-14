'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ElectionResultsBar } from '@/components/exchange/ElectionResultsBar'
import { TurnoutGauge } from '@/components/exchange/TurnoutGauge'
import { CivicTimeline } from '@/components/exchange/CivicTimeline'
import { CommunityImpactCard } from '@/components/exchange/CommunityImpactCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { ElectionTimeline } from '@/components/exchange/ElectionTimeline'
import { MyBallot } from '@/components/exchange/MyBallot'
import { OfficialCard } from '@/components/exchange/OfficialCard'


interface VotingDashboardClientProps {
  pastElections: any[]
  upcomingElections: any[]
  civicEvents: any[]
  recentCandidates: any[]
  recentBallotItems: any[]
  upcomingCandidates: any[]
  upcomingBallotItems: any[]
  officialsByLevel: {
    federal: any[]
    state: any[]
    county: any[]
    city: any[]
  }
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
  officialsByLevel,
  relatedContent,
  zip: initialZip,
}: VotingDashboardClientProps) {
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

  const runoffCandidates = useMemo(function () {
    return recentCandidates.filter(function (c) { return c.advanced_to_runoff === 'Yes' })
  }, [recentCandidates])

  const totalOfficials = officialsByLevel.federal.length +
    officialsByLevel.state.length +
    officialsByLevel.county.length +
    officialsByLevel.city.length

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

  const levelOrder: Array<{ key: keyof typeof officialsByLevel; label: string }> = [
    { key: 'federal', label: 'Federal' },
    { key: 'state', label: 'State' },
    { key: 'county', label: 'County' },
    { key: 'city', label: 'City' },
  ]

  return (
    <div>

      {/* ════════════════════════════════════════════════════════
          CHAPTER 1: What's Next — the most urgent thing first
          ════════════════════════════════════════════════════════ */}
      {nextElection && (
        <section>
          <ChapterHeading number="I" title="What's Coming Up" />

          <div className="mt-6">
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

          {/* Timeline */}
          <div className="mt-6">
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
          </div>

          {nextElection.community_impact_summary && (
            <div className="mt-6">
              <CommunityImpactCard summary={nextElection.community_impact_summary} />
            </div>
          )}

          {/* What's on Your Ballot */}
          {upcomingCandidates.length > 0 && (
            <div className="mt-8">
              <MyBallot
                candidates={upcomingCandidates}
                electionName={nextElection.election_name}
                electionDate={nextElection.election_date}
              />
            </div>
          )}

          {/* Upcoming ballot items */}
          {upcomingBallotItems.length > 0 && (
            <div className="mt-8">
              <p className="mb-4" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase' }}>
                Propositions on the Ballot
              </p>
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
            </div>
          )}

          {/* Other upcoming elections */}
          {upcomingElections.length > 1 && (
            <div className="mt-8">
              <p className="mb-3" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase' }}>
                Also on the calendar
              </p>
              <div className="space-y-3">
                {upcomingElections.slice(1).map(function (election) {
                  return (
                    <Link
                      key={election.election_id}
                      href={'/elections/' + election.election_id}
                      className="block p-4 hover:bg-[#f4f5f7] transition-colors"
                      style={{ border: '1px solid #dde1e8' }}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <p style={{ fontSize: 16,  }}>
                          {election.election_name}
                        </p>
                        <p style={{ fontSize: 12, color: "#5c6474", whiteSpace: 'nowrap' }}>
                          {election.election_date && new Date(election.election_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      {election.election_type && (
                        <p className="mt-1" style={{ fontSize: 10, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase' }}>
                          {election.election_type}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Registration + vote-by-mail CTAs */}
          {nextElection.registration_deadline && (
            <div className="mt-8 p-6" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
              <p style={{ fontSize: 16,  }}>
                Registration deadline:{' '}
                <strong>{new Date(nextElection.registration_deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
              </p>
              <p className="mt-1" style={{ fontSize: 14, color: "#5c6474" }}>
                Make sure you're ready to vote.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://www.votetexas.gov/register-to-vote/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-white transition-opacity hover:opacity-90"
                  style={{ fontSize: 12, letterSpacing: '0.04em', background: '#1b5e8a' }}
                >
                  Check Your Registration
                </a>
                <a
                  href="https://www.votetexas.gov/voting/vote-by-mail.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 transition-colors hover:bg-[#f4f5f7]"
                  style={{ fontSize: 12, letterSpacing: '0.04em', border: '1px solid #dde1e8' }}
                >
                  Vote by Mail
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {!nextElection && (
        <section>
          <ChapterHeading number="I" title="What's Coming Up" />
          <p className="mt-4" style={{ fontSize: 15, color: "#5c6474" }}>
            No upcoming elections scheduled right now. Check back soon — and make sure you're registered so you're ready when the next one is announced.
          </p>
          <div className="mt-4">
            <a
              href="https://www.votetexas.gov/register-to-vote/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-white transition-opacity hover:opacity-90 inline-block"
              style={{ fontSize: 12, letterSpacing: '0.04em', background: '#1b5e8a' }}
            >
              Check Your Registration
            </a>
          </div>
        </section>
      )}

      {/* Section rule */}
      <div className="my-12" style={{ height: 1, background: '#dde1e8' }} />

      {/* ════════════════════════════════════════════════════════
          CHAPTER 2: Who Represents You
          ════════════════════════════════════════════════════════ */}
      <section>
        <ChapterHeading number="II" title="Who Represents You" />

        <p className="mt-3 max-w-[560px]" style={{ fontSize: 15, lineHeight: 1.7, color: "#5c6474" }}>
          {initialZip
            ? 'These are the elected officials who represent your area. Contact them about the issues that matter to you.'
            : 'Enter your ZIP code to find the officials who represent you at every level of government — from city hall to the U.S. Capitol.'
          }
        </p>

        {/* ZIP input */}
        <form onSubmit={handleZipSubmit} className="mt-6 flex items-center gap-3 max-w-md">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            value={zipInput}
            onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '')) }}
            placeholder="Your ZIP code"
            className="flex-1 px-4 py-3 focus:outline-none"
            style={{ fontSize: 15, background: '#ffffff', border: '1px solid #dde1e8' }}
          />
          <button
            type="submit"
            disabled={zipInput.length !== 5}
            className="px-5 py-3 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ fontSize: 12, letterSpacing: '0.04em', background: '#1b5e8a' }}
          >
            Find My Reps
          </button>
          {initialZip && (
            <button
              type="button"
              onClick={handleZipClear}
              className="hover:underline"
              style={{ fontSize: 13, color: "#5c6474" }}
            >
              Clear
            </button>
          )}
        </form>

        {initialZip && (
          <p className="mt-3" style={{ fontSize: 11, letterSpacing: '0.06em', color: "#5c6474", textTransform: 'uppercase' }}>
            Showing results for {initialZip}
          </p>
        )}

        {totalOfficials > 0 ? (
          <div className="mt-8 space-y-8">
            {levelOrder.map(function ({ key, label }) {
              const officials = officialsByLevel[key]
              if (officials.length === 0) return null
              return (
                <div key={key}>
                  <div className="flex items-baseline gap-3 mb-4">
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', color: "#1b5e8a", textTransform: 'uppercase' }}>
                      {label}
                    </p>
                    <div className="flex-1" style={{ height: 1, background: '#dde1e8' }} />
                    <p style={{ fontSize: 11, color: "#5c6474" }}>
                      {officials.length}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {officials.map(function (o: any) {
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
            <div className="pt-2">
              <Link href="/officials" className="hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
                See all elected officials &rarr;
              </Link>
            </div>
          </div>
        ) : !initialZip ? (
          <div className="mt-8 relative p-8 text-center" style={{ border: '1px dashed ' + '#dde1e8' }}>
            <Image src="/images/fol/vesica-piscis.svg" alt="" width={80} height={80} className="opacity-[0.06] mx-auto mb-4" />
            <p style={{ fontSize: 15, color: "#5c6474" }}>
              Enter your ZIP code above to see who represents you.
            </p>
          </div>
        ) : (
          <div className="mt-8 p-6" style={{ border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: 15, color: "#5c6474" }}>
              We couldn't find officials for that ZIP code. Try a different one, or browse the full list.
            </p>
            <Link href="/officials" className="mt-2 inline-block hover:underline" style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}>
              Browse all officials &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Section rule */}
      <div className="my-12" style={{ height: 1, background: '#dde1e8' }} />

      {/* ════════════════════════════════════════════════════════
          CHAPTER 3: How to Participate — practical resources
          ════════════════════════════════════════════════════════ */}
      <section>
        <ChapterHeading number="III" title="How to Participate" />

        <p className="mt-3 max-w-[560px]" style={{ fontSize: 15, lineHeight: 1.7, color: "#5c6474" }}>
          Voting is one of the most direct ways to shape your community. Here's what you need.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResourceLink
            href="https://www.votetexas.gov/register-to-vote/"
            external
            label="Register to Vote"
            description="Check your status or register for the first time"
            mono="votetexas.gov"
          />
          <ResourceLink
            href="https://www.harrisvotes.com/Polling-Locations"
            external
            label="Find Your Polling Place"
            description="Locate early voting and Election Day polling sites"
            mono="harrisvotes.com"
          />
          <ResourceLink
            href="https://www.votetexas.gov/voting/vote-by-mail.html"
            external
            label="Vote by Mail"
            description="Request a mail-in ballot for upcoming elections"
            mono="votetexas.gov"
          />
          <ResourceLink
            href="/officials"
            label="Contact Your Representatives"
            description="Make your voice heard on the issues you care about"
            mono="changeengine.us"
          />
          <ResourceLink
            href="/call-your-senators"
            label="Call Your Senators"
            description="A quick guide to reaching your U.S. Senators by phone"
            mono="changeengine.us"
          />
          <ResourceLink
            href="https://www.harrisvotes.com/VoterBallotSearch"
            external
            label="Sample Ballot Lookup"
            description="Preview what's on your ballot before you head to the polls"
            mono="harrisvotes.com"
          />
        </div>
      </section>

      {/* Section rule */}
      <div className="my-12" style={{ height: 1, background: '#dde1e8' }} />

      {/* ════════════════════════════════════════════════════════
          CHAPTER 4: Key Dates — civic calendar
          ════════════════════════════════════════════════════════ */}
      {civicEvents.length > 0 && (
        <>
          <section>
            <ChapterHeading number="IV" title="Key Dates" />
            <p className="mt-3 mb-6 max-w-[560px]" style={{ fontSize: 15, lineHeight: 1.7, color: "#5c6474" }}>
              Council meetings, registration deadlines, early voting windows — the dates that matter for civic life in Houston.
            </p>
            <CivicTimeline events={civicEvents} />
          </section>
          <div className="my-12" style={{ height: 1, background: '#dde1e8' }} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          CHAPTER 5: What Just Happened — recent election results
          ════════════════════════════════════════════════════════ */}
      {recentElection && (
        <>
          <section>
            <ChapterHeading number={civicEvents.length > 0 ? 'V' : 'IV'} title={recentElection.election_name + ' Results'} />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="mt-6 p-5" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
                <p style={{ fontSize: 16, fontWeight: 'bold',  }}>
                  These races are heading to a runoff
                </p>
                <p className="mt-1" style={{ fontSize: 14, color: "#5c6474" }}>
                  No candidate won a majority. Voters will decide again on{' '}
                  {nextElection.election_date && new Date(nextElection.election_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {runoffCandidates.map(function (c) {
                    return (
                      <span
                        key={c.candidate_id}
                        className="px-3 py-1"
                        style={{ fontSize: 11, background: '#ffffff', border: '1px solid #dde1e8' }}
                      >
                        {c.candidate_name} ({c.party?.charAt(0)}) — {c.office_sought}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Propositions */}
            {recentBallotItems.length > 0 && (
              <div className="mt-6">
                <p className="mb-4" style={{ fontSize: 11, letterSpacing: '0.08em', color: "#5c6474", textTransform: 'uppercase' }}>
                  Propositions
                </p>
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

            <div className="mt-4">
              <Link
                href={'/elections/' + recentElection.election_id}
                className="hover:underline"
                style={{ fontSize: 14, fontStyle: 'italic', color: "#1b5e8a" }}
              >
                Full election details &rarr;
              </Link>
            </div>
          </section>
          <div className="my-12" style={{ height: 1, background: '#dde1e8' }} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          Related Reading
          ════════════════════════════════════════════════════════ */}
      {relatedContent.length > 0 && (
        <section>
          <ChapterHeading number="" title="Related Reading" />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedContent.map(function (item) {
              return (
                <Link
                  key={item.id}
                  href={'/content/' + item.id}
                  className="block p-4 transition-colors hover:bg-[#f4f5f7]"
                  style={{ border: '1px solid #dde1e8' }}
                >
                  {item.image_url && (
                    <div className="h-32 overflow-hidden mb-3 -mx-4 -mt-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <Image
                        src={item.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                        width={400}
                        height={200}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: 15, lineHeight: 1.4 }} className="line-clamp-2">
                    {item.title_6th_grade}
                  </p>
                  {item.summary_6th_grade && (
                    <p className="mt-1 line-clamp-2" style={{ fontSize: 13, color: "#5c6474" }}>
                      {item.summary_6th_grade}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Chapter heading with roman numeral ── */

function ChapterHeading({ number, title }: { number: string; title: string }) {
  return (
    <div>
      {number && (
        <p style={{ fontSize: 11, letterSpacing: '0.12em', color: "#1b5e8a", textTransform: 'uppercase', marginBottom: 6 }}>
          Chapter {number}
        </p>
      )}
      <h2 style={{ fontSize: 28, lineHeight: 1.15,  }}>
        {title}
      </h2>
    </div>
  )
}

/* ── Resource link card ── */

function ResourceLink({
  href,
  external,
  label,
  description,
  mono,
}: {
  href: string
  external?: boolean
  label: string
  description: string
  mono: string
}) {
  const Tag = external ? 'a' : Link
  const extraProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <Tag
      href={href}
      {...extraProps as any}
      className="block p-5 transition-colors hover:bg-[#f4f5f7]"
      style={{ border: '1px solid #dde1e8' }}
    >
      <p style={{ fontSize: 16,  }}>{label}</p>
      <p className="mt-1" style={{ fontSize: 13, color: "#5c6474" }}>{description}</p>
      <p className="mt-2" style={{ fontSize: 10, letterSpacing: '0.06em', color: "#1b5e8a", textTransform: 'uppercase' }}>
        {mono} {external ? ' \u2197' : ''}
      </p>
    </Tag>
  )
}
