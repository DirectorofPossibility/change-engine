'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THEMES } from '@/lib/constants'

const PATHWAY_OPTIONS = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: (t as any).name, color: (t as any).color }
})

interface Quote {
  quote_id: string
  quote_text: string
  attribution: string | null
  source_url: string | null
  pathway_id: string | null
  focus_area_id: string | null
  is_active: boolean
  display_order: number
}

export default function QuotesAdmin() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ quote_text: '', attribution: '', source_url: '', pathway_id: '', is_active: true, display_order: 0 })
  const [adding, setAdding] = useState(false)

  const supabase = createClient()

  useEffect(function () { loadQuotes() }, [])

  async function loadQuotes() {
    const { data } = await (supabase as any)
      .from('quotes')
      .select('*')
      .order('display_order', { ascending: true })
    setQuotes(data || [])
  }

  async function handleSave() {
    if (!form.quote_text.trim()) return
    const payload = {
      quote_text: form.quote_text,
      attribution: form.attribution || null,
      source_url: form.source_url || null,
      pathway_id: form.pathway_id || null,
      is_active: form.is_active,
      display_order: form.display_order,
    }

    if (editing) {
      await (supabase as any).from('quotes').update(payload).eq('quote_id', editing)
    } else {
      await (supabase as any).from('quotes').insert(payload)
    }
    setEditing(null)
    setAdding(false)
    setForm({ quote_text: '', attribution: '', source_url: '', pathway_id: '', is_active: true, display_order: 0 })
    loadQuotes()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quote?')) return
    await (supabase as any).from('quotes').delete().eq('quote_id', id)
    loadQuotes()
  }

  async function handleToggle(id: string, current: boolean) {
    await (supabase as any).from('quotes').update({ is_active: !current }).eq('quote_id', id)
    loadQuotes()
  }

  function startEdit(q: Quote) {
    setEditing(q.quote_id)
    setAdding(false)
    setForm({
      quote_text: q.quote_text,
      attribution: q.attribution || '',
      source_url: q.source_url || '',
      pathway_id: q.pathway_id || '',
      is_active: q.is_active,
      display_order: q.display_order,
    })
  }

  function startAdd() {
    setAdding(true)
    setEditing(null)
    setForm({ quote_text: '', attribution: '', source_url: '', pathway_id: '', is_active: true, display_order: quotes.length + 1 })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-brand-text text-white text-sm font-semibold rounded-lg hover:bg-brand-accent transition-colors"
        >
          Add Quote
        </button>
      </div>

      {/* Add/Edit form */}
      {(adding || editing) && (
        <div className="mb-6 p-5 bg-white border-2 border-brand-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Quote' : 'New Quote'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Quote Text</label>
              <textarea
                value={form.quote_text}
                onChange={function (e) { setForm({ ...form, quote_text: e.target.value }) }}
                rows={3}
                className="w-full px-3 py-2 border-2 border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Attribution</label>
                <input
                  value={form.attribution}
                  onChange={function (e) { setForm({ ...form, attribution: e.target.value }) }}
                  className="w-full px-3 py-2 border-2 border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="e.g. The Change Lab"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Source URL</label>
                <input
                  value={form.source_url}
                  onChange={function (e) { setForm({ ...form, source_url: e.target.value }) }}
                  className="w-full px-3 py-2 border-2 border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pathway</label>
                <select
                  value={form.pathway_id}
                  onChange={function (e) { setForm({ ...form, pathway_id: e.target.value }) }}
                  className="w-full px-3 py-2 border-2 border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none bg-white"
                >
                  <option value="">All pathways (general)</option>
                  {PATHWAY_OPTIONS.map(function (pw) {
                    return <option key={pw.id} value={pw.id}>{pw.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={function (e) { setForm({ ...form, display_order: parseInt(e.target.value) || 0 }) }}
                  className="w-full px-3 py-2 border-2 border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={function (e) { setForm({ ...form, is_active: e.target.checked }) }}
                  />
                  Active
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors">
                Save
              </button>
              <button
                onClick={function () { setEditing(null); setAdding(false) }}
                className="px-4 py-2 border-2 border-brand-border text-sm font-semibold rounded-lg hover:border-brand-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotes list */}
      <div className="space-y-3">
        {quotes.map(function (q) {
          return (
            <div key={q.quote_id} className="p-4 bg-white border-2 border-brand-border rounded-xl flex gap-4">
              <div className="w-1 rounded flex-shrink-0" style={{ background: q.is_active ? '#C75B2A' : '#D4CCBE' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm italic leading-relaxed text-brand-text">
                  &ldquo;{q.quote_text}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {q.attribution && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                      {q.attribution}
                    </span>
                  )}
                  {q.pathway_id && (() => {
                    const pw = PATHWAY_OPTIONS.find(function (p) { return p.id === q.pathway_id })
                    return (
                      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-brand-muted-light">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pw?.color || '#999' }} />
                        {pw?.name || q.pathway_id}
                      </span>
                    )
                  })()}
                  <span className="font-mono text-[10px] text-brand-muted-light">
                    #{q.display_order}
                  </span>
                  {!q.is_active && (
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-brand-danger">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-1.5 flex-shrink-0">
                <button onClick={function () { handleToggle(q.quote_id, q.is_active) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-text transition-colors">
                  {q.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={function () { startEdit(q) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors">
                  Edit
                </button>
                <button onClick={function () { handleDelete(q.quote_id) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-danger hover:text-brand-danger transition-colors">
                  Del
                </button>
              </div>
            </div>
          )
        })}
        {quotes.length === 0 && (
          <p className="text-center text-brand-muted py-12">No quotes yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
