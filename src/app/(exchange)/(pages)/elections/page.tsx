import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getElectionDashboard } from '@/lib/data/exchange'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { PAGE_INTROS } from '@/lib/constants'
import { VotingDashboardClient } from './VotingDashboardClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Elections & Voting — Community Exchange',
  description: 'See recent election results, upcoming elections, who represents you, and where to vote.',
}

export default async function ElectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>
}) {
  const { zip: paramZip } = await searchParams
  const cookieStore = await cookies()
  const zip = paramZip || cookieStore.get('zip')?.value || undefined
  const data = await getElectionDashboard(zip)

  return (
    <div>
      <IndexPageHero
        color="#e53e3e"
        pattern="seed"
        titleKey="elections.title"
        subtitleKey="elections.subtitle"
        intro={PAGE_INTROS.elections}
        stats={[
          { value: data.upcomingElections?.length || 0, label: 'Upcoming' },
          { value: data.officials?.length || 0, label: 'Your Officials' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Elections' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <Suspense fallback={<div className="text-brand-muted py-12 text-center">Loading your voting dashboard...</div>}>
              <VotingDashboardClient
                pastElections={data.pastElections}
                upcomingElections={data.upcomingElections}
                civicEvents={data.civicEvents}
                recentCandidates={data.recentCandidates}
                recentBallotItems={data.recentBallotItems}
                upcomingCandidates={data.upcomingCandidates}
                upcomingBallotItems={data.upcomingBallotItems}
                officials={data.officials}
                relatedContent={data.relatedContent}
                zip={zip}
              />
            </Suspense>
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="elections"
                color="#e53e3e"
                related={[
                  { label: 'Call Your Senators', href: '/call-your-senators', color: '#e53e3e' },
                  { label: 'Officials', href: '/officials', color: '#805ad5' },
                  { label: 'Policies', href: '/policies', color: '#3182ce' },
                  { label: 'Polling Places', href: '/polling-places', color: '#38a169' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
