'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, ChevronDown, Users, Landmark, Loader2, Map } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { GEO_LAYERS } from '@/lib/constants'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { GeoLayerConfig } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

const InteractiveMap = dynamic(
  () => import('@/components/maps/InteractiveMap').then(m => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <div className="w-full h-[500px] rounded-xl bg-brand-border/30 animate-pulse" /> }
)

interface GeographyClientProps {
  superNeighborhoods: Array<{ sn_id: string; sn_name: string }>
  initialZip?: string
  initialSuperNeighborhood?: string
}

/** Map GEO_LAYERS ids to API region types. */
const LAYER_TO_API_TYPE: Record<string, string> = {
  superNeighborhoods: 'superNeighborhood',
  councilDistricts: 'councilDistrict',
  congressionalDistricts: 'congressional',
  stateSenate: 'stateSenate',
  stateHouse: 'stateHouse',
  zipCodes: 'zip',
}

interface Official {
  official_id: string
  official_name: string
  title: string | null
  level: string | null
  party: string | null
  email: string | null
  office_phone: string | null
  website: string | null
  photo_url: string | null
}

interface Foundation {
  id: string
  name: string
  mission: string | null
  assets: number | null
  website_url: string | null
}

interface SelectedRegion {
  type: string
  id: string
  label: string
}

export function GeographyClient({
  superNeighborhoods,
  initialZip,
  initialSuperNeighborhood,
}: GeographyClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [zip, setZip] = useState(initialZip || '')
  const [selectedSN, setSelectedSN] = useState(initialSuperNeighborhood || '')

  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [officials, setOfficials] = useState<Official[]>([])
  const [foundations, setFoundations] = useState<Foundation[]>([])
  const [loading, setLoading] = useState(false)

  const layers: GeoLayerConfig[] = useMemo(function () {
    return Object.values(GEO_LAYERS)
  }, [])

  /** Fetch content from the map-markers API. */
  const loadContent = useCallback(async function (type: string, id: string, label: string) {
    setSelectedRegion({ type, id, label })
    setLoading(true)
    try {
      const res = await fetch('/api/map-markers?type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id))
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setMarkers(data.markers || [])
      setOfficials(data.officials || [])
      setFoundations(data.foundations || [])
    } catch {
      setMarkers([])
      setOfficials([])
      setFoundations([])
    } finally {
      setLoading(false)
    }
  }, [])

  /** Handle polygon clicks on the map. */
  const handleFeatureClick = useCallback(function (layerConfig: GeoLayerConfig, properties: GeoFeatureProperties) {
    const apiType = LAYER_TO_API_TYPE[layerConfig.id]
    if (!apiType) return

    const featureId = String(properties[layerConfig.idProperty] || '')
    if (!featureId) return

    // Build a human-readable label from the properties
    const label = String(
      properties['SN_NAME'] || properties['NAME'] || properties['NAMELSAD'] ||
      properties['DISTRICT'] || properties['CD'] || properties['SD'] || properties['HD'] ||
      properties[layerConfig.idProperty] || featureId
    )

    loadContent(apiType, featureId, layerConfig.label + ': ' + label)
  }, [loadContent])

  /** Handle ZIP submit. */
  const handleZipSubmit = useCallback(function (e: React.FormEvent) {
    e.preventDefault()
    if (zip.length === 5) {
      loadContent('zip', zip, 'ZIP Code ' + zip)
      router.push('/geography?zip=' + zip, { scroll: false })
    }
  }, [zip, loadContent, router])

  /** Handle super neighborhood dropdown. */
  function handleSNChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setSelectedSN(value)
    if (value) {
      const snInfo = superNeighborhoods.find(function (sn) { return sn.sn_id === value })
      loadContent('superNeighborhood', value, snInfo?.sn_name || value)
      router.push('/geography?superNeighborhood=' + value, { scroll: false })
    }
  }

  // Load initial data from URL params on mount
  useEffect(function () {
    if (initialZip) {
      loadContent('zip', initialZip, 'ZIP Code ' + initialZip)
    } else if (initialSuperNeighborhood) {
      const snInfo = superNeighborhoods.find(function (sn) { return sn.sn_id === initialSuperNeighborhood })
      loadContent('superNeighborhood', initialSuperNeighborhood, snInfo?.sn_name || initialSuperNeighborhood)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      {/* ZIP Code + Super Neighborhood dropdown */}
      <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Interactive Map — always visible, all layers OFF by default */}
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden shadow-sm relative">
        <InteractiveMap
          markers={markers}
          layers={layers}
          defaultVisibleLayers={[]}
          className="w-full h-[500px]"
          showLegend={true}
          onFeatureClick={handleFeatureClick}
        />

        {/* Prompt overlay — only when no region selected */}
        {!selectedRegion && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-brand-border text-center max-w-sm">
              <Map size={32} className="mx-auto text-brand-accent mb-2" />
              <p className="text-sm text-brand-muted">{t('geo.click_to_explore')}</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-md border border-brand-border">
              <Loader2 size={18} className="animate-spin text-brand-accent" />
              <span className="text-sm text-brand-muted">{t('geo.loading_content')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Panels — shown when region is selected */}
      {selectedRegion && !loading && (
        <div className="space-y-6">
          {/* Region header */}
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-brand-text">
              {t('geo.exploring')}: {selectedRegion.label}
            </h2>
            <span className="text-xs text-brand-muted">
              ({markers.length} marker{markers.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Officials */}
            {officials.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-brand-accent" />
                  <h3 className="font-serif text-lg font-bold text-brand-text">{t('geo.officials_here')}</h3>
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

            {/* Foundations */}
            {foundations.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Landmark size={18} className="text-brand-accent" />
                  <h3 className="font-serif text-lg font-bold text-brand-text">{t('geo.foundations_nearby')}</h3>
                </div>
                <ul className="space-y-3">
                  {foundations.map(function (f) {
                    return (
                      <li key={f.id} className="text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={'/foundations?highlight=' + f.id}
                              className="font-medium text-brand-accent hover:underline"
                            >
                              {f.name}
                            </Link>
                            {f.mission && (
                              <p className="text-brand-muted text-xs mt-0.5 line-clamp-2">{f.mission}</p>
                            )}
                          </div>
                          {f.website_url && (
                            <a
                              href={f.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-accent/70 hover:underline flex-shrink-0"
                            >
                              website
                            </a>
                          )}
                        </div>
                        {f.assets && (
                          <span className="text-xs text-brand-muted">Assets: ${f.assets.toLocaleString()}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* Empty content message */}
          {officials.length === 0 && foundations.length === 0 && markers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-brand-muted text-sm">{t('geo.no_selection')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
