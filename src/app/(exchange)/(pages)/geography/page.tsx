import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getSuperNeighborhoodsList } from '@/lib/data/exchange'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { GeographyClient } from './GeographyClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Your Community — Map View',
  description: 'Explore your city through its neighborhoods, districts, and civic boundaries. Find services, officials, and organizations in your area.',
}

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; superNeighborhood?: string }>
}) {
  await requirePageEnabled('page_geography')

  const params = await searchParams
  const superNeighborhoods = await getSuperNeighborhoodsList()

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Explore Your Community"
        subtitle="Your city through its neighborhoods, districts, and civic boundaries. Find services, officials, and organizations in your area."
        color="#1b5e8a"
        stats={[
          { value: superNeighborhoods.length, label: 'Neighborhoods' },
        ]}
      />

      <Breadcrumb items={[{ label: 'Map View' }]} />

      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <Suspense fallback={<div className="w-full h-[650px] animate-pulse bg-paper" />}>
          <GeographyClient
            superNeighborhoods={superNeighborhoods}
            initialZip={params.zip}
            initialSuperNeighborhood={params.superNeighborhood}
          />
        </Suspense>

        <PageCrossLinks preset="resources" />
      </div>
    </div>
  )
}
