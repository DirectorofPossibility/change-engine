/**
 * @fileoverview Base Leaflet map component centered on Houston, TX.
 *
 * Renders a `react-leaflet` `<MapContainer>` with OpenStreetMap tiles,
 * pre-configured with the Houston metro center coordinates (29.76, -95.37)
 * and scroll-wheel zoom disabled (cooperative gesture equivalent).
 * Accepts optional overrides for zoom, center, and className, and renders
 * any children (markers, layers) on top of the map.
 */
'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

interface HoustonMapProps {
  children?: React.ReactNode
  className?: string
  zoom?: number
  center?: { lat: number; lng: number }
}

const HOUSTON_CENTER: LatLngExpression = [29.76, -95.37]

/**
 * Base Leaflet map centered on Houston with scroll-wheel zoom disabled.
 *
 * @param props.children - Map overlay elements (markers, layers, etc.).
 * @param props.className - CSS class for the map container. Defaults to `'w-full h-[400px]'`.
 * @param props.zoom - Initial zoom level. Defaults to `10`.
 * @param props.center - Initial center coordinates. Defaults to Houston center.
 */
export function HoustonMap({
  children,
  className = 'w-full h-[400px]',
  zoom = 10,
  center,
}: HoustonMapProps) {
  const mapCenter: LatLngExpression = center
    ? [center.lat, center.lng]
    : HOUSTON_CENTER

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  )
}
