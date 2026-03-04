/**
 * @fileoverview Full-featured interactive Leaflet map with GeoJSON boundary
 * layers, marker clustering, layer toggle controls, and polygon-click info
 * panels.
 *
 * This is the highest-level map component in the maps system. It composes
 * {@link HoustonMap}, {@link MapMarker}, {@link GeoJsonLayer},
 * {@link LayerControl}, {@link GeoInfoPanel}, and {@link MapLegend} into a
 * single ready-to-use map experience. Consumers provide an array of markers
 * and/or an array of GeoJSON layer configurations; the component handles
 * clustering, visibility toggling, boundary rendering, feature highlighting,
 * and polygon detail display.
 */
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
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
  onFeatureClick?: (layerConfig: GeoLayerConfig, properties: GeoFeatureProperties) => void
}

interface SelectedFeature {
  properties: GeoFeatureProperties
  layerConfig: GeoLayerConfig
}

/**
 * Auto-fits map bounds to contain all markers with padding.
 *
 * @param props.markers - Array of marker data with lat/lng positions.
 */
function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, markers])

  return null
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
  onFeatureClick,
}: InteractiveMapProps) {
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(
    new Set(defaultVisibleLayers)
  )
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null)

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

  const handleLayerClick = useCallback(
    (layerConfig: GeoLayerConfig) => (properties: GeoFeatureProperties) => {
      setSelectedFeature({ properties, layerConfig })
      if (onFeatureClick) {
        onFeatureClick(layerConfig, properties)
      }
    },
    [onFeatureClick]
  )

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
          {/* Auto-fit bounds to markers */}
          {markers.length > 0 && <FitBounds markers={markers} />}

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

          {/* Clustered point markers on top of boundaries */}
          <MarkerClusterGroup chunkedLoading>
            {markers.map(m => (
              <MapMarker key={m.id} marker={m} />
            ))}
          </MarkerClusterGroup>
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

/**
 * Full-featured interactive map with boundary layers, clustering, and info panels.
 *
 * Wraps its own {@link MapProvider} so it can be dropped into any page without
 * additional setup. Supports optional GeoJSON boundary layers with toggle
 * controls, marker clustering, feature highlighting, and a detail panel that
 * appears when the user clicks a polygon.
 *
 * @param props.markers - Point markers to display on the map.
 * @param props.layers - GeoJSON boundary layer configurations.
 * @param props.defaultVisibleLayers - Layer IDs that should be visible on mount.
 * @param props.className - CSS class for the map container.
 * @param props.showLegend - Whether to show the marker-type legend. Defaults to `true`.
 * @param props.highlightLayerId - ID of the layer containing the feature to highlight.
 * @param props.highlightFeatureId - ID of the specific feature to highlight within the layer.
 * @param props.zoom - Initial zoom level override.
 * @param props.center - Initial center coordinate override.
 */
export function InteractiveMap(props: InteractiveMapProps) {
  return (
    <MapProvider>
      <InteractiveMapInner {...props} />
    </MapProvider>
  )
}
