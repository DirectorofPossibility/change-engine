'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Search, ChevronDown, Users, Loader2, X, Layers, MapPin } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { GEO_LAYERS, THEMES } from '@/lib/constants'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { MapEntityDrawer } from '@/components/maps/MapEntityDrawer'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { GeoLayerConfig } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

const InteractiveMap = dynamic(
  () => import('@/components/maps/InteractiveMap').then(m => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <div className="w-full h-[650px] bg-brand-border/30 animate-pulse" /> }
)

interface GeographyClientProps {
  superNeighborhoods: Array<{ sn_id: string; sn_name: string }>
  initialZip?: string
  initialSuperNeighborhood?: string
}

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
  primaryPathway?: string | null
  pathways?: string[]
}

interface EntityCounts {
  organizations: number
  services: number
  voting: number
  officials: number
}

interface SelectedRegion {
  type: string
  id: string
  label: string
}

const PATHWAY_ENTRIES = Object.entries(THEMES) as Array<[string, { name: string; color: string }]>

/** Friendly layer groups for the toggle bar */
const LAYER_GROUPS = [
  { id: 'superNeighborhoods', label: 'Neighborhoods', icon: 'SN' },
  { id: 'councilDistricts', label: 'Council', icon: 'CD' },
  { id: 'congressionalDistricts', label: 'Congress', icon: 'US' },
  { id: 'stateSenate', label: 'Senate', icon: 'TX' },
  { id: 'stateHouse', label: 'House', icon: 'TX' },
  { id: 'schoolDistricts', label: 'Schools', icon: 'SD' },
  { id: 'zipCodes', label: 'ZIP Codes', icon: 'ZIP' },
]

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
  const [entityCounts, setEntityCounts] = useState<EntityCounts>({ organizations: 0, services: 0, voting: 0, officials: 0 })
  const [loading, setLoading] = useState(false)
  const [activePathway, setActivePathway] = useState<string | null>(null)
  const [drawerEntity, setDrawerEntity] = useState<MarkerData | null>(null)
  const [showLayerPicker, setShowLayerPicker] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const layers: GeoLayerConfig[] = useMemo(function () {
    return Object.values(GEO_LAYERS)
  }, [])

  const loadContent = useCallback(async function (type: string, id: string, label: string, pathway?: string | null) {
    setSelectedRegion({ type, id, label })
    setPanelOpen(true)
    setLoading(true)
    try {
      let url = '/api/map-markers?type=' + encodeURIComponent(type) + '&id=' + encodeURIComponent(id)
      if (pathway) url += '&pathway=' + encodeURIComponent(pathway)
      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setMarkers(data.markers || [])
      setOfficials(data.officials || [])
      setEntityCounts(data.entityCounts || { organizations: 0, services: 0, voting: 0, officials: 0 })
    } catch {
      setMarkers([])
      setOfficials([])
      setEntityCounts({ organizations: 0, services: 0, voting: 0, officials: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleFeatureClick = useCallback(function (layerConfig: GeoLayerConfig, properties: GeoFeatureProperties) {
    const apiType = LAYER_TO_API_TYPE[layerConfig.id]
    if (!apiType) return
    const featureId = String(properties[layerConfig.idProperty] || '')
    if (!featureId) return
    const label = String(
      properties['SN_NAME'] || properties['NAME'] || properties['NAMELSAD'] ||
      properties['DISTRICT'] || properties['CD'] || properties['SD'] || properties['HD'] ||
      properties[layerConfig.idProperty] || featureId
    )
    setActivePathway(null)
    loadContent(apiType, featureId, label)
  }, [loadContent])

  const handleMarkerClick = useCallback(function (marker: MarkerData) {
    setDrawerEntity(marker)
  }, [])

  const handleDrawerPathwayClick = useCallback(function (themeId: string) {
    setActivePathway(themeId)
    setDrawerEntity(null)
    if (selectedRegion) loadContent(selectedRegion.type, selectedRegion.id, selectedRegion.label, themeId)
  }, [selectedRegion, loadContent])

  const handlePathwayFilter = useCallback(function (themeId: string | null) {
    setActivePathway(themeId)
    if (selectedRegion) loadContent(selectedRegion.type, selectedRegion.id, selectedRegion.label, themeId)
  }, [selectedRegion, loadContent])

  const handleZipSubmit = useCallback(function (e: React.FormEvent) {
    e.preventDefault()
    if (zip.length === 5) {
      setActivePathway(null)
      loadContent('zip', zip, 'ZIP ' + zip)
      router.push('/geography?zip=' + zip, { scroll: false })
    }
  }, [zip, loadContent, router])

  function handleSNChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setSelectedSN(value)
    if (value) {
      const snInfo = superNeighborhoods.find(function (sn) { return sn.sn_id === value })
      setActivePathway(null)
      loadContent('superNeighborhood', value, snInfo?.sn_name || value)
      router.push('/geography?superNeighborhood=' + value, { scroll: false })
    }
  }

  useEffect(function () {
    if (initialZip) {
      loadContent('zip', initialZip, 'ZIP ' + initialZip)
    } else if (initialSuperNeighborhood) {
      const snInfo = superNeighborhoods.find(function (sn) { return sn.sn_id === initialSuperNeighborhood })
      loadContent('superNeighborhood', initialSuperNeighborhood, snInfo?.sn_name || initialSuperNeighborhood)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalCount = entityCounts.organizations + entityCounts.services + entityCounts.voting + entityCounts.officials

  return (
    <div className="relative">
      {/* ── MAP (the hero) ── */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-brand-border" style={{ boxShadow: '4px 4px 0 #D5D0C8' }}>
        <InteractiveMap
          markers={markers}
          layers={layers}
          defaultVisibleLayers={['superNeighborhoods']}
          className="w-full h-[650px]"
          showLegend={false}
          onFeatureClick={handleFeatureClick}
          onMarkerClick={handleMarkerClick}
        />

        {/* ── Floating search bar (top-left) ── */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 w-72">
          <form onSubmit={handleZipSubmit} className="flex bg-white rounded-xl border-2 border-brand-border overflow-hidden" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
            <div className="relative flex-1">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent" />
              <input
                type="text"
                value={zip}
                onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                placeholder="ZIP code"
                maxLength={5}
                className="w-full pl-9 pr-2 py-2.5 text-sm bg-transparent focus:outline-none placeholder:text-brand-muted/50"
              />
            </div>
            <button
              type="submit"
              disabled={zip.length !== 5}
              className="px-3 text-xs font-bold uppercase tracking-wider text-white bg-brand-accent disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              Go
            </button>
          </form>

          <div className="relative bg-white rounded-xl border-2 border-brand-border overflow-hidden" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
            <select
              value={selectedSN}
              onChange={handleSNChange}
              className="w-full appearance-none px-3 py-2.5 pr-8 text-sm bg-transparent focus:outline-none text-brand-text"
            >
              <option value="">Browse neighborhoods...</option>
              {superNeighborhoods.map(function (sn) {
                return <option key={sn.sn_id} value={sn.sn_id}>{sn.sn_name}</option>
              })}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
          </div>
        </div>

        {/* ── Floating layer toggles (top-right) ── */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={function () { setShowLayerPicker(!showLayerPicker) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border-2 border-brand-border text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors"
            style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
          >
            <Layers size={14} />
            Boundaries
          </button>

          {showLayerPicker && (
            <div className="mt-2 bg-white rounded-xl border-2 border-brand-border p-3 space-y-1.5 min-w-[180px]" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
              {/* Handled by InteractiveMap's LayerControl internally — but we provide quick toggles here */}
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-2">Show on map</p>
              {LAYER_GROUPS.map(function (lg) {
                const cfg = GEO_LAYERS[lg.id]
                if (!cfg) return null
                return (
                  <label key={lg.id} className="flex items-center gap-2 cursor-pointer text-xs text-brand-text hover:text-brand-accent py-0.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    {lg.label}
                  </label>
                )
              })}
              <p className="text-[10px] text-brand-muted pt-1 border-t border-brand-border mt-1">Use the map layer control to toggle</p>
            </div>
          )}
        </div>

        {/* ── Welcome prompt (no region selected) ── */}
        {!selectedRegion && !loading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 border-2 border-brand-border text-center" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
              <p className="text-sm font-medium text-brand-text">Click any neighborhood to explore</p>
              <p className="text-xs text-brand-muted mt-0.5">or enter a ZIP code above</p>
            </div>
          </div>
        )}

        {/* ── Loading overlay ── */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] z-30">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border-2 border-brand-border" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
              <Loader2 size={16} className="animate-spin text-brand-accent" />
              <span className="text-sm text-brand-muted">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-up panel (region selected) ── */}
      {panelOpen && selectedRegion && !loading && (
        <div className="mt-6 bg-white rounded-2xl border-2 border-brand-border overflow-hidden" style={{ boxShadow: '4px 4px 0 #D5D0C8' }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-brand-border bg-brand-bg">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">Exploring</p>
              <h2 className="font-serif text-xl font-bold text-brand-text">{selectedRegion.label}</h2>
            </div>
            <button
              onClick={function () { setPanelOpen(false); setSelectedRegion(null); setMarkers([]); setOfficials([]) }}
              className="p-1.5 rounded-lg hover:bg-brand-border/40 transition-colors"
            >
              <X size={18} className="text-brand-muted" />
            </button>
          </div>

          {/* Quick stats */}
          {totalCount > 0 && (
            <div className="flex gap-4 px-5 py-3 border-b border-brand-border text-xs">
              {entityCounts.organizations > 0 && (
                <span className="text-brand-muted"><strong className="text-brand-text">{entityCounts.organizations}</strong> organizations</span>
              )}
              {entityCounts.services > 0 && (
                <span className="text-brand-muted"><strong className="text-brand-text">{entityCounts.services}</strong> services</span>
              )}
              {entityCounts.officials > 0 && (
                <span className="text-brand-muted"><strong className="text-brand-text">{entityCounts.officials}</strong> officials</span>
              )}
              {entityCounts.voting > 0 && (
                <span className="text-brand-muted"><strong className="text-brand-text">{entityCounts.voting}</strong> voting locations</span>
              )}
            </div>
          )}

          {/* Pathway filter chips */}
          <div className="px-5 py-3 border-b border-brand-border overflow-x-auto">
            <div className="flex gap-2 flex-nowrap">
              <button
                onClick={function () { handlePathwayFilter(null) }}
                className={'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' +
                  (activePathway === null
                    ? 'bg-brand-text text-white'
                    : 'bg-brand-border/40 text-brand-muted hover:bg-brand-border')}
              >
                All
              </button>
              {PATHWAY_ENTRIES.map(function ([themeId, theme]) {
                const isActive = activePathway === themeId
                return (
                  <button
                    key={themeId}
                    onClick={function () { handlePathwayFilter(themeId) }}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={isActive
                      ? { backgroundColor: theme.color, color: '#fff' }
                      : { backgroundColor: theme.color + '12', color: theme.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isActive ? '#fff' : theme.color }} />
                    {theme.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Officials grid */}
          {officials.length > 0 && (
            <div className="px-5 py-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-brand-accent" />
                <h3 className="text-sm font-bold text-brand-text">Your representatives</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Empty state */}
          {officials.length === 0 && markers.length === 0 && (
            <div className="text-center py-8 px-5">
              <p className="text-sm text-brand-muted">No results found for this area yet.</p>
              <p className="text-xs text-brand-muted-light mt-1">Try a different boundary or pathway filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Entity detail drawer */}
      {drawerEntity && (
        <MapEntityDrawer
          entity={drawerEntity}
          onClose={function () { setDrawerEntity(null) }}
          onPathwayClick={handleDrawerPathwayClick}
        />
      )}
    </div>
  )
}
