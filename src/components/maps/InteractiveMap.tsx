'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { BaseMap } from './BaseMap'
import { MapMarker, type MarkerData, type MarkerType } from './MapMarker'
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
  citySlug?: string
  onFeatureClick?: (layerConfig: GeoLayerConfig, properties: GeoFeatureProperties) => void
  onMarkerClick?: (marker: MarkerData) => void
}

interface SelectedFeature {
  properties: GeoFeatureProperties
  layerConfig: GeoLayerConfig
}

/** Marker type display config for layer control */
const MARKER_TYPE_META: Record<MarkerType, { label: string; color: string }> = {
  service:      { label: 'Services',           color: '#1b5e8a' },
  voting:       { label: 'Voting Locations',   color: '#7a2018' },
  organization: { label: 'Organizations',      color: '#1a6b56' },
  distribution: { label: 'Distribution Sites', color: '#4a2870' },
  opportunity:  { label: 'Opportunities',      color: '#4a2870' },
  park:         { label: 'Parks',              color: '#1a6b56' },
  police:       { label: 'Police',             color: '#1b5e8a' },
  fire:         { label: 'Fire Stations',      color: '#7a2018' },
  school:       { label: 'Schools',            color: '#1e4d7a' },
  medical:      { label: 'Medical',            color: '#4a2870' },
  library:      { label: 'Libraries',          color: '#1e4d7a' },
  official:     { label: 'Officials',          color: '#1a5030' },
}

/** Zoom thresholds for progressive detail */
const ZOOM_SHOW_BOUNDARIES = 9    // show GeoJSON boundaries
const ZOOM_SHOW_MARKERS = 12      // show individual markers (clusters always show)
const ZOOM_DETAILED_BOUNDARIES = 13 // thicker strokes, higher fill opacity

function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap()

  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, markers])

  return null
}

/** Zoom-aware GeoJSON styling */
function getLayerStyle(color: string, zoom: number) {
  const isDetailed = zoom >= ZOOM_DETAILED_BOUNDARIES
  return {
    fillColor: color,
    fillOpacity: isDetailed ? 0.12 : 0.06,
    strokeColor: color,
    strokeWeight: isDetailed ? 2 : 1,
  }
}

/** Custom cluster icon factory with brand styling */
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount()
  let size = 36
  let fontSize = '0.75rem'
  if (count >= 100) { size = 48; fontSize = '0.8rem' }
  else if (count >= 10) { size = 40; fontSize = '0.75rem' }

  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(199,91,42,0.85);
      color:#fff;font-weight:600;font-size:${fontSize};
      border-radius:50%;
      border:3px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
    ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Reports current zoom level from inside MapContainer to a parent callback */
function ZoomReporter({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const map = useMap()
  useEffect(() => {
    onZoomChange(map.getZoom())
    const onZoom = () => onZoomChange(map.getZoom())
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [map, onZoomChange])
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
  zoom: initialZoom,
  center,
  citySlug,
  onFeatureClick,
  onMarkerClick,
}: InteractiveMapProps) {
  const [currentZoom, setCurrentZoom] = useState(10)
  const handleZoom = useCallback((z: number) => setCurrentZoom(z), [])
  const [visibleLayerIds, setVisibleLayerIds] = useState<Set<string>>(
    new Set(defaultVisibleLayers)
  )
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null)
  const [hiddenMarkerTypes, setHiddenMarkerTypes] = useState<Set<string>>(new Set())

  const handleToggleLayer = useCallback((layerId: string) => {
    // Check if this is a marker type toggle (prefixed with 'markers:')
    if (layerId.startsWith('markers:')) {
      const markerType = layerId.slice(8)
      setHiddenMarkerTypes(prev => {
        const next = new Set(prev)
        if (next.has(markerType)) next.delete(markerType)
        else next.add(markerType)
        return next
      })
      return
    }
    setVisibleLayerIds(prev => {
      const next = new Set(prev)
      if (next.has(layerId)) next.delete(layerId)
      else next.add(layerId)
      return next
    })
  }, [])

  const handleLayerClick = useCallback(
    (layerConfig: GeoLayerConfig) => (properties: GeoFeatureProperties) => {
      setSelectedFeature({ properties, layerConfig })
      if (onFeatureClick) onFeatureClick(layerConfig, properties)
    },
    [onFeatureClick]
  )

  const markerTypes = useMemo(
    () => Array.from(new Set(markers.map(m => m.type))),
    [markers]
  )

  const layerOptions: LayerOption[] = useMemo(
    () => {
      const geoOptions = layers.map(layer => ({
        id: layer.id,
        label: layer.label,
        color: layer.color,
        visible: visibleLayerIds.has(layer.id),
      }))
      // Add marker type toggles when there are multiple types
      if (markerTypes.length > 1) {
        const markerOptions = markerTypes.map(type => ({
          id: 'markers:' + type,
          label: MARKER_TYPE_META[type]?.label ?? type,
          color: MARKER_TYPE_META[type]?.color ?? '#718096',
          visible: !hiddenMarkerTypes.has(type),
        }))
        return [...markerOptions, ...geoOptions]
      }
      return geoOptions
    },
    [layers, visibleLayerIds, markerTypes, hiddenMarkerTypes]
  )

  const filteredMarkers = useMemo(
    () => hiddenMarkerTypes.size === 0 ? markers : markers.filter(m => !hiddenMarkerTypes.has(m.type)),
    [markers, hiddenMarkerTypes]
  )

  const showBoundaries = currentZoom >= ZOOM_SHOW_BOUNDARIES

  return (
    <div>
      <div className="relative">
        <BaseMap
          className={className || 'w-full h-[450px]'}
          zoom={initialZoom}
          center={center}
          citySlug={citySlug}
        >
          <ZoomReporter onZoomChange={handleZoom} />
          {filteredMarkers.length > 0 && <FitBounds markers={filteredMarkers} />}

          {/* GeoJSON boundary layers — fade in at neighborhood zoom */}
          {showBoundaries && layers.map(layer => (
            <GeoJsonLayer
              key={layer.id}
              url={layer.url}
              visible={visibleLayerIds.has(layer.id)}
              style={getLayerStyle(layer.color, currentZoom)}
              onClick={handleLayerClick(layer)}
              idProperty={layer.idProperty}
              highlightFeatureId={
                highlightLayerId === layer.id ? highlightFeatureId : undefined
              }
            />
          ))}

          {/* Clustered markers with brand-styled clusters */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            maxClusterRadius={50}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            disableClusteringAtZoom={ZOOM_SHOW_MARKERS}
          >
            {filteredMarkers.map(m => (
              <MapMarker key={m.id} marker={m} onClick={onMarkerClick} />
            ))}
          </MarkerClusterGroup>
        </BaseMap>

        {/* Layer toggle control */}
        {layerOptions.length > 0 && (
          <LayerControl layers={layerOptions} onToggle={handleToggleLayer} />
        )}

        {/* Zoom hint — shows briefly at low zoom */}
        {currentZoom < ZOOM_SHOW_BOUNDARIES && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs text-brand-muted shadow-sm border border-brand-border/50 pointer-events-none">
            Zoom in to explore neighborhoods
          </div>
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

      {/* Marker legend — only at zoom levels where individual markers show */}
      {showLegend && markerTypes.length > 1 && currentZoom >= ZOOM_SHOW_MARKERS && (
        <MapLegend types={markerTypes} />
      )}
    </div>
  )
}

export function InteractiveMap(props: InteractiveMapProps) {
  return <InteractiveMapInner {...props} />
}
