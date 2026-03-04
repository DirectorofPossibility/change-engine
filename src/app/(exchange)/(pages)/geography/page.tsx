import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getGeographyData } from '@/lib/data/exchange'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { GeographyClient } from './GeographyClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Geography — Explore Your Community',
  description: 'Explore Houston through its neighborhoods, districts, and civic boundaries. Find services, officials, and organizations in your area.',
}

export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; superNeighborhood?: string; neighborhood?: string }>
}) {
  const params = await searchParams
  const data = await getGeographyData(params.zip, params.superNeighborhood)

  return (
    <div>
      <PageHero
        variant="editorial"
        titleKey="geo.title"
        subtitleKey="geo.subtitle"
        intro={PAGE_INTROS.geography}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Geography' }]} />

        <Suspense fallback={<div className="text-brand-muted py-12 text-center">Loading geography...</div>}>
          <GeographyClient
            superNeighborhoods={data.superNeighborhoods}
            neighborhoods={data.neighborhoods}
            serviceMarkers={data.serviceMarkers}
            organizationMarkers={data.organizationMarkers}
            officials={data.officials}
            policies={data.policies}
            initialZip={params.zip}
            initialSuperNeighborhood={params.superNeighborhood}
            initialNeighborhood={params.neighborhood}
          />
        </Suspense>
      </div>
    </div>
  )
}
