'use client'

import { useState } from 'react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { Modal } from '@/components/ui/Modal'
import { updateContent, toggleFeatured, toggleActive, deleteContent, moveToDraft, bulkMoveToDraft, bulkDeleteContent } from './actions'
import { THEMES, CENTERS } from '@/lib/constants'
import type { ContentPublished } from '@/lib/types/dashboard'

export function ContentClient({ initialItems }: { initialItems: ContentPublished[] }) {
  const [items, setItems] = useState(initialItems)
  const [search, setSearch] = useState('')
  const [pathwayFilter, setPathwayFilter] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [editing, setEditing] = useState<ContentPublished | null>(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

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
    const contentType = form.get('content_type') as string
    await updateContent(editing.id, {
      title_6th_grade: form.get('title') as string,
      summary_6th_grade: form.get('summary') as string,
      body: form.get('body') as string || undefined,
      image_url: (form.get('image_url') as string) || null,
      content_type: contentType || undefined,
      source_url: form.get('source_url') as string || undefined,
      event_start_date: contentType === 'event' ? (form.get('event_start_date') as string || null) : null,
      event_end_date: contentType === 'event' ? (form.get('event_end_date') as string || null) : null,
      pathway_primary: form.get('pathway') as string,
      center: form.get('center') as string,
    })
    setEditing(null)
    setSaving(false)
    window.location.reload()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(i => i.id)))
    }
  }

  /** @sideeffect Calls bulkMoveToDraft for all selected items with inbox IDs. */
  async function handleBulkDraft() {
    const targets = items.filter(i => selected.has(i.id) && i.inbox_id)
    const skipped = items.filter(i => selected.has(i.id) && !i.inbox_id).length
    if (targets.length === 0) return alert('None of the selected items have an inbox ID — cannot move to draft.')
    const msg = `Move ${targets.length} item(s) back to the review queue?` + (skipped ? ` (${skipped} skipped — no inbox ID)` : '')
    if (!window.confirm(msg)) return

    setBulkLoading(true)
    const res = await bulkMoveToDraft(targets.map(i => ({ id: i.id, inboxId: i.inbox_id! })))
    setBulkLoading(false)

    const succeeded = new Set(targets.map(i => i.id).filter(id => !res.failed.includes(id)))
    setItems(prev => prev.filter(i => !succeeded.has(i.id)))
    setSelected(new Set())
    if (res.failed.length) alert(`${res.failed.length} item(s) failed to move to draft.`)
  }

  /** @sideeffect Calls bulkDeleteContent for all selected items. */
  async function handleBulkDelete() {
    if (!window.confirm(`Permanently delete ${selected.size} item(s)?`)) return

    setBulkLoading(true)
    const targets = items.filter(i => selected.has(i.id))
    const res = await bulkDeleteContent(targets.map(i => ({ id: i.id, inboxId: i.inbox_id })))
    setBulkLoading(false)

    const succeeded = new Set(targets.map(i => i.id).filter(id => !res.failed.includes(id)))
    setItems(prev => prev.filter(i => !succeeded.has(i.id)))
    setSelected(new Set())
    if (res.failed.length) alert(`${res.failed.length} item(s) failed to delete.`)
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button
            onClick={handleBulkDraft}
            disabled={bulkLoading}
            className="text-sm text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-md disabled:opacity-50"
          >
            {bulkLoading ? 'Working...' : 'Move to Draft'}
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="text-sm text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md disabled:opacity-50"
          >
            {bulkLoading ? 'Working...' : 'Delete'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-brand-muted hover:underline ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
              <th className="px-2 py-3 w-8">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
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
              <tr key={item.id} className={`border-b border-brand-border/50 hover:bg-brand-bg/50 ${selected.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium max-w-sm truncate">{item.title_6th_grade}</td>
                <td className="px-4 py-3"><ThemePill themeId={item.pathway_primary} linkable={false} /></td>
                <td className="px-4 py-3"><CenterBadge center={item.center} linkable={false} /></td>
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
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(item)} className="text-brand-accent text-xs hover:underline">Edit</button>
                    <button
                      onClick={async () => {
                        if (!item.inbox_id) return alert('No inbox ID — cannot move to draft.')
                        if (!window.confirm('Move this content back to the review queue?')) return
                        const res = await moveToDraft(item.id, item.inbox_id)
                        if (res.error) return alert(res.error)
                        setItems(prev => prev.filter(i => i.id !== item.id))
                      }}
                      className="text-amber-600 text-xs hover:underline"
                    >Draft</button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Permanently delete this content?')) return
                        const res = await deleteContent(item.id, item.inbox_id)
                        if (res.error) return alert(res.error)
                        setItems(prev => prev.filter(i => i.id !== item.id))
                      }}
                      className="text-red-600 text-xs hover:underline"
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Content">
        {editing && (
          <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium mb-1">Title (6th Grade)</label>
              <input name="title" defaultValue={editing.title_6th_grade} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Summary (6th Grade)</label>
              <textarea name="summary" defaultValue={editing.summary_6th_grade} rows={3} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body (Markdown)</label>
              <textarea name="body" defaultValue={(editing as any).body || ''} rows={8} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input name="image_url" defaultValue={(editing as any).image_url || ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source URL</label>
                <input name="source_url" defaultValue={(editing as any).source_url || ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Content Type</label>
                <select name="content_type" defaultValue={(editing as any).content_type || ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm">
                  <option value="">--</option>
                  <option value="announcement">Announcement</option>
                  <option value="article">Article</option>
                  <option value="campaign">Campaign</option>
                  <option value="course">Course</option>
                  <option value="event">Event</option>
                  <option value="guide">Guide</option>
                  <option value="news">News</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="opinion">Opinion</option>
                  <option value="report">Report</option>
                  <option value="resource">Resource</option>
                  <option value="tool">Tool</option>
                  <option value="video">Video</option>
                </select>
              </div>
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
            {((editing as any).content_type === 'event' || true) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Start Date</label>
                  <input name="event_start_date" type="datetime-local" defaultValue={(editing as any).event_start_date ? (editing as any).event_start_date.substring(0, 16) : ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Event End Date</label>
                  <input name="event_end_date" type="datetime-local" defaultValue={(editing as any).event_end_date ? (editing as any).event_end_date.substring(0, 16) : ''} className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
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
