'use client'

import { InteractiveMap } from '@/components/maps/dynamic'
import type { MarkerData } from '@/components/maps/MapMarker'
import { GEO_LAYERS } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface HomeMapProps {
  markers: MarkerData[]
}

const homeLayers = [GEO_LAYERS.superNeighborhoods, GEO_LAYERS.councilDistricts]

export function HomeMap({ markers }: HomeMapProps) {
  const { t } = useTranslation()

  if (markers.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-brand-text mb-6">{t('map.houston_glance')}</h2>
      <InteractiveMap
        markers={markers}
        layers={homeLayers}
        defaultVisibleLayers={['superNeighborhoods']}
        className="w-full h-[450px] rounded-xl"
      />
    </section>
  )
}
