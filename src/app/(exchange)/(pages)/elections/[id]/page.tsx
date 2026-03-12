import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { ElectionResultsBar } from '@/components/exchange/ElectionResultsBar'
import { TurnoutGauge } from '@/components/exchange/TurnoutGauge'
import { CommunityImpactCard } from '@/components/exchange/CommunityImpactCard'
import { CandidateCard } from '@/components/exchange/CandidateCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { VotingLocationCard } from '@/components/exchange/VotingLocationCard'
import { VotingLocationsMap } from '@/components/exchange/VotingLocationsMap'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elections').select('election_name, description').eq('election_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.election_name,
    description: data.description || 'Details on the Community Exchange.',
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

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Breadcrumb items={[
        { label: 'Elections', href: '/elections' },
        { label: election.election_name }
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">

      {/* Countdown banner */}
      <div className="mb-5">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
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
        <div className="mb-5">
          <CommunityImpactCard summary={(election as any).community_impact_summary} />
        </div>
      )}

      {/* Register to vote CTA */}
      {canRegister && (
        <div className="bg-brand-accent text-white p-6 text-center mb-5">
          <p className="text-lg font-bold mb-2">Make sure you&apos;re registered to vote!</p>
          <p className="text-sm mb-4 opacity-90">Registration deadline: {new Date(election.registration_deadline! + 'T00:00:00').toLocaleDateString()}</p>
          <Link
            href="https://www.votetexas.gov/register-to-vote/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3.5 py-1.5 bg-white text-brand-accent rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Register to Vote
          </Link>
        </div>
      )}

      {election.description && (
        <p className="text-brand-muted mb-5">{election.description}</p>
      )}

      {/* Election Results (vote percentages) — shown for past elections with results */}
      {hasResults && (
        <section className="mb-6">
          <h2 className="text-xl font-bold font-display text-brand-text mb-4">Election Results</h2>
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

      {/* Candidates */}
      {Object.keys(candidateGroups).length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold font-display text-brand-text mb-4">Who&apos;s Running</h2>
          <div className="space-y-6">
            {Object.entries(candidateGroups).map(function ([office, cands]) {
              return (
                <div key={office}>
                  <h3 className="font-semibold text-brand-text mb-3">{office}</h3>
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

      {/* Ballot Items */}
      {ballotItems.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold font-display text-brand-text mb-4">What&apos;s on the Ballot</h2>
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

      {/* Voting Locations */}
      {votingLocations.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold font-display text-brand-text mb-4">Where to Vote</h2>
          <VotingLocationsMap locations={votingLocations} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div>
        <DetailWayfinder data={wayfinderData} currentType={'election' as any} currentId={id} userRole={userProfile?.role} />
      </div>
      </div>
    </div>
  )
}
