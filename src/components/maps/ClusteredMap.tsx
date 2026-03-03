/**
 * @fileoverview Map with automatic marker clustering via react-leaflet-cluster.
 *
 * Combines {@link MapProvider}, {@link HoustonMap}, and {@link MapMarker}
 * with a declarative `<MarkerClusterGroup>` so that densely packed markers
 * are grouped into numbered cluster icons. A helper child component
 * auto-fits the map bounds to contain all provided markers, and an optional
 * {@link MapLegend} is shown when more than one marker type is present.
 */
'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { MapProvider } from './MapProvider'
import { HoustonMap } from './HoustonMap'
import { MapMarker, type MarkerData } from './MapMarker'
import { MapLegend } from './MapLegend'

interface ClusteredMapProps {
  markers: MarkerData[]
  className?: string
  showLegend?: boolean
}

/**
 * Auto-fits map bounds to contain all markers with padding.
 *
 * @param props.markers - Array of marker data with lat/lng positions.
 */
function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, markers])

  return null
}

function ClusteredMapInner({ markers, className, showLegend = true }: ClusteredMapProps) {
  const types = Array.from(new Set(markers.map(m => m.type)))

  return (
    <div>
      <HoustonMap className={className || 'w-full h-[400px] rounded-xl'}>
        <FitBounds markers={markers} />
        <MarkerClusterGroup chunkedLoading>
          {markers.map(m => (
            <MapMarker key={m.id} marker={m} />
          ))}
        </MarkerClusterGroup>
      </HoustonMap>
      {showLegend && types.length > 1 && <MapLegend types={types} />}
    </div>
  )
}

/**
 * Self-contained clustered map with its own MapProvider.
 *
 * Renders a Houston-centered map where nearby markers are automatically
 * grouped into numbered cluster icons. Includes an optional color-coded
 * legend when multiple marker types are present.
 *
 * @param props.markers - Array of {@link MarkerData} objects to display.
 * @param props.className - CSS class for the map container.
 * @param props.showLegend - Whether to display the marker-type legend. Defaults to `true`.
 */
export function ClusteredMap(props: ClusteredMapProps) {
  return (
    <MapProvider>
      <ClusteredMapInner {...props} />
    </MapProvider>
  )
}
