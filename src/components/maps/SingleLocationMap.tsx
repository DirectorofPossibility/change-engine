/**
 * @fileoverview Single-location map convenience wrapper.
 *
 * Renders a compact Leaflet map centered on a single marker. Used by detail
 * pages (services, help resources, etc.) to show the location of a specific
 * entity without clustering or boundary layers.
 */
'use client'

import { MapProvider } from './MapProvider'
import { BaseMap } from './BaseMap'
import { MapMarker, type MarkerData } from './MapMarker'

interface SingleLocationMapProps {
  marker: MarkerData
}

function SingleLocationMapInner({ marker }: SingleLocationMapProps) {
  return (
    <BaseMap
      className="w-full h-[250px]"
      zoom={14}
      center={{ lat: marker.lat, lng: marker.lng }}
    >
      <MapMarker marker={marker} />
    </BaseMap>
  )
}

/**
 * Self-contained single-marker map with its own MapProvider.
 *
 * @param props.marker - The {@link MarkerData} to display at the map center.
 */
export function SingleLocationMap({ marker }: SingleLocationMapProps) {
  return (
    <MapProvider>
      <SingleLocationMapInner marker={marker} />
    </MapProvider>
  )
}
