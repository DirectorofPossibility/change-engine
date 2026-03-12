'use client'

import { useState, useCallback } from 'react'
import { Pencil, X, Save, Loader2 } from 'lucide-react'

export interface EditField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'url' | 'select'
  options?: string[]
  value: string | number | null | undefined
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
                <p className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">{entityType} / {entityId}</p>
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
                    <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
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
