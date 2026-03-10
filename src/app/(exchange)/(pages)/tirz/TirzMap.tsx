'use client'

import dynamic from 'next/dynamic'
import { GEO_LAYERS } from '@/lib/constants'

const InteractiveMap = dynamic(
  function () { return import('@/components/maps/InteractiveMap').then(function (m) { return m.InteractiveMap }) },
  { ssr: false, loading: function () { return <div className="h-[400px] bg-brand-bg-alt rounded-xl animate-pulse" /> } }
)

export function TirzMap() {
  return (
    <div className="rounded-xl overflow-hidden border border-brand-border mb-8" style={{ height: 400 }}>
      <InteractiveMap
        layers={[GEO_LAYERS.tirzZones, GEO_LAYERS.councilDistricts]}
        defaultVisibleLayers={['tirzZones']}
        zoom={10}
        center={{ lat: 29.76, lng: -95.37 }}
      />
    </div>
  )
}
