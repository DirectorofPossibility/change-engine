/**
 * @fileoverview Client-side neighborhood detection context provider.
 *
 * Reads the user's ZIP code (from a cookie or explicit input), queries the
 * Supabase `neighborhoods` table to resolve the matching neighborhood, and
 * fetches the associated council-district elected officials. The resolved
 * data is exposed via React context so components like NeighborhoodBanner
 * can display location-aware content.
 */

'use client'

// ── Imports ──

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Neighborhood, ElectedOfficial } from '@/lib/types/exchange'

// ── Types ──

interface NeighborhoodContextValue {
  zip: string | null
  neighborhood: Neighborhood | null
  councilDistrict: string | null
  districtOfficials: ElectedOfficial[]
  lookupZip: (zip: string) => Promise<void>
  clearZip: () => void
  isLoading: boolean
}

// ── Context ──

const NeighborhoodContext = createContext<NeighborhoodContextValue | null>(null)

// ── Provider ──

/**
 * Provides neighborhood and council-district data to child components.
 *
 * When a ZIP code is supplied (either as `initialZip` or via `lookupZip`),
 * the provider queries Supabase for a matching neighborhood and its elected
 * officials. The ZIP is also persisted in a cookie so it survives page
 * reloads. Call `clearZip` to reset all neighborhood state and remove the
 * cookie.
 *
 * @param props.initialZip - Optional ZIP code read from cookies at SSR time.
 * @param props.children   - React children that may consume the context.
 */
export function NeighborhoodProvider({
  initialZip,
  children,
}: {
  initialZip?: string
  children: ReactNode
}) {
  const [zip, setZip] = useState<string | null>(initialZip || null)
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null)
  const [councilDistrict, setCouncilDistrict] = useState<string | null>(null)
  const [districtOfficials, setDistrictOfficials] = useState<ElectedOfficial[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const lookupZip = useCallback(async function (inputZip: string) {
    if (!inputZip || inputZip.length !== 5) return
    setIsLoading(true)
    setZip(inputZip)
    document.cookie = 'zip=' + inputZip + ';path=/;max-age=31536000'

    try {
      const supabase = createClient()

      // Look up neighborhood by ZIP via junction table
      const { data: zipJunctions } = await supabase
        .from('neighborhood_zip_codes')
        .select('neighborhood_id')
        .eq('zip_code', inputZip)
        .limit(1)

      let match: Neighborhood | null = null
      if (zipJunctions && zipJunctions.length > 0) {
        const { data: hood } = await supabase
          .from('neighborhoods')
          .select('*')
          .eq('neighborhood_id', zipJunctions[0].neighborhood_id)
          .single()
        match = hood ?? null
      }

      setNeighborhood(match)
      const district = match?.council_district ?? null
      setCouncilDistrict(district)

      // Look up officials for the council district
      if (district) {
        const { data: officials } = await supabase
          .from('elected_officials')
          .select('*')
          .eq('district_id', district)
        setDistrictOfficials(officials ?? [])
      } else {
        setDistrictOfficials([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearZip = useCallback(function () {
    setZip(null)
    setNeighborhood(null)
    setCouncilDistrict(null)
    setDistrictOfficials([])
    document.cookie = 'zip=;path=/;max-age=0'
  }, [])

  return (
    <NeighborhoodContext.Provider value={{
      zip, neighborhood, councilDistrict, districtOfficials,
      lookupZip, clearZip, isLoading,
    }}>
      {children}
    </NeighborhoodContext.Provider>
  )
}

// ── Hook ──

/**
 * Convenience hook to consume the {@link NeighborhoodContext}.
 *
 * Must be called inside a `<NeighborhoodProvider>` -- throws if the context
 * is missing.
 *
 * @returns The current ZIP, neighborhood, council district, officials, and helpers.
 */
export function useNeighborhood() {
  const ctx = useContext(NeighborhoodContext)
  if (!ctx) throw new Error('useNeighborhood must be used within NeighborhoodProvider')
  return ctx
}
