/**
 * @fileoverview Base Leaflet map component with configurable center.
 *
 * Renders a `react-leaflet` `<MapContainer>` with OpenStreetMap tiles.
 * Center defaults to Houston but can be set for any city via props.
 * Scroll-wheel zoom is enabled, zoom control is bottom-right.
 */
'use client'

import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

interface BaseMapProps {
  children?: React.ReactNode
  className?: string
  zoom?: number
  center?: { lat: number; lng: number }
}

const DEFAULT_CENTER: LatLngExpression = [29.76, -95.37] // Houston fallback

/**
 * Base Leaflet map with configurable center.
 *
 * @param props.children - Map overlay elements (markers, layers, etc.).
 * @param props.className - CSS class for the map container. Defaults to `'w-full h-[400px]'`.
 * @param props.zoom - Initial zoom level. Defaults to `10`.
 * @param props.center - Initial center coordinates. Defaults to Houston.
 */
export function BaseMap({
  children,
  className = 'w-full h-[400px]',
  zoom = 10,
  center,
}: BaseMapProps) {
  const mapCenter: LatLngExpression = center
    ? [center.lat, center.lng]
    : DEFAULT_CENTER

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      scrollWheelZoom
      zoomControl={false}
      className={className}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      {children}
    </MapContainer>
  )
}

/** @deprecated Use BaseMap instead. Kept for backward compatibility. */
export const HoustonMap = BaseMap
