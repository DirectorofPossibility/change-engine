'use client'

import { useState, useMemo } from 'react'
import type { RssFeed } from '@/lib/types/dashboard'

const THEMES: Record<string, { name: string; color: string }> = {
  THEME_01: { name: 'Health', color: '#e53e3e' },
  THEME_02: { name: 'Families', color: '#dd6b20' },
  THEME_03: { name: 'Neighborhood', color: '#d69e2e' },
  THEME_04: { name: 'Voice', color: '#38a169' },
  THEME_05: { name: 'Money', color: '#3182ce' },
  THEME_06: { name: 'Planet', color: '#319795' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5' },
}

const CATEGORIES = ['all', 'news', 'nonprofit', 'government', 'research', 'community', 'media', 'arts'] as const

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  return days + 'd ago'
}

export function FeedManagerClient({ initialFeeds }: { initialFeeds: RssFeed[] }) {
  const [feeds, setFeeds] = useState(initialFeeds)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [pollResult, setPollResult] = useState<Record<string, string>>({})

  const [newFeed, setNewFeed] = useState({
    feed_name: '', feed_url: '', source_domain: '', category: 'news',
    pathway_hint: '', poll_interval_hours: 24, notes: '',
  })

  const filtered = useMemo(function () {
    let result = feeds
    if (filter !== 'all') result = result.filter(function (f) { return f.category === filter })
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(function (f) {
        return f.feed_name.toLowerCase().includes(s) ||
          (f.source_domain || '').toLowerCase().includes(s) ||
          (f.feed_url || '').toLowerCase().includes(s)
      })
    }
    return result
  }, [feeds, filter, search])

  const stats = useMemo(function () {
    const active = feeds.filter(function (f) { return f.is_active }).length
    const errored = feeds.filter(function (f) { return f.error_count > 0 }).length
    const neverPolled = feeds.filter(function (f) { return !f.last_polled }).length
    const catCounts: Record<string, number> = {}
    feeds.forEach(function (f) {
      catCounts[f.category || 'uncategorized'] = (catCounts[f.category || 'uncategorized'] || 0) + 1
    })
    return { total: feeds.length, active, errored, neverPolled, catCounts }
  }, [feeds])

  async function toggleActive(feed: RssFeed) {
    setSaving(feed.id)
    const res = await fetch('/api/admin/feeds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: feed.id, is_active: !feed.is_active }),
    })
    if (res.ok) {
      setFeeds(function (prev) {
        return prev.map(function (f) { return f.id === feed.id ? { ...f, is_active: !f.is_active } : f })
      })
    }
    setSaving(null)
  }

  async function updateFeed(id: string, updates: Partial<RssFeed>) {
    setSaving(id)
    const res = await fetch('/api/admin/feeds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) {
      setFeeds(function (prev) {
        return prev.map(function (f) { return f.id === id ? { ...f, ...updates } : f })
      })
      setEditingId(null)
    }
    setSaving(null)
  }

  async function addFeed() {
    if (!newFeed.feed_name || !newFeed.feed_url) return
    setSaving('new')
    const res = await fetch('/api/admin/feeds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeed),
    })
    if (res.ok) {
      const created = await res.json()
      setFeeds(function (prev) { return [...prev, created] })
      setNewFeed({ feed_name: '', feed_url: '', source_domain: '', category: 'news', pathway_hint: '', poll_interval_hours: 24, notes: '' })
      setShowAdd(false)
    }
    setSaving(null)
  }

  async function deleteFeed(id: string) {
    if (!confirm('Delete this feed permanently?')) return
    setSaving(id)
    await fetch('/api/admin/feeds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setFeeds(function (prev) { return prev.filter(function (f) { return f.id !== id }) })
    setSaving(null)
  }

  async function pollFeed(id: string) {
    setPollResult(function (prev) { return { ...prev, [id]: 'polling...' } })
    try {
      const res = await fetch('/api/admin/feeds/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: id }),
      })
      const data = await res.json()
      setPollResult(function (prev) {
        return { ...prev, [id]: data.message || (data.items_found + ' items found') }
      })
    } catch {
      setPollResult(function (prev) { return { ...prev, [id]: 'Error polling feed' } })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-text">Feed Manager</h1>
          <p className="text-sm text-brand-muted mt-1">Manage RSS feeds that power your content pipeline</p>
        </div>
        <button onClick={function () { setShowAdd(!showAdd) }}
          className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent/90 transition-colors">
          {showAdd ? 'Cancel' : '+ Add Feed'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { value: stats.total, label: 'Total Feeds', color: 'text-brand-text' },
          { value: stats.active, label: 'Active', color: 'text-green-600' },
          { value: stats.neverPolled, label: 'Never Polled', color: 'text-amber-600' },
          { value: stats.errored, label: 'Errors', color: 'text-red-600' },
        ].map(function (s) {
          return (
            <div key={s.label} className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <p className={'text-2xl font-serif font-bold ' + s.color}>{s.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showAdd && <AddFeedForm newFeed={newFeed} setNewFeed={setNewFeed} saving={saving === 'new'} onAdd={addFeed} onCancel={function () { setShowAdd(false) }} />}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-brand-border rounded-lg p-0.5">
          {CATEGORIES.map(function (cat) {
            const count = cat === 'all' ? feeds.length : (stats.catCounts[cat] || 0)
            return (
              <button key={cat} onClick={function () { setFilter(cat) }}
                className={'px-3 py-1.5 text-xs font-medium rounded-md transition-colors ' +
                  (filter === cat ? 'bg-brand-accent text-white' : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg-alt')}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            )
          })}
        </div>
        <input type="text" value={search} onChange={function (e) { setSearch(e.target.value) }}
          placeholder="Search feeds..." className="px-3 py-1.5 border border-brand-border rounded-lg text-sm flex-1 min-w-[200px]" />
      </div>

      {/* Feed cards */}
      <div className="space-y-2">
        {filtered.map(function (feed) {
          const pt = feed.pathway_hint ? THEMES[feed.pathway_hint] : null
          return (
            <div key={feed.id} className={'bg-white rounded-xl border overflow-hidden transition-all ' + (feed.is_active ? 'border-brand-border' : 'border-brand-border/50 opacity-60')}>
              <div className="flex items-stretch">
                <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: pt?.color || '#E2DDD5' }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-brand-text text-sm">{feed.feed_name}</h3>
                        <span className={'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ' + (feed.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                          {feed.is_active ? 'Active' : 'Paused'}
                        </span>
                        {feed.category && <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted bg-brand-bg-alt px-1.5 py-0.5 rounded">{feed.category}</span>}
                        {pt && <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: pt.color }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pt.color }} />{pt.name}</span>}
                        {feed.error_count > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{feed.error_count} errors</span>}
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5 truncate">{feed.feed_url}</p>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-brand-muted">
                        <span>Polled: <strong>{timeAgo(feed.last_polled)}</strong></span>
                        <span>Every <strong>{feed.poll_interval_hours}h</strong></span>
                        <span>Last: <strong>{feed.last_item_count ?? 0}</strong></span>
                        <span>Total: <strong>{feed.total_items_ingested}</strong></span>
                      </div>
                      {feed.last_error && <p className="text-[11px] text-red-600 mt-1 truncate">{feed.last_error}</p>}
                      {feed.notes && <p className="text-[11px] text-brand-muted italic mt-1">{feed.notes}</p>}
                      {pollResult[feed.id] && <p className="text-[11px] text-brand-accent font-medium mt-1">{pollResult[feed.id]}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={function () { pollFeed(feed.id) }} className="px-2.5 py-1.5 text-[11px] font-medium text-brand-accent bg-brand-bg-alt rounded-lg hover:bg-brand-accent hover:text-white transition-colors">Poll</button>
                      <button onClick={function () { toggleActive(feed) }} disabled={saving === feed.id}
                        className={'px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ' + (feed.is_active ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100')}>
                        {feed.is_active ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={function () { setEditingId(editingId === feed.id ? null : feed.id) }}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-brand-muted bg-brand-bg-alt rounded-lg hover:bg-brand-border transition-colors">
                        {editingId === feed.id ? 'Close' : 'Edit'}
                      </button>
                      <button onClick={function () { deleteFeed(feed.id) }}
                        className="px-2.5 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                  {editingId === feed.id && (
                    <EditFeedForm feed={feed} saving={saving === feed.id}
                      onSave={function (u) { updateFeed(feed.id, u) }}
                      onCancel={function () { setEditingId(null) }} />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-brand-muted py-8">No feeds match your filter.</p>}
    </div>
  )
}

function AddFeedForm({ newFeed, setNewFeed, saving, onAdd, onCancel }: {
  newFeed: any; setNewFeed: (fn: (p: any) => any) => void;
  saving: boolean; onAdd: () => void; onCancel: () => void
}) {
  function set(key: string, value: any) { setNewFeed(function (p: any) { return { ...p, [key]: value } }) }
  return (
    <div className="bg-white rounded-xl border border-brand-border p-5">
      <h2 className="font-serif font-bold text-brand-text mb-4">Add New Feed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Feed Name" value={newFeed.feed_name} onChange={function (v: string) { set('feed_name', v) }} placeholder="Houston Chronicle" />
        <Field label="Feed URL" value={newFeed.feed_url} onChange={function (v: string) { set('feed_url', v) }} placeholder="https://example.com/feed/" type="url" />
        <Field label="Source Domain" value={newFeed.source_domain} onChange={function (v: string) { set('source_domain', v) }} placeholder="example.com" />
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Category</label>
          <select value={newFeed.category} onChange={function (e: any) { set('category', e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm">
            {CATEGORIES.filter(function (c) { return c !== 'all' }).map(function (c) {
              return <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">Pathway Hint</label>
          <select value={newFeed.pathway_hint} onChange={function (e: any) { set('pathway_hint', e.target.value) }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm">
            <option value="">Auto-classify</option>
            {Object.entries(THEMES).map(function ([id, t]) { return <option key={id} value={id}>{t.name}</option> })}
          </select>
        </div>
        <Field label="Poll Interval (hours)" value={String(newFeed.poll_interval_hours)} onChange={function (v: string) { set('poll_interval_hours', parseInt(v) || 24) }} type="number" />
        <div className="sm:col-span-2">
          <Field label="Notes" value={newFeed.notes} onChange={function (v: string) { set('notes', v) }} placeholder="Contact info, API key notes, etc." />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={onAdd} disabled={saving || !newFeed.feed_name || !newFeed.feed_url}
          className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent/90 disabled:opacity-50">
          {saving ? 'Adding...' : 'Add Feed'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-brand-muted">Cancel</button>
      </div>
    </div>
  )
}

function EditFeedForm({ feed, saving, onSave, onCancel }: {
  feed: RssFeed; saving: boolean; onSave: (u: Partial<RssFeed>) => void; onCancel: () => void
}) {
  const [form, setForm] = useState({
    feed_name: feed.feed_name, feed_url: feed.feed_url, source_domain: feed.source_domain || '',
    category: feed.category || 'news', pathway_hint: feed.pathway_hint || '',
    poll_interval_hours: feed.poll_interval_hours, notes: feed.notes || '',
  })
  function set(key: string, value: any) { setForm(function (p) { return { ...p, [key]: value } }) }

  return (
    <div className="mt-3 pt-3 border-t border-brand-border">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Name</label>
          <input type="text" value={form.feed_name} onChange={function (e) { set('feed_name', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs" /></div>
        <div className="col-span-2"><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">URL</label>
          <input type="url" value={form.feed_url} onChange={function (e) { set('feed_url', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs" /></div>
        <div><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Domain</label>
          <input type="text" value={form.source_domain} onChange={function (e) { set('source_domain', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs" /></div>
        <div><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Category</label>
          <select value={form.category} onChange={function (e) { set('category', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs">
            {CATEGORIES.filter(function (c) { return c !== 'all' }).map(function (c) { return <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option> })}
          </select></div>
        <div><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Pathway</label>
          <select value={form.pathway_hint} onChange={function (e) { set('pathway_hint', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs">
            <option value="">Auto-classify</option>
            {Object.entries(THEMES).map(function ([id, t]) { return <option key={id} value={id}>{t.name}</option> })}
          </select></div>
        <div><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Poll (hrs)</label>
          <input type="number" value={form.poll_interval_hours} min={1} max={168} onChange={function (e) { set('poll_interval_hours', parseInt(e.target.value) || 24) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs" /></div>
        <div className="col-span-2 sm:col-span-3"><label className="block text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-0.5">Notes</label>
          <input type="text" value={form.notes} onChange={function (e) { set('notes', e.target.value) }} className="w-full px-2 py-1.5 border border-brand-border rounded-lg text-xs" placeholder="Contact info, API key requirements, etc." /></div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={function () { onSave(form) }} disabled={saving}
          className="px-3 py-1.5 bg-brand-accent text-white text-xs font-semibold rounded-lg hover:bg-brand-accent/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-brand-muted">Cancel</button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">{label}</label>
      <input type={type} value={value} onChange={function (e) { onChange(e.target.value) }}
        className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm" placeholder={placeholder} />
    </div>
  )
}
