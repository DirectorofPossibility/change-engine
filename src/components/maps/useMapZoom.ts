'use client'

import { useState, useEffect } from 'react'
import { useMap } from 'react-leaflet'

/**
 * Returns the current zoom level of the Leaflet map, updating on `zoomend`.
 */
export function useMapZoom() {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [map])

  return zoom
}
