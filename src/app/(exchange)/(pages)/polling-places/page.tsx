import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PollingPlaceClient } from './PollingPlaceClient'
import { PollingHero } from './PollingHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Find Where to Vote',
  description: 'Find where to vote. Early voting, Election Day, and mail ballots — enter your address and get your polling place in thirty seconds.',
}

export default async function PollingPlacesPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: upcoming } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)

  const activeElection = upcoming && upcoming.length > 0 ? upcoming[0] : null

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Polling Places' }]} />
      <PollingHero />

      {activeElection && (
        <div className="mb-6">
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
