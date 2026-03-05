/**
 * @fileoverview GeoJSON boundary layer renderer for Leaflet.
 *
 * Fetches a GeoJSON file from a URL and renders its features using the
 * react-leaflet `<GeoJSON>` component. Supports:
 *
 * - Visibility toggling (renders nothing when hidden, without re-fetching).
 * - Configurable fill/stroke styling.
 * - Feature highlighting by ID (increased opacity and stroke weight).
 * - Hover highlighting with mouse-over/mouse-out visual feedback.
 * - Click and hover callbacks that surface feature properties.
 *
 * GeoJSON responses are cached per URL to avoid redundant network requests
 * when a layer is toggled off and back on.
 */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { GeoJSON, useMap } from 'react-leaflet'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import L from 'leaflet'
import type { GeoFeatureProperties } from '@/lib/types/exchange'
import type { Feature, GeoJsonObject, Geometry } from 'geojson'

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

/** Module-level GeoJSON cache shared across component instances. */
const geoJsonCache = new Map<string, GeoJsonObject>()

/**
 * Renders a GeoJSON boundary layer on the map with optional highlighting.
 *
 * @param props.url - URL of the GeoJSON file to fetch and render.
 * @param props.style - Fill and stroke styling for the layer features.
 * @param props.visible - Whether the layer is currently shown on the map.
 * @param props.onClick - Callback fired with feature properties when a polygon is clicked.
 * @param props.onHover - Callback fired with feature properties on mouse-over, or `null` on mouse-out.
 * @param props.highlightFeatureId - ID of a feature to visually emphasize (doubled opacity/stroke).
 * @param props.idProperty - Name of the GeoJSON property used to match `highlightFeatureId`.
 */
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
  const [data, setData] = useState<GeoJsonObject | null>(
    geoJsonCache.get(url) ?? null
  )
  const hoveredLayerRef = useRef<Layer | null>(null)

  useEffect(() => {
    if (geoJsonCache.has(url)) {
      setData(geoJsonCache.get(url)!)
      return
    }

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)
        return res.json()
      })
      .then((geojson: GeoJsonObject) => {
        geoJsonCache.set(url, geojson)
        setData(geojson)
      })
      .catch(err => {
        console.error('GeoJsonLayer: failed to load', url, err)
      })
  }, [url])

  /** Returns the base or highlighted style for a given feature. */
  const featureStyle = useCallback(
    (feature?: Feature<Geometry>): PathOptions => {
      const featureId = feature?.properties && idProperty
        ? feature.properties[idProperty]
        : null
      const isHighlighted =
        highlightFeatureId != null && featureId === highlightFeatureId

      return {
        fillColor: style.fillColor,
        fillOpacity: isHighlighted
          ? Math.min(style.fillOpacity * 3, 0.35)
          : style.fillOpacity,
        color: style.strokeColor,
        weight: isHighlighted ? style.strokeWeight * 2 : style.strokeWeight,
        opacity: 0.7,
      }
    },
    [style, highlightFeatureId, idProperty]
  )

  /** Resets the previously hovered layer back to its base style. */
  const resetHover = useCallback(() => {
    if (!hoveredLayerRef.current || !map) return
    const path = hoveredLayerRef.current as L.Path
    path.setStyle({
      fillOpacity: style.fillOpacity,
      weight: style.strokeWeight,
    })
    hoveredLayerRef.current = null
  }, [map, style.fillOpacity, style.strokeWeight])

  /** Attaches click and hover handlers to each GeoJSON feature layer. */
  const onEachFeature = useCallback(
    (feature: Feature<Geometry>, layer: Layer) => {
      layer.on({
        click: () => {
          if (onClick && feature.properties) {
            onClick(feature.properties as GeoFeatureProperties)
          }
        },
        mouseover: (e: LeafletMouseEvent) => {
          resetHover()
          hoveredLayerRef.current = e.target as Layer
          const path = e.target as L.Path
          path.setStyle({
            fillOpacity: Math.min(style.fillOpacity * 2, 0.6),
            weight: style.strokeWeight + 1,
          })
          path.bringToFront()
          if (onHover && feature.properties) {
            onHover(feature.properties as GeoFeatureProperties)
          }
        },
        mouseout: () => {
          resetHover()
          if (onHover) onHover(null)
        },
      })
    },
    [onClick, onHover, resetHover, style.fillOpacity, style.strokeWeight]
  )

  if (!visible || !data) return null

  return (
    <GeoJSON
      key={`${url}-${highlightFeatureId ?? 'none'}`}
      data={data}
      style={featureStyle}
      onEachFeature={onEachFeature}
    />
  )
}
