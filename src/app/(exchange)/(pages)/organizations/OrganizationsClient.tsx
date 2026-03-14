'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MapPin } from 'lucide-react'
import Image from 'next/image'

type Org = {
  org_id: string
  org_name: string | null
  description_5th_grade: string | null
  website: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
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
  { label: 'Community Partner', color: '#1b5e8a' },
  { label: 'Foundation/Grantmaker', color: '#4a2870' },
  { label: 'Government Agency', color: '#6a4e10' },
  { label: 'Educational Institution', color: '#1a5030' },
  { label: 'Media & News', color: '#1a6b56' },
  { label: 'Healthcare Provider', color: '#7a2018' },
  { label: 'Human Services', color: '#1e4d7a' },
  { label: 'Advocacy/Policy', color: '#C75B2A' },
  { label: 'Arts, Culture & Humanities', color: '#1b5e8a' },
  { label: 'Environmental', color: '#276749' },
  { label: 'Faith-Based', color: '#b7791f' },
]

const ORG_TYPE_COLOR: Record<string, string> = {}
for (const t of ORG_TYPES) ORG_TYPE_COLOR[t.label] = t.color

// Houston-area cities that count as "local"
const HOUSTON_AREA_CITIES = new Set([
  'houston', 'pasadena', 'sugar land', 'pearland', 'league city',
  'baytown', 'missouri city', 'the woodlands', 'conroe', 'spring',
  'katy', 'humble', 'kingwood', 'cypress', 'tomball', 'friendswood',
  'deer park', 'la porte', 'galveston', 'webster', 'clear lake',
  'bellaire', 'west university place', 'stafford', 'richmond',
  'rosenberg', 'alvin', 'angleton', 'dickinson', 'texas city',
  'la marque', 'seabrook', 'kemah', 'mont belvieu',
])

type GeoScope = 'local' | 'regional' | 'national'

function classifyScope(org: Org): GeoScope {
  const sa = (org.service_area || '').toLowerCase()

  // Use service_area directly when set
  if (sa === 'greater houston' || sa === 'houston metropolitan area') return 'local'
  if (sa === 'texas') return 'regional'
  if (sa === 'national' || sa === 'international') return 'national'

  // Fallback: infer from city/state
  const city = (org.city || '').toLowerCase().trim()
  const state = (org.state || '').toUpperCase().trim()

  if (HOUSTON_AREA_CITIES.has(city) || city.includes('houston')) return 'local'
  if (state === 'TX' || state === 'TEXAS') return 'regional'

  return 'national'
}

const SCOPE_CONFIG: Record<GeoScope, { label: string; description: string; color: string }> = {
  local: {
    label: 'Houston Area',
    description: 'Organizations based in the Greater Houston region',
    color: '#1a6b56',
  },
  regional: {
    label: 'Texas & Regional',
    description: 'Statewide and regional organizations serving Houston',
    color: '#1e4d7a',
  },
  national: {
    label: 'National & Beyond',
    description: 'National and international organizations with Houston-relevant programs',
    color: '#4a2870',
  },
}

const SCOPE_ORDER: GeoScope[] = ['local', 'regional', 'national']

interface OrganizationsClientProps {
  organizations: Org[]
  userZip?: string
}

