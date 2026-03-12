/**
 * @fileoverview Individual map marker with a Popup for Leaflet.
 *
 * Uses Leaflet `L.divIcon` to render color-coded pin shapes styled by
 * {@link MarkerType} (service, voting, organization, distribution,
 * opportunity). Clicking a pin opens a Popup showing the marker's title,
 * address, phone, and detail link.
 */
'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'

export type MarkerType = 'service' | 'voting' | 'organization' | 'distribution' | 'opportunity' | 'park' | 'police' | 'fire' | 'school' | 'medical' | 'library' | 'official'

export interface MarkerData {
  id: string
  lat: number
  lng: number
  title: string
  type: MarkerType
  address?: string | null
  phone?: string | null
  link?: string | null
  primaryPathway?: string | null
  pathways?: string[]
  focusAreas?: Array<{ id: string; name: string }>
}

const MARKER_COLORS: Record<MarkerType, { background: string; border: string }> = {
  service:      { background: '#1b5e8a', border: '#163a5c' },
  voting:       { background: '#7a2018', border: '#5a1810' },
  organization: { background: '#1a6b56', border: '#145242' },
  distribution: { background: '#4a2870', border: '#381e55' },
  opportunity:  { background: '#4a2870', border: '#381e55' },
  park:         { background: '#1a6b56', border: '#145242' },
  police:       { background: '#1b5e8a', border: '#163a5c' },
  fire:         { background: '#7a2018', border: '#5a1810' },
  school:       { background: '#1e4d7a', border: '#163a5c' },
  medical:      { background: '#4a2870', border: '#381e55' },
  library:      { background: '#1e4d7a', border: '#163a5c' },
  official:     { background: '#1a5030', border: '#123d24' },
}

/**
 * Creates a Leaflet `divIcon` shaped as a map pin with the given color.
 *
 * @param bg - CSS background color for the pin body.
 * @param border - CSS border color for the pin body.
 */
function createPinIcon(bg: string, border: string) {
  return L.divIcon({
    className: '',
    iconSize: [20, 28],
    iconAnchor: [10, 28],
    popupAnchor: [0, -28],
    html: `<div style="
      width:18px;height:18px;
      background:${bg};
      border:2px solid rgba(255,255,255,0.9);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 1px 4px rgba(0,0,0,0.2);
    "></div>`,
  })
}

interface MapMarkerProps {
  marker: MarkerData
  onClick?: (marker: MarkerData) => void
}

/**
 * Renders a color-coded Leaflet marker pin with a click-to-open Popup.
 *
 * @param props.marker - Data object describing the marker's position, title, type, and optional contact info.
 */
export function MapMarker({ marker, onClick }: MapMarkerProps) {
  // Use pathway color if available, otherwise fall back to type-based color
  const themeEntry = marker.primaryPathway ? (THEMES as Record<string, { color: string }>)[marker.primaryPathway] : null
  const colors = themeEntry
    ? { background: themeEntry.color, border: themeEntry.color }
    : MARKER_COLORS[marker.type]
  const icon = createPinIcon(colors.background, colors.border)

  return (
    <Marker
      position={[marker.lat, marker.lng]}
      icon={icon}
      eventHandlers={onClick ? { click: () => onClick(marker) } : undefined}
    >
      <Popup>
        <div className="max-w-[240px] text-sm">
          <h3 className="font-semibold mb-1" style={{ color: '#0d1117' }}>{marker.title}</h3>
          {marker.address && (
            <p className="text-xs mb-1" style={{ color: '#5c6474' }}>{marker.address}</p>
          )}
          {marker.phone && (
            <p className="text-xs mb-1" style={{ color: '#5c6474' }}>
              <a href={'tel:' + marker.phone} className="hover:underline" style={{ color: '#1b5e8a' }}>{marker.phone}</a>
            </p>
          )}
          {marker.link && (
            <Link href={marker.link} className="text-xs hover:underline" style={{ color: '#1b5e8a' }}>
              View details &rarr;
            </Link>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
