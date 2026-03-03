'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

interface GeoJsonLayerProps {
  url: string
  style: {
    fillColor: string
    fillOpacity: number
    strokeColor: string
    strokeWeight: number
  }
  visible: boolean
  onClick?: (properties: GeoFeatureProperties) => void
  onHover?: (properties: GeoFeatureProperties | null) => void
  highlightFeatureId?: string | null
  idProperty?: string
}

export function GeoJsonLayer({
  url,
  style,
  visible,
  onClick,
  onHover,
  highlightFeatureId,
  idProperty,
}: GeoJsonLayerProps) {
  const map = useMap()
  const dataLayerRef = useRef<google.maps.Data | null>(null)
  const geoJsonCacheRef = useRef<Map<string, object[]>>(new Map())

  // Create and configure the data layer
  useEffect(() => {
    if (!map) return

    const dataLayer = new google.maps.Data()
    dataLayerRef.current = dataLayer

    return () => {
      dataLayer.setMap(null)
      dataLayerRef.current = null
    }
  }, [map])

  // Load GeoJSON data
  useEffect(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer || !map) return

    if (geoJsonCacheRef.current.has(url)) {
      // Already loaded
      return
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
        return res.json()
      })
      .then(geojson => {
        geoJsonCacheRef.current.set(url, geojson.features || [])
        dataLayer.addGeoJson(geojson)
      })
      .catch(err => {
        console.error('GeoJsonLayer: failed to load', url, err)
      })
  }, [url, map])

  // Toggle visibility
  useEffect(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer || !map) return

    if (visible) {
      dataLayer.setMap(map)
    } else {
      dataLayer.setMap(null)
    }
  }, [visible, map])

  // Apply styles
  useEffect(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer) return

    dataLayer.setStyle((feature) => {
      const featureId = idProperty ? feature.getProperty(idProperty) : null
      const isHighlighted = highlightFeatureId != null && featureId === highlightFeatureId

      return {
        fillColor: style.fillColor,
        fillOpacity: isHighlighted ? style.fillOpacity * 2 : style.fillOpacity,
        strokeColor: style.strokeColor,
        strokeWeight: isHighlighted ? style.strokeWeight * 2 : style.strokeWeight,
        clickable: true,
      }
    })
  }, [style, highlightFeatureId, idProperty])

  // Click handler
  useEffect(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer || !onClick) return

    const listener = dataLayer.addListener('click', (event: google.maps.Data.MouseEvent) => {
      const feature = event.feature
      const props: GeoFeatureProperties = {}
      feature.forEachProperty((value: unknown, name: string) => {
        props[name] = value as string | number | null
      })
      onClick(props)
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [onClick])

  // Hover handlers
  const prevHoveredRef = useRef<google.maps.Data.Feature | null>(null)

  const resetHover = useCallback(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer || !prevHoveredRef.current) return
    dataLayer.overrideStyle(prevHoveredRef.current, {
      fillOpacity: style.fillOpacity,
      strokeWeight: style.strokeWeight,
    })
    prevHoveredRef.current = null
  }, [style.fillOpacity, style.strokeWeight])

  useEffect(() => {
    const dataLayer = dataLayerRef.current
    if (!dataLayer) return

    const overListener = dataLayer.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
      resetHover()
      const feature = event.feature
      prevHoveredRef.current = feature
      dataLayer.overrideStyle(feature, {
        fillOpacity: Math.min(style.fillOpacity * 2, 0.6),
        strokeWeight: style.strokeWeight + 1,
      })
      if (onHover) {
        const props: GeoFeatureProperties = {}
        feature.forEachProperty((value: unknown, name: string) => {
          props[name] = value as string | number | null
        })
        onHover(props)
      }
    })

    const outListener = dataLayer.addListener('mouseout', () => {
      resetHover()
      if (onHover) onHover(null)
    })

    return () => {
      google.maps.event.removeListener(overListener)
      google.maps.event.removeListener(outListener)
    }
  }, [onHover, resetHover, style.fillOpacity, style.strokeWeight])

  return null
}
