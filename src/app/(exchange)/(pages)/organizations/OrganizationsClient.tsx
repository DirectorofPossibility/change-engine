'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'

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
  is_verified: string | null
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
  { label: 'Environmental', color: '#276749' },
  { label: 'Faith-Based', color: '#b7791f' },
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
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by name, city, or ZIP..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg border-2 border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="px-2.5 py-2 rounded-lg border-2 border-brand-border bg-white text-xs font-semibold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
        >
          <option value="">All ({organizations.length})</option>
          {ORG_TYPES.filter(t => typeCounts[t.label]).map(t => (
            <option key={t.label} value={t.label}>{t.label} ({typeCounts[t.label]})</option>
          ))}
        </select>
        {typeFilter && (
          <button onClick={() => setTypeFilter(null)} className="text-xs font-semibold text-brand-accent hover:underline shrink-0">
            Clear
          </button>
        )}
      </div>

      {/* Grid — compact cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(org => {
          const color = ORG_TYPE_COLOR[org.org_type || ''] || '#C75B2A'
          return (
            <Link
              key={org.org_id}
              href={`/organizations/${org.org_id}`}
              className="group relative bg-white rounded-lg border-2 border-brand-border overflow-hidden flex items-start gap-3 p-3 hover:border-brand-text hover:-translate-y-px transition-all duration-150"
              style={{ boxShadow: '2px 2px 0 #E2DDD5' }}
            >
              {/* Left color bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />

              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt=""
                  className="w-10 h-10 rounded-md object-contain bg-brand-bg border-2 border-brand-border flex-shrink-0 ml-1"
                />
              ) : (
                <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ml-1" style={{ background: color + '12' }}>
                  <span className="font-serif font-bold text-lg" style={{ color }}>
                    {org.org_name?.charAt(0) || '?'}
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-[13px] text-brand-text leading-snug group-hover:text-brand-accent transition-colors line-clamp-1">
                    {org.org_name}
                  </h3>
                  {org.is_verified === 'Yes' && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                      <path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" fill="#805ad5" />
                      <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {(org.description_5th_grade || org.mission_statement) && (
                  <p className="text-[11px] text-brand-muted leading-snug mt-0.5 line-clamp-2">
                    {org.description_5th_grade || org.mission_statement}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-muted-light">
                  {org.org_type === 'Community Partner' ? (
                    <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#805ad5' }}>
                      <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="#805ad5"><path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" /></svg>
                      Community Partner
                    </span>
                  ) : org.org_type ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-sm" style={{ background: color }} />
                      {org.org_type}
                    </span>
                  ) : null}
                  {org.city && (
                    <span className="flex items-center gap-0.5">
                      <MapPin size={9} /> {org.city}
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
