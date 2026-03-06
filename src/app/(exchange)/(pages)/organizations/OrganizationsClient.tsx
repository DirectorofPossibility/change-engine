'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Globe, Phone, MapPin } from 'lucide-react'

type Org = {
  org_id: string
  org_name: string | null
  description_5th_grade: string | null
  website: string | null
  phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  logo_url: string | null
  org_type: string | null
  mission_statement: string | null
  service_area: string | null
  focus_area_ids: string | null
  ntee_code: string | null
}

const ORG_TYPES = [
  'Community Partner',
  'Foundation/Grantmaker',
  'Government Agency',
  'Educational Institution',
  'Media & News',
  'Healthcare Provider',
  'Human Services',
  'Advocacy/Policy',
  'Arts, Culture & Humanities',
]

export function OrganizationsClient({ organizations }: { organizations: Org[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = organizations
    if (typeFilter) {
      result = result.filter(o => o.org_type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        (o.org_name?.toLowerCase().includes(q)) ||
        (o.description_5th_grade?.toLowerCase().includes(q)) ||
        (o.city?.toLowerCase().includes(q)) ||
        (o.zip_code?.includes(q))
      )
    }
    return result
  }, [organizations, search, typeFilter])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of organizations) {
      if (o.org_type) counts[o.org_type] = (counts[o.org_type] || 0) + 1
    }
    return counts
  }, [organizations])

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search organizations by name, city, or ZIP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="px-3 py-2.5 rounded-lg border border-brand-border bg-white text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
        >
          <option value="">All types ({organizations.length})</option>
          {ORG_TYPES.filter(t => typeCounts[t]).map(t => (
            <option key={t} value={t}>{t} ({typeCounts[t]})</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-brand-muted mb-4">
        Showing {filtered.length} of {organizations.length} organizations
        {typeFilter && <button onClick={() => setTypeFilter(null)} className="ml-2 text-brand-accent hover:underline">Clear filter</button>}
      </p>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(org => (
          <Link
            key={org.org_id}
            href={`/organizations/${org.org_id}`}
            className="group bg-white rounded-xl border border-brand-border p-5 hover:shadow-lg transition-shadow flex flex-col"
          >
            <div className="flex items-start gap-3 mb-3">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-contain bg-brand-bg flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-accent font-bold text-sm">
                    {org.org_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-brand-text text-sm leading-tight group-hover:text-brand-accent transition-colors line-clamp-2">
                  {org.org_name}
                </h3>
                {org.org_type && (
                  <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wider">
                    {org.org_type}
                  </span>
                )}
              </div>
            </div>
            {(org.description_5th_grade || org.mission_statement) && (
              <p className="text-xs text-brand-muted leading-relaxed mb-3 line-clamp-3 flex-1">
                {org.description_5th_grade || org.mission_statement}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-muted mt-auto pt-2 border-t border-brand-border/50">
              {org.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {org.city}
                </span>
              )}
              {org.website && (
                <span className="flex items-center gap-1">
                  <Globe size={11} /> Website
                </span>
              )}
              {org.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {org.phone}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-brand-muted">No organizations match your search.</p>
          <button onClick={() => { setSearch(''); setTypeFilter(null) }} className="mt-2 text-sm text-brand-accent hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
