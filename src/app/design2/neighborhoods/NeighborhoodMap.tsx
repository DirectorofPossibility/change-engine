'use client'

import { useEffect, useRef, useState } from 'react'

export function NeighborhoodMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapReady, setMapReady] = useState(false)
  const leafletMap = useRef<any>(null)

  useEffect(function () {
    if (!mapRef.current || leafletMap.current) return

    // Dynamically load Leaflet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = function () {
      const L = (window as any).L
      const map = L.map(mapRef.current, { center: [29.76, -95.37], zoom: 10 })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'OpenStreetMap, CartoDB',
        maxZoom: 18,
      }).addTo(map)

      // Load super neighborhoods GeoJSON
      fetch('/geo/super-neighborhoods.geojson')
        .then(function (r) { return r.json() })
        .then(function (data) {
          L.geoJSON(data, {
            style: function () {
              return { color: '#d69e2e', weight: 1.5, fillColor: '#d69e2e', fillOpacity: 0.08 }
            },
            onEachFeature: function (feature: any, layer: any) {
              const name = feature.properties.SN_NAME || ''
              layer.bindTooltip(name, { sticky: true, direction: 'top' })
              layer.on({
                mouseover: function (e: any) { e.target.setStyle({ weight: 3, fillOpacity: 0.25 }) },
                mouseout: function (e: any) { e.target.setStyle({ weight: 1.5, fillOpacity: 0.08 }) },
                click: function (e: any) {
                  const snId = feature.properties.SN_ID
                  if (snId) window.location.href = '/design2/super-neighborhoods/' + snId
                },
              })
            },
          }).addTo(map)
        })

      leafletMap.current = map
      setMapReady(true)
    }
    document.head.appendChild(script)
  }, [])

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl border-2 overflow-hidden"
      style={{ height: 500, borderColor: '#E2DDD5', background: '#F7F2EA' }}
    />
  )
}
