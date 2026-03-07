import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getSuperNeighborhoodsList } from '@/lib/data/exchange'
import { GeographyClient } from './GeographyClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Your Community — Map View',
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Breadcrumb items={[{ label: 'Map View' }]} />
          <h1 className="font-serif text-xl font-bold text-brand-text mt-1">Explore your community</h1>
        </div>
      </div>

      <Suspense fallback={<div className="w-full h-[650px] rounded-2xl bg-brand-border/30 animate-pulse" />}>
        <GeographyClient
          superNeighborhoods={superNeighborhoods}
          initialZip={params.zip}
          initialSuperNeighborhood={params.superNeighborhood}
        />
      </Suspense>
    </div>
  )
}
