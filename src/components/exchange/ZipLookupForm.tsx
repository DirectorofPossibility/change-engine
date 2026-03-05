'use client'

import { useState } from 'react'
import { MapPin, Vote, Landmark, Star, Home, Building2, Phone, Globe, Shield, Flame, Heart, Trees, BookOpen, Zap, AlertTriangle, Scale } from 'lucide-react'
import Link from 'next/link'
import { VotingLocationsMap } from './VotingLocationsMap'
import { useTranslation } from '@/lib/use-translation'
import { lookupCivicProfile, type CivicProfileResult } from '@/app/(exchange)/(pages)/officials/lookup/actions'

function levelColor(level: string | null): string {
  if (level === 'Federal') return 'bg-blue-100 text-blue-700'
  if (level === 'State') return 'bg-green-100 text-green-700'
  if (level === 'County') return 'bg-orange-100 text-orange-700'
  if (level === 'City') return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
}

type ServicesByType = NonNullable<CivicProfileResult['services']>

const SERVICE_SECTIONS: Array<{ key: keyof ServicesByType; i18nKey: string; Icon: typeof Shield; color: string }> = [
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
  const [results, setResults] = useState<CivicProfileResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { t } = useTranslation()

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (input.trim().length === 0) return
    setError('')
    setLoading(true)
    setResults(null)

    try {
      const res = await lookupCivicProfile(input)
      if (res.error === 'no_zip') {
        setError('Please enter a valid address with ZIP code or a 5-digit ZIP code')
      } else if (res.error === 'zip_not_found') {
        setError('ZIP code not found in our database')
      } else if (res.error) {
        setError('Something went wrong. Please try again.')
      } else if (res.data) {
        setResults(res.data)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasOfficials = results && (results.federal.length > 0 || results.state.length > 0 || results.county.length > 0 || results.city.length > 0)
  const hasServices = results?.services && SERVICE_SECTIONS.some(s => (results.services as ServicesByType)[s.key].length > 0)

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

      {results && (
        <p className="text-sm text-brand-muted mb-6">{t('lookup.showing_results')} <span className="font-semibold text-brand-text">{results.zip}</span></p>
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
                  const items = (results.services as ServicesByType)[section.key]
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

          {/* ── Policies Affecting Your Area ── */}
          {results.policies && (results.policies.federal.length > 0 || results.policies.state.length > 0 || results.policies.city.length > 0) && (
            <div>
              <h2 className="text-xl font-serif font-bold text-brand-text mb-4 flex items-center gap-2 border-b border-brand-border pb-2">
                <Scale size={22} className="text-brand-accent" /> Policies Affecting Your Area
              </h2>
              <div className="space-y-4">
                {renderPolicyGroup('Federal Policies', results.policies.federal)}
                {renderPolicyGroup('State Policies', results.policies.state)}
                {renderPolicyGroup('City Policies', results.policies.city)}
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

function renderPolicyGroup(title: string, policies: NonNullable<CivicProfileResult['policies']>['federal']) {
  if (policies.length === 0) return null
  return (
    <div>
      <h3 className="text-base font-semibold text-brand-text mb-2 flex items-center gap-2">
        <Scale size={16} className="text-brand-muted" /> {title} <span className="text-xs text-brand-muted font-normal">({policies.length})</span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {policies.slice(0, 6).map(function (p) {
          return (
            <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-brand-text text-sm mb-1 line-clamp-2">{p.title_6th_grade || p.policy_name}</h4>
              {p.bill_number && <p className="text-xs font-mono text-brand-muted mb-1">{p.bill_number}</p>}
              <div className="flex items-center gap-2">
                {p.status && <span className="text-xs text-brand-muted">{p.status}</span>}
              </div>
              {p.impact_statement && (
                <p className="text-xs text-amber-700 mt-2 line-clamp-2">{p.impact_statement}</p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function renderGroup(title: string, officials: CivicProfileResult['federal']) {
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
