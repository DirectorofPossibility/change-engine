'use client'

import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { ServiceWithOrg } from '@/lib/types/exchange'

interface DashboardCoverageMapProps {
  services: ServiceWithOrg[]
}

export function DashboardCoverageMap({ services }: DashboardCoverageMapProps) {
  const markers: MarkerData[] = services
    .filter(s => s.latitude != null && s.longitude != null)
    .map(function (s: any) {
      return {
        id: s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        phone: s.phone,
        link: '/services/' + s.service_id,
      }
    })

  if (markers.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-brand-text mb-4">Service Coverage</h2>
      <p className="text-sm text-brand-muted mb-4">
        {markers.length} services with verified locations across Houston
      </p>
      <InteractiveMap
        markers={markers}
        layers={[GEO_LAYERS.superNeighborhoods, GEO_LAYERS.councilDistricts]}
        defaultVisibleLayers={[]}
        showLegend={false}
        className="w-full h-[400px]"
      />
    </div>
  )
}
