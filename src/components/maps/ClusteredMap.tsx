'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { MapProvider } from './MapProvider'
import { HoustonMap } from './HoustonMap'
import { MapMarker, type MarkerData } from './MapMarker'
import { MapLegend } from './MapLegend'

interface ClusteredMapProps {
  markers: MarkerData[]
  className?: string
  showLegend?: boolean
}

function ClusteredMapInner({ markers, className, showLegend = true }: ClusteredMapProps) {
  const map = useMap()
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markerRefs = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())

  useEffect(() => {
    if (!map) return
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map })
    }
  }, [map])

  // Fit bounds to markers
  useEffect(() => {
    if (!map || markers.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }))
    map.fitBounds(bounds, 50)
  }, [map, markers])

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    if (!clustererRef.current) return
    if (marker) {
      markerRefs.current.set(id, marker)
    } else {
      markerRefs.current.delete(id)
    }
    clustererRef.current.clearMarkers()
    clustererRef.current.addMarkers(Array.from(markerRefs.current.values()))
  }, [])

  const types = Array.from(new Set(markers.map(m => m.type)))

  return (
    <div>
      <HoustonMap className={className || 'w-full h-[400px] rounded-xl'}>
        {markers.map(m => (
          <MapMarker key={m.id} marker={m} onMarkerReady={setMarkerRef} />
        ))}
      </HoustonMap>
      {showLegend && types.length > 1 && <MapLegend types={types} />}
    </div>
  )
}

export function ClusteredMap(props: ClusteredMapProps) {
  return (
    <MapProvider>
      <ClusteredMapInner {...props} />
    </MapProvider>
  )
}
