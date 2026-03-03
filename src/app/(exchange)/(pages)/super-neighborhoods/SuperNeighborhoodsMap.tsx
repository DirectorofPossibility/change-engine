'use client'

import { useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/maps'
import { GEO_LAYERS } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

const layers = [GEO_LAYERS.superNeighborhoods]

export function SuperNeighborhoodsMap() {
  const router = useRouter()

  return (
    <InteractiveMap
      layers={layers}
      defaultVisibleLayers={['superNeighborhoods']}
      className="w-full h-[500px] rounded-xl"
    />
  )
}
