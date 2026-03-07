import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getSuperNeighborhoodsList } from '@/lib/data/exchange'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { GeographyClient } from './GeographyClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Map View — Explore Your Community',
  description: 'Explore Houston through its neighborhoods, districts, and civic boundaries. Find services, officials, and organizations in your area.',
}

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; superNeighborhood?: string }>
}) {
  const params = await searchParams
  const superNeighborhoods = await getSuperNeighborhoodsList()

  return (
    <div>
      <PageHero
        variant="editorial"
        titleKey="geo.title"
        subtitleKey="geo.subtitle"
        intro={PAGE_INTROS.geography}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Map View' }]} />

        <Suspense fallback={<div className="text-brand-muted py-12 text-center">Loading map...</div>}>
          <GeographyClient
            superNeighborhoods={superNeighborhoods}
            initialZip={params.zip}
            initialSuperNeighborhood={params.superNeighborhood}
          />
        </Suspense>
      </div>
    </div>
  )
}
