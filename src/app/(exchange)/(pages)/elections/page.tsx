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
import { FOLLoading } from '@/components/exchange/FOLLoading'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Elections & Voting — Change Engine',
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
        color="#7a2018"
        pattern="seed"
        titleKey="elections.title"
        subtitleKey="elections.subtitle"
        intro={PAGE_INTROS.elections}
        stats={[
          { value: data.upcomingElections?.length || 0, label: 'Upcoming' },
          { value: data.officials?.length || 0, label: 'Your Officials' },
        ]}
      />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Elections' }]} />

        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          <div className="flex-1 min-w-0">
            <Suspense fallback={<FOLLoading message="Loading your voting dashboard..." />}>
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
                color="#7a2018"
                related={[
                  { label: 'My Neighborhood', href: '/my-neighborhood', color: '#1a6b56' },
                  { label: 'Call Your Senators', href: '/call-your-senators', color: '#7a2018' },
                  { label: 'Officials', href: '/officials', color: '#4a2870' },
                  { label: 'Policies', href: '/policies', color: '#1b5e8a' },
                  { label: 'Polling Places', href: '/polling-places', color: '#1a6b56' },
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
