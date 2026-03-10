'use client'

import dynamic from 'next/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { MarkerType } from '@/components/maps/MapMarker'

const InteractiveMap = dynamic(
  function () { return import('@/components/maps/InteractiveMap').then(function (m) { return m.InteractiveMap }) },
  { ssr: false, loading: function () { return <div className="h-[280px] bg-brand-bg-alt rounded-xl animate-pulse" /> } }
)

interface TirzDetailMapProps {
  siteNumber: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    title: string
    type: MarkerType
    address?: string | null
    link?: string | null
  }>
}

export function TirzDetailMap({ siteNumber, markers }: TirzDetailMapProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-brand-border" style={{ height: 280 }}>
      <InteractiveMap
        layers={[GEO_LAYERS.tirzZones, GEO_LAYERS.councilDistricts]}
        defaultVisibleLayers={['tirzZones']}
        highlightLayerId="tirzZones"
        highlightFeatureId={String(siteNumber)}
        markers={markers}
        zoom={12}
        center={{ lat: 29.76, lng: -95.37 }}
      />
    </div>
  )
}
