'use client'

import { useState, useMemo, useCallback } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import Image from 'next/image'
import {
  MapPin,
  Search,
  Vote,
  ChevronDown,
  ChevronUp,
  Globe,
  Shield,
  Loader2,
  X,
} from 'lucide-react'

// ── Types ──

interface Candidate {
  candidate_id: string
  candidate_name: string
  election_id: string
  office_sought: string | null
  district: string | null
  office_level: string | null
  party: string | null
  incumbent_status: string | null
  photo_url: string | null
  campaign_website: string | null
}

interface MyBallotProps {
  candidates: Candidate[]
  electionName: string
  electionDate: string
}

// ── Helpers ──

const PARTY_COLORS: Record<string, string> = {
  Democratic: '#2563eb',
  Democrat: '#2563eb',
  Republican: '#dc2626',
  Libertarian: '#eab308',
  Green: '#16a34a',
  Independent: '#6b7280',
}

function partyColor(party: string | null): string {
  if (!party) return '#6b7280'
  for (const [key, color] of Object.entries(PARTY_COLORS)) {
    if (party.toLowerCase().includes(key.toLowerCase())) return color
  }
  return '#6b7280'
}

function partyAbbrev(party: string | null): string {
  if (!party) return ''
  if (party.toLowerCase().includes('democrat')) return 'D'
  if (party.toLowerCase().includes('republican')) return 'R'
  if (party.toLowerCase().includes('libertarian')) return 'L'
  if (party.toLowerCase().includes('green')) return 'G'
  if (party.toLowerCase().includes('independent')) return 'I'
  return party.charAt(0).toUpperCase()
}

/** Ordering weight for office levels — federal first, local last */
function levelWeight(level: string | null): number {
  switch (level) {
    case 'Federal': return 0
    case 'State': return 1
    case 'County': return 2
    case 'City': return 3
    default: return 4
  }
}

// ── Component ──

