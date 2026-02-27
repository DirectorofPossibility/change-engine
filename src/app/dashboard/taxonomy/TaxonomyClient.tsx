'use client'

import { useState } from 'react'
import { THEMES } from '@/lib/constants'

interface ThemeRow {
  theme_id: string
  theme_name: string
  theme_color: string | null
  focus_area_count: number | null
  [key: string]: any
}

interface FocusAreaRow {
  focus_id: string
  focus_area_name: string
  theme_id: string | null
  sdg_id: string | null
  sdoh_code: string | null
  ntee_code: string | null
  airs_code: string | null
  is_bridging: boolean | null
  description: string | null
  [key: string]: any
}

export function TaxonomyClient({
  themes,
  focusAreas,
  sdgs,
  sdoh,
  ntee,
  airs,
}: {
  themes: ThemeRow[]
  focusAreas: FocusAreaRow[]
  sdgs: any[]
  sdoh: any[]
  ntee: any[]
  airs: any[]
}) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)

  const themeColors: Record<string, string> = {}
  for (const [key, val] of Object.entries(THEMES)) {
    themeColors[key] = val.color
  }

  const selectedFocusAreas = selectedTheme
    ? focusAreas.filter((fa) => fa.theme_id === selectedTheme)
    : []

  // Lookup maps
  const sdgMap: Record<string, string> = {}
  for (const s of sdgs) sdgMap[s.sdg_id] = `SDG ${s.sdg_number}: ${s.sdg_name}`
  const sdohMap: Record<string, string> = {}
  for (const s of sdoh) sdohMap[s.sdoh_code] = s.sdoh_name
  const nteeMap: Record<string, string> = {}
  for (const n of ntee) nteeMap[n.ntee_code] = n.ntee_name
  const airsMap: Record<string, string> = {}
  for (const a of airs) airsMap[a.airs_code] = a.airs_name

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Taxonomy Browser</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Left: Theme Cards */}
        <div className="col-span-4 space-y-3">
          <h2 className="text-sm font-semibold text-brand-muted uppercase">7 Pathways</h2>
          {themes.map((theme) => {
            const color = themeColors[theme.theme_id] || theme.theme_color || '#666'
            const faCount = theme.focus_area_count ?? focusAreas.filter((fa) => fa.theme_id === theme.theme_id).length
            const isSelected = selectedTheme === theme.theme_id
            return (
              <button
                key={theme.theme_id}
                onClick={() => setSelectedTheme(isSelected ? null : theme.theme_id)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${
                  isSelected
                    ? 'border-2 shadow-md'
                    : 'border-brand-border hover:shadow-sm'
                }`}
                style={{
                  borderColor: isSelected ? color : undefined,
                  backgroundColor: isSelected ? `${color}08` : 'white',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-medium">{theme.theme_name}</span>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-brand-muted">
                  <span>{faCount} focus areas</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: Focus Areas + Crosswalks */}
        <div className="col-span-8">
          {!selectedTheme ? (
            <div className="bg-white rounded-lg border border-brand-border p-12 text-center text-brand-muted">
              Select a pathway to view its focus areas and crosswalk mappings.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: themeColors[selectedTheme] || '#666' }}
                />
                <h2 className="text-lg font-semibold">
                  {themes.find((t) => t.theme_id === selectedTheme)?.theme_name} — Focus Areas
                </h2>
                <span className="text-sm text-brand-muted">({selectedFocusAreas.length})</span>
              </div>

              <div className="space-y-2">
                {selectedFocusAreas.map((fa) => (
                  <div
                    key={fa.focus_id}
                    className="bg-white rounded-lg border border-brand-border p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{fa.focus_area_name}</span>
                      {fa.is_bridging && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Bridging</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {fa.sdg_id && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded" title={sdgMap[fa.sdg_id]}>
                          {fa.sdg_id}
                        </span>
                      )}
                      {fa.sdoh_code && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded" title={sdohMap[fa.sdoh_code]}>
                          SDOH: {fa.sdoh_code}
                        </span>
                      )}
                      {fa.ntee_code && (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded" title={nteeMap[fa.ntee_code]}>
                          NTEE: {fa.ntee_code}
                        </span>
                      )}
                      {fa.airs_code && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded" title={airsMap[fa.airs_code]}>
                          AIRS: {fa.airs_code}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Crosswalk Legend */}
              <div className="bg-white rounded-lg border border-brand-border p-4 mt-6">
                <h3 className="text-xs font-semibold text-brand-muted uppercase mb-3">Crosswalk Legend</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">SDG</span>
                    <span className="text-brand-muted">UN Sustainable Development Goals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">SDOH</span>
                    <span className="text-brand-muted">Social Determinants of Health</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded">NTEE</span>
                    <span className="text-brand-muted">National Taxonomy of Exempt Entities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">AIRS</span>
                    <span className="text-brand-muted">Alliance of Information and Referral Systems</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
