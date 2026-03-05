'use client'

import { ClusteredMap } from '@/components/maps/dynamic'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { ServiceWithOrg } from '@/lib/types/exchange'

interface NeighborhoodMapProps {
  services: ServiceWithOrg[]
  votingLocations: Array<{ location_id: string; location_name: string; latitude: number | null; longitude: number | null; address: string | null; city: string | null }>
  distributionSites: Array<{ site_id: string; site_name: string; latitude: number | null; longitude: number | null; address: string | null; city: string | null }>
  organizations: Array<{ org_id: string; org_name: string; latitude: number | null; longitude: number | null; address: string | null; city: string | null }>
}

export function NeighborhoodMap({ services, votingLocations, distributionSites, organizations }: NeighborhoodMapProps) {
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
    ...votingLocations
      .filter(v => v.latitude != null && v.longitude != null)
      .map(v => ({
        id: 'vote-' + v.location_id,
        lat: v.latitude!,
        lng: v.longitude!,
        title: v.location_name,
        type: 'voting' as const,
        address: [v.address, v.city].filter(Boolean).join(', '),
      })),
    ...distributionSites
      .filter(d => d.latitude != null && d.longitude != null)
      .map(d => ({
        id: 'dist-' + d.site_id,
        lat: d.latitude!,
        lng: d.longitude!,
        title: d.site_name,
        type: 'distribution' as const,
        address: [d.address, d.city].filter(Boolean).join(', '),
      })),
    ...organizations
      .filter(o => o.latitude != null && o.longitude != null)
      .map(o => ({
        id: 'org-' + o.org_id,
        lat: o.latitude!,
        lng: o.longitude!,
        title: o.org_name,
        type: 'organization' as const,
        address: [o.address, o.city].filter(Boolean).join(', '),
        link: '/organizations/' + o.org_id,
      })),
  ]

  if (markers.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-brand-text mb-4">Neighborhood Map</h2>
      <ClusteredMap markers={markers} className="w-full h-[400px] rounded-xl" />
    </div>
  )
}
