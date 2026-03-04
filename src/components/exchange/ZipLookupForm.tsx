'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Vote, Landmark, Star, Home, Building2, Phone, Globe, Shield, Flame, Heart, Trees, BookOpen, Zap, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { VotingLocationsMap } from './VotingLocationsMap'
import { useTranslation } from '@/lib/i18n'

interface Official {
  official_id: string
  official_name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  office_phone: string | null
  website: string | null
  district_id: string | null
}

interface Neighborhood {
  neighborhood_name: string
  city: string | null
  population: number | null
  median_income: number | null
}

interface VotingLocation {
  location_id: string
  location_name: string
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  hours_early_voting: string | null
  hours_election_day: string | null
  is_accessible: string | null
}

interface MunicipalService {
  id: string
  service_type: string
  service_name: string
  phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  website: string | null
  hours: string | null
  coverage_area: string | null
  is_emergency: boolean
  display_order: number
}

interface MunicipalServicesByType {
  emergency: MunicipalService[]
  police: MunicipalService[]
  fire: MunicipalService[]
  medical: MunicipalService[]
  parks: MunicipalService[]
  library: MunicipalService[]
  utilities: MunicipalService[]
}

interface LookupResults {
  federal: Official[]
  state: Official[]
  county: Official[]
  city: Official[]
  neighborhood: Neighborhood | null
  votingLocations: VotingLocation[]
  services: MunicipalServicesByType | null
}

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

function extractZip(input: string): string | null {
  const trimmed = input.trim()
  // Pure 5-digit ZIP
  if (/^\d{5}$/.test(trimmed)) return trimmed
  // Extract ZIP from an address string
  const match = trimmed.match(/\b(\d{5})\b/)
  return match ? match[1] : null
}

const SERVICE_SECTIONS: Array<{ key: keyof MunicipalServicesByType; i18nKey: string; Icon: typeof Shield; color: string }> = [
  { key: 'emergency', i18nKey: 'lookup.emergency', Icon: AlertTriangle, color: 'text-red-600' },
  { key: 'police', i18nKey: 'lookup.police', Icon: Shield, color: 'text-blue-600' },
  { key: 'fire', i18nKey: 'lookup.fire', Icon: Flame, color: 'text-orange-600' },
  { key: 'medical', i18nKey: 'lookup.medical', Icon: Heart, color: 'text-rose-600' },
  { key: 'parks', i18nKey: 'lookup.parks', Icon: Trees, color: 'text-green-600' },
  { key: 'library', i18nKey: 'lookup.library', Icon: BookOpen, color: 'text-indigo-600' },
  { key: 'utilities', i18nKey: 'lookup.utilities', Icon: Zap, color: 'text-amber-600' },
]

