'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { HoustonMap } from './HoustonMap'
import { MapMarker, type MarkerData } from './MapMarker'
import { MapLegend } from './MapLegend'

interface ClusteredMapProps {
  markers: MarkerData[]
  className?: string
  showLegend?: boolean
}

function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, markers])

  return null
}

function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount()
  let size = 36
  let fontSize = '0.75rem'
  if (count >= 100) { size = 48; fontSize = '0.8rem' }
  else if (count >= 10) { size = 40; fontSize = '0.75rem' }

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(199,91,42,0.85);
      color:#fff;font-weight:600;font-size:${fontSize};
      border-radius:50%;
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Reports current zoom level from inside MapContainer to a parent callback */
function ZoomReporter({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMap()
  useEffect(() => {
    onZoomChange(map.getZoom())
    const onZoom = () => onZoomChange(map.getZoom())
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [map, onZoomChange])
  return null
}

export function ClusteredMap({ markers, className, showLegend = true }: ClusteredMapProps) {
  const types = Array.from(new Set(markers.map(m => m.type)))
  const [zoom, setZoom] = useState(10)
  const handleZoom = useCallback((z: number) => setZoom(z), [])

  return (
    <div>
      <HoustonMap className={className || 'w-full h-[400px] rounded-xl'}>
        <FitBounds markers={markers} />
        <ZoomReporter onZoomChange={handleZoom} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          disableClusteringAtZoom={12}
        >
          {markers.map(m => (
            <MapMarker key={m.id} marker={m} />
          ))}
        </MarkerClusterGroup>
      </HoustonMap>
      {showLegend && types.length > 1 && zoom >= 12 && <MapLegend types={types} />}
    </div>
  )
}
