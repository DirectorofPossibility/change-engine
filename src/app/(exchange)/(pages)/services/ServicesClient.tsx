'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/exchange/SearchBar'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { ClusteredMap } from '@/components/maps/dynamic'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { ServiceWithOrg, TranslationMap } from '@/lib/types/exchange'
import { List, Map as MapIcon, Phone, ChevronDown, ChevronRight } from 'lucide-react'

// Category display config: icon colors for the phone book tabs
const CAT_COLORS: Record<string, string> = {
  Food: '#38a169',
  Housing: '#3182ce',
  Money: '#d69e2e',
  Healthcare: '#e53e3e',
  Legal: '#805ad5',
  Jobs: '#dd6b20',
  Education: '#319795',
  Family: '#d53f8c',
  Seniors: '#718096',
  Disability: '#3182ce',
  Veterans: '#2d3748',
  Crisis: '#e53e3e',
  Transportation: '#dd6b20',
  Utilities: '#d69e2e',
}

interface CategoryInfo {
  name: string
  description: string
  examples: string
}

interface ServicesClientProps {
  services: ServiceWithOrg[]
  translations?: TranslationMap
  categories: Record<string, CategoryInfo>
  initialZip?: string
}

export function ServicesClient({ services, translations = {}, categories, initialZip }: ServicesClientProps) {
  const { zip: savedZip } = useNeighborhood()
  const [search, setSearch] = useState('')
  const [zipFilter, setZipFilter] = useState(initialZip || '')
  const [view, setView] = useState<'directory' | 'map'>('directory')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const autoFilled = useRef(!!initialZip)

  useEffect(function () {
    if (savedZip && savedZip.length === 5 && !autoFilled.current && !zipFilter) {
      autoFilled.current = true
      setZipFilter(savedZip)
    }
  }, [savedZip]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter services by search + ZIP
  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = s.service_name.toLowerCase().includes(q)
        const matchOrg = s.org_name?.toLowerCase().includes(q)
        const matchDesc = s.description_5th_grade?.toLowerCase().includes(q)
        if (!matchName && !matchOrg && !matchDesc) return false
      }
      if (zipFilter && s.zip_code !== zipFilter) return false
      return true
    })
  }, [services, search, zipFilter])

  // Group by category for phone book view
  const grouped = useMemo(() => {
    const groups: Record<string, ServiceWithOrg[]> = {}
    const uncategorized: ServiceWithOrg[] = []

    filtered.forEach(s => {
      const catId = s.service_cat_id
      if (catId && categories[catId]) {
        if (!groups[catId]) groups[catId] = []
        groups[catId].push(s)
      } else {
        uncategorized.push(s)
      }
    })

    // Sort categories by name
    const sorted = Object.entries(groups)
      .sort(([a], [b]) => categories[a].name.localeCompare(categories[b].name))

    if (uncategorized.length > 0) {
      sorted.push(['OTHER', uncategorized])
    }

    return sorted
  }, [filtered, categories])

  // Category list for quick-jump sidebar
  const categoryList = useMemo(() => {
    return grouped.map(([catId, items]) => ({
      id: catId,
      name: catId === 'OTHER' ? 'Other Services' : categories[catId]?.name ?? catId,
      count: items.length,
      color: catId === 'OTHER' ? '#718096' : (CAT_COLORS[categories[catId]?.name] ?? '#718096'),
    }))
  }, [grouped, categories])

  const markers: MarkerData[] = useMemo(() => {
    return filtered
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => ({
        id: s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: s.service_name,
        type: 'service' as const,
        address: [s.address, s.city, s.state, s.zip_code].filter(Boolean).join(', '),
        phone: s.phone,
        link: '/services/' + s.service_id,
      }))
  }, [filtered])

  function toggleCategory(catId: string) {
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  function scrollToCategory(catId: string) {
    setActiveCategory(catId)
    setExpandedCats(prev => new Set(prev).add(catId))
    const el = document.getElementById('cat-' + catId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // When searching, expand all categories
  useEffect(() => {
    if (search) {
      setExpandedCats(new Set(grouped.map(([id]) => id)))
    }
  }, [search, grouped])

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 max-w-sm">
          <SearchBar placeholder="Search services, organizations..." onSearch={setSearch} />
        </div>
        <input
          type="text"
          placeholder="ZIP code"
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm w-28"
          maxLength={5}
        />
        <span className="text-sm text-brand-muted self-center whitespace-nowrap">
          {filtered.length} services
        </span>
        <div className="flex gap-1 ml-auto bg-brand-bg rounded-lg p-1">
          <button
            onClick={() => setView('directory')}
            className={'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' + (view === 'directory' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text')}
          >
            <List size={16} className="inline mr-1" />
            Directory
          </button>
          <button
            onClick={() => setView('map')}
            className={'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' + (view === 'map' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text')}
          >
            <MapIcon size={16} className="inline mr-1" />
            Map
          </button>
        </div>
      </div>

      {view === 'map' ? (
        markers.length > 0 ? (
          <ClusteredMap markers={markers} showLegend={false} className="w-full h-[500px] rounded-xl" />
        ) : (
          <p className="text-center text-brand-muted py-12">No services with location data found.</p>
        )
      ) : (
        <div className="flex gap-6">
          {/* ── Category Quick-Jump (desktop) ── */}
          <nav className="hidden md:block w-48 flex-shrink-0">
            <div className="sticky top-24 space-y-0.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Categories</p>
              {categoryList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={'w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ' +
                    (activeCategory === cat.id ? 'bg-white shadow-sm font-semibold text-brand-text' : 'text-brand-muted hover:text-brand-text hover:bg-white/60')}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-auto text-xs opacity-60">{cat.count}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* ── Phone Book Directory ── */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Mobile category pills */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {categoryList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  style={{
                    borderColor: cat.color + '40',
                    color: activeCategory === cat.id ? '#fff' : cat.color,
                    backgroundColor: activeCategory === cat.id ? cat.color : 'transparent',
                  }}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>

            {grouped.map(([catId, items]) => {
              const catInfo = catId === 'OTHER'
                ? { name: 'Other Services', description: 'Additional community resources', examples: '' }
                : categories[catId]
              const color = catId === 'OTHER' ? '#718096' : (CAT_COLORS[catInfo?.name] ?? '#718096')
              const isExpanded = expandedCats.has(catId)

              return (
                <section key={catId} id={'cat-' + catId} className="scroll-mt-20">
                  {/* Category header — phone book section divider */}
                  <button
                    onClick={() => toggleCategory(catId)}
                    className="w-full group"
                  >
                    <div className="flex items-center gap-3 py-3 border-b-2" style={{ borderColor: color }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '15' }}>
                        <Phone size={16} style={{ color }} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h2 className="font-serif text-lg font-bold text-brand-text leading-tight">
                          {catInfo?.name ?? catId}
                        </h2>
                        <p className="text-xs text-brand-muted">{catInfo?.description} &middot; {items.length} services</p>
                      </div>
                      <span className="text-brand-muted group-hover:text-brand-text transition-colors">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </span>
                    </div>
                  </button>

                  {/* Service listings — compact phone-book rows when collapsed, cards when expanded */}
                  {isExpanded ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                      {items.map(s => {
                        const t = translations[s.service_id]
                        return (
                          <ServiceCard
                            key={s.service_id}
                            serviceId={s.service_id}
                            name={s.service_name}
                            orgName={s.org_name}
                            orgId={s.org_id ?? undefined}
                            description={s.description_5th_grade ?? null}
                            phone={s.phone}
                            address={s.address}
                            city={s.city}
                            state={s.state}
                            zipCode={s.zip_code}
                            website={s.website}
                            translatedName={t?.title}
                            translatedDescription={t?.summary}
                          />
                        )
                      })}
                    </div>
                  ) : (
                    /* Collapsed: compact phone-book listing */
                    <div className="divide-y divide-brand-border/50">
                      {items.slice(0, 5).map(s => (
                        <Link
                          key={s.service_id}
                          href={'/services/' + s.service_id}
                          className="flex items-center gap-3 py-2.5 px-1 hover:bg-brand-bg/50 transition-colors group"
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent truncate flex-1">
                            {s.service_name}
                          </span>
                          {s.org_name && (
                            <span className="text-xs text-brand-muted truncate max-w-[140px] hidden sm:inline">{s.org_name}</span>
                          )}
                          {s.phone && (
                            <span className="text-xs text-brand-accent font-mono whitespace-nowrap hidden sm:inline">{s.phone}</span>
                          )}
                        </Link>
                      ))}
                      {items.length > 5 && (
                        <button
                          onClick={() => toggleCategory(catId)}
                          className="w-full text-left py-2 px-1 text-xs font-medium hover:underline"
                          style={{ color }}
                        >
                          + {items.length - 5} more {catInfo?.name?.toLowerCase() ?? ''} services
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )
            })}

            {grouped.length === 0 && (
              <p className="text-center text-brand-muted py-12">No services found matching your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
