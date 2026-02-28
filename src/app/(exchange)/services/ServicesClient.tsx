'use client'

import { useState, useMemo } from 'react'
import { SearchBar } from '@/components/exchange/SearchBar'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import type { ServiceWithOrg } from '@/lib/types/exchange'

interface ServicesClientProps {
  services: ServiceWithOrg[]
}

export function ServicesClient({ services }: ServicesClientProps) {
  const [search, setSearch] = useState('')
  const [zipFilter, setZipFilter] = useState('')

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-72">
          <SearchBar placeholder="Search services..." onSearch={setSearch} />
        </div>
        <input
          type="text"
          placeholder="ZIP code"
          value={zipFilter}
          onChange={(e) => setZipFilter(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm w-32"
          maxLength={5}
        />
        <span className="text-sm text-brand-muted self-center">{filtered.length} services</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <ServiceCard
            key={s.service_id}
            name={s.service_name}
            orgName={s.org_name}
            description={s.description_5th_grade}
            phone={s.phone}
            address={s.address}
            city={s.city}
            state={s.state}
            zipCode={s.zip_code}
            website={s.website}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-brand-muted py-12">No services found matching your search.</p>
      )}
    </div>
  )
}