export function OrganizationsClient({ organizations, userZip }: OrganizationsClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [scopeFilter, setScopeFilter] = useState<GeoScope | null>(null)

  // Classify all orgs by scope
  const orgsWithScope = useMemo(() => {
    return organizations.map(o => ({ ...o, _scope: classifyScope(o) }))
  }, [organizations])

  const filtered = useMemo(() => {
    let result = orgsWithScope
    if (typeFilter) {
      result = result.filter(o => o.org_type === typeFilter)
    }
    if (scopeFilter) {
      result = result.filter(o => o._scope === scopeFilter)
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
  }, [orgsWithScope, search, typeFilter, scopeFilter])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const o of organizations) {
      if (o.org_type) counts[o.org_type] = (counts[o.org_type] || 0) + 1
    }
    return counts
  }, [organizations])

  const scopeCounts = useMemo(() => {
    const counts: Record<GeoScope, number> = { local: 0, regional: 0, national: 0 }
    for (const o of orgsWithScope) {
      counts[o._scope]++
    }
    return counts
  }, [orgsWithScope])

  // Group filtered results by scope
  const grouped = useMemo(() => {
    const groups: Record<GeoScope, typeof filtered> = { local: [], regional: [], national: [] }
    for (const o of filtered) {
      groups[o._scope].push(o)
    }
    return groups
  }, [filtered])

  const isSearching = search.trim().length > 0 || typeFilter !== null

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name, city, or ZIP..."
            aria-label="Search organizations"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-rule bg-white text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-blue/30 focus:border-blue"
          />
        </div>
        <select
          value={typeFilter || ''}
          onChange={e => setTypeFilter(e.target.value || null)}
          className="px-2.5 py-2 border border-rule bg-white text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-blue/30"
        >
          <option value="">All types ({organizations.length})</option>
          {ORG_TYPES.filter(t => typeCounts[t.label]).map(t => (
            <option key={t.label} value={t.label}>{t.label} ({typeCounts[t.label]})</option>
          ))}
        </select>
        {(typeFilter || scopeFilter) && (
          <button onClick={() => { setTypeFilter(null); setScopeFilter(null) }} className="text-xs font-semibold text-blue hover:underline shrink-0">
            Clear filters
          </button>
        )}
      </div>

      {/* Scope tabs */}
      <div className="flex gap-1 mb-6 border-b border-rule">
        <button
          onClick={() => setScopeFilter(null)}
          className={'px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ' + (scopeFilter === null ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')}
        >
          All ({filtered.length})
        </button>
        {SCOPE_ORDER.map(scope => (
          <button
            key={scope}
            onClick={() => setScopeFilter(scopeFilter === scope ? null : scope)}
            className={'px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ' + (scopeFilter === scope ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink')}
          >
            <span className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle" style={{ background: SCOPE_CONFIG[scope].color }} />
            {SCOPE_CONFIG[scope].label} ({scopeCounts[scope]})
          </button>
        ))}
      </div>

      {/* Grouped sections or flat when filtering by scope */}
      {scopeFilter ? (
        <OrgGrid orgs={filtered} />
      ) : (
        SCOPE_ORDER.map(scope => {
          const scopeOrgs = grouped[scope]
          if (scopeOrgs.length === 0) return null
          const config = SCOPE_CONFIG[scope]
          return (
            <section key={scope} className="mb-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: config.color }} />
                <h3 className="font-display font-bold text-lg text-ink">{config.label}</h3>
                <span className="text-xs text-muted font-mono">({scopeOrgs.length})</span>
              </div>
              <p className="text-xs text-muted mb-3">{config.description}</p>
              <OrgGrid orgs={scopeOrgs} />
            </section>
          )
        })
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted">No organizations match your search.</p>
          <button onClick={() => { setSearch(''); setTypeFilter(null); setScopeFilter(null) }} className="mt-2 text-sm text-blue hover:underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function OrgGrid({ orgs }: { orgs: Array<Org & { _scope: GeoScope }> }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {orgs.map(org => {
        const color = ORG_TYPE_COLOR[org.org_type || ''] || '#C75B2A'
        return (
          <Link
            key={org.org_id}
            href={'/organizations/' + org.org_id}
            className="group relative bg-white border border-rule overflow-hidden flex items-start gap-3 p-3 hover:border-ink hover:-translate-y-px transition-all duration-150"
          >
            {/* Left color bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: color }} />

            {org.logo_url ? (
              <Image
                src={org.logo_url}
                alt=""
                className="w-10 h-10 rounded-md object-contain bg-paper border border-rule flex-shrink-0 ml-1"
                width={48} height={40}
              />
            ) : (
              <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ml-1" style={{ background: color + '12' }}>
                <span className="font-display font-bold text-lg" style={{ color }}>
                  {org.org_name?.charAt(0) || '?'}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-[13px] text-ink leading-snug group-hover:text-blue transition-colors line-clamp-1">
                  {org.org_name}
                </h3>
                {org.is_verified === 'Yes' && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
                    <path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" fill="#1b5e8a" />
                    <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {(org.description_5th_grade || org.mission_statement) && (
                <p className="text-[11px] text-muted leading-snug mt-0.5 line-clamp-2">
                  {org.description_5th_grade || org.mission_statement}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-light">
                {org.org_type === 'Community Partner' ? (
                  <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#1b5e8a' }}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="#1b5e8a"><path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" /></svg>
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
                    <MapPin size={9} /> {org.city}{org.state && org.state !== 'TX' ? ', ' + org.state : ''}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
