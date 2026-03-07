import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'
import { PollingPlaceClient } from './PollingPlaceClient'
import { PageHeader } from '@/components/exchange/PageHeader'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Find Your Polling Place',
  description: 'Look up your polling place by ZIP code. Find early voting and Election Day locations in Houston.',
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
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Polling Places' }]} />
      <PageHeader titleKey="polling.title" subtitleKey="polling.subtitle" />

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
