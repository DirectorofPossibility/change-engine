'use client'

import { useRouter } from 'next/navigation'
import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

const layers = [GEO_LAYERS.superNeighborhoods, GEO_LAYERS.councilDistricts, GEO_LAYERS.zipCodes]

export function SuperNeighborhoodsMap() {
  const router = useRouter()

  return (
    <InteractiveMap
      layers={layers}
      defaultVisibleLayers={['superNeighborhoods']}
      className="w-full h-[500px]"
    />
  )
}
