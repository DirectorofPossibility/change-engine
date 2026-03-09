'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import FoundationsGalaxy from './FoundationsGalaxy'

/* ── Types ── */
interface Foundation {
  id: string
  name: string
  slug: string
  mission?: string | null
  type?: string | null
  geo_level: string
  assets?: string | null
  annual_giving?: string | null
  website_url?: string | null
  website_display?: string | null
  city?: string | null
  state_code?: string | null
  founded_year?: number | null
  is_spotlight: boolean
  org_id?: string | null
  pathways: string[]
  focusAreas: { name: string; id?: string }[]
}

interface Props {
  foundations: Foundation[]
  totalCount: number
}

/* ── Pathway lookup ── */
const PW: Record<string, { name: string; color: string; slug: string }> = {
  health:       { name: 'Health',       color: '#e53e3e', slug: 'health' },
  families:     { name: 'Families',     color: '#dd6b20', slug: 'families' },
  neighborhood: { name: 'Neighborhood', color: '#d69e2e', slug: 'neighborhood' },
  voice:        { name: 'Voice',        color: '#38a169', slug: 'voice' },
  money:        { name: 'Money',        color: '#3182ce', slug: 'money' },
  planet:       { name: 'Planet',       color: '#319795', slug: 'planet' },
  bigger_we:    { name: 'The Bigger We',    color: '#805ad5', slug: 'the-bigger-we' },
}

/* ── Geo levels ── */
const GEO: { id: string; name: string; short: string; color: string }[] = [
  { id: 'city',          name: 'City of Houston',  short: 'Houston',    color: '#FFD166' },
  { id: 'county',        name: 'Harris County',    short: 'Harris Co.', color: '#F4845F' },
  { id: 'metro',         name: 'Greater Houston',  short: 'Metro',      color: '#EF476F' },
  { id: 'state',         name: 'State of Texas',   short: 'Texas',      color: '#06D6A0' },
  { id: 'federal',       name: 'Federal',          short: 'Federal',    color: '#118AB2' },
  { id: 'international', name: 'International',    short: 'Intl',       color: '#9B5DE5' },
]
const GM = Object.fromEntries(GEO.map(g => [g.id, g]))

