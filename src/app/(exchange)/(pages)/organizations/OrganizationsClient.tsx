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

const ORG_TYPES: Array<{ label: string; color: string }> = [
  { label: 'Community Partner', color: '#805ad5' },
  { label: 'Foundation/Grantmaker', color: '#d69e2e' },
  { label: 'Government Agency', color: '#3182ce' },
  { label: 'Educational Institution', color: '#319795' },
  { label: 'Media & News', color: '#e53e3e' },
  { label: 'Healthcare Provider', color: '#38a169' },
  { label: 'Human Services', color: '#dd6b20' },
  { label: 'Advocacy/Policy', color: '#C75B2A' },
  { label: 'Arts, Culture & Humanities', color: '#805ad5' },
]

const ORG_TYPE_COLOR: Record<string, string> = {}
for (const t of ORG_TYPES) ORG_TYPE_COLOR[t.label] = t.color

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
      <div className="flex flex-col sm:flex-row gap-3 mb-5 p-4 bg-white rounded-card border-2 border-brand-text" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by name, city, or ZIP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-brand-border bg-brand-bg text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="px-3 py-2.5 rounded-lg border-2 border-brand-border bg-brand-bg text-sm font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
        >
          <option value="">All types ({organizations.length})</option>
          {ORG_TYPES.filter(t => typeCounts[t.label]).map(t => (
            <option key={t.label} value={t.label}>{t.label} ({typeCounts[t.label]})</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted">
          {filtered.length} of {organizations.length} organizations
        </p>
        {typeFilter && (
          <button onClick={() => setTypeFilter(null)} className="text-xs font-semibold text-brand-accent hover:underline">
            Clear filter
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {filtered.map(org => {
          const color = ORG_TYPE_COLOR[org.org_type || ''] || '#C75B2A'
          return (
            <Link
              key={org.org_id}
              href={`/organizations/${org.org_id}`}
              className="group relative bg-white rounded-card border-2 border-brand-text overflow-hidden flex flex-col hover:-translate-y-0.5 transition-all duration-200"
              style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
            >
              {/* Left color bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: color }} />

              <div className="pl-5 pr-5 pt-5 pb-4 flex flex-col flex-1">
                <div className="flex items-start gap-4 mb-3">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt=""
                      className="w-14 h-14 rounded-lg object-contain bg-brand-bg border border-brand-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + '15' }}>
                      <span className="font-serif font-bold text-xl" style={{ color }}>
                        {org.org_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif font-bold text-brand-text leading-tight group-hover:text-brand-accent transition-colors line-clamp-2">
                      {org.org_name}
                    </h3>
                    {org.org_type && (
                      <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color }} />
                        {org.org_type}
                      </span>
                    )}
                  </div>
                </div>

                {(org.description_5th_grade || org.mission_statement) && (
                  <p className="text-sm text-brand-muted leading-relaxed mb-4 line-clamp-3 flex-1">
                    {org.description_5th_grade || org.mission_statement}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-brand-muted mt-auto pt-3 border-t border-brand-border/50">
                  {org.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} /> {org.city}{org.zip_code ? `, ${org.zip_code}` : ''}
                    </span>
                  )}
                  {org.website && (
                    <span className="flex items-center gap-1.5 text-brand-accent">
                      <Globe size={13} /> Website
                    </span>
                  )}
                  {org.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} /> {org.phone}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
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
