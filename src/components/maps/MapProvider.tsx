/**
 * @fileoverview Map context provider (passthrough for Leaflet).
 *
 * With Leaflet + OpenStreetMap no API key or global provider is needed.
 * This component is kept as a transparent passthrough so that existing
 * consumer code that wraps children in `<MapProvider>` continues to work
 * without modification.
 */
'use client'

interface MapProviderProps {
  children: React.ReactNode
}

/**
 * Passthrough provider retained for API compatibility.
 *
 * @param props.children - React children that render map components.
 */
export function MapProvider({ children }: MapProviderProps) {
  return <>{children}</>
}
