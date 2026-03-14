'use client'

import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { ServiceWithOrg } from '@/lib/types/exchange'

interface HelpMapProps {
  services: ServiceWithOrg[]
  opportunities: Array<{ opportunity_id: string; opportunity_name: string; address: string | null; city: string | null }>
}

export function HelpMap({ services, opportunities }: HelpMapProps) {
  const markers: MarkerData[] = [
    ...services
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        phone: s.phone,
        link: '/services/' + s.service_id,
      })),
    ...opportunities
      .filter(o => (o as any).latitude != null && (o as any).longitude != null)
      .map(o => ({
        id: 'opp-' + o.opportunity_id,
        lat: (o as any).latitude as number,
        lng: (o as any).longitude as number,
        title: o.opportunity_name,
        type: 'opportunity' as const,
        address: [o.address, o.city].filter(Boolean).join(', '),
      })),
  ]

  if (markers.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-brand-text mb-4">Nearby Resources</h2>
      <InteractiveMap
        markers={markers}
        layers={[GEO_LAYERS.superNeighborhoods, GEO_LAYERS.councilDistricts]}
        defaultVisibleLayers={[]}
        className="w-full h-[350px]"
      />
    </div>
  )
}
