/**
 * @fileoverview Client-side neighborhood detection context provider.
 *
 * Supports two modes:
 *   1. ZIP code — quick lookup via Supabase neighborhood_zip_codes junction
 *   2. Address — geocodes via /api/geocode, resolves exact districts via
 *      point-in-polygon against GeoJSON boundaries
 *
 * Both modes set the ZIP cookie so server-side pages (like /my-area) work.
 * Address mode additionally stores precise district IDs.
 */

'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Neighborhood, ElectedOfficial } from '@/lib/types/exchange'

// ── Types ──

export interface ResolvedDistricts {
  councilDistrict: string | null
  congressionalDistrict: string | null
  stateHouseDistrict: string | null
  stateSenateDistrict: string | null
  superNeighborhood: string | null
  superNeighborhoodName: string | null
}

interface NeighborhoodContextValue {
  zip: string | null
  address: string | null
  neighborhood: Neighborhood | null
  councilDistrict: string | null
  districtOfficials: ElectedOfficial[]
  resolvedDistricts: ResolvedDistricts | null
  lookupZip: (zip: string) => Promise<void>
  lookupAddress: (address: string) => Promise<void>
  clearZip: () => void
  clearLocation: () => void
  isLoading: boolean
  locationMode: 'zip' | 'address' | null
}

// ── Context ──

const NeighborhoodContext = createContext<NeighborhoodContextValue | null>(null)

// ── Provider ──

export function NeighborhoodProvider({
  initialZip,
  children,
}: {
  initialZip?: string
  children: ReactNode
}) {
  const [zip, setZip] = useState<string | null>(initialZip || null)
  const [address, setAddress] = useState<string | null>(null)
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null)
  const [councilDistrict, setCouncilDistrict] = useState<string | null>(null)
  const [districtOfficials, setDistrictOfficials] = useState<ElectedOfficial[]>([])
  const [resolvedDistricts, setResolvedDistricts] = useState<ResolvedDistricts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [locationMode, setLocationMode] = useState<'zip' | 'address' | null>(
    initialZip ? 'zip' : null
  )

  // Restore address from cookie on mount
  useEffect(function () {
    const match = document.cookie.match(/(?:^|; )user_address=([^;]+)/)
    if (match) {
      try {
        const decoded = decodeURIComponent(match[1])
        setAddress(decoded)
        setLocationMode('address')
      } catch {
        // ignore malformed cookie
      }
    }
    const districtMatch = document.cookie.match(/(?:^|; )user_districts=([^;]+)/)
    if (districtMatch) {
      try {
        const parsed = JSON.parse(decodeURIComponent(districtMatch[1]))
        setResolvedDistricts(parsed)
        if (parsed.councilDistrict) {
          setCouncilDistrict(parsed.councilDistrict)
        }
      } catch {
        // ignore
      }
    }
  }, [])

  /** Shared helper: resolve neighborhood + officials from ZIP via Supabase */
  const resolveNeighborhood = useCallback(async function (inputZip: string) {
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
    return match
  }, [])

  /** Resolve officials for a given district */
  const resolveOfficials = useCallback(async function (district: string) {
    const supabase = createClient()
    const { data: officials } = await supabase
      .from('elected_officials')
      .select('*')
      .eq('district_id', district)
    setDistrictOfficials(officials ?? [])
  }, [])

  /** ZIP-based lookup — the quick path */
  const lookupZip = useCallback(async function (inputZip: string) {
    if (!inputZip || inputZip.length !== 5) return
    setIsLoading(true)
    setZip(inputZip)
    setAddress(null)
    setResolvedDistricts(null)
    setLocationMode('zip')
    document.cookie = 'zip=' + inputZip + ';path=/;max-age=31536000'
    document.cookie = 'user_address=;path=/;max-age=0'
    document.cookie = 'user_districts=;path=/;max-age=0'

    try {
      const match = await resolveNeighborhood(inputZip)
      const district = match?.council_district ?? null
      setCouncilDistrict(district)

      if (district) {
        await resolveOfficials(district)
      } else {
        setDistrictOfficials([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [resolveNeighborhood, resolveOfficials])

  /** Address-based lookup — the precise path */
  const lookupAddress = useCallback(async function (inputAddress: string) {
    if (!inputAddress || inputAddress.trim().length < 5) return
    setIsLoading(true)
    setLocationMode('address')

    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: inputAddress.trim() }),
      })

      if (!res.ok) {
        // Fall back to trying as ZIP if it looks like one
        if (/^\d{5}$/.test(inputAddress.trim())) {
          setIsLoading(false)
          return lookupZip(inputAddress.trim())
        }
        setIsLoading(false)
        return
      }

      const data = await res.json()
      const resolvedZip = data.zip
      const districts: ResolvedDistricts = data.districts

      setZip(resolvedZip)
      setAddress(data.formattedAddress || inputAddress.trim())
      setResolvedDistricts(districts)

      // Set cookies
      document.cookie = 'zip=' + resolvedZip + ';path=/;max-age=31536000'
      document.cookie = 'user_address=' + encodeURIComponent(data.formattedAddress || inputAddress.trim()) + ';path=/;max-age=31536000'
      document.cookie = 'user_districts=' + encodeURIComponent(JSON.stringify(districts)) + ';path=/;max-age=31536000'

      // Resolve neighborhood from ZIP
      await resolveNeighborhood(resolvedZip)

      // Use the precise council district from geocoding
      const district = districts.councilDistrict
      setCouncilDistrict(district)

      if (district) {
        await resolveOfficials(district)
      } else {
        setDistrictOfficials([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [lookupZip, resolveNeighborhood, resolveOfficials])

  const clearLocation = useCallback(function () {
    setZip(null)
    setAddress(null)
    setNeighborhood(null)
    setCouncilDistrict(null)
    setDistrictOfficials([])
    setResolvedDistricts(null)
    setLocationMode(null)
    document.cookie = 'zip=;path=/;max-age=0'
    document.cookie = 'user_address=;path=/;max-age=0'
    document.cookie = 'user_districts=;path=/;max-age=0'
  }, [])

  // Auto-resolve on mount when initialZip is available
  useEffect(function () {
    if (initialZip && initialZip.length === 5 && !neighborhood) {
      // Check if we have address data in cookies — if so, don't override with ZIP-only
      const hasAddress = document.cookie.includes('user_address=')
      if (!hasAddress) {
        lookupZip(initialZip)
      } else {
        // Still resolve neighborhood from ZIP for display
        resolveNeighborhood(initialZip).then(function (match) {
          const district = match?.council_district ?? null
          // Only set if not overridden by address districts
          if (!resolvedDistricts?.councilDistrict) {
            setCouncilDistrict(district)
            if (district) resolveOfficials(district)
          }
        })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NeighborhoodContext.Provider value={{
      zip, address, neighborhood, councilDistrict, districtOfficials,
      resolvedDistricts, lookupZip, lookupAddress,
      clearZip: clearLocation, clearLocation,
      isLoading, locationMode,
    }}>
      {children}
    </NeighborhoodContext.Provider>
  )
}

// ── Hook ──

export function useNeighborhood() {
  const ctx = useContext(NeighborhoodContext)
  if (!ctx) throw new Error('useNeighborhood must be used within NeighborhoodProvider')
  return ctx
}
