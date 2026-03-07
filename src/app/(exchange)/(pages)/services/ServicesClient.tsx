'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { SearchBar } from '@/components/exchange/SearchBar'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { ClusteredMap } from '@/components/maps/dynamic'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import type { MarkerData } from '@/components/maps/MapMarker'
import type { ServiceWithOrg, TranslationMap } from '@/lib/types/exchange'
import { List, Map as MapIcon } from 'lucide-react'
import { InfoBubble } from '@/components/exchange/InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'

interface ServicesClientProps {
  services: ServiceWithOrg[]
  translations?: TranslationMap
}

export function ServicesClient({ services, translations = {} }: ServicesClientProps) {
  const { zip: savedZip } = useNeighborhood()
  const [search, setSearch] = useState('')
  const [zipFilter, setZipFilter] = useState('')
  const [view, setView] = useState<'list' | 'map'>('list')
  const autoFilled = useRef(false)

  // Auto-fill ZIP filter from saved neighborhood
  useEffect(function () {
    if (savedZip && savedZip.length === 5 && !autoFilled.current && !zipFilter) {
      autoFilled.current = true
      setZipFilter(savedZip)
    }
  }, [savedZip]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        const matchName = s.service_name.toLowerCase().includes(q)
        const matchOrg = s.org_name?.toLowerCase().includes(q)
        if (!matchName && !matchOrg) return false
      }
      if (zipFilter && s.zip_code !== zipFilter) return false
      return true
    })
  }, [services, search, zipFilter])

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <SearchBar placeholder="Search services..." onSearch={setSearch} />
          <InfoBubble id={TOOLTIPS.service_type_tags.id} text={TOOLTIPS.service_type_tags.text} position="bottom" />
        </div>
        <input
          type="text"
          placeholder="ZIP code"
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="border-2 border-brand-border rounded-lg px-3 py-2 text-sm w-32"
          maxLength={5}
        />
        <span className="relative text-sm text-brand-muted self-center">
          {filtered.length} services — powered by 211
          <InfoBubble id={TOOLTIPS.badge_211.id} text={TOOLTIPS.badge_211.text} position="bottom" />
        </span>

        {/* View toggle */}
        <div className="relative flex gap-1 ml-auto bg-brand-bg rounded-lg p-1">
          <InfoBubble id={TOOLTIPS.map_view_toggle.id} text={TOOLTIPS.map_view_toggle.text} position="bottom" />
          <button
            onClick={() => setView('list')}
            className={'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' + (view === 'list' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text')}
          >
            <List size={16} className="inline mr-1" />
            List
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const t = translations[s.service_id]
              return (
                <ServiceCard
                  key={s.service_id}
                  serviceId={s.service_id}
                  name={s.service_name}
                  orgName={s.org_name}
                  orgId={s.org_id ?? undefined}
                  description={s.description_5th_grade}
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

          {filtered.length === 0 && (
            <p className="text-center text-brand-muted py-12">No services found matching your search.</p>
          )}
        </>
      )}
    </div>
  )
}