export function MyBallot({ candidates, electionName, electionDate }: MyBallotProps) {
  const { resolvedDistricts, lookupAddress, address, isLoading, clearLocation } = useNeighborhood()
  const [addressInput, setAddressInput] = useState('')
  const [expandedRaces, setExpandedRaces] = useState<Set<string>>(new Set())

  const hasLocation = !!resolvedDistricts || !!address

  // Filter candidates to the user's ballot
  const ballotCandidates = useMemo(function () {
    if (!hasLocation) return []

    return candidates.filter(function (c) {
      const level = c.office_level
      const district = c.district

      // Federal Senate — statewide, always show for Texas
      if (level === 'Federal' && c.office_sought?.toLowerCase().includes('senate')) {
        return true
      }

      // Federal House — match congressional district
      if (level === 'Federal' && c.office_sought?.toLowerCase().includes('house')) {
        if (!resolvedDistricts?.congressionalDistrict) return false
        // candidate.district is like "TX-18", congressionalDistrict is like "18"
        if (!district) return false
        const cdNum = resolvedDistricts.congressionalDistrict.replace(/\D/g, '')
        const candNum = district.replace(/\D/g, '')
        return cdNum === candNum
      }

      // State Senate
      if (level === 'State' && c.office_sought?.toLowerCase().includes('senate')) {
        if (!resolvedDistricts?.stateSenateDistrict) return false
        if (!district) return false
        const sdNum = resolvedDistricts.stateSenateDistrict.replace(/\D/g, '')
        const candNum = district.replace(/\D/g, '')
        return sdNum === candNum
      }

      // State House / State Rep
      if (level === 'State' && (
        c.office_sought?.toLowerCase().includes('house') ||
        c.office_sought?.toLowerCase().includes('representative')
      )) {
        if (!resolvedDistricts?.stateHouseDistrict) return false
        if (!district) return false
        const hdNum = resolvedDistricts.stateHouseDistrict.replace(/\D/g, '')
        const candNum = district.replace(/\D/g, '')
        return hdNum === candNum
      }

      // Other state-level (e.g. Governor, AG) — statewide, show all
      if (level === 'State') {
        return true
      }

      // County / City — show all (within Harris County / Houston scope)
      if (level === 'County' || level === 'City') {
        return true
      }

      // Fallback: include anything unclassified
      return true
    })
  }, [candidates, hasLocation, resolvedDistricts])

  // Group by office_sought, sorted by level weight
  const raceGroups = useMemo(function () {
    const groups: Record<string, { candidates: Candidate[]; level: string | null }> = {}
    ballotCandidates.forEach(function (c) {
      const key = c.office_sought || 'Other'
      if (!groups[key]) {
        groups[key] = { candidates: [], level: c.office_level }
      }
      groups[key].candidates.push(c)
    })

    // Sort: by level weight, then alphabetically within same level
    return Object.entries(groups).sort(function ([aKey, aVal], [bKey, bVal]) {
      const wDiff = levelWeight(aVal.level) - levelWeight(bVal.level)
      if (wDiff !== 0) return wDiff
      return aKey.localeCompare(bKey)
    })
  }, [ballotCandidates])

  const raceCount = raceGroups.length

  const handleSubmit = useCallback(function (e: React.FormEvent) {
    e.preventDefault()
    if (addressInput.trim().length >= 5) {
      lookupAddress(addressInput.trim())
    }
  }, [addressInput, lookupAddress])

  const handleClear = useCallback(function () {
    setAddressInput('')
    clearLocation()
  }, [clearLocation])

  function toggleRace(office: string) {
    setExpandedRaces(function (prev) {
      const next = new Set(prev)
      if (next.has(office)) {
        next.delete(office)
      } else {
        next.add(office)
      }
      return next
    })
  }

  const formattedDate = electionDate
    ? new Date(electionDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-accent/10 to-brand-accent/5 px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2 mb-1">
          <Vote size={18} className="text-brand-accent" />
          <h3 className="font-serif font-bold text-brand-text text-lg">Your Ballot</h3>
        </div>
        <p className="text-sm text-brand-muted">
          {electionName} {formattedDate ? ' \u2014 ' + formattedDate : ''}
        </p>
      </div>

      <div className="p-5">
        {/* Address input */}
        <form onSubmit={handleSubmit} className="mb-5">
          <label className="block text-sm font-medium text-brand-text mb-1.5">
            Find what&apos;s on your ballot
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
              />
              <input
                type="text"
                value={addressInput}
                onChange={function (e) { setAddressInput(e.target.value) }}
                placeholder="Enter your address or ZIP code"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addressInput.trim().length < 5 || isLoading}
              className="px-4 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              Look up
            </button>
          </div>
        </form>

        {/* Active location indicator */}
        {hasLocation && address && (
          <div className="flex items-center justify-between bg-brand-accent/5 rounded-lg px-3 py-2 mb-4">
            <p className="text-sm text-brand-text">
              <MapPin size={13} className="inline -mt-0.5 mr-1 text-brand-accent" />
              Showing ballot for <strong>{address}</strong>
            </p>
            <button
              onClick={handleClear}
              className="text-brand-muted hover:text-brand-accent transition-colors"
              aria-label="Clear address"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Empty state */}
        {!hasLocation && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center mx-auto mb-3">
              <MapPin size={20} className="text-brand-accent" />
            </div>
            <p className="text-brand-muted text-sm">
              Enter your address to see what&apos;s on your ballot
            </p>
            <p className="text-brand-muted text-xs mt-1">
              We&apos;ll match you to the exact races in your district
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-6">
            <Loader2 size={24} className="animate-spin text-brand-accent mx-auto mb-2" />
            <p className="text-sm text-brand-muted">Looking up your districts...</p>
          </div>
        )}

        {/* Ballot results */}
        {hasLocation && !isLoading && (
          <div>
            {raceCount > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-brand-text">
                    {raceCount} {raceCount === 1 ? 'race' : 'races'} on your ballot
                  </p>
                  {resolvedDistricts?.congressionalDistrict && (
                    <span className="text-xs text-brand-muted">
                      CD-{resolvedDistricts.congressionalDistrict}
                      {resolvedDistricts.stateHouseDistrict && ' / HD-' + resolvedDistricts.stateHouseDistrict}
                      {resolvedDistricts.stateSenateDistrict && ' / SD-' + resolvedDistricts.stateSenateDistrict}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {raceGroups.map(function ([office, { candidates: raceCands, level }]) {
                    const isExpanded = expandedRaces.has(office)
                    const showToggle = raceCands.length > 3

                    return (
                      <div
                        key={office}
                        className="border border-brand-border rounded-lg overflow-hidden"
                      >
                        {/* Race header */}
                        <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-sm text-brand-text">{office}</h4>
                            {level && (
                              <span className="text-xs text-brand-muted">{level}</span>
                            )}
                          </div>
                          <span className="text-xs text-brand-muted">
                            {raceCands.length} {raceCands.length === 1 ? 'candidate' : 'candidates'}
                          </span>
                        </div>

                        {/* Candidates list */}
                        <div className="divide-y divide-brand-border">
                          {(showToggle && !isExpanded ? raceCands.slice(0, 3) : raceCands).map(
                            function (c) {
                              return (
                                <div
                                  key={c.candidate_id}
                                  className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
                                >
                                  {/* Photo or party dot */}
                                  {c.photo_url ? (
                                    <Image
                                      src={c.photo_url}
                                      alt={c.candidate_name}
                                      width={36}
                                      height={36}
                                      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-brand-border"
                                    />
                                  ) : (
                                    <div
                                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
                                      style={{ backgroundColor: partyColor(c.party) }}
                                    >
                                      {partyAbbrev(c.party) || c.candidate_name.charAt(0)}
                                    </div>
                                  )}

                                  {/* Name + meta */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-brand-text truncate">
                                        {c.candidate_name}
                                      </span>
                                      {c.incumbent_status === 'Yes' && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide font-semibold text-brand-accent bg-brand-accent/10 px-1.5 py-0.5 rounded">
                                          <Shield size={9} />
                                          Incumbent
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      {c.party && (
                                        <span className="flex items-center gap-1 text-xs text-brand-muted">
                                          <span
                                            className="w-2 h-2 rounded-full inline-block"
                                            style={{ backgroundColor: partyColor(c.party) }}
                                          />
                                          {c.party}
                                        </span>
                                      )}
                                      {c.district && (
                                        <span className="text-xs text-brand-muted">
                                          {c.party ? ' \u00b7 ' : ''}
                                          {c.district}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Campaign website link */}
                                  {c.campaign_website && (
                                    <a
                                      href={c.campaign_website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 text-brand-muted hover:text-brand-accent transition-colors"
                                      aria-label={'Visit ' + c.candidate_name + ' campaign website'}
                                    >
                                      <Globe size={14} />
                                    </a>
                                  )}
                                </div>
                              )
                            }
                          )}
                        </div>

                        {/* Show more / less toggle */}
                        {showToggle && (
                          <button
                            onClick={function () { toggleRace(office) }}
                            className="w-full px-4 py-2 text-xs text-brand-accent hover:bg-brand-accent/5 transition-colors flex items-center justify-center gap-1 border-t border-brand-border"
                          >
                            {isExpanded ? (
                              <>Show fewer <ChevronUp size={12} /></>
                            ) : (
                              <>Show all {raceCands.length} candidates <ChevronDown size={12} /></>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-brand-muted text-sm">
                  No races matched your location for this election.
                </p>
                <p className="text-brand-muted text-xs mt-1">
                  This can happen if candidate data is still being updated.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
