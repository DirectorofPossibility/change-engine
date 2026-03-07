import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getElectionDashboard } from '@/lib/data/exchange'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { VotingDashboardClient } from './VotingDashboardClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Elections & Voting — Community Exchange',
  description: 'See recent election results, upcoming elections, who represents you, and where to vote. Start with your ZIP code to personalize your experience.',
}

export default async function ElectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>
}) {
  const { zip: paramZip } = await searchParams
  // Use ZIP from URL params, or fall back to saved cookie
  const cookieStore = await cookies()
  const zip = paramZip || cookieStore.get('zip')?.value || undefined
  const data = await getElectionDashboard(zip)

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="seed"
        gradientColor="#e53e3e"
        titleKey="elections.title"
        subtitleKey="elections.subtitle"
        intro={PAGE_INTROS.elections}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Breadcrumb items={[{ label: 'Elections' }]} />
        </div>

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
    </div>
  )
}
