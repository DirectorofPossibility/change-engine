'use client'

import { MapProvider } from './MapProvider'
import { HoustonMap } from './HoustonMap'
import { MapMarker, type MarkerData } from './MapMarker'

interface SingleLocationMapProps {
  marker: MarkerData
}

function SingleLocationMapInner({ marker }: SingleLocationMapProps) {
  return (
    <HoustonMap
      className="w-full h-[250px] rounded-xl"
      zoom={14}
      center={{ lat: marker.lat, lng: marker.lng }}
    >
      <MapMarker marker={marker} />
    </HoustonMap>
  )
}

export function SingleLocationMap({ marker }: SingleLocationMapProps) {
  return (
    <MapProvider>
      <SingleLocationMapInner marker={marker} />
    </MapProvider>
  )
}
