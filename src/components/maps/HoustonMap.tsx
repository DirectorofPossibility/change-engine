'use client'

import { Map } from '@vis.gl/react-google-maps'

interface HoustonMapProps {
  children?: React.ReactNode
  className?: string
  zoom?: number
  center?: { lat: number; lng: number }
}

const HOUSTON_CENTER = { lat: 29.76, lng: -95.37 }

export function HoustonMap({
  children,
  className = 'w-full h-[400px]',
  zoom = 10,
  center = HOUSTON_CENTER,
}: HoustonMapProps) {
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ''
  return (
    <Map
      defaultCenter={center}
      defaultZoom={zoom}
      mapId={mapId}
      gestureHandling="cooperative"
      className={className}
    >
      {children}
    </Map>
  )
}
