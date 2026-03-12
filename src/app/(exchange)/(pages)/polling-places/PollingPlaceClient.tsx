'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, ExternalLink } from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { VotingLocationCard } from '@/components/exchange/VotingLocationCard'
import { useTranslation } from '@/lib/use-translation'

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
  const { zip: savedZip } = useNeighborhood()
  const { t } = useTranslation()
  const [zip, setZip] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [locationTypeFilter, setLocationTypeFilter] = useState<'all' | 'Early Voting' | 'Election Day'>('all')
  const [accessibilityFilter, setAccessibilityFilter] = useState(false)
  const autoSearched = useRef(false)

  useEffect(function () {
    if (savedZip && savedZip.length === 5 && !autoSearched.current && !results) {
      autoSearched.current = true
      setZip(savedZip)
      doLookup(savedZip)
    }
  }, [savedZip]) // eslint-disable-line react-hooks/exhaustive-deps

  async function doLookup(searchZip: string) {
    if (searchZip.length !== 5) return
    setError('')
    setLoading(true)
    setResults(null)

    try {
      const supabase = createClient()

      const { data: zipData } = await supabase
        .from('zip_codes')
        .select('congressional_district, state_senate_district, state_house_district, city')
        .eq('zip_code', parseInt(searchZip))
        .single()

      if (!zipData) { setError('ZIP code not found in our database'); setLoading(false); return }

      let query = supabase
        .from('voting_locations')
        .select('*')
        .eq('zip_code', parseInt(searchZip))
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

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (zip.length !== 5) { setError('Please enter a 5-digit ZIP code'); return }
    doLookup(zip)
  }

  const filtered = results ? results.votingLocations.filter(function (loc) {
    if (locationTypeFilter !== 'all' && loc.location_type !== locationTypeFilter) return false
    if (accessibilityFilter && loc.is_accessible !== 'Yes') return false
    return true
  }) : []

  return (
    <div>
      {/* Search form */}
      <form onSubmit={handleLookup} className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-xs">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={zip}
            onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
            placeholder={t('polling.zip_placeholder') || 'Enter ZIP code'}
            className="w-full pl-9 pr-4 py-3 border-2 border-ink font-mono text-[.82rem] bg-white focus:outline-none focus:border-blue transition-colors"
            maxLength={5}
          />
        </div>
        <button
          type="submit"
          disabled={loading || zip.length !== 5}
          className="px-6 py-3 bg-ink text-white font-mono text-[.68rem] uppercase tracking-[0.08em] hover:bg-blue transition-colors disabled:opacity-50"
        >
          {loading ? t('ui.searching') || 'Searching...' : t('polling.find_button') || 'Find My Polling Place'}
        </button>
      </form>

      {error && <p className="text-civic font-body text-[.85rem] mb-4">{error}</p>}

      {results && (
        <div className="space-y-6">
          {/* District info */}
          {results.districtInfo && (
            <div className="border-2 border-ink bg-paper px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-blue" />
                <span className="font-mono text-[.68rem] uppercase tracking-[0.08em] text-ink font-semibold">
                  {t('polling.your_districts') || 'Your Districts'}
                </span>
                {results.districtInfo.city && (
                  <span className="font-body text-[.82rem] text-dim">{results.districtInfo.city}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 font-mono text-[.68rem] text-dim">
                {results.districtInfo.congressional_district && (
                  <span>Congressional: <strong className="text-ink">{results.districtInfo.congressional_district}</strong></span>
                )}
                {results.districtInfo.state_senate_district && (
                  <span>State Senate: <strong className="text-ink">{results.districtInfo.state_senate_district}</strong></span>
                )}
                {results.districtInfo.state_house_district && (
                  <span>State House: <strong className="text-ink">{results.districtInfo.state_house_district}</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2 border-b border-rule pb-4">
            {(['all', 'Early Voting', 'Election Day'] as const).map(function (filter) {
              const isActive = locationTypeFilter === filter
              return (
                <button
                  key={filter}
                  onClick={function () { setLocationTypeFilter(filter) }}
                  className={'px-4 py-1.5 font-mono text-[.62rem] uppercase tracking-[0.08em] border transition-colors '
                    + (isActive
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-dim border-rule hover:border-ink hover:text-ink'
                    )}
                >
                  {filter === 'all' ? (t('ui.all') || 'All') : filter}
                </button>
              )
            })}
            <button
              onClick={function () { setAccessibilityFilter(!accessibilityFilter) }}
              className={'px-4 py-1.5 font-mono text-[.62rem] uppercase tracking-[0.08em] border transition-colors '
                + (accessibilityFilter
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-dim border-rule hover:border-ink hover:text-ink'
                )}
            >
              {t('polling.accessible_only') || 'Accessible Only'}
            </button>
          </div>

          {/* Results count */}
          <p className="font-mono text-[.62rem] uppercase tracking-[0.08em] text-faint">
            {filtered.length} {t('polling.places_found') || 'polling place'}{filtered.length !== 1 ? 's' : ''} {t('ui.found') || 'found'}
          </p>

          {/* Results grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(function (loc) {
                return (
                  <div key={loc.location_id} className="border-2 border-rule hover:border-ink transition-colors">
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
                        className="flex items-center gap-1 font-mono text-[.62rem] uppercase tracking-[0.06em] text-blue hover:text-ink transition-colors px-4 pb-3"
                      >
                        <ExternalLink size={12} /> View on Map
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-rule">
              <p className="font-body text-[.9rem] text-dim mb-3">No polling places found for the selected filters.</p>
              <a
                href="https://www.votetexas.gov/voting/where.html"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[.68rem] uppercase tracking-[0.06em] text-blue hover:text-ink transition-colors"
              >
                Check votetexas.gov &rarr;
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
