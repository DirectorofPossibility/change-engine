'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { THEMES } from '@/lib/constants'
import { Check, Save, Loader2 } from 'lucide-react'

interface FocusArea {
  focus_id: string
  focus_area_name: string
  theme_id: string | null
  description: string | null
}

interface PreferencesClientProps {
  focusAreas: FocusArea[]
  currentInterests: string[]
}

const THEME_ENTRIES = Object.entries(THEMES) as [string, { name: string; color: string; slug: string; description: string }][]

export function PreferencesClient({ focusAreas, currentInterests }: PreferencesClientProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set(currentInterests))
  const [expandedPathways, setExpandedPathways] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Group focus areas by theme
  const focusByTheme = useMemo(function () {
    const map: Record<string, FocusArea[]> = {}
    for (const fa of focusAreas) {
      const key = fa.theme_id || 'none'
      if (!map[key]) map[key] = []
      map[key].push(fa)
    }
    return map
  }, [focusAreas])

  // Compute which pathways have any selected focus areas
  const activePathways = useMemo(function () {
    const set = new Set<string>()
    for (const fa of focusAreas) {
      if (fa.theme_id && selected.has(fa.focus_id)) {
        set.add(fa.theme_id)
      }
    }
    return set
  }, [focusAreas, selected])

  function toggleFocusArea(focusId: string) {
    setSaved(false)
    setSelected(function (prev) {
      const next = new Set(prev)
      if (next.has(focusId)) {
        next.delete(focusId)
      } else {
        next.add(focusId)
      }
      return next
    })
  }

  function togglePathway(themeId: string) {
    setSaved(false)
    const themeFocusAreas = focusByTheme[themeId] || []
    const allSelected = themeFocusAreas.every(function (fa) { return selected.has(fa.focus_id) })

    setSelected(function (prev) {
      const next = new Set(prev)
      for (const fa of themeFocusAreas) {
        if (allSelected) {
          next.delete(fa.focus_id)
        } else {
          next.add(fa.focus_id)
        }
      }
      return next
    })
  }

  function toggleExpanded(themeId: string) {
    setExpandedPathways(function (prev) {
      const next = new Set(prev)
      if (next.has(themeId)) {
        next.delete(themeId)
      } else {
        next.add(themeId)
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_profiles')
        .update({ focus_area_interests: Array.from(selected) } as any)
        .eq('auth_id', user.id)

      setSaved(true)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = (() => {
    if (selected.size !== currentInterests.length) return true
    for (const id of currentInterests) {
      if (!selected.has(id)) return true
    }
    return false
  })()

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Content Preferences</h1>
          <p className="text-brand-muted mt-1">
            Choose the pathways and focus areas that matter to you. Your dashboard will highlight content in these areas.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className={
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ' +
            (saved
              ? 'bg-green-100 text-green-700'
              : hasChanges
                ? 'bg-brand-accent text-white hover:bg-brand-accent/90'
                : 'bg-brand-border text-brand-muted cursor-not-allowed')
          }
        >
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check size={16} /> Saved</>
          ) : (
            <><Save size={16} /> Save Preferences</>
          )}
        </button>
      </div>

      <p className="text-sm text-brand-muted mb-4">
        {selected.size} focus area{selected.size !== 1 ? 's' : ''} selected across {activePathways.size} pathway{activePathways.size !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {THEME_ENTRIES.map(function ([themeId, theme]) {
          const themeFocusAreas = focusByTheme[themeId] || []
          const selectedCount = themeFocusAreas.filter(function (fa) { return selected.has(fa.focus_id) }).length
          const allSelected = themeFocusAreas.length > 0 && selectedCount === themeFocusAreas.length
          const isExpanded = expandedPathways.has(themeId)

          return (
            <div key={themeId} className="bg-white rounded-lg border border-brand-border overflow-hidden">
              {/* Pathway header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={function () { togglePathway(themeId) }}
                  className={
                    'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ' +
                    (allSelected
                      ? 'border-transparent'
                      : selectedCount > 0
                        ? 'border-current opacity-60'
                        : 'border-brand-border')
                  }
                  style={allSelected || selectedCount > 0 ? { backgroundColor: theme.color, borderColor: theme.color } : undefined}
                >
                  {(allSelected || selectedCount > 0) && <Check size={12} className="text-white" />}
                </button>

                <button
                  onClick={function () { toggleExpanded(themeId) }}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="font-semibold text-brand-text">{theme.name}</span>
                  <span className="text-xs text-brand-muted">
                    {selectedCount > 0 ? selectedCount + '/' + themeFocusAreas.length : themeFocusAreas.length + ' areas'}
                  </span>
                  <span className="ml-auto text-brand-muted text-xs">
                    {isExpanded ? 'collapse' : 'expand'}
                  </span>
                </button>
              </div>

              {/* Focus areas */}
              {isExpanded && themeFocusAreas.length > 0 && (
                <div className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {themeFocusAreas.map(function (fa) {
                      const isSelected = selected.has(fa.focus_id)
                      return (
                        <button
                          key={fa.focus_id}
                          onClick={function () { toggleFocusArea(fa.focus_id) }}
                          className={
                            'flex items-start gap-2 p-2.5 rounded-md text-left text-sm transition-colors ' +
                            (isSelected
                              ? 'bg-brand-accent/5 ring-1 ring-brand-accent/30'
                              : 'hover:bg-brand-bg-alt')
                          }
                        >
                          <div
                            className={
                              'flex-shrink-0 w-4 h-4 mt-0.5 rounded border flex items-center justify-center transition-colors ' +
                              (isSelected ? 'border-brand-accent bg-brand-accent' : 'border-brand-border')
                            }
                          >
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                          <div className="min-w-0">
                            <span className={isSelected ? 'font-medium text-brand-text' : 'text-brand-muted'}>
                              {fa.focus_area_name}
                            </span>
                            {fa.description && (
                              <p className="text-xs text-brand-muted mt-0.5 line-clamp-2">{fa.description}</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {isExpanded && themeFocusAreas.length === 0 && (
                <p className="px-4 pb-4 text-sm text-brand-muted">No focus areas defined for this pathway yet.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
