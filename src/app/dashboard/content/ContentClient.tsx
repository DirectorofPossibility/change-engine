'use client'

import { useState } from 'react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { Modal } from '@/components/ui/Modal'
import { updateContent, toggleFeatured, toggleActive } from './actions'
import { THEMES, CENTERS } from '@/lib/constants'
import type { ContentPublished } from '@/lib/types/dashboard'

export function ContentClient({ initialItems }: { initialItems: ContentPublished[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [pathwayFilter, setPathwayFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [editing, setEditing] = useState<ContentPublished | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = items.filter((item) => {
    if (search && !item.title_6th_grade.toLowerCase().includes(search.toLowerCase())) return false
    if (pathwayFilter && item.pathway_primary !== pathwayFilter) return false
    if (centerFilter && item.center !== centerFilter) return false
    return true
  })

  async function handleToggleFeatured(id: string, current: boolean | null) {
    await toggleFeatured(id, !current)
    setItems(items.map(i => i.id === id ? { ...i, is_featured: !current } : i))
  }

  async function handleToggleActive(id: string, current: boolean | null) {
    await toggleActive(id, !current)
    setItems(items.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    const form = new FormData(e.currentTarget)
    await updateContent(editing.id, {
      title_6th_grade: form.get('title') as string,
      summary_6th_grade: form.get('summary') as string,
      pathway_primary: form.get('pathway') as string,
      center: form.get('center') as string,
    })
    setEditing(null)
    setSaving(false)
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Published Content</h1>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm w-64"
        />
        <select
          value={pathwayFilter}
          onChange={(e) => setPathwayFilter(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Pathways</option>
          {Object.entries(THEMES).map(([id, t]) => (
            <option key={id} value={id}>{t.name}</option>
          ))}
        </select>
        <select
          value={centerFilter}
          onChange={(e) => setCenterFilter(e.target.value)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Centers</option>
          {Object.keys(CENTERS).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="text-sm text-brand-muted self-center">{filtered.length} items</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Pathway</th>
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Published</th>
              <th className="px-4 py-3 font-medium text-center">Featured</th>
              <th className="px-4 py-3 font-medium text-center">Active</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                <td className="px-4 py-3 font-medium max-w-sm truncate">{item.title_6th_grade}</td>
                <td className="px-4 py-3"><ThemePill themeId={item.pathway_primary} /></td>
                <td className="px-4 py-3"><CenterBadge center={item.center} /></td>
                <td className="px-4 py-3"><ConfidenceBadge confidence={item.confidence} /></td>
                <td className="px-4 py-3 text-brand-muted text-xs">
                  {item.published_at ? new Date(item.published_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggleFeatured(item.id, item.is_featured)} className="text-lg">
                    {item.is_featured ? '⭐' : '☆'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${item.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.is_active !== false ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setEditing(item)} className="text-brand-accent text-xs hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Content">
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title (6th Grade)</label>
              <input name="title" defaultValue={editing.title_6th_grade} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summary (6th Grade)</label>
              <textarea name="summary" defaultValue={editing.summary_6th_grade} rows={4} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pathway</label>
                <select name="pathway" defaultValue={editing.pathway_primary || ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm">
                  {Object.entries(THEMES).map(([id, t]) => (
                    <option key={id} value={id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Center</label>
                <select name="center" defaultValue={editing.center || ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm">
                  {Object.keys(CENTERS).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-brand-border rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
