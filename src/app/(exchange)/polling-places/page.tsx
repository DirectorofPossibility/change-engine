import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PollingPlaceClient } from './PollingPlaceClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Find Your Polling Place',
  description: 'Look up your polling place by ZIP code. Find early voting and Election Day locations in Houston.',
}

export default async function PollingPlacesPage() {
  const supabase = await createClient()
  var today = new Date().toISOString().split('T')[0]

  const { data: upcoming } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)

  var activeElection = upcoming && upcoming.length > 0 ? upcoming[0] : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Find Your Polling Place</h1>
      <p className="text-brand-muted mb-8">Enter your ZIP code to find nearby voting locations.</p>

      {activeElection && (
        <div className="mb-10">
          <ElectionCountdown
            electionName={activeElection.election_name}
            electionDate={activeElection.election_date}
            earlyVotingStart={activeElection.early_voting_start}
            earlyVotingEnd={activeElection.early_voting_end}
            registrationDeadline={activeElection.registration_deadline}
            electionType={activeElection.election_type}
          />
        </div>
      )}

      <PollingPlaceClient activeElection={activeElection} />
    </div>
  )
}
