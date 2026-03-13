import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { ElectionResultsBar } from '@/components/exchange/ElectionResultsBar'
import { TurnoutGauge } from '@/components/exchange/TurnoutGauge'
import { CommunityImpactCard } from '@/components/exchange/CommunityImpactCard'
import { CandidateCard } from '@/components/exchange/CandidateCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { VotingLocationCard } from '@/components/exchange/VotingLocationCard'
import { VotingLocationsMap } from '@/components/exchange/VotingLocationsMap'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elections').select('election_name, description').eq('election_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.election_name,
    description: data.description || 'Details on the Change Engine.',
  }
}

export default async function ElectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: election } = await supabase
    .from('elections')
    .select('*')
    .eq('election_id', id)
    .single()

  if (!election) notFound()

  const userProfile = await getUserProfile()
  const [candidatesRes, ballotRes, locationsRes, wayfinderData] = await Promise.all([
    supabase.from('candidates').select('*').eq('election_id', id).eq('is_active', 'Yes'),
    supabase.from('ballot_items').select('*').eq('election_id', id),
    supabase.from('voting_locations').select('*').eq('election_id', id).eq('is_active', 'Yes'),
    getWayfinderContext('election' as any, id, userProfile?.role),
  ])

  const candidates = candidatesRes.data || []
  const ballotItems = ballotRes.data || []
  const votingLocations = locationsRes.data || []

  // Group candidates by office_sought
  const candidateGroups: Record<string, typeof candidates> = {}
  candidates.forEach(function (c) {
    const office = c.office_sought || 'Other'
    if (!candidateGroups[office]) candidateGroups[office] = []
    candidateGroups[office].push(c)
  })

  // Check if election is in the past (has results)
  const today = new Date().toISOString().split('T')[0]
  const isPast = election.election_date ? election.election_date < today : false
  const canRegister = election.registration_deadline ? today <= election.registration_deadline : false

  // Check if any candidates have vote_pct (results available)
  const hasResults = candidates.some(function (c) { return (c as any).vote_pct != null })

  const canonicalUrl = `https://www.changeengine.us/elections/${id}`

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {election.election_type && (
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CLAY }}>{election.election_type}</span>
            )}
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {election.election_name}
          </h1>
          {election.description && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {election.description}
            </p>
          )}
          {election.election_date && (
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED, marginTop: '1rem' }}>
              {new Date(election.election_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/elections" className="hover:underline" style={{ color: CLAY }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>{election.election_name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Countdown banner */}
        <div className="mb-8">
          <ElectionCountdown
            electionName={election.election_name}
            electionDate={election.election_date}
            earlyVotingStart={election.early_voting_start}
            earlyVotingEnd={election.early_voting_end}
            registrationDeadline={election.registration_deadline}
            electionType={election.election_type}
          />
        </div>

        {/* Turnout + Community Impact for past elections */}
        {isPast && (election.turnout_pct != null || (election as any).community_impact_summary) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            {election.turnout_pct != null && (
              <TurnoutGauge turnoutPct={election.turnout_pct} />
            )}
            {(election as any).community_impact_summary && (
              <div className="lg:col-span-2">
                <CommunityImpactCard summary={(election as any).community_impact_summary} />
              </div>
            )}
          </div>
        )}

        {/* Community Impact for upcoming elections */}
        {!isPast && (election as any).community_impact_summary && (
          <div className="mb-8">
            <CommunityImpactCard summary={(election as any).community_impact_summary} />
          </div>
        )}

        {/* Register to vote CTA */}
        {canRegister && (
          <div className="p-6 mb-8" style={{ border: '1px solid ' + RULE_COLOR, background: PARCHMENT_WARM }}>
            <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: INK, marginBottom: '0.5rem' }}>Make sure you&apos;re registered to vote</p>
            <p style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED, marginBottom: '1rem' }}>
              Registration deadline: {new Date(election.registration_deadline! + 'T00:00:00').toLocaleDateString()}
            </p>
            <Link
              href="https://www.votetexas.gov/register-to-vote/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 text-white transition-opacity hover:opacity-90"
              style={{ background: CLAY, fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              Register to Vote
            </Link>
          </div>
        )}

        {/* Election Results */}
        {hasResults && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Election Results</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{Object.keys(candidateGroups).length} race{Object.keys(candidateGroups).length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(candidateGroups).map(function ([office, cands]) {
                return (
                  <ElectionResultsBar
                    key={office}
                    office={office}
                    district={cands[0]?.district}
                    candidates={cands.map(function (c) {
                      return {
                        candidate_id: c.candidate_id,
                        candidate_name: c.candidate_name,
                        party: c.party,
                        incumbent: c.incumbent,
                        vote_pct: (c as any).vote_pct,
                        vote_count: (c as any).vote_count,
                        advanced_to_runoff: (c as any).advanced_to_runoff,
                      }
                    })}
                  />
                )
              })}
            </div>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* Candidates */}
        {Object.keys(candidateGroups).length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Who&apos;s Running</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="space-y-6">
              {Object.entries(candidateGroups).map(function ([office, cands]) {
                return (
                  <div key={office}>
                    <h3 style={{ fontFamily: SERIF, fontSize: '1.1rem', color: INK, marginBottom: '0.75rem' }}>{office}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cands.map(function (c) {
                        return (
                          <CandidateCard
                            key={c.candidate_id}
                            name={c.candidate_name}
                            party={c.party}
                            incumbent={c.incumbent}
                            officeSought={c.office_sought}
                            district={c.district}
                            bioSummary={c.bio_summary}
                            campaignWebsite={c.campaign_website}
                            linkedinUrl={(c as any).linkedin_url}
                            policyPositions={c.policy_positions}
                            endorsements={c.endorsements}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* Ballot Items */}
        {ballotItems.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>What&apos;s on the Ballot</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{ballotItems.length} item{ballotItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ballotItems.map(function (item) {
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
                    {(item as any).community_impact_summary && (
                      <div className="mt-2">
                        <CommunityImpactCard summary={(item as any).community_impact_summary} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* Voting Locations */}
        {votingLocations.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Where to Vote</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{votingLocations.length} location{votingLocations.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <VotingLocationsMap locations={votingLocations} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {votingLocations.map(function (loc) {
                return (
                  <VotingLocationCard
                    key={loc.location_id}
                    name={loc.location_name}
                    address={loc.address}
                    city={loc.city}
                    locationType={loc.location_type}
                    hoursEarlyVoting={loc.hours_early_voting}
                    hoursElectionDay={loc.hours_election_day}
                    isAccessible={loc.is_accessible}
                    hasParking={loc.has_parking}
                    transitAccessible={loc.transit_accessible}
                    hasCurbside={loc.has_curbside}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/elections" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Elections
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: election.election_name,
            startDate: election.election_date,
            url: canonicalUrl,
          }),
        }}
      />
    </div>
  )
}
