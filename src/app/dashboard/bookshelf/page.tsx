'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { THEMES } from '@/lib/constants'

const PATHWAY_OPTIONS = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: (t as any).name, color: (t as any).color }
})

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  cover_image_url: string | null
  purchase_url: string | null
  free_url: string | null
  isbn: string | null
  theme_id: string | null
  tags: string[]
  page_count: number | null
  year_published: number | null
  is_featured: boolean
  is_active: boolean
  display_order: number
}

const EMPTY_FORM = {
  title: '', author: '', description: '', cover_image_url: '', purchase_url: '',
  free_url: '', isbn: '', theme_id: '', tags: '',
  page_count: '', year_published: '', is_featured: false, is_active: true, display_order: 0,
}

export default function BookshelfAdmin() {
  const [books, setBooks] = useState<Book[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)

  const supabase = createClient()

  useEffect(function () { loadBooks() }, [])

  async function loadBooks() {
    const { data } = await (supabase as any)
      .from('bookshelf')
      .select('*')
      .order('display_order', { ascending: true })
    setBooks(data || [])
  }

  async function handleSave() {
    if (!form.title.trim() || !form.author.trim()) return
    const payload = {
      title: form.title,
      author: form.author,
      description: form.description || null,
      cover_image_url: form.cover_image_url || null,
      purchase_url: form.purchase_url || null,
      free_url: form.free_url || null,
      isbn: form.isbn || null,
      theme_id: form.theme_id || null,
      tags: form.tags ? form.tags.split(',').map(function (t) { return t.trim() }).filter(Boolean) : [],
      page_count: form.page_count ? parseInt(form.page_count) : null,
      year_published: form.year_published ? parseInt(form.year_published) : null,
      is_featured: form.is_featured,
      is_active: form.is_active,
      display_order: form.display_order,
    }

    if (editing) {
      await (supabase as any).from('bookshelf').update(payload).eq('id', editing)
    } else {
      await (supabase as any).from('bookshelf').insert(payload)
    }
    setEditing(null)
    setAdding(false)
    setForm(EMPTY_FORM)
    loadBooks()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this book?')) return
    await (supabase as any).from('bookshelf').delete().eq('id', id)
    loadBooks()
  }

  async function handleToggle(id: string, field: 'is_active' | 'is_featured', current: boolean) {
    await (supabase as any).from('bookshelf').update({ [field]: !current }).eq('id', id)
    loadBooks()
  }

  function startEdit(b: Book) {
    setEditing(b.id)
    setAdding(false)
    setForm({
      title: b.title,
      author: b.author,
      description: b.description || '',
      cover_image_url: b.cover_image_url || '',
      purchase_url: b.purchase_url || '',
      free_url: b.free_url || '',
      isbn: b.isbn || '',
      theme_id: b.theme_id || '',
      tags: (b.tags || []).join(', '),
      page_count: b.page_count ? String(b.page_count) : '',
      year_published: b.year_published ? String(b.year_published) : '',
      is_featured: b.is_featured,
      is_active: b.is_active,
      display_order: b.display_order,
    })
  }

  function startAdd() {
    setAdding(true)
    setEditing(null)
    setForm({ ...EMPTY_FORM, display_order: books.length + 1 })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookshelf</h1>
        <button
          onClick={startAdd}
          className="px-4 py-2 bg-brand-text text-white text-sm font-semibold rounded-lg hover:bg-brand-accent transition-colors"
        >
          Add Book
        </button>
      </div>

      {/* Add/Edit form */}
      {(adding || editing) && (
        <div className="mb-6 p-5 bg-white border border-brand-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Book' : 'New Book'}</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={function (e) { setForm({ ...form, title: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Author</label>
                <input
                  value={form.author}
                  onChange={function (e) { setForm({ ...form, author: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={function (e) { setForm({ ...form, description: e.target.value }) }}
                rows={2}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cover Image URL</label>
                <input
                  value={form.cover_image_url}
                  onChange={function (e) { setForm({ ...form, cover_image_url: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">ISBN</label>
                <input
                  value={form.isbn}
                  onChange={function (e) { setForm({ ...form, isbn: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Purchase URL</label>
                <input
                  value={form.purchase_url}
                  onChange={function (e) { setForm({ ...form, purchase_url: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="https://bookshop.org/..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Free / Open Access URL</label>
                <input
                  value={form.free_url}
                  onChange={function (e) { setForm({ ...form, free_url: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pathway</label>
                <select
                  value={form.theme_id}
                  onChange={function (e) { setForm({ ...form, theme_id: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none bg-white"
                >
                  <option value="">None</option>
                  {PATHWAY_OPTIONS.map(function (pw) {
                    return <option key={pw.id} value={pw.id}>{pw.name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Pages</label>
                <input
                  type="number"
                  value={form.page_count}
                  onChange={function (e) { setForm({ ...form, page_count: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Year</label>
                <input
                  type="number"
                  value={form.year_published}
                  onChange={function (e) { setForm({ ...form, year_published: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={function (e) { setForm({ ...form, display_order: parseInt(e.target.value) || 0 }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={function (e) { setForm({ ...form, tags: e.target.value }) }}
                className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                placeholder="justice, community, housing"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={function (e) { setForm({ ...form, is_featured: e.target.checked }) }} />
                Featured (Staff Pick)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={function (e) { setForm({ ...form, is_active: e.target.checked }) }} />
                Active
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors">
                Save
              </button>
              <button
                onClick={function () { setEditing(null); setAdding(false) }}
                className="px-4 py-2 border border-brand-border text-sm font-semibold rounded-lg hover:border-brand-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Books list */}
      <div className="space-y-3">
        {books.map(function (b) {
          const pw = PATHWAY_OPTIONS.find(function (p) { return p.id === b.theme_id })
          return (
            <div key={b.id} className="p-4 bg-white border border-brand-border rounded-xl flex gap-4">
              <div className="w-1.5 rounded flex-shrink-0" style={{ background: pw?.color || '#1a3460' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-text">{b.title}</p>
                <p className="text-xs text-brand-muted">by {b.author} {b.year_published ? '(' + b.year_published + ')' : ''}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  {pw && (
                    <span className="flex items-center gap-1 font-mono text-xs text-brand-muted-light">
                      <span className="w-2 h-2 rounded-sm" style={{ background: pw.color }} />
                      {pw.name}
                    </span>
                  )}
                  {b.is_featured && (
                    <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-accent">Featured</span>
                  )}
                  {!b.is_active && (
                    <span className="font-mono text-xs font-bold uppercase tracking-wide text-brand-danger">Hidden</span>
                  )}
                  <span className="font-mono text-xs text-brand-muted-light">#{b.display_order}</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 flex-shrink-0">
                <button onClick={function () { handleToggle(b.id, 'is_featured', b.is_featured) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors">
                  {b.is_featured ? 'Unfeature' : 'Feature'}
                </button>
                <button onClick={function () { handleToggle(b.id, 'is_active', b.is_active) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-text transition-colors">
                  {b.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={function () { startEdit(b) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors">
                  Edit
                </button>
                <button onClick={function () { handleDelete(b.id) }} className="px-2 py-1 text-[11px] font-semibold rounded border border-brand-border hover:border-brand-danger hover:text-brand-danger transition-colors">
                  Del
                </button>
              </div>
            </div>
          )
        })}
        {books.length === 0 && (
          <p className="text-center text-brand-muted py-12">No books yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
