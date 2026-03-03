'use client'

import { useState, useCallback, useEffect } from 'react'
import { AdvancedMarker, InfoWindow, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps'
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

const MARKER_COLORS: Record<MarkerType, { background: string; glyph: string; border: string }> = {
  service:      { background: '#3182ce', glyph: '#ffffff', border: '#2c5282' },
  voting:       { background: '#e53e3e', glyph: '#ffffff', border: '#c53030' },
  organization: { background: '#38a169', glyph: '#ffffff', border: '#276749' },
  distribution: { background: '#d69e2e', glyph: '#ffffff', border: '#b7791f' },
  opportunity:  { background: '#805ad5', glyph: '#ffffff', border: '#6b46c1' },
}

interface MapMarkerProps {
  marker: MarkerData
  onMarkerReady?: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void
}

export function MapMarker({ marker, onMarkerReady }: MapMarkerProps) {
  const [infoOpen, setInfoOpen] = useState(false)
  const [markerRef, advancedMarker] = useAdvancedMarkerRef()
  const colors = MARKER_COLORS[marker.type]

  useEffect(() => {
    if (onMarkerReady) {
      onMarkerReady(advancedMarker, marker.id)
    }
    return () => {
      if (onMarkerReady) onMarkerReady(null, marker.id)
    }
  }, [advancedMarker, marker.id, onMarkerReady])

  const handleClick = useCallback(() => setInfoOpen(true), [])
  const handleClose = useCallback(() => setInfoOpen(false), [])

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: marker.lat, lng: marker.lng }}
        onClick={handleClick}
      >
        <Pin
          background={colors.background}
          glyphColor={colors.glyph}
          borderColor={colors.border}
        />
      </AdvancedMarker>

      {infoOpen && advancedMarker && (
        <InfoWindow anchor={advancedMarker} onCloseClick={handleClose}>
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
        </InfoWindow>
      )}
    </>
  )
}
