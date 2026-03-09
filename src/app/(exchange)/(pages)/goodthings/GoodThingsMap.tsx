'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Entry {
  id: string
  thing_1: string
  thing_2: string
  thing_3: string
  zip_code: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

interface Props {
  entries: Entry[]
  focusEntry?: Entry | null
}

const MARKER_COLORS = ['#38a169', '#3182ce', '#805ad5']

function createMarkerIcon(isActive: boolean) {
  const size = isActive ? 42 : 24
  const color = isActive ? '#C75B2A' : '#38a169'
  const glow = isActive ? 'box-shadow:0 0 12px rgba(199,91,42,0.6);' : ''
  return L.divIcon({
    html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';border:2px solid white;' + glow + '"></div>',
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function GoodThingsMap({ entries, focusEntry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(function () {
    if (!containerRef.current || mapRef.current) return

    const geoEntries = entries.filter(function (e) { return e.latitude != null && e.longitude != null })

    // Default center: Houston, or the focus entry, or first entry
    let center: [number, number] = [29.76, -95.37]
    let zoom = 4

    if (focusEntry?.latitude && focusEntry?.longitude) {
      center = [focusEntry.latitude, focusEntry.longitude]
      zoom = 10
    } else if (geoEntries.length > 0) {
      center = [geoEntries[0].latitude!, geoEntries[0].longitude!]
      zoom = 10
    }

    const map = L.map(containerRef.current, {
      center: center,
      zoom: zoom,
      scrollWheelZoom: false,
      zoomControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    // Add markers
    geoEntries.forEach(function (entry) {
      const isActive = focusEntry?.id === entry.id
      const marker = L.marker(
        [entry.latitude!, entry.longitude!],
        { icon: createMarkerIcon(isActive) }
      ).addTo(map)

      const loc = [entry.city, entry.state].filter(Boolean).join(', ') || 'ZIP ' + entry.zip_code
      const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })

      marker.bindPopup(
        '<div style="font-family:DM Sans,sans-serif;max-width:260px;padding:4px 0;">' +
          '<div style="font-size:11px;color:#5A6178;margin-bottom:6px;">' + loc + ' &middot; ' + date + '</div>' +
          [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
            return '<div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start;">' +
              '<span style="width:16px;height:16px;border-radius:50%;background:' + MARKER_COLORS[i] + ';color:white;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">' + (i + 1) + '</span>' +
              '<span style="font-size:13px;color:#1A1A1A;line-height:1.4;">' + thing + '</span>' +
            '</div>'
          }).join('') +
        '</div>',
        { closeButton: false, maxWidth: 280 }
      )

      if (isActive) {
        marker.openPopup()
      }
    })

    // Fit bounds if multiple entries and no focus
    if (!focusEntry && geoEntries.length > 1) {
      const bounds = L.latLngBounds(geoEntries.map(function (e) { return [e.latitude!, e.longitude!] as [number, number] }))
      map.fitBounds(bounds, { padding: [40, 40] })
    }

    mapRef.current = map

    return function () {
      map.remove()
      mapRef.current = null
    }
  }, [entries, focusEntry])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]" />
  )
}
