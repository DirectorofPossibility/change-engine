'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { MapProvider } from './MapProvider'
import { HoustonMap } from './HoustonMap'
import { MapMarker, type MarkerData } from './MapMarker'
import { MapLegend } from './MapLegend'
import { GeoJsonLayer } from './GeoJsonLayer'
import { LayerControl, type LayerOption } from './LayerControl'
import { GeoInfoPanel } from './GeoInfoPanel'
import type { GeoLayerConfig } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

interface InteractiveMapProps {
  markers?: MarkerData[]
  layers?: GeoLayerConfig[]
  defaultVisibleLayers?: string[]
  className?: string
  showLegend?: boolean
  highlightLayerId?: string
  highlightFeatureId?: string
  zoom?: number
  center?: { lat: number; lng: number }
}

interface SelectedFeature {
  properties: GeoFeatureProperties
  layerConfig: GeoLayerConfig
}

function InteractiveMapInner({
  markers = [],
  layers = [],
  defaultVisibleLayers = [],
  className,
  showLegend = true,
  highlightLayerId,
  highlightFeatureId,
  zoom,
  center,
}: InteractiveMapProps) {
  const map = useMap()
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markerRefs = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())

  // Visible layer state
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(
    new Set(defaultVisibleLayers)
  )
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null)

  // Marker clustering
  useEffect(() => {
    if (!map) return
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map })
    }
  }, [map])

  // Fit bounds to markers
  useEffect(() => {
    if (!map || markers.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }))
    map.fitBounds(bounds, 50)
  }, [map, markers])

  const setMarkerRef = useCallback((marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
    if (!clustererRef.current) return
    if (marker) {
      markerRefs.current.set(id, marker)
    } else {
      markerRefs.current.delete(id)
    }
    clustererRef.current.clearMarkers()
    clustererRef.current.addMarkers(Array.from(markerRefs.current.values()))
  }, [])

  // Layer toggle
  const handleToggleLayer = useCallback((layerId: string) => {
    setVisibleLayerIds(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }
      return next
    })
  }, [])

  // Layer click
  const handleLayerClick = useCallback(
    (layerConfig: GeoLayerConfig) => (properties: GeoFeatureProperties) => {
      setSelectedFeature({ properties, layerConfig })
    },
    []
  )

  // Build layer options for control panel
  const layerOptions: LayerOption[] = useMemo(
    () =>
      layers.map(layer => ({
        id: layer.id,
        label: layer.label,
        color: layer.color,
        visible: visibleLayerIds.has(layer.id),
      })),
    [layers, visibleLayerIds]
  )

  const markerTypes = useMemo(
    () => Array.from(new Set(markers.map(m => m.type))),
    [markers]
  )

  return (
    <div>
      <div className="relative">
        <HoustonMap
          className={className || 'w-full h-[450px] rounded-xl'}
          zoom={zoom}
          center={center}
        >
          {/* GeoJSON boundary layers */}
          {layers.map(layer => (
            <GeoJsonLayer
              key={layer.id}
              url={layer.url}
              visible={visibleLayerIds.has(layer.id)}
              style={{
                fillColor: layer.color,
                fillOpacity: 0.15,
                strokeColor: layer.color,
                strokeWeight: 1.5,
              }}
              onClick={handleLayerClick(layer)}
              idProperty={layer.idProperty}
              highlightFeatureId={
                highlightLayerId === layer.id ? highlightFeatureId : undefined
              }
            />
          ))}

          {/* Point markers on top of boundaries */}
          {markers.map(m => (
            <MapMarker key={m.id} marker={m} onMarkerReady={setMarkerRef} />
          ))}
        </HoustonMap>

        {/* Layer toggle control */}
        {layers.length > 0 && (
          <LayerControl layers={layerOptions} onToggle={handleToggleLayer} />
        )}
      </div>

      {/* Info panel for clicked polygon */}
      {selectedFeature && (
        <GeoInfoPanel
          properties={selectedFeature.properties}
          layerLabel={selectedFeature.layerConfig.label}
          layerColor={selectedFeature.layerConfig.color}
          detailPath={selectedFeature.layerConfig.detailPath}
          idProperty={selectedFeature.layerConfig.idProperty}
          onClose={() => setSelectedFeature(null)}
        />
      )}

      {/* Marker legend */}
      {showLegend && markerTypes.length > 1 && <MapLegend types={markerTypes} />}
    </div>
  )
}

export function InteractiveMap(props: InteractiveMapProps) {
  return (
    <MapProvider>
      <InteractiveMapInner {...props} />
    </MapProvider>
  )
}
