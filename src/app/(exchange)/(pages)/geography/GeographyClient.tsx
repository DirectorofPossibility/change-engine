'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  ChevronDown, ChevronRight, Users, Loader2, X, Layers, MapPin,
  Building2, Heart, Vote, Landmark, Filter, BarChart3, Eye, EyeOff,
  PanelLeftOpen, PanelLeftClose,
} from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { GEO_LAYERS, THEMES } from '@/lib/constants'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { MapEntityDrawer } from '@/components/maps/MapEntityDrawer'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { GeoLayerConfig } from '@/lib/constants'
import type { GeoFeatureProperties } from '@/lib/types/exchange'

const InteractiveMap = dynamic(
  () => import('@/components/maps/InteractiveMap').then(m => ({ default: m.InteractiveMap })),
  { ssr: false, loading: () => <div className="w-full aspect-square bg-brand-border/30 animate-pulse rounded-xl" /> }
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

const BOUNDARY_LAYERS = [
  { id: 'superNeighborhoods', label: 'Neighborhoods', short: 'SN' },
  { id: 'councilDistricts', label: 'Council Districts', short: 'CD' },
  { id: 'congressionalDistricts', label: 'Congressional', short: 'US' },
  { id: 'stateSenate', label: 'State Senate', short: 'SD' },
  { id: 'stateHouse', label: 'State House', short: 'HD' },
  { id: 'schoolDistricts', label: 'School Districts', short: 'ISD' },
  { id: 'zipCodes', label: 'ZIP Codes', short: 'ZIP' },
  { id: 'censusTracts', label: 'Census Tracts', short: 'CT' },
  { id: 'tirzZones', label: 'TIRZ Zones', short: 'TIRZ' },
]

const ENTITY_TYPES = [
  { key: 'organizations', label: 'Organizations', icon: Building2, color: '#C75B2A' },
  { key: 'services', label: 'Services', icon: Heart, color: '#38a169' },
  { key: 'officials', label: 'Officials', icon: Landmark, color: '#3182ce' },
  { key: 'voting', label: 'Voting', icon: Vote, color: '#805ad5' },
]

export function GeographyClient({
  superNeighborhoods,
  initialZip,
  initialSuperNeighborhood,
}: GeographyClientProps) {
  const { t } = useTranslation()
  const router = useRouter()

  // Panel visibility
  const [panelOpen, setPanelOpen] = useState(true)

  // Search
  const [zip, setZip] = useState(initialZip || '')
  const [selectedSN, setSelectedSN] = useState(initialSuperNeighborhood || '')

  // Map state
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(null)
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [officials, setOfficials] = useState<Official[]>([])
  const [entityCounts, setEntityCounts] = useState<EntityCounts>({ organizations: 0, services: 0, voting: 0, officials: 0 })
  const [loading, setLoading] = useState(false)
  const [activePathway, setActivePathway] = useState<string | null>(null)
  const [drawerEntity, setDrawerEntity] = useState<MarkerData | null>(null)

  // Collapsible sections
  const [showLayers, setShowLayers] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [showResults, setShowResults] = useState(true)

  const layers: GeoLayerConfig[] = useMemo(function () {
    return Object.values(GEO_LAYERS)
  }, [])

  const loadContent = useCallback(async function (type: string, id: string, label: string, pathway?: string | null) {
    setSelectedRegion({ type, id, label })
    setShowResults(true)
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
    <div className="relative flex gap-0 rounded-2xl overflow-hidden border-2 border-brand-border" style={{ boxShadow: '4px 4px 0 #D5D0C8' }}>

      {/* ═══════════ CONTROL PANEL (left sidebar) ═══════════ */}
      {panelOpen && (
        <div className="w-[340px] flex-shrink-0 bg-white border-r-2 border-brand-border overflow-y-auto" style={{ maxHeight: '700px' }}>

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-bg">
            <h2 className="font-serif text-base font-bold text-brand-text">Explorer</h2>
            <button onClick={function () { setPanelOpen(false) }} className="p-1 rounded hover:bg-brand-border/40 transition-colors">
              <PanelLeftClose size={16} className="text-brand-muted" />
            </button>
          </div>

          {/* ── Search section ── */}
          <div className="px-4 py-3 border-b border-brand-border space-y-2">
            <form onSubmit={handleZipSubmit} className="flex gap-1.5">
              <div className="relative flex-1">
                <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-accent" />
                <input
                  type="text"
                  value={zip}
                  onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                  placeholder="ZIP code"
                  maxLength={5}
                  className="w-full pl-8 pr-2 py-2 text-sm border-2 border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/40 placeholder:text-brand-muted/50"
                />
              </div>
              <button
                type="submit"
                disabled={zip.length !== 5}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-brand-accent text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                Go
              </button>
            </form>

            <div className="relative">
              <select
                value={selectedSN}
                onChange={handleSNChange}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm border-2 border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 text-brand-text"
              >
                <option value="">Browse neighborhoods...</option>
                {superNeighborhoods.map(function (sn) {
                  return <option key={sn.sn_id} value={sn.sn_id}>{sn.sn_name}</option>
                })}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* ── Boundary Layers ── */}
          <div className="border-b border-brand-border">
            <button
              onClick={function () { setShowLayers(!showLayers) }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-brand-bg/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                <Layers size={13} />
                Boundary Layers
              </span>
              {showLayers ? <ChevronDown size={13} className="text-brand-muted" /> : <ChevronRight size={13} className="text-brand-muted" />}
            </button>
            {showLayers && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
                {BOUNDARY_LAYERS.map(function (bl) {
                  const cfg = GEO_LAYERS[bl.id]
                  if (!cfg) return null
                  return (
                    <div
                      key={bl.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-default hover:bg-brand-bg/50 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="text-brand-text truncate">{bl.label}</span>
                    </div>
                  )
                })}
                <p className="col-span-2 text-[10px] text-brand-muted-light mt-1">Toggle layers using the map control</p>
              </div>
            )}
          </div>

          {/* ── Pathway Filters ── */}
          <div className="border-b border-brand-border">
            <button
              onClick={function () { setShowFilters(!showFilters) }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-brand-bg/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                <Filter size={13} />
                Pathways
              </span>
              {showFilters ? <ChevronDown size={13} className="text-brand-muted" /> : <ChevronRight size={13} className="text-brand-muted" />}
            </button>
            {showFilters && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={function () { handlePathwayFilter(null) }}
                    className={'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ' +
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
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
                {!selectedRegion && (
                  <p className="text-[10px] text-brand-muted-light mt-2">Select a region first to filter by pathway</p>
                )}
              </div>
            )}
          </div>

          {/* ── Results section ── */}
          <div>
            <button
              onClick={function () { setShowResults(!showResults) }}
              className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-brand-bg/50 transition-colors"
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                <BarChart3 size={13} />
                {selectedRegion ? selectedRegion.label : 'Results'}
              </span>
              {showResults ? <ChevronDown size={13} className="text-brand-muted" /> : <ChevronRight size={13} className="text-brand-muted" />}
            </button>

            {showResults && (
              <div className="px-4 pb-4">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center gap-2 py-6 justify-center">
                    <Loader2 size={16} className="animate-spin text-brand-accent" />
                    <span className="text-sm text-brand-muted">Loading...</span>
                  </div>
                )}

                {/* No selection yet */}
                {!selectedRegion && !loading && (
                  <div className="text-center py-6">
                    <MapPin size={24} className="mx-auto text-brand-border mb-2" />
                    <p className="text-sm text-brand-muted">Click a region on the map</p>
                    <p className="text-xs text-brand-muted-light mt-0.5">or search by ZIP / neighborhood above</p>
                  </div>
                )}

                {/* Entity counts */}
                {selectedRegion && !loading && totalCount > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {ENTITY_TYPES.map(function (et) {
                      const count = entityCounts[et.key as keyof EntityCounts] || 0
                      if (count === 0) return null
                      const Icon = et.icon
                      return (
                        <div key={et.key} className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-brand-border">
                          <Icon size={14} style={{ color: et.color }} />
                          <div>
                            <span className="block text-sm font-bold text-brand-text leading-none">{count}</span>
                            <span className="text-[10px] text-brand-muted">{et.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Officials list */}
                {selectedRegion && !loading && officials.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users size={13} className="text-brand-accent" />
                      <span className="text-xs font-bold text-brand-text">Your representatives</span>
                    </div>
                    <div className="space-y-2">
                      {officials.map(function (o) {
                        return (
                          <Link
                            key={o.official_id}
                            href={'/officials/' + o.official_id}
                            className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-brand-border hover:border-brand-accent/40 hover:bg-brand-bg/50 transition-all group"
                          >
                            {o.photo_url ? (
                              <img src={o.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-brand-border" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-brand-border/40 flex items-center justify-center">
                                <Users size={14} className="text-brand-muted" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-brand-text truncate group-hover:text-brand-accent transition-colors">{o.official_name}</span>
                              <span className="block text-[10px] text-brand-muted truncate">{o.title}{o.party ? ' (' + o.party + ')' : ''}</span>
                            </div>
                            <ChevronRight size={14} className="text-brand-muted flex-shrink-0" />
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {selectedRegion && !loading && officials.length === 0 && markers.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-brand-muted">No results found for this area.</p>
                    <p className="text-xs text-brand-muted-light mt-0.5">Try a different region or pathway.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ MAP (right side, square) ═══════════ */}
      <div className="flex-1 relative min-w-0">
        {/* Panel toggle (when collapsed) */}
        {!panelOpen && (
          <button
            onClick={function () { setPanelOpen(true) }}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border-2 border-brand-border text-xs font-bold text-brand-text hover:bg-brand-bg transition-colors"
            style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
          >
            <PanelLeftOpen size={14} />
            Explorer
          </button>
        )}

        <InteractiveMap
          markers={markers}
          layers={layers}
          defaultVisibleLayers={['superNeighborhoods']}
          className="w-full h-[700px]"
          showLegend={false}
          onFeatureClick={handleFeatureClick}
          onMarkerClick={handleMarkerClick}
        />

        {/* Welcome prompt */}
        {!selectedRegion && !loading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-5 py-3 border-2 border-brand-border text-center" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
              <p className="text-sm font-medium text-brand-text">Click any neighborhood to explore</p>
              <p className="text-xs text-brand-muted mt-0.5">or use the panel to search</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] z-10">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border-2 border-brand-border" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
              <Loader2 size={16} className="animate-spin text-brand-accent" />
              <span className="text-sm text-brand-muted">Loading...</span>
            </div>
          </div>
        )}
      </div>

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
