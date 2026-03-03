'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FocusAreaItem {
  focus_id: string
  focus_area_name: string
  is_bridging: boolean | null
  sdg_id: string | null
  sdoh_code: string | null
  theme_id: string | null
}

interface ThemeGroup {
  id: string
  name: string
  color: string
  emoji: string
  focusAreas: FocusAreaItem[]
}

interface SDGItem {
  sdg_id: string
  sdg_number: number
  sdg_name: string
  sdg_color: string | null
}

interface SDOHItem {
  sdoh_code: string
  sdoh_name: string
}

interface ExploreFilterClientProps {
  themes: ThemeGroup[]
  unthemedAreas: FocusAreaItem[]
  sdgs: SDGItem[]
  sdohDomains: SDOHItem[]
}

export function ExploreFilterClient({ themes, unthemedAreas, sdgs, sdohDomains }: ExploreFilterClientProps) {
  const [activeSDG, setActiveSDG] = useState<string | null>(null)
  const [activeSDOH, setActiveSDOH] = useState<string | null>(null)

  function matchesFilters(fa: FocusAreaItem) {
    if (activeSDG && fa.sdg_id !== activeSDG) return false
    if (activeSDOH && fa.sdoh_code !== activeSDOH) return false
    return true
  }

  let totalVisible = 0

  return (
    <div>
      {/* SDG filter row */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-brand-muted mb-2">Filter by SDG</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={function () { setActiveSDG(null) }}
            className={'px-3 py-1.5 rounded-full text-xs font-medium transition-colors ' +
              (!activeSDG ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text')}
          >
            All
          </button>
          {sdgs.map(function (s) {
            const isActive = activeSDG === s.sdg_id
            return (
              <button
                key={s.sdg_id}
                onClick={function () { setActiveSDG(isActive ? null : s.sdg_id) }}
                className={'px-3 py-1.5 rounded-full text-xs font-medium transition-colors ' +
                  (isActive ? 'text-white' : 'border text-brand-muted hover:text-brand-text')}
                style={isActive ? { backgroundColor: s.sdg_color || '#3182ce' } : { borderColor: s.sdg_color || '#3182ce', color: s.sdg_color || '#3182ce' }}
              >
                {s.sdg_number}
              </button>
            )
          })}
        </div>
      </div>

      {/* SDOH filter row */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-brand-muted mb-2">Filter by SDOH Domain</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={function () { setActiveSDOH(null) }}
            className={'px-3 py-1.5 rounded-full text-xs font-medium transition-colors ' +
              (!activeSDOH ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text')}
          >
            All
          </button>
          {sdohDomains.map(function (d) {
            const isActive = activeSDOH === d.sdoh_code
            return (
              <button
                key={d.sdoh_code}
                onClick={function () { setActiveSDOH(isActive ? null : d.sdoh_code) }}
                className={'px-3 py-1.5 rounded-full text-xs font-medium transition-colors ' +
                  (isActive ? 'bg-green-600 text-white' : 'bg-white border border-green-300 text-green-700 hover:bg-green-50')}
              >
                {d.sdoh_name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Focus areas grouped by pathway */}
      <div className="space-y-8">
        {themes.map(function (theme) {
          const filtered = theme.focusAreas.filter(matchesFilters)
          if (filtered.length === 0) return null
          totalVisible += filtered.length
          return (
            <div key={theme.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{theme.emoji}</span>
                <h2 className="text-lg font-bold text-brand-text">{theme.name}</h2>
                <span className="text-xs text-brand-muted">({filtered.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filtered.map(function (fa) {
                  let baseClass = 'text-xs px-3 py-1.5 rounded-full bg-white text-brand-text hover:shadow-md transition-shadow'
                  if (fa.is_bridging) {
                    baseClass += ' border border-dashed'
                  } else {
                    baseClass += ' border border-brand-border'
                  }
                  return (
                    <Link
                      key={fa.focus_id}
                      href={'/explore/focus/' + fa.focus_id}
                      className={baseClass}
                      style={{ borderColor: fa.is_bridging ? theme.color : undefined }}
                    >
                      {fa.focus_area_name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Unthemed focus areas */}
        {(function () {
          const filtered = unthemedAreas.filter(matchesFilters)
          if (filtered.length === 0) return null
          totalVisible += filtered.length
          return (
            <div>
              <h2 className="text-lg font-bold text-brand-text mb-3">Other Focus Areas</h2>
              <div className="flex flex-wrap gap-2">
                {filtered.map(function (fa) {
                  return (
                    <Link
                      key={fa.focus_id}
                      href={'/explore/focus/' + fa.focus_id}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-brand-border text-brand-text hover:shadow-md transition-shadow"
                    >
                      {fa.focus_area_name}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Empty state */}
      {totalVisible === 0 && (activeSDG || activeSDOH) && (
        <p className="text-center text-brand-muted py-12">No focus areas match the selected filters.</p>
      )}
    </div>
  )
}
