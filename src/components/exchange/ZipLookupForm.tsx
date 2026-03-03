'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, User, Vote } from 'lucide-react'
import Link from 'next/link'
import { VotingLocationsMap } from './VotingLocationsMap'

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

interface LookupResults {
  federal: Official[]
  state: Official[]
  county: Official[]
  city: Official[]
  neighborhood: Neighborhood | null
  votingLocations: VotingLocation[]
}

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

export function ZipLookupForm() {
  var [zip, setZip] = useState('')
  var [results, setResults] = useState<LookupResults | null>(null)
  var [loading, setLoading] = useState(false)
  var [error, setError] = useState('')

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (zip.length !== 5) { setError('Please enter a 5-digit ZIP code'); return }
    setError('')
    setLoading(true)
    setResults(null)

    try {
      var supabase = createClient()

      // Step 1: Get district info
      var { data: zipData } = await supabase
        .from('zip_codes')
        .select('*')
        .eq('zip_code', parseInt(zip))
        .single()

      if (!zipData) { setError('ZIP code not found in our database'); setLoading(false); return }

      // Step 2: Find matching officials
      var districts = [
        zipData.congressional_district,
        zipData.state_senate_district,
        zipData.state_house_district,
        'TX',
      ].filter(Boolean)

      var filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      filterParts += ',level.eq.City'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      var { data: officials } = await supabase
        .from('elected_officials')
        .select('*')
        .or(filterParts)

      var all = officials || []
      var grouped: LookupResults = {
        federal: all.filter(function (o) { return o.level === 'Federal' }),
        state: all.filter(function (o) { return o.level === 'State' }),
        county: all.filter(function (o) { return o.level === 'County' }),
        city: all.filter(function (o) { return o.level === 'City' }),
        neighborhood: null,
        votingLocations: [],
      }

      // Step 3: Neighborhood lookup
      if (zipData.neighborhood_id != null) {
        var { data: hood } = await supabase
          .from('neighborhoods')
          .select('*')
          .eq('neighborhood_id', zipData.neighborhood_id.toString())
          .single()
        if (hood) grouped.neighborhood = hood
      }

      // Step 4: Voting locations
      var { data: locations } = await supabase
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

  return (
    <div>
      <form onSubmit={handleLookup} className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-xs">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={zip}
            onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
            placeholder="Enter ZIP code"
            className="w-full pl-9 pr-4 py-3 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
            maxLength={5}
          />
        </div>
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="px-6 py-3 bg-brand-accent text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'Find'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {results && (
        <div className="space-y-8">
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

          {/* Officials by level */}
          {renderGroup('Federal Representatives', results.federal)}
          {renderGroup('State Representatives', results.state)}
          {renderGroup('County Officials', results.county)}
          {renderGroup('City Officials', results.city)}

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

          {results.federal.length === 0 && results.state.length === 0 && results.county.length === 0 && results.city.length === 0 && (
            <p className="text-brand-muted text-sm">No officials found for this ZIP code.</p>
          )}
        </div>
      )}
    </div>
  )
}

function renderGroup(title: string, officials: Official[]) {
  if (officials.length === 0) return null
  var emoji = title.indexOf('Federal') !== -1 ? '🏛️' : title.indexOf('State') !== -1 ? '⭐' : title.indexOf('County') !== -1 ? '🏘️' : '🏙️'
  return (
    <div>
      <h3 className="text-lg font-bold text-brand-text mb-3">{emoji} {title}</h3>
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
