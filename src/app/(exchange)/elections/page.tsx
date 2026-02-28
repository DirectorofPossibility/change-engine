import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ElectionCountdown } from '@/components/exchange/ElectionCountdown'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Elections and Voting Guide',
  description: 'Upcoming elections, candidates, ballot items, and where to vote in Houston.',
}

export default async function ElectionsPage() {
  const supabase = await createClient()
  var today = new Date().toISOString().split('T')[0]

  // Upcoming election
  const { data: upcoming } = await supabase
    .from('elections')
    .select('*')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(1)

  // All elections
  const { data: elections } = await supabase
    .from('elections')
    .select('*')
    .order('election_date', { ascending: false })

  var upcomingElection = upcoming && upcoming.length > 0 ? upcoming[0] : null
  var allElections = elections || []
  var futureElections = allElections.filter(function (e) { return e.election_date && e.election_date >= today })
  var pastElections = allElections.filter(function (e) { return !e.election_date || e.election_date < today })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Elections &amp; Voting</h1>
      <p className="text-brand-muted mb-8">Know what&apos;s on your ballot and where to vote.</p>

      {/* Upcoming election banner */}
      {upcomingElection && (
        <div className="mb-10">
          <Link href={'/elections/' + upcomingElection.election_id}>
            <ElectionCountdown
              electionName={upcomingElection.election_name}
              electionDate={upcomingElection.election_date}
              earlyVotingStart={upcomingElection.early_voting_start}
              earlyVotingEnd={upcomingElection.early_voting_end}
              registrationDeadline={upcomingElection.registration_deadline}
              electionType={upcomingElection.election_type}
            />
          </Link>
        </div>
      )}

      {/* Upcoming elections */}
      {futureElections.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Upcoming Elections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {futureElections.map(function (e) {
              return (
                <Link key={e.election_id} href={'/elections/' + e.election_id} className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-brand-text">{e.election_name}</h3>
                  </div>
                  {e.election_type && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{e.election_type}</span>}
                  {e.election_date && <p className="text-sm text-brand-muted mt-2">{new Date(e.election_date + 'T00:00:00').toLocaleDateString()}</p>}
                  {e.jurisdiction && <p className="text-xs text-brand-muted mt-1">{e.jurisdiction}</p>}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Past elections */}
      {pastElections.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Past Elections</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastElections.map(function (e) {
              return (
                <Link key={e.election_id} href={'/elections/' + e.election_id} className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow opacity-75">
                  <h3 className="font-semibold text-brand-text mb-1">{e.election_name}</h3>
                  {e.election_type && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{e.election_type}</span>}
                  {e.election_date && <p className="text-sm text-brand-muted mt-2">{new Date(e.election_date + 'T00:00:00').toLocaleDateString()}</p>}
                  {e.turnout_pct != null && <p className="text-xs text-brand-muted mt-1">Turnout: {e.turnout_pct}%</p>}
                  {e.results_certified === 'Yes' && <span className="text-xs text-green-600">Results certified</span>}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
