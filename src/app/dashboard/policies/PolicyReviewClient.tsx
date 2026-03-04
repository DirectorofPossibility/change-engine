'use client'

import { useState } from 'react'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'

interface Policy {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  summary_6th_grade: string | null
  summary_5th_grade: string | null
  impact_statement: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  source_url: string | null
  data_source: string | null
  is_published: boolean
  classification_v2: any
  last_updated: string | null
}

const LEVELS = ['All', 'Federal', 'State', 'County', 'City']
const PUB_FILTERS = ['All', 'Unpublished', 'Published']

export function PolicyReviewClient({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState(initialPolicies)
  const [levelFilter, setLevelFilter] = useState('All')
  const [pubFilter, setPubFilter] = useState('Unpublished')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [acting, setActing] = useState(false)
  const [selected, setSelected] = useState<Policy | null>(null)

  const filtered = policies.filter(function (p) {
    if (levelFilter !== 'All' && p.level !== levelFilter) return false
    if (pubFilter === 'Unpublished' && p.is_published) return false
    if (pubFilter === 'Published' && !p.is_published) return false
    return true
  })

  function toggleSelect(id: string) {
    setSelectedIds(function (prev) {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handlePublish(policyId: string) {
    setActing(true)
    try {
      const res = await fetch('/api/dashboard/policy-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_ids: [policyId] }),
      })
      if (res.ok) {
        setPolicies(function (prev) { return prev.map(function (p) { return p.policy_id === policyId ? { ...p, is_published: true } : p }) })
      }
    } finally {
      setActing(false)
    }
  }

  async function handleBulkPublish() {
    if (selectedIds.size === 0) return
    setActing(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await fetch('/api/dashboard/policy-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_ids: ids }),
      })
      if (res.ok) {
        setPolicies(function (prev) { return prev.map(function (p) { return ids.includes(p.policy_id) ? { ...p, is_published: true } : p }) })
        setSelectedIds(new Set())
      }
    } finally {
      setActing(false)
    }
  }

  const classification = selected?.classification_v2 as any

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Policy Review</h1>
      <p className="text-sm text-brand-muted mb-6">Review AI-classified policies and publish them to the public site. Each policy is rewritten at a 5th-grade reading level with a community impact statement, while linking to the full legislation.</p>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={levelFilter} onChange={function (e) { setLevelFilter(e.target.value) }} className="px-3 py-2 border rounded-lg text-sm">
          {LEVELS.map(function (l) { return <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option> })}
        </select>
        <select value={pubFilter} onChange={function (e) { setPubFilter(e.target.value) }} className="px-3 py-2 border rounded-lg text-sm">
          {PUB_FILTERS.map(function (f) { return <option key={f} value={f}>{f}</option> })}
        </select>
        <span className="text-sm text-brand-muted">{filtered.length} policies</span>
        {selectedIds.size > 0 && (
          <button onClick={handleBulkPublish} disabled={acting} className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            Publish {selectedIds.size} Selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-3 text-left w-8">
                <input
                  type="checkbox"
                  onChange={function (e) {
                    if (e.target.checked) setSelectedIds(new Set(filtered.map(function (p) { return p.policy_id })))
                    else setSelectedIds(new Set())
                  }}
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                />
              </th>
              <th className="px-3 py-3 text-left">Title</th>
              <th className="px-3 py-3 text-left">Bill #</th>
              <th className="px-3 py-3 text-left">Level</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Source</th>
              <th className="px-3 py-3 text-left">Published</th>
              <th className="px-3 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(function (p) {
              const color = LEVEL_COLORS[p.level || ''] || DEFAULT_LEVEL_COLOR
              return (
                <tr key={p.policy_id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedIds.has(p.policy_id)} onChange={function () { toggleSelect(p.policy_id) }} />
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={function () { setSelected(p) }} className="text-left hover:text-brand-accent">
                      <span className="font-medium line-clamp-1">{p.title_6th_grade || p.policy_name}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-brand-muted">{p.bill_number}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-semibold" style={{ color }}>{p.level}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">{p.status}</td>
                  <td className="px-3 py-3 text-xs text-brand-muted">{p.data_source}</td>
                  <td className="px-3 py-3">
                    {p.is_published
                      ? <span className="text-xs text-green-600 font-medium">Yes</span>
                      : <span className="text-xs text-brand-muted">No</span>
                    }
                  </td>
                  <td className="px-3 py-3">
                    {!p.is_published && (
                      <button onClick={function () { handlePublish(p.policy_id) }} disabled={acting} className="text-xs text-brand-accent hover:underline disabled:opacity-50">
                        Publish
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={function () { setSelected(null) }}>
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 shadow-xl" onClick={function (e) { e.stopPropagation() }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-text">Policy Details</h2>
              <button onClick={function () { setSelected(null) }} className="text-2xl text-brand-muted hover:text-brand-text">&times;</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-brand-muted uppercase tracking-wide">Accessible Title (5th-grade level)</label>
                <p className="text-brand-text font-medium">{selected.title_6th_grade || selected.policy_name}</p>
              </div>

              {selected.bill_number && (
                <div>
                  <label className="text-xs text-brand-muted uppercase tracking-wide">Bill Number</label>
                  <p className="text-brand-text font-mono">{selected.bill_number}</p>
                </div>
              )}

              {(selected.summary_6th_grade || selected.summary_5th_grade) && (
                <div>
                  <label className="text-xs text-brand-muted uppercase tracking-wide">Plain-Language Summary</label>
                  <p className="text-brand-text text-sm leading-relaxed">{selected.summary_6th_grade || selected.summary_5th_grade}</p>
                </div>
              )}

              {selected.impact_statement && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <label className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Community Impact — How This Touches Your Life</label>
                  <p className="text-brand-text text-sm mt-1 leading-relaxed">{selected.impact_statement}</p>
                </div>
              )}

              {selected.source_url && (
                <div>
                  <label className="text-xs text-brand-muted uppercase tracking-wide">Full Legislation</label>
                  <a href={selected.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline text-sm block mt-1">
                    Read the complete bill text &rarr;
                  </a>
                </div>
              )}

              {classification && (
                <div>
                  <label className="text-xs text-brand-muted uppercase tracking-wide">AI Classification</label>
                  <div className="mt-1 text-xs space-y-1">
                    {classification.theme_primary && <p><span className="font-medium">Pathway:</span> {classification.theme_primary}</p>}
                    {classification.center && <p><span className="font-medium">Center:</span> {classification.center}</p>}
                    {classification.focus_area_ids?.length > 0 && <p><span className="font-medium">Focus areas:</span> {classification.focus_area_ids.join(', ')}</p>}
                    {classification.confidence && <p><span className="font-medium">Confidence:</span> {(classification.confidence * 100).toFixed(0)}%</p>}
                    {classification.geographic_scope && <p><span className="font-medium">Scope:</span> {classification.geographic_scope}</p>}
                    {classification.reasoning && <p className="text-brand-muted italic mt-1">{classification.reasoning}</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                {!selected.is_published && (
                  <button
                    onClick={function () { handlePublish(selected.policy_id); setSelected(null) }}
                    disabled={acting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    Publish to Wayfinder
                  </button>
                )}
                <button onClick={function () { setSelected(null) }} className="flex-1 px-4 py-2 border border-brand-border rounded-lg text-sm font-medium hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
