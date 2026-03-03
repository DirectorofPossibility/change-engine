/**
 * @fileoverview Barrel export for the maps system.
 *
 * The maps architecture is layered for progressive complexity:
 *
 * - {@link MapProvider} — Passthrough provider (no API key needed with Leaflet).
 * - {@link HoustonMap} — Base Leaflet `<MapContainer>` centered on Houston, TX.
 * - {@link MapMarker} — Individual marker pin with a Popup.
 * - {@link ClusteredMap} — HoustonMap + MapMarker with MarkerClusterGroup grouping.
 * - {@link InteractiveMap} — Full-featured map with GeoJSON boundary layers,
 *   marker clustering, layer toggles, and polygon-click info panels.
 * - {@link SingleLocationMap} — Convenience wrapper for a single location pin.
 * - {@link GeoJsonLayer} — Renders a GeoJSON boundary layer on the map with
 *   hover/click highlighting support.
 * - {@link LayerControl} — Toggle panel for showing/hiding boundary layers.
 * - {@link MapLegend} — Color-coded legend for marker types.
 * - {@link GeoInfoPanel} — Detail panel displayed when a user clicks a polygon feature.
 *
 * The three entry-point components (ClusteredMap, InteractiveMap,
 * SingleLocationMap) are re-exported as `next/dynamic` wrappers with
 * `ssr: false` so consumers get SSR safety automatically.
 */
export { MapProvider } from './MapProvider'
export { HoustonMap } from './HoustonMap'
export { MapMarker, type MarkerData, type MarkerType } from './MapMarker'
export { ClusteredMap, InteractiveMap, SingleLocationMap } from './dynamic'
export { MapLegend } from './MapLegend'
export { GeoJsonLayer } from './GeoJsonLayer'
export { LayerControl, type LayerOption } from './LayerControl'
export { GeoInfoPanel } from './GeoInfoPanel'
