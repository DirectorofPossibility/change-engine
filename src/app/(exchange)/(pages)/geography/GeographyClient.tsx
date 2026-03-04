'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { MapPin, Search, ChevronDown, Building2, Shield, Scale, Users } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { GEO_LAYERS } from '@/lib/constants'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { GeoLayerConfig } from '@/lib/constants'
import type { SuperNeighborhood, MapMarkerData, GeographyData } from '@/lib/types/exchange'

const InteractiveMap = dynamic(
  () => import('@/components/maps/InteractiveMap').then(m => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-xl bg-brand-border/30 animate-pulse" /> }
)

interface GeographyClientProps {
  superNeighborhoods: SuperNeighborhood[]
  neighborhoods: Array<{ neighborhood_id: string; neighborhood_name: string; super_neighborhood_id: string | null }>
  serviceMarkers: MapMarkerData[]
  organizationMarkers: MapMarkerData[]
  officials: GeographyData['officials']
  policies: GeographyData['policies']
  initialZip?: string
  initialSuperNeighborhood?: string
  initialNeighborhood?: string
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  police: 'Police & Law Enforcement',
  fire: 'Fire Stations',
  medical: 'Medical & Health',
  park: 'Parks & Recreation',
  library: 'Libraries',
  service: 'Utilities & Other Services',
}

export function GeographyClient({
  superNeighborhoods,
  neighborhoods,
  serviceMarkers,
  organizationMarkers,
  officials,
  policies,
  initialZip,
  initialSuperNeighborhood,
  initialNeighborhood,
}: GeographyClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [zip, setZip] = useState(initialZip || '')
  const [selectedSN, setSelectedSN] = useState(initialSuperNeighborhood || '')
  const [selectedHood, setSelectedHood] = useState(initialNeighborhood || '')
  const [hasSearched, setHasSearched] = useState(!!initialZip || !!initialSuperNeighborhood)

  // Filter neighborhoods by selected super neighborhood
  const filteredNeighborhoods = useMemo(function () {
    if (!selectedSN) return neighborhoods
    return neighborhoods.filter(function (n) { return n.super_neighborhood_id === selectedSN })
  }, [neighborhoods, selectedSN])

  // Combine all markers for the map — only show when user has searched
  const allMarkers: MarkerData[] = useMemo(function () {
    if (!hasSearched) return []
    const markers: MarkerData[] = []
    serviceMarkers.forEach(function (m) {
      markers.push({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        type: m.type as MarkerData['type'],
        address: m.address,
        phone: m.phone,
        link: m.link,
      })
    })
    organizationMarkers.forEach(function (m) {
      markers.push({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        type: 'organization',
        address: m.address,
        phone: m.phone,
        link: m.link,
      })
    })
    return markers
  }, [hasSearched, serviceMarkers, organizationMarkers])

  // All GEO_LAYERS for the map
  const layers: GeoLayerConfig[] = useMemo(function () {
    return Object.values(GEO_LAYERS)
  }, [])

  const handleZipSubmit = useCallback(function (e: React.FormEvent) {
    e.preventDefault()
    if (zip.length === 5) {
      setHasSearched(true)
      router.push('/geography?zip=' + zip + (selectedSN ? '&superNeighborhood=' + selectedSN : ''))
    }
  }, [zip, selectedSN, router])

  function handleSNChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setSelectedSN(value)
    setSelectedHood('')
    if (value) {
      setHasSearched(true)
      router.push('/geography?superNeighborhood=' + value + (zip ? '&zip=' + zip : ''))
    }
  }

  function handleNeighborhoodChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedHood(e.target.value)
  }

  // Selected super neighborhood info
  const selectedSNInfo = useMemo(function () {
    if (!selectedSN) return null
    return superNeighborhoods.find(function (sn) { return sn.sn_id === selectedSN }) || null
  }, [selectedSN, superNeighborhoods])

  // Group services by type for display
  const servicesByType = useMemo(function () {
    const groups: Record<string, MapMarkerData[]> = {}
    serviceMarkers.forEach(function (m) {
      const key = m.type
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return groups
  }, [serviceMarkers])

  return (
    <div className="space-y-8">
      {/* ZIP Code + Dropdowns */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ZIP Code */}
          <form onSubmit={handleZipSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={zip}
                onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                placeholder="Enter ZIP code"
                maxLength={5}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
              />
            </div>
            <button
              type="submit"
              disabled={zip.length !== 5}
              className="px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-lg bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Go
            </button>
          </form>

          {/* Super Neighborhood */}
          <div className="relative">
            <select
              value={selectedSN}
              onChange={handleSNChange}
              className="w-full appearance-none px-3 py-2.5 pr-10 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent text-brand-text"
            >
              <option value="">{t('geo.select_super')}</option>
              {superNeighborhoods.map(function (sn) {
                return <option key={sn.sn_id} value={sn.sn_id}>{sn.sn_name}</option>
              })}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>

          {/* Neighborhood */}
          <div className="relative">
            <select
              value={selectedHood}
              onChange={handleNeighborhoodChange}
              className="w-full appearance-none px-3 py-2.5 pr-10 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent text-brand-text"
            >
              <option value="">{t('geo.select_neighborhood')}</option>
              {filteredNeighborhoods.map(function (n) {
                return <option key={n.neighborhood_id} value={n.neighborhood_id}>{n.neighborhood_name}</option>
              })}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>
        </div>

        {/* Super neighborhood info */}
        {selectedSNInfo && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-serif font-bold text-brand-text">{selectedSNInfo.sn_name}</span>
              {selectedSNInfo.population && (
                <span className="text-brand-muted">Population: {selectedSNInfo.population.toLocaleString()}</span>
              )}
              {selectedSNInfo.median_income && (
                <span className="text-brand-muted">Median Income: ${selectedSNInfo.median_income.toLocaleString()}</span>
              )}
              {selectedSNInfo.zip_codes && (
                <span className="text-brand-muted">ZIP Codes: {selectedSNInfo.zip_codes}</span>
              )}
            </div>
            {selectedSNInfo.description && (
              <p className="mt-2 text-sm text-brand-muted leading-relaxed">{selectedSNInfo.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Interactive Map — starts empty, populates after search */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden shadow-sm">
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <MapPin size={48} className="text-brand-muted/40 mb-4" />
            <p className="text-brand-muted text-sm max-w-md">{t('geo.explore_prompt')}</p>
          </div>
        )}
        {hasSearched && (
          <InteractiveMap
            markers={allMarkers}
            layers={layers}
            defaultVisibleLayers={['superNeighborhoods']}
            className="w-full h-[500px]"
            showLegend={true}
            highlightLayerId={selectedSN ? 'superNeighborhoods' : undefined}
            highlightFeatureId={selectedSN || undefined}
          />
        )}
      </div>

      {/* Detail Panels — only shown after a search */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Officials */}
          {officials.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-brand-accent" />
                <h2 className="font-serif text-lg font-bold text-brand-text">{t('geo.officials_here')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {officials.map(function (o) {
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
                      photoUrl={o.photo_url}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Municipal Services */}
          {serviceMarkers.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-brand-accent" />
                <h2 className="font-serif text-lg font-bold text-brand-text">{t('geo.services_nearby')}</h2>
              </div>
              <div className="space-y-4">
                {Object.entries(servicesByType).map(function ([type, items]) {
                  return (
                    <div key={type}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                        {SERVICE_TYPE_LABELS[type] || type}
                      </h3>
                      <ul className="space-y-1.5">
                        {items.map(function (s) {
                          return (
                            <li key={s.id} className="text-sm text-brand-text">
                              <span className="font-medium">{s.title}</span>
                              {s.address && <span className="text-brand-muted ml-1.5">— {s.address}</span>}
                              {s.phone && (
                                <a href={'tel:' + s.phone} className="text-brand-accent hover:underline ml-1.5 text-xs">{s.phone}</a>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Organizations */}
          {organizationMarkers.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-brand-accent" />
                <h2 className="font-serif text-lg font-bold text-brand-text">{t('geo.organizations_here')}</h2>
              </div>
              <ul className="space-y-2">
                {organizationMarkers.slice(0, 20).map(function (o) {
                  return (
                    <li key={o.id} className="text-sm">
                      <span className="font-medium text-brand-text">{o.title}</span>
                      {o.address && <span className="text-brand-muted ml-1.5">— {o.address}</span>}
                    </li>
                  )
                })}
                {organizationMarkers.length > 20 && (
                  <li className="text-xs text-brand-muted">
                    + {organizationMarkers.length - 20} more on the map
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Policies */}
          {policies.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Scale size={18} className="text-brand-accent" />
                <h2 className="font-serif text-lg font-bold text-brand-text">{t('geo.policies_impacting')}</h2>
              </div>
              <ul className="space-y-2">
                {policies.map(function (p) {
                  return (
                    <li key={p.policy_id} className="text-sm">
                      <Link href={'/policies/' + p.policy_id} className="font-medium text-brand-accent hover:underline">
                        {p.title_6th_grade || p.policy_name}
                      </Link>
                      {p.status && <span className="text-brand-muted ml-1.5">({p.status})</span>}
                      {p.level && <span className="text-xs text-brand-muted ml-1.5">{p.level}</span>}
                      {p.source_url && (
                        <a href={p.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent/70 hover:underline ml-1.5">source</a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Empty state when nothing searched */}
      {!hasSearched && (
        <div className="text-center py-12">
          <p className="text-brand-muted text-sm">{t('geo.no_selection')}</p>
        </div>
      )}
    </div>
  )
}