/* ── Foundation Card ── */
function FoundationCard({ f }: { f: Foundation }) {
  const geo = GM[f.geo_level] || GEO[0]
  return (
    <Link
      href={`/foundations/${f.id}`}
      className="group bg-white rounded-lg border-2 border-brand-border hover:border-brand-text hover:-translate-y-px transition-all duration-150 overflow-hidden block"
      style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
    >
      {/* Left color bar */}
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: geo.color }} />
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <h3 className="text-sm font-serif font-bold text-brand-text leading-snug group-hover:text-brand-accent transition-colors">
                {f.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: geo.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: geo.color }} />
                  {geo.short}
                </span>
                {f.type && <span className="text-[10px] text-brand-muted">{f.type}</span>}
              </div>
            </div>
            {f.assets && (
              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-brand-accent">{f.assets}</span>
                {f.annual_giving && (
                  <div className="text-[10px] text-brand-muted">{f.annual_giving}/yr</div>
                )}
              </div>
            )}
          </div>

          {f.mission && (
            <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 mb-2">{f.mission}</p>
          )}

          {/* Pathway dots */}
          {f.pathways.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {f.pathways.slice(0, 4).map(pid => {
                const pw = PW[pid]
                if (!pw) return null
                return (
                  <span key={pid} className="inline-flex items-center gap-1 text-[9px] font-medium" style={{ color: pw.color }}>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: pw.color }} />
                    {pw.name}
                  </span>
                )
              })}
            </div>
          )}

          {/* Focus areas */}
          {f.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {f.focusAreas.slice(0, 3).map(fa => (
                <span key={fa.name} className="text-[9px] px-1.5 py-0.5 bg-brand-bg rounded text-brand-muted border border-brand-border">
                  {fa.name}
                </span>
              ))}
              {f.focusAreas.length > 3 && (
                <span className="text-[9px] text-brand-muted">+{f.focusAreas.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── Spotlight Card (larger, horizontal) ── */
function SpotlightCard({ f }: { f: Foundation }) {
  const geo = GM[f.geo_level] || GEO[0]
  return (
    <Link
      href={`/foundations/${f.id}`}
      className="group flex-shrink-0 w-[340px] bg-white rounded-lg border-2 border-brand-accent/20 hover:border-brand-accent hover:-translate-y-px transition-all duration-150 overflow-hidden block"
      style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
    >
      {/* Accent top bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: geo.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-serif font-bold text-brand-text leading-snug group-hover:text-brand-accent transition-colors">
              {f.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: geo.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: geo.color }} />
                {geo.short}
              </span>
              {f.city && <span className="text-[10px] text-brand-muted">{f.city}, {f.state_code}</span>}
            </div>
          </div>
          {f.assets && (
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-brand-accent">{f.assets}</span>
              {f.annual_giving && (
                <div className="text-[10px] text-brand-muted">{f.annual_giving}/yr</div>
              )}
            </div>
          )}
        </div>

        {f.mission && (
          <p className="text-xs text-brand-muted leading-relaxed line-clamp-3 mb-3">{f.mission}</p>
        )}

        {/* Pathway dots */}
        {f.pathways.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {f.pathways.slice(0, 5).map(pid => {
              const pw = PW[pid]
              if (!pw) return null
              return (
                <span key={pid} className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: pw.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pw.color }} />
                  {pw.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN CLIENT COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function FoundationsListClient({ foundations, totalCount }: Props) {
  const [view, setView] = useState<'list' | 'galaxy'>('list')
  const [q, setQ] = useState('')
  const [geoF, setGeoF] = useState<string | null>(null)
  const [pwF, setPwF] = useState<string | null>(null)

  const spotlight = useMemo(() => foundations.filter(f => f.is_spotlight), [foundations])

  const filtered = useMemo(() => {
    return foundations.filter(f => {
      if (geoF && f.geo_level !== geoF) return false
      if (pwF && !f.pathways.includes(pwF)) return false
      if (q) {
        const s = q.toLowerCase()
        return (
          f.name.toLowerCase().includes(s) ||
          (f.mission || '').toLowerCase().includes(s) ||
          f.focusAreas.some(fa => fa.name.toLowerCase().includes(s)) ||
          (f.city || '').toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [foundations, geoF, pwF, q])

  /* Pathway counts */
  const pwCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of foundations) {
      for (const pid of f.pathways) {
        counts[pid] = (counts[pid] || 0) + 1
      }
    }
    return Object.entries(PW)
      .map(([id, pw]) => ({ id, ...pw, count: counts[id] || 0 }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [foundations])

  /* Geo counts */
  const geoCounts = useMemo(() => {
    return GEO.map(g => ({
      ...g,
      count: foundations.filter(f => f.geo_level === g.id).length,
    })).filter(g => g.count > 0)
  }, [foundations])

  if (view === 'galaxy') {
    return (
      <div>
        {/* Toggle back to list */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => setView('list')}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-accent hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to list view
          </button>
        </div>
        <FoundationsGalaxy />
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* ── Spotlight Shelf ── */}
      {spotlight.length > 0 && (
        <section className="py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-brand-accent" />
            <h2 className="text-lg font-serif font-bold text-brand-text">Funder Spotlight</h2>
            <div className="h-px flex-1 bg-brand-border" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {spotlight.map(f => (
              <SpotlightCard key={f.id} f={f} />
            ))}
          </div>
        </section>
      )}

      {/* ── Controls Row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-brand-border mb-6">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search foundations..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white border border-brand-border text-brand-text placeholder:text-brand-muted-light focus:outline-none focus:border-brand-accent"
          />
        </div>

        {/* Filter chips + galaxy toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {(geoF || pwF || q) && (
            <button
              onClick={() => { setGeoF(null); setPwF(null); setQ('') }}
              className="text-[10px] font-medium text-brand-accent hover:underline"
            >
              Clear filters
            </button>
          )}

          <span className="text-xs text-brand-muted">
            {filtered.length} of {totalCount}
          </span>

          <div className="w-px h-4 bg-brand-border" />

          <button
            onClick={() => setView('galaxy')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-muted hover:text-brand-accent transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
              <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
            </svg>
            Galaxy view
          </button>
        </div>
      </div>

      {/* ── Main Grid: Filters sidebar + List ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block space-y-6">
          {/* Geographic Level */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Geographic Level</h3>
            <div className="space-y-1">
              <button
                onClick={() => setGeoF(null)}
                className={`flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${!geoF ? 'text-brand-accent font-semibold bg-brand-accent/5' : 'text-brand-muted hover:text-brand-text'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${!geoF ? 'bg-brand-accent' : 'bg-brand-border'}`} />
                All Levels
                <span className="ml-auto text-[10px]">{totalCount}</span>
              </button>
              {geoCounts.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGeoF(geoF === g.id ? null : g.id)}
                  className={`flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${geoF === g.id ? 'font-semibold' : 'text-brand-muted hover:text-brand-text'}`}
                  style={geoF === g.id ? { color: g.color, backgroundColor: g.color + '08' } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color, opacity: geoF === g.id ? 1 : 0.5 }} />
                  {g.name}
                  <span className="ml-auto text-[10px]">{g.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pathway */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Pathway</h3>
            <div className="space-y-1">
              <button
                onClick={() => setPwF(null)}
                className={`flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${!pwF ? 'text-brand-accent font-semibold bg-brand-accent/5' : 'text-brand-muted hover:text-brand-text'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${!pwF ? 'bg-brand-accent' : 'bg-brand-border'}`} />
                All Pathways
              </button>
              {pwCounts.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPwF(pwF === p.id ? null : p.id)}
                  className={`flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded transition-colors ${pwF === p.id ? 'font-semibold' : 'text-brand-muted hover:text-brand-text'}`}
                  style={pwF === p.id ? { color: p.color, backgroundColor: p.color + '08' } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color, opacity: pwF === p.id ? 1 : 0.5 }} />
                  {p.name}
                  <span className="ml-auto text-[10px]">{p.count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* List */}
        <div>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-brand-muted">
              No foundations match your filters.
            </div>
          )}

          {GEO.filter(g => !geoF || g.id === geoF).map(g => {
            const gf = filtered.filter(f => f.geo_level === g.id)
            if (!gf.length) return null
            return (
              <section key={g.id} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-sm font-serif font-bold" style={{ color: g.color }}>{g.name}</span>
                  <span className="text-xs text-brand-muted">({gf.length})</span>
                  <div className="h-px flex-1 bg-brand-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gf.map(f => (
                    <FoundationCard key={f.id} f={f} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
