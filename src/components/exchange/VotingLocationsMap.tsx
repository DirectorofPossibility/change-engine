'use client'

import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { MarkerData } from '@/components/maps/MapMarker'

interface VotingLocationData {
  location_id: string
  location_name: string
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

interface VotingLocationsMapProps {
  locations: VotingLocationData[]
}

export function VotingLocationsMap({ locations }: VotingLocationsMapProps) {
  const markers: MarkerData[] = locations
    .filter(loc => loc.latitude != null && loc.longitude != null)
    .map(loc => ({
      id: loc.location_id,
      lat: loc.latitude!,
      lng: loc.longitude!,
      title: loc.location_name,
      type: 'voting' as const,
      address: [loc.address, loc.city].filter(Boolean).join(', '),
    }))

  if (markers.length === 0) return null

  return (
    <div className="mb-6">
      <InteractiveMap
        markers={markers}
        layers={[GEO_LAYERS.councilDistricts, GEO_LAYERS.superNeighborhoods]}
        defaultVisibleLayers={[]}
        showLegend={false}
      />
    </div>
  )
}
