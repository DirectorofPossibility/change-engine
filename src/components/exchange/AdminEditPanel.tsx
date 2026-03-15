'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Pencil, X, Save, Loader2, Search } from 'lucide-react'

export interface EditField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'search'
  options?: string[]
  value: string | number | null | undefined
  displayValue?: string | null
  searchEndpoint?: string
}

function SearchField({ field, value, displayValue, onChange }: {
  field: EditField
  value: string | number | null
  displayValue?: string | null
  onChange: (id: string | null, label: string | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ id: string; label: string }>>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(displayValue || null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const endpoint = field.searchEndpoint || '/api/admin/search-orgs'

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInput(q: string) {
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (q.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(endpoint + '?q=' + encodeURIComponent(q))
        const data = await res.json()
        setResults(data.results || [])
        setShowDropdown(true)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function handleSelect(item: { id: string; label: string }) {
    setSelectedLabel(item.label)
    setQuery('')
    setShowDropdown(false)
    onChange(item.id, item.label)
  }

  function handleClear() {
    setSelectedLabel(null)
    setQuery('')
    onChange(null, null)
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedLabel || value ? (
        <div className="flex items-center gap-2 px-3 py-2 text-sm border border-brand-border bg-white">
          <span className="flex-1 text-brand-text">{selectedLabel || value}</span>
          <button onClick={handleClear} className="text-brand-muted hover:text-red-600 transition-colors" type="button">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-brand-border bg-white text-brand-text focus:outline-none focus:border-brand-accent"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-muted" />
          {searching && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted animate-spin" />}
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 max-h-[200px] overflow-y-auto bg-white border border-brand-border shadow-lg">
          {results.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-cream transition-colors border-b border-brand-border last:border-0"
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
      {showDropdown && results.length === 0 && !searching && query.length >= 2 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 px-3 py-2 bg-white border border-brand-border text-sm text-brand-muted">
          No results found
        </div>
      )}
    </div>
  )
}

interface AdminEditPanelProps {
  entityType: string
  entityId: string
  fields: EditField[]
  userRole?: string | null
}

export function AdminEditPanel({ entityType, entityId, fields, userRole }: AdminEditPanelProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string | number | null>>(() => {
    const init: Record<string, string | number | null> = {}
    for (const f of fields) init[f.key] = f.value ?? null
    return init
  })

  if (userRole !== 'admin') return null

  const handleSave = useCallback(async function () {
    setSaving(true)
    setError(null)
    setSaved(false)

    // Build updates — only send changed fields
    const updates: Record<string, unknown> = {}
    for (const f of fields) {
      const current = values[f.key]
      const original = f.value ?? null
      if (current !== original) {
        updates[f.key] = f.type === 'number' ? (current ? Number(current) : null) : (current || null)
      }
    }

    if (Object.keys(updates).length === 0) {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      return
    }

    try {
      const res = await fetch('/api/admin/edit-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      setTimeout(() => {
        setSaved(false)
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [entityType, entityId, fields, values])

  return (
    <>
      {/* Floating edit button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 bg-brand-text text-white border-2 border-brand-text font-mono text-xs font-bold uppercase tracking-wider hover:bg-brand-accent transition-colors"
       
      >
        <Pencil size={14} />
        Edit Page
      </button>

      {/* Slide-out panel */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-[200]" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-[480px] z-[201] bg-brand-cream border-l-2 border-brand-text overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-brand-bg-alt border-b-2 border-brand-text px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-brand-text">Edit Page</h2>
                <p className="font-mono text-xs text-brand-muted uppercase tracking-wider">{entityType} / {entityId}</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-md hover:bg-brand-border transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 space-y-4">
              {fields.map(function (field) {
                const val = values[field.key] ?? ''
                return (
                  <div key={field.key}>
                    <label className="block font-mono text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                      {field.label}
                    </label>
                    {field.type === 'search' ? (
                      <SearchField
                        field={field}
                        value={val as string | null}
                        displayValue={field.displayValue}
                        onChange={(id) => setValues(prev => ({ ...prev, [field.key]: id }))}
                      />
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={String(val)}
                        onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-brand-border bg-white text-brand-text focus:outline-none focus:border-brand-accent resize-y"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={String(val)}
                        onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-brand-border bg-white text-brand-text focus:outline-none focus:border-brand-accent"
                      >
                        <option value="">--</option>
                        {(field.options || []).map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={String(val)}
                        onChange={e => setValues(prev => ({ ...prev, [field.key]: field.type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-brand-border bg-white text-brand-text focus:outline-none focus:border-brand-accent"
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-brand-bg-alt border-t-2 border-brand-text px-5 py-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent text-white font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-sm font-semibold text-green-600">Saved</span>}
              {error && <span className="text-sm font-semibold text-red-600">{error}</span>}
            </div>
          </div>
        </>
      )}
    </>
  )
}
