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

export type MarkerType = 'service' | 'voting' | 'organization' | 'distribution' | 'opportunity'

export interface MarkerData {
  id: string
  lat: number
  lng: number
  title: string
  type: MarkerType
  address?: string | null
  phone?: string | null
  link?: string | null
}

const MARKER_COLORS: Record<MarkerType, { background: string; border: string }> = {
  service:      { background: '#3182ce', border: '#2c5282' },
  voting:       { background: '#e53e3e', border: '#c53030' },
  organization: { background: '#38a169', border: '#276749' },
  distribution: { background: '#d69e2e', border: '#b7791f' },
  opportunity:  { background: '#805ad5', border: '#6b46c1' },
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
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    html: `<div style="
      width:24px;height:24px;
      background:${bg};
      border:2px solid ${border};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
  })
}

interface MapMarkerProps {
  marker: MarkerData
}

/**
 * Renders a color-coded Leaflet marker pin with a click-to-open Popup.
 *
 * @param props.marker - Data object describing the marker's position, title, type, and optional contact info.
 */
export function MapMarker({ marker }: MapMarkerProps) {
  const colors = MARKER_COLORS[marker.type]
  const icon = createPinIcon(colors.background, colors.border)

  return (
    <Marker position={[marker.lat, marker.lng]} icon={icon}>
      <Popup>
        <div className="max-w-[240px] text-sm">
          <h3 className="font-semibold text-brand-text mb-1">{marker.title}</h3>
          {marker.address && (
            <p className="text-xs text-brand-muted mb-1">{marker.address}</p>
          )}
          {marker.phone && (
            <p className="text-xs text-brand-muted mb-1">
              <a href={'tel:' + marker.phone} className="text-brand-accent hover:underline">{marker.phone}</a>
            </p>
          )}
          {marker.link && (
            <Link href={marker.link} className="text-xs text-brand-accent hover:underline">
              View details &rarr;
            </Link>
          )}
        </div>
      </Popup>
    </Marker>
  )
}