export function ZipLookupForm() {
  const [input, setInput] = useState('')
  const [resolvedZip, setResolvedZip] = useState('')
  const [results, setResults] = useState<LookupResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const zip = extractZip(input)
    if (!zip) { setError('Please enter a valid address with ZIP code or a 5-digit ZIP code'); return }
    setError('')
    setLoading(true)
    setResults(null)
    setResolvedZip(zip)

    try {
      const supabase = createClient()

      // Step 1: Get district info
      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('*')
        .eq('zip_code', parseInt(zip))
        .single()

      if (!zipData) { setError('ZIP code not found in our database'); setLoading(false); return }

      // Step 2: Find matching officials
      const districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        'TX',
      ].filter(Boolean)

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      filterParts += ',level.eq.City'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: officials } = await supabase
        .from('elected_officials')
        .select('*')
        .or(filterParts)

      // Step 3: Municipal services
      const svcFilters: string[] = ['coverage_area.eq.citywide']
      if (zipData.county_id) svcFilters.push('county_id.eq.' + zipData.county_id)
      if (zipData.city) svcFilters.push('city.eq.' + zipData.city)

      const { data: svcData } = await supabase
        .from('municipal_services')
        .select('*')
        .or(svcFilters.join(','))
        .order('display_order')

      const svcAll = (svcData || []) as MunicipalService[]
      const servicesByType: MunicipalServicesByType = {
        emergency: svcAll.filter(s => s.service_type === 'emergency'),
        police: svcAll.filter(s => s.service_type === 'police'),
        fire: svcAll.filter(s => s.service_type === 'fire'),
        medical: svcAll.filter(s => s.service_type === 'medical'),
        parks: svcAll.filter(s => s.service_type === 'parks'),
        library: svcAll.filter(s => s.service_type === 'library'),
        utilities: svcAll.filter(s => s.service_type === 'utilities'),
      }

      const all = officials || []
      const grouped: LookupResults = {
        federal: all.filter(function (o) { return o.level === 'Federal' }),
        state: all.filter(function (o) { return o.level === 'State' }),
        county: all.filter(function (o) { return o.level === 'County' }),
        city: all.filter(function (o) { return o.level === 'City' }),
        neighborhood: null,
        votingLocations: [],
        services: servicesByType,
      }

      // Step 4: Neighborhood lookup
      if (zipData.neighborhood_id != null) {
        const { data: hood } = await supabase
          .from('neighborhoods')
          .select('*')
          .eq('neighborhood_id', zipData.neighborhood_id.toString())
          .single()
        if (hood) grouped.neighborhood = hood
      }

      // Step 5: Voting locations
      const { data: locations } = await supabase
        .from('voting_locations')
        .select('*')
        .eq('zip_code', parseInt(zip))
        .eq('is_active', 'Yes')
      grouped.votingLocations = locations || []

      setResults(grouped)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasOfficials = results && (results.federal.length > 0 || results.state.length > 0 || results.county.length > 0 || results.city.length > 0)
  const hasServices = results?.services && SERVICE_SECTIONS.some(s => (results.services as MunicipalServicesByType)[s.key].length > 0)

  return (
    <div>
      <form onSubmit={handleLookup} className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={input}
            onChange={function (e) { setInput(e.target.value) }}
            placeholder={t('lookup.address_or_zip')}
            className="w-full pl-9 pr-4 py-3 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
          />
        </div>
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="px-6 py-3 bg-brand-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'Find'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {results && resolvedZip && (
        <p className="text-sm text-brand-muted mb-6">{t('lookup.showing_results')} <span className="font-semibold text-brand-text">{resolvedZip}</span></p>
      )}

      {results && (
        <div className="space-y-10">
          {/* Neighborhood info */}
          {results.neighborhood && (
            <div className="bg-brand-accent/5 rounded-xl p-4 border border-brand-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-brand-accent" />
                <span className="font-semibold text-brand-text">{results.neighborhood.neighborhood_name}</span>
                {results.neighborhood.city && <span className="text-sm text-brand-muted">{results.neighborhood.city}</span>}
              </div>
              <div className="flex gap-4 text-sm text-brand-muted">
                {results.neighborhood.population != null && <span>Population: {results.neighborhood.population.toLocaleString()}</span>}
                {results.neighborhood.median_income != null && <span>Median Income: ${results.neighborhood.median_income.toLocaleString()}</span>}
              </div>
            </div>
          )}

          {/* ── Your Representatives ── */}
          {hasOfficials && (
            <div>
              <h2 className="text-xl font-serif font-bold text-brand-text mb-4 flex items-center gap-2 border-b border-brand-border pb-2">
                <Landmark size={22} className="text-brand-accent" /> {t('lookup.your_representatives')}
              </h2>
              <div className="space-y-6">
                {renderGroup('Federal Representatives', results.federal)}
                {renderGroup('State Representatives', results.state)}
                {renderGroup('County Officials', results.county)}
                {renderGroup('City Officials', results.city)}
              </div>
            </div>
          )}

          {/* ── Essential Services ── */}
          {hasServices && results.services && (
            <div>
              <h2 className="text-xl font-serif font-bold text-brand-text mb-4 flex items-center gap-2 border-b border-brand-border pb-2">
                <Phone size={22} className="text-brand-accent" /> {t('lookup.essential_services')}
              </h2>
              <div className="space-y-4">
                {SERVICE_SECTIONS.map(function (section) {
                  const items = (results.services as MunicipalServicesByType)[section.key]
                  if (items.length === 0) return null
                  return (
                    <div key={section.key}>
                      <h3 className="text-base font-semibold text-brand-text mb-2 flex items-center gap-2">
                        <section.Icon size={18} className={section.color} /> {t(section.i18nKey)}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map(function (svc) {
                          return (
                            <div key={svc.id} className={'bg-white rounded-xl border p-4 ' + (svc.is_emergency ? 'border-red-300 bg-red-50/30' : 'border-brand-border')}>
                              <h4 className="font-semibold text-brand-text text-sm mb-1">{svc.service_name}</h4>
                              {svc.address && (
                                <p className="text-xs text-brand-muted flex items-center gap-1 mb-1">
                                  <MapPin size={12} /> {svc.address}{svc.city ? ', ' + svc.city : ''}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs mt-2">
                                {svc.phone && (
                                  <a href={'tel:' + svc.phone.replace(/[^\d+]/g, '')} className="text-brand-accent hover:underline flex items-center gap-1">
                                    <Phone size={12} /> {svc.phone}
                                  </a>
                                )}
                                {svc.website && (
                                  <a href={svc.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline flex items-center gap-1">
                                    <Globe size={12} /> Website
                                  </a>
                                )}
                              </div>
                              {svc.hours && <p className="text-xs text-brand-muted mt-1">{svc.hours}</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Voting locations */}
          {results.votingLocations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-brand-text mb-3 flex items-center gap-2">
                <Vote size={20} /> Voting Locations
              </h3>
              <VotingLocationsMap locations={results.votingLocations} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.votingLocations.map(function (loc) {
                  return (
                    <div key={loc.location_id} className="bg-white rounded-xl border border-brand-border p-4">
                      <h4 className="font-semibold text-brand-text text-sm mb-1">{loc.location_name}</h4>
                      {loc.address && <p className="text-xs text-brand-muted flex items-center gap-1"><MapPin size={12} /> {loc.address}{loc.city ? ', ' + loc.city : ''}</p>}
                      {loc.hours_early_voting && <p className="text-xs text-brand-muted mt-1">Early voting: {loc.hours_early_voting}</p>}
                      {loc.hours_election_day && <p className="text-xs text-brand-muted">Election day: {loc.hours_election_day}</p>}
                      {loc.is_accessible === 'Yes' && <span className="text-xs text-brand-muted">Accessible</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!hasOfficials && (
            <p className="text-brand-muted text-sm">No officials found for this ZIP code.</p>
          )}
        </div>
      )}
    </div>
  )
}

function renderGroup(title: string, officials: Official[]) {
  if (officials.length === 0) return null
  const LevelIcon = title.indexOf('Federal') !== -1 ? Landmark : title.indexOf('State') !== -1 ? Star : title.indexOf('County') !== -1 ? Home : Building2
  return (
    <div>
      <h3 className="text-base font-semibold text-brand-text mb-3 flex items-center gap-2">
        <LevelIcon size={18} /> {title} <span className="text-xs text-brand-muted font-normal">({officials.length})</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officials.map(function (o) {
          return (
            <div key={o.official_id} className="bg-white rounded-xl border border-brand-border p-4">
              <div className="mb-2">
                <Link href={'/officials/' + o.official_id} className="font-semibold text-brand-text hover:text-brand-accent">{o.official_name}</Link>
                {o.title && <p className="text-xs text-brand-muted">{o.title}</p>}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {o.party && <span className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg text-brand-muted">{o.party}</span>}
                {o.level && <span className={'text-xs px-2 py-0.5 rounded-lg ' + levelColor(o.level)}>{o.level}</span>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                {o.email && <a href={'mailto:' + o.email} className="text-brand-accent hover:underline">Email</a>}
                {o.office_phone && <a href={'tel:' + o.office_phone} className="text-brand-accent hover:underline">Call</a>}
                {o.website && <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Website</a>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
