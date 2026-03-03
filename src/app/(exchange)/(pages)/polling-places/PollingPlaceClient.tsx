'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, ExternalLink } from 'lucide-react'
import { VotingLocationCard } from '@/components/exchange/VotingLocationCard'

interface ActiveElection {
  election_id: string
  election_name: string
  [key: string]: unknown
}

interface VotingLocation {
  location_id: string
  location_name: string
  address: string | null
  city: string | null
  location_type: string | null
  hours_early_voting: string | null
  hours_election_day: string | null
  is_accessible: string | null
  has_parking: string | null
  transit_accessible: string | null
  has_curbside: string | null
  latitude: number | null
  longitude: number | null
}

interface DistrictInfo {
  congressional_district: string | null
  state_senate_district: string | null
  state_house_district: string | null
  city: string | null
}

interface Results {
  votingLocations: VotingLocation[]
  districtInfo: DistrictInfo | null
}

interface PollingPlaceClientProps {
  activeElection: ActiveElection | null
}

export function PollingPlaceClient({ activeElection }: PollingPlaceClientProps) {
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'Early Voting' | 'Election Day'>('all')
  const [accessibilityFilter, setAccessibilityFilter] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (zip.length !== 5) { setError('Please enter a 5-digit ZIP code'); return }
    setError('')
    setLoading(true)
    setResults(null)

    try {
      const supabase = createClient()

      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('congressional_district, state_senate_district, state_house_district, city')
        .eq('zip_code', parseInt(zip))
        .single()

      if (!zipData) { setError('ZIP code not found in our database'); setLoading(false); return }

      let query = supabase
        .from('voting_locations')
        .select('*')
        .eq('zip_code', parseInt(zip))
        .eq('is_active', 'Yes')

      if (activeElection) {
        query = query.eq('election_id', activeElection.election_id)
      }

      const { data: locations } = await query

      setResults({
        votingLocations: locations || [],
        districtInfo: zipData,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = results ? results.votingLocations.filter(function (loc) {
    if (locationTypeFilter !== 'all' && loc.location_type !== locationTypeFilter) return false
    if (accessibilityFilter && loc.is_accessible !== 'Yes') return false
    return true
  }) : []

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
          {loading ? 'Searching...' : 'Find Polling Places'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {results && (
        <div className="space-y-6">
          {/* District info */}
          {results.districtInfo && (
            <div className="bg-brand-accent/5 rounded-xl p-4 border border-brand-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-brand-accent" />
                <span className="font-semibold text-brand-text">Your Districts</span>
                {results.districtInfo.city && <span className="text-sm text-brand-muted">{results.districtInfo.city}</span>}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-brand-muted">
                {results.districtInfo.congressional_district && <span>Congressional: {results.districtInfo.congressional_district}</span>}
                {results.districtInfo.state_senate_district && <span>State Senate: {results.districtInfo.state_senate_district}</span>}
                {results.districtInfo.state_house_district && <span>State House: {results.districtInfo.state_house_district}</span>}
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'Early Voting', 'Election Day'] as const).map(function (filter) {
              const isActive = locationTypeFilter === filter
              return (
                <button
                  key={filter}
                  onClick={function () { setLocationTypeFilter(filter) }}
                  className={'px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' + (isActive ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-muted hover:bg-brand-border')}
                >
                  {filter === 'all' ? 'All' : filter}
                </button>
              )
            })}
            <button
              onClick={function () { setAccessibilityFilter(!accessibilityFilter) }}
              className={'px-4 py-1.5 rounded-full text-sm font-medium transition-colors ' + (accessibilityFilter ? 'bg-brand-accent text-white' : 'bg-brand-bg text-brand-muted hover:bg-brand-border')}
            >
              Accessible Only
            </button>
          </div>

          {/* Results count */}
          <p className="text-sm text-brand-muted">{filtered.length} polling place{filtered.length !== 1 ? 's' : ''} found</p>

          {/* Results grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(function (loc) {
                return (
                  <div key={loc.location_id}>
                    <VotingLocationCard
                      name={loc.location_name}
                      address={loc.address}
                      city={loc.city}
                      locationType={loc.location_type}
                      hoursEarlyVoting={loc.hours_early_voting}
                      hoursElectionDay={loc.hours_election_day}
                      isAccessible={loc.is_accessible}
                      hasParking={loc.has_parking}
                      transitAccessible={loc.transit_accessible}
                      hasCurbside={loc.has_curbside}
                    />
                    {loc.latitude != null && loc.longitude != null && (
                      <a
                        href={'https://www.google.com/maps/search/?api=1&query=' + loc.latitude + ',' + loc.longitude}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-accent hover:underline mt-2 ml-1"
                      >
                        <ExternalLink size={12} /> View on Google Maps
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-brand-muted mb-2">No polling places found for the selected filters.</p>
              <a
                href="https://www.votetexas.gov/voting/where.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline text-sm"
              >
                Check votetexas.gov for more information
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
