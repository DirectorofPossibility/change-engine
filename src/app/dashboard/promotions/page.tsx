'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, ChevronLeft, ChevronRight, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface Promotion {
  promo_id: string
  title: string
  subtitle: string | null
  description: string | null
  promo_type: string
  org_id: string | null
  content_id: string | null
  image_url: string | null
  cta_text: string | null
  cta_href: string | null
  color: string
  start_date: string | null
  end_date: string | null
  is_active: boolean
  display_order: number
  created_at: string
}

interface OrgOption {
  org_id: string
  org_name: string
  logo_url: string | null
}

const PROMO_TYPES = [
  { value: 'partner_spotlight', label: 'Partner Spotlight', color: '#dd6b20' },
  { value: 'event', label: 'Event', color: '#38a169' },
  { value: 'resource', label: 'Resource', color: '#3182ce' },
  { value: 'campaign', label: 'Campaign', color: '#805ad5' },
  { value: 'announcement', label: 'Announcement', color: '#C75B2A' },
]

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  promo_type: 'partner_spotlight',
  org_id: '',
  image_url: '',
  cta_text: 'Learn More',
  cta_href: '',
  color: '#C75B2A',
  start_date: '',
  end_date: '',
  is_active: true,
  display_order: 0,
}

export default function PromotionsAdmin() {
  const [promos, setPromos] = useState<Promotion[]>([])
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [calMonth, setCalMonth] = useState(new Date())

  const supabase = createClient()

  useEffect(function () {
    loadPromos()
    loadOrgs()
  }, [])

  async function loadPromos() {
    const { data } = await (supabase as any)
      .from('promotions')
      .select('*')
      .order('display_order', { ascending: true })
    setPromos(data || [])
  }

  async function loadOrgs() {
    const { data } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url')
      .order('org_name')
    setOrgs((data || []) as OrgOption[])
  }

  async function handleSave() {
    if (!form.title.trim()) return
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      description: form.description || null,
      promo_type: form.promo_type,
      org_id: form.org_id || null,
      image_url: form.image_url || null,
      cta_text: form.cta_text || 'Learn More',
      cta_href: form.cta_href || null,
      color: form.color,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
      display_order: form.display_order,
    }
    if (editing) {
      await (supabase as any).from('promotions').update(payload).eq('promo_id', editing)
    } else {
      await (supabase as any).from('promotions').insert(payload)
    }
    setEditing(null)
    setAdding(false)
    setForm(EMPTY_FORM)
    loadPromos()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promotion?')) return
    await (supabase as any).from('promotions').delete().eq('promo_id', id)
    loadPromos()
  }

  async function handleToggle(id: string, current: boolean) {
    await (supabase as any).from('promotions').update({ is_active: !current }).eq('promo_id', id)
    loadPromos()
  }

  function startEdit(p: Promotion) {
    setEditing(p.promo_id)
    setAdding(false)
    setForm({
      title: p.title,
      subtitle: p.subtitle || '',
      description: p.description || '',
      promo_type: p.promo_type,
      org_id: p.org_id || '',
      image_url: p.image_url || '',
      cta_text: p.cta_text || 'Learn More',
      cta_href: p.cta_href || '',
      color: p.color || '#C75B2A',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
      is_active: p.is_active,
      display_order: p.display_order,
    })
  }

  function startAdd() {
    setAdding(true)
    setEditing(null)
    setForm({ ...EMPTY_FORM, display_order: promos.length + 1 })
  }

  // Calendar helpers
  const calDays = useMemo(function () {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: Array<{ day: number; promos: Promotion[] }> = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0')
      const dayPromos = promos.filter(function (p) {
        if (!p.start_date && !p.end_date) return false
        const start = p.start_date || '2000-01-01'
        const end = p.end_date || '2099-12-31'
        return dateStr >= start && dateStr <= end
      })
      days.push({ day: d, promos: dayPromos })
    }
    return { firstDay, days }
  }, [calMonth, promos])

  function prevMonth() {
    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
  }

  const typeConfig = function (t: string) {
    return PROMO_TYPES.find(function (pt) { return pt.value === t }) || PROMO_TYPES[0]
  }

  const selectedOrg = form.org_id ? orgs.find(function (o) { return o.org_id === form.org_id }) : null

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule featured partner content, events, and announcements</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={function () { setView(view === 'list' ? 'calendar' : 'list') }}
            className="flex items-center gap-1.5 px-3 py-2 border border-brand-border text-sm font-semibold rounded-lg hover:border-brand-text transition-colors"
          >
            <Calendar size={14} />
            {view === 'list' ? 'Calendar' : 'List'}
          </button>
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-text text-white text-sm font-semibold rounded-lg hover:bg-brand-accent transition-colors"
          >
            <Plus size={14} />
            Add Promotion
          </button>
        </div>
      </div>

      {/* Add/Edit form */}
      {(adding || editing) && (
        <div className="mb-6 p-5 bg-white border border-brand-border rounded-xl">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Promotion' : 'New Promotion'}</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Title</label>
                <input
                  value={form.title}
                  onChange={function (e) { setForm({ ...form, title: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="Houston Food Bank Drive"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={function (e) { setForm({ ...form, subtitle: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="Feeding families across Harris County"
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

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Type</label>
                <select
                  value={form.promo_type}
                  onChange={function (e) { setForm({ ...form, promo_type: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none bg-white"
                >
                  {PROMO_TYPES.map(function (t) {
                    return <option key={t.value} value={t.value}>{t.label}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Organization</label>
                <select
                  value={form.org_id}
                  onChange={function (e) { setForm({ ...form, org_id: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none bg-white"
                >
                  <option value="">None</option>
                  {orgs.map(function (o) {
                    return <option key={o.org_id} value={o.org_id}>{o.org_name}</option>
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={function (e) { setForm({ ...form, color: e.target.value }) }}
                    className="w-8 h-8 rounded border border-brand-border cursor-pointer"
                  />
                  <input
                    value={form.color}
                    onChange={function (e) { setForm({ ...form, color: e.target.value }) }}
                    className="flex-1 px-3 py-2 border border-brand-border rounded-lg text-sm font-mono focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={function (e) { setForm({ ...form, start_date: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={function (e) { setForm({ ...form, end_date: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">CTA Text</label>
                <input
                  value={form.cta_text}
                  onChange={function (e) { setForm({ ...form, cta_text: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="Learn More"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">CTA Link</label>
                <input
                  value={form.cta_href}
                  onChange={function (e) { setForm({ ...form, cta_href: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="/organizations/ORG_123"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Image URL</label>
                <input
                  value={form.image_url}
                  onChange={function (e) { setForm({ ...form, image_url: e.target.value }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={function (e) { setForm({ ...form, display_order: parseInt(e.target.value) || 0 }) }}
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm focus:border-brand-accent focus:outline-none"
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

            {/* Live preview */}
            {form.title && (
              <div className="mt-4 pt-4 border-t border-brand-border">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Preview</p>
                <div className="max-w-sm">
                  <PromoPreview
                    title={form.title}
                    subtitle={form.subtitle}
                    description={form.description}
                    promoType={form.promo_type}
                    orgName={selectedOrg?.org_name}
                    logoUrl={selectedOrg?.logo_url}
                    imageUrl={form.image_url}
                    ctaText={form.cta_text}
                    color={form.color}
                  />
                </div>
              </div>
            )}

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

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-3">
          {promos.map(function (p) {
            const tc = typeConfig(p.promo_type)
            const org = p.org_id ? orgs.find(function (o) { return o.org_id === p.org_id }) : null
            return (
              <div key={p.promo_id} className="p-4 bg-white border border-brand-border rounded-xl flex gap-4">
                <div className="w-1.5 rounded flex-shrink-0" style={{ background: p.is_active ? (p.color || tc.color) : '#D1D5E0' }} />
                {p.image_url && (
                  <Image src={p.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0"  width={800} height={64} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: tc.color, backgroundColor: tc.color + '15' }}>
                      {tc.label}
                    </span>
                    {!p.is_active && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-danger">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-brand-text">{p.title}</p>
                  {p.subtitle && <p className="text-xs text-brand-muted mt-0.5">{p.subtitle}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-brand-muted-light">
                    {org && <span>{org.org_name}</span>}
                    {p.start_date && <span>{p.start_date}{p.end_date ? ' to ' + p.end_date : '+'}</span>}
                    <span>#{p.display_order}</span>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 flex-shrink-0">
                  <button onClick={function () { handleToggle(p.promo_id, p.is_active) }} className="p-1.5 rounded border border-brand-border hover:border-brand-text transition-colors" title={p.is_active ? 'Hide' : 'Show'}>
                    {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={function () { startEdit(p) }} className="p-1.5 rounded border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button onClick={function () { handleDelete(p.promo_id) }} className="p-1.5 rounded border border-brand-border hover:border-brand-danger hover:text-brand-danger transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
          {promos.length === 0 && (
            <p className="text-center text-brand-muted py-12">No promotions yet. Click "Add Promotion" to get started.</p>
          )}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div className="bg-white border border-brand-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-brand-bg transition-colors"><ChevronLeft size={18} /></button>
            <h2 className="font-serif text-lg font-bold">
              {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-brand-bg transition-colors"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-px bg-brand-border rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(function (d) {
              return (
                <div key={d} className="text-[10px] font-mono font-bold uppercase tracking-wider text-center py-2 bg-brand-bg text-brand-muted">
                  {d}
                </div>
              )
            })}
            {/* Leading empty cells */}
            {Array.from({ length: calDays.firstDay }).map(function (_, i) {
              return <div key={'empty-' + i} className="bg-white min-h-[80px]" />
            })}
            {/* Day cells */}
            {calDays.days.map(function (d) {
              const today = new Date()
              const isToday = d.day === today.getDate() && calMonth.getMonth() === today.getMonth() && calMonth.getFullYear() === today.getFullYear()
              return (
                <div key={d.day} className="bg-white min-h-[80px] p-1.5 relative">
                  <span className={'text-xs font-semibold ' + (isToday ? 'text-white bg-brand-accent w-5 h-5 rounded-full flex items-center justify-center' : 'text-brand-muted')}>
                    {d.day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {d.promos.slice(0, 3).map(function (p) {
                      return (
                        <div
                          key={p.promo_id}
                          className="text-[9px] font-semibold px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: (p.color || '#C75B2A') + '20', color: p.color || '#C75B2A' }}
                          onClick={function () { startEdit(p) }}
                          title={p.title}
                        >
                          {p.title}
                        </div>
                      )
                    })}
                    {d.promos.length > 3 && (
                      <span className="text-[9px] text-brand-muted">+{d.promos.length - 3} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/** Inline preview card */
function PromoPreview({ title, subtitle, description, promoType, orgName, logoUrl, imageUrl, ctaText, color }: {
  title: string; subtitle?: string; description?: string; promoType: string
  orgName?: string; logoUrl?: string | null; imageUrl?: string; ctaText?: string; color: string
}) {
  const tc = PROMO_TYPES.find(function (t) { return t.value === promoType }) || PROMO_TYPES[0]
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden" style={{ boxShadow: '3px 3px 0 ' + color + '30' }}>
      {imageUrl && (
        <div className="h-24 overflow-hidden">
          <Image src={imageUrl} alt="" className="w-full h-full object-cover"  width={800} height={400} />
        </div>
      )}
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {logoUrl && <Image src={logoUrl} alt="" className="w-6 h-6 rounded"  width={48} height={24} />}
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: tc.color }}>{tc.label}</span>
        </div>
        <p className="text-sm font-bold text-brand-text">{title}</p>
        {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
        {description && <p className="text-xs text-brand-muted mt-1.5 line-clamp-2">{description}</p>}
        {orgName && <p className="text-[10px] font-mono text-brand-muted-light mt-2">{orgName}</p>}
        <div className="mt-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: color, color: '#fff' }}>
            {ctaText || 'Learn More'}
          </span>
        </div>
      </div>
    </div>
  )
}
