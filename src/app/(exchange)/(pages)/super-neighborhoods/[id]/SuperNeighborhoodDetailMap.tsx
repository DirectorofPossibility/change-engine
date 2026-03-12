'use client'

import { InteractiveMap } from '@/components/maps/dynamic'
import type { MarkerData } from '@/components/maps/MapMarker'
import { GEO_LAYERS } from '@/lib/constants'

interface SuperNeighborhoodDetailMapProps {
  markers: MarkerData[]
  snId: string
}

const layers = [GEO_LAYERS.superNeighborhoods]

export function SuperNeighborhoodDetailMap({ markers, snId }: SuperNeighborhoodDetailMapProps) {
  return (
    <InteractiveMap
      markers={markers}
      layers={layers}
      defaultVisibleLayers={['superNeighborhoods']}
      highlightLayerId="superNeighborhoods"
      highlightFeatureId={snId}
      className="w-full h-[450px]"
    />
  )
}
