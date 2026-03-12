'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Landmark, Star, Home, Building2, type LucideIcon } from 'lucide-react'
import { TranslatedTooltip } from '@/components/exchange/TranslatedTooltip'
import { TOOLTIPS } from '@/lib/tooltips'
import { createClient } from '@/lib/supabase/client'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { OfficialsClient } from './OfficialsClient'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import type { ElectedOfficial, GovernmentLevel, TranslationMap } from '@/lib/types/exchange'

interface ZipResults {
  federal: ElectedOfficial[]
  state: ElectedOfficial[]
  county: ElectedOfficial[]
  city: ElectedOfficial[]
}

const LEVEL_CONFIG: { key: keyof ZipResults; label: string; icon: LucideIcon }[] = [
  { key: 'federal', label: 'Federal', icon: Landmark },
  { key: 'state', label: 'State', icon: Star },
  { key: 'county', label: 'County', icon: Home },
  { key: 'city', label: 'City', icon: Building2 },
]

interface Props {
  officials: ElectedOfficial[]
  levels: GovernmentLevel[]
  translations?: TranslationMap
  linkedinProfiles?: Record<string, string>
}

export function OfficialsPageClient({ officials, levels, translations = {}, linkedinProfiles = {} }: Props) {
  const { zip: savedZip } = useNeighborhood()
  const [zip, setZip] = useState('')
  const [zipResults, setZipResults] = useState<ZipResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const autoSearched = useRef(false)

  // Auto-search when user has a saved ZIP from their neighborhood
  useEffect(function () {
    if (savedZip && savedZip.length === 5 && !autoSearched.current && !zipResults) {
      autoSearched.current = true
      setZip(savedZip)
      doZipSearch(savedZip)
    }
  }, [savedZip]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doZipSearch(searchZip: string) {
    if (searchZip.length !== 5) return
    setError('')
    setLoading(true)
    setZipResults(null)

    try {
      const supabase = createClient()

      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('*')
        .eq('zip_code', parseInt(searchZip))
        .single()

      if (!zipData) { setError('ZIP code not found in our database'); setLoading(false); return }

      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
      ].filter(Boolean)

      // Look up city council district from neighborhoods
      const { data: hoodRows } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + searchZip + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDistrict = hoodRows?.[0]?.council_district || null

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      // US Senators: Federal level with null district_id (statewide)
      filterParts += ',and(level.eq.Federal,district_id.is.null)'
      // City: specific district + at-large + mayor
      if (councilDistrict) {
        filterParts += ',district_id.eq.' + councilDistrict
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: matched } = await supabase
        .from('elected_officials')
        .select('*')
        .or(filterParts)
        .order('official_name')

      const all = (matched ?? []) as ElectedOfficial[]

      // Sort city officials: user's council district first, then at-large, then others
      const cityOfficials = all.filter(function (o) { return o.level === 'City' })
      const sortedCity = cityOfficials.sort(function (a, b) {
        const aDistrict = (a as any).district_id
        const bDistrict = (b as any).district_id
        // Mayor (null district) first
        if (aDistrict === null && bDistrict !== null) return -1
        if (aDistrict !== null && bDistrict === null) return 1
        // User's council district next
        if (aDistrict === councilDistrict && bDistrict !== councilDistrict) return -1
        if (aDistrict !== councilDistrict && bDistrict === councilDistrict) return 1
        // At-large next
        const aAtLarge = aDistrict && aDistrict.startsWith('AL')
        const bAtLarge = bDistrict && bDistrict.startsWith('AL')
        if (aAtLarge && !bAtLarge) return -1
        if (!aAtLarge && bAtLarge) return 1
        return (a.official_name || '').localeCompare(b.official_name || '')
      })

      setZipResults({
        federal: all.filter(function (o) { return o.level === 'Federal' }),
        state: all.filter(function (o) { return o.level === 'State' }),
        county: all.filter(function (o) { return o.level === 'County' }),
        city: sortedCity,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleZipSearch(e: React.FormEvent) {
    e.preventDefault()
    if (zip.length !== 5) { setError('Please enter a 5-digit ZIP code'); return }
    doZipSearch(zip)
  }

  function clearZipResults() {
    setZipResults(null)
    setZip('')
    setError('')
  }

  return (
    <div>
      {/* ZIP Search Bar */}
      <div className="bg-white p-6 mb-8" style={{ border: '2px solid #0d1117' }}>
        <h2 className="font-display text-xl font-bold mb-2" style={{ color: '#0d1117' }}>Who Represents You?</h2>
        <p className="font-body text-sm mb-4" style={{ color: '#5c6474' }}>Drop your ZIP code. We\u2019ll show you everyone from City Hall to the Capitol.</p>
        <form onSubmit={handleZipSearch} className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5c6474' }} />
            <input
              type="text"
              value={zip}
              onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
              placeholder="Enter ZIP code"
              className="w-full pl-9 pr-4 py-3 text-sm bg-white focus:outline-none font-mono"
              style={{ border: '2px solid #0d1117' }}
              maxLength={5}
            />
            <TranslatedTooltip tip={TOOLTIPS.zip_lookup} position="bottom" />
          </div>
          <button
            type="submit"
            disabled={loading || zip.length !== 5}
            className="px-6 py-3 text-white text-sm font-mono uppercase tracking-[0.08em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#0d1117' }}
          >
            <Search size={16} />
            {loading ? 'Searching...' : 'Find'}
          </button>
        </form>
        {error && <p className="text-sm mt-3" style={{ color: '#b03a2a' }}>{error}</p>}
      </div>

      {/* ZIP Results — "Your Representatives" */}
      {zipResults && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold" style={{ color: '#0d1117' }}>Your Reps</h2>
            <button onClick={clearZipResults} className="text-sm hover:underline" style={{ color: '#1b5e8a' }}>
              Clear results
            </button>
          </div>

          {LEVEL_CONFIG.map(function ({ key, label, icon: Icon }) {
            const group = zipResults[key]
            if (group.length === 0) return null
            return (
              <div key={key} className="mb-6">
                <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#0d1117' }}>
                  <Icon size={20} /> {label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map(function (o) {
                    const t = translations[o.official_id]
                    return (
                      <OfficialCard
                        key={o.official_id}
                        id={o.official_id}
                        name={o.official_name}
                        title={o.title}
                        party={o.party}
                        level={o.level}
                        email={o.email}
                        phone={o.office_phone}
                        website={o.website}
                        photoUrl={(o as any).photo_url}
                        linkedinUrl={linkedinProfiles[o.official_id]}
                        translatedTitle={t?.title}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}

          {zipResults.federal.length === 0 && zipResults.state.length === 0 &&
            zipResults.county.length === 0 && zipResults.city.length === 0 && (
            <p className="font-body text-sm py-4" style={{ color: '#5c6474' }}>No officials found for this ZIP code.</p>
          )}

          <hr className="my-8" style={{ borderColor: '#dde1e8' }} />
        </div>
      )}

      {/* Full Officials Listing */}
      <h2 className="relative font-display text-2xl font-bold mb-6" style={{ color: '#0d1117' }}>The Full Roster
        <TranslatedTooltip tip={TOOLTIPS.party_label} position="bottom" />
      </h2>
      <OfficialsClient officials={officials} levels={levels} translations={translations} linkedinProfiles={linkedinProfiles} />
    </div>
  )
}
