/**
 * @fileoverview Client-side city context provider.
 *
 * Manages the active city for multi-city support. The city determines which
 * map center, geo layers, officials, and UI copy are shown. Resolved from
 * cookie, URL param, or geolocation. Falls back to Houston.
 *
 * Usage: wrap pages in `<CityProvider>` and consume via `useCity()`.
 */

'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import { MAP_CENTERS, getGeoLayers, type GeoLayerConfig } from '@/lib/constants'

// ── Types ──

export interface CityConfig {
  citySlug: string
  cityName: string
  lat: number
  lng: number
  zoom: number
  geoLayers: Record<string, GeoLayerConfig>
}

interface CityContextValue {
  city: CityConfig
  citySlug: string
  cityName: string
  setCity: (slug: string) => void
}

// ── City registry — display names by slug ──

const CITY_NAMES: Record<string, string> = {
  houston: 'Houston',
  'san-francisco': 'San Francisco',
  berkeley: 'Berkeley',
}

// ── Helpers ──

function buildCityConfig(slug: string): CityConfig {
  const center = MAP_CENTERS[slug] ?? MAP_CENTERS.houston
  return {
    citySlug: slug,
    cityName: CITY_NAMES[slug] ?? slug,
    lat: center.lat,
    lng: center.lng,
    zoom: center.zoom,
    geoLayers: getGeoLayers(slug),
  }
}

// ── Context ──

const CityContext = createContext<CityContextValue | null>(null)

// ── Provider ──

interface CityProviderProps {
  children: ReactNode
  initialCity?: string
}

/**
 * Provides city state to child components.
 *
 * @param props.initialCity - City slug resolved server-side (from cookie or param).
 *   Falls back to 'houston' if not provided.
 */
export function CityProvider({ children, initialCity = 'houston' }: CityProviderProps) {
  const [citySlug, setCitySlug] = useState(initialCity)

  const city = useMemo(() => buildCityConfig(citySlug), [citySlug])

  const setCity = useCallback((slug: string) => {
    setCitySlug(slug)
    // Persist to cookie so server components can read it
    if (typeof document !== 'undefined') {
      document.cookie = `ce_city=${slug};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    }
  }, [])

  const value = useMemo<CityContextValue>(() => ({
    city,
    citySlug: city.citySlug,
    cityName: city.cityName,
    setCity,
  }), [city, setCity])

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  )
}

// ── Hook ──

/**
 * Returns the active city context. Must be used within a `<CityProvider>`.
 */
export function useCity(): CityContextValue {
  const ctx = useContext(CityContext)
  if (!ctx) {
    // Graceful fallback for components outside provider (e.g. during SSR)
    return {
      city: buildCityConfig('houston'),
      citySlug: 'houston',
      cityName: 'Houston',
      setCity: () => {},
    }
  }
  return ctx
}
