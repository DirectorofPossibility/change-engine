'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Neighborhood, ElectedOfficial } from '@/lib/types/exchange'

interface NeighborhoodContextValue {
  zip: string | null
  neighborhood: Neighborhood | null
  councilDistrict: string | null
  districtOfficials: ElectedOfficial[]
  lookupZip: (zip: string) => Promise<void>
  clearZip: () => void
  isLoading: boolean
}

const NeighborhoodContext = createContext<NeighborhoodContextValue | null>(null)

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
      var supabase = createClient()

      // Look up neighborhood by ZIP
      var { data: neighborhoods } = await supabase
        .from('neighborhoods')
        .select('*')
        .ilike('zip_codes', '%' + inputZip + '%')

      var match: Neighborhood | null = null
      if (neighborhoods) {
        match = neighborhoods.find(function (n) {
          if (!n.zip_codes) return false
          var zips = n.zip_codes.split(',').map(function (z) { return z.trim() })
          return zips.indexOf(inputZip) !== -1
        }) ?? null
      }

      setNeighborhood(match)
      var district = match?.council_district ?? null
      setCouncilDistrict(district)

      // Look up officials for the council district
      if (district) {
        var { data: officials } = await supabase
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

export function useNeighborhood() {
  var ctx = useContext(NeighborhoodContext)
  if (!ctx) throw new Error('useNeighborhood must be used within NeighborhoodProvider')
  return ctx
}
