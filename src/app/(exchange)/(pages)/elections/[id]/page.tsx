import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { CandidateCard } from '@/components/exchange/CandidateCard'
import { BallotItemCard } from '@/components/exchange/BallotItemCard'
import { VotingLocationCard } from '@/components/exchange/VotingLocationCard'
import { VotingLocationsMap } from '@/components/exchange/VotingLocationsMap'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('elections').select('election_name, description').eq('election_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.election_name,
    description: data.description || 'Details on The Change Engine.',
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

  const [candidatesRes, ballotRes, locationsRes] = await Promise.all([
    supabase.from('candidates').select('*').eq('election_id', id).eq('is_active', 'Yes'),
    supabase.from('ballot_items').select('*').eq('election_id', id),
    supabase.from('voting_locations').select('*').eq('election_id', id).eq('is_active', 'Yes'),
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

  // Check if before registration deadline
  const today = new Date().toISOString().split('T')[0]
  const canRegister = election.registration_deadline ? today <= election.registration_deadline : false

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/elections" className="hover:text-brand-accent">Elections</Link>
        <span className="mx-2">/</span>
        <span>{election.election_name}</span>
      </div>

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

      {/* Register to vote CTA */}
      {canRegister && (
        <div className="bg-brand-accent text-white rounded-xl p-6 text-center mb-8">
          <p className="text-lg font-bold mb-2">Make sure you&apos;re registered to vote!</p>
          <p className="text-sm mb-4 opacity-90">Registration deadline: {new Date(election.registration_deadline! + 'T00:00:00').toLocaleDateString()}</p>
          <Link
            href="https://www.votetexas.gov/register-to-vote/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-white text-brand-accent rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Register to Vote
          </Link>
        </div>
      )}

      {election.description && (
        <p className="text-brand-muted mb-8">{election.description}</p>
      )}

      {/* Candidates */}
      {Object.keys(candidateGroups).length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Who&apos;s Running</h2>
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
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">What&apos;s on the Ballot</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ballotItems.map(function (item) {
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
        </section>
      )}

      {/* Voting Locations */}
      {votingLocations.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Where to Vote</h2>
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
  )
}
