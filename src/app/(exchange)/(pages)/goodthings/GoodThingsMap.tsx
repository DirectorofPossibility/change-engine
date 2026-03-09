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

function folSvg(color: string, size: number) {
  const r = 4, cx = 12, cy = 12
  const circles = [0, 60, 120, 180, 240, 300].map(function (deg) {
    const rad = (deg * Math.PI) / 180
    return '<circle cx="' + (cx + r * Math.cos(rad)) + '" cy="' + (cy + r * Math.sin(rad)) + '" r="' + r + '" stroke="' + color + '" stroke-width="1.2" fill="none"/>'
  }).join('')
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px;">' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + color + '" stroke-width="1.5" fill="none"/>' +
    circles + '</svg>'
}

function createMarkerIcon(isActive: boolean) {
  const size = isActive ? 42 : 24
  const color = isActive ? '#C75B2A' : '#38a169'
  const glow = isActive ? 'filter:drop-shadow(0 0 6px rgba(199,91,42,0.6));' : ''
  const r = size * 0.18, cx = size / 2, cy = size / 2
  const circles = [0, 60, 120, 180, 240, 300].map(function (deg) {
    const rad = (deg * Math.PI) / 180
    return '<circle cx="' + (cx + r * Math.cos(rad)) + '" cy="' + (cy + r * Math.sin(rad)) + '" r="' + r + '" stroke="' + color + '" stroke-width="' + (isActive ? 1.8 : 1.2) + '" fill="none"/>'
  }).join('')
  const svg = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" fill="none" style="' + glow + '">' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 2.2) + '" stroke="' + color + '" stroke-width="0.8" fill="white" fill-opacity="0.7"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + color + '" stroke-width="' + (isActive ? 2 : 1.5) + '" fill="none"/>' +
    circles + '</svg>'
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function buildPopupHtml(entry: Entry) {
  const loc = [entry.city, entry.state].filter(Boolean).join(', ') || 'ZIP ' + entry.zip_code
  const date = new Date(entry.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  return (
    '<div style="font-family:DM Sans,sans-serif;max-width:260px;padding:4px 0;">' +
      '<div style="font-size:11px;color:#5A6178;margin-bottom:6px;">' + loc + ' &middot; ' + date + '</div>' +
      [entry.thing_1, entry.thing_2, entry.thing_3].map(function (thing, i) {
        return '<div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start;">' +
          folSvg(MARKER_COLORS[i], 16) +
          '<span style="font-size:13px;color:#1A1A1A;line-height:1.4;">' + thing + '</span>' +
        '</div>'
      }).join('') +
    '</div>'
  )
}

export function GoodThingsMap({ entries, focusEntry }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Init map once
  useEffect(function () {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [29.76, -95.37],
      zoom: 4,
      scrollWheelZoom: false,
      zoomControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    return function () {
      map.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  }, [])

  // Update markers when entries change
  useEffect(function () {
    const map = mapRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(function (marker) { marker.remove() })
    markersRef.current.clear()

    const geoEntries = entries.filter(function (e) { return e.latitude != null && e.longitude != null })

    geoEntries.forEach(function (entry) {
      const isActive = focusEntry?.id === entry.id
      const marker = L.marker(
        [entry.latitude!, entry.longitude!],
        { icon: createMarkerIcon(isActive) }
      ).addTo(map)

      marker.bindPopup(buildPopupHtml(entry), { closeButton: false, maxWidth: 280 })

      if (isActive) {
        marker.openPopup()
      }

      markersRef.current.set(entry.id, marker)
    })

    // Fit bounds if multiple entries and no focus
    if (!focusEntry && geoEntries.length > 1) {
      const bounds = L.latLngBounds(geoEntries.map(function (e) { return [e.latitude!, e.longitude!] as [number, number] }))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [entries, focusEntry])

  // Pan to focus entry without rebuilding map
  useEffect(function () {
    const map = mapRef.current
    if (!map || !focusEntry?.latitude || !focusEntry?.longitude) return

    map.flyTo([focusEntry.latitude, focusEntry.longitude], 10, { duration: 0.8 })

    // Update marker icons — highlight focused, reset others
    markersRef.current.forEach(function (marker, id) {
      marker.setIcon(createMarkerIcon(id === focusEntry.id))
      if (id === focusEntry.id) {
        marker.openPopup()
      }
    })
  }, [focusEntry])

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]" />
  )
}
