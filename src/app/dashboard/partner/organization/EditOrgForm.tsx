'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Pencil, Save, X } from 'lucide-react'

interface OrgData {
  org_id: string
  org_name: string
  mission_statement: string | null
  description_full: string | null
  email: string | null
  phone: string | null
  phone_secondary: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  service_area: string | null
}

const EDITABLE_FIELDS: { key: keyof OrgData; label: string; type?: 'text' | 'textarea' | 'email' | 'url' }[] = [
  { key: 'mission_statement', label: 'Mission Statement', type: 'textarea' },
  { key: 'description_full', label: 'Full Description', type: 'textarea' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'phone_secondary', label: 'Secondary Phone' },
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip_code', label: 'ZIP Code' },
  { key: 'service_area', label: 'Service Area' },
]

export function EditOrgForm({ org }: { org: OrgData }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<OrgData>(org)

  function handleChange(key: keyof OrgData, value: string) {
    setForm(function (prev) { return Object.assign({}, prev, { [key]: value || null }) })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const updates: Record<string, string | null> = {}
      for (const field of EDITABLE_FIELDS) {
        updates[field.key] = form[field.key] as string | null
      }
      const { error: err } = await supabase
        .from('organizations')
        .update(updates)
        .eq('org_id', org.org_id)
      if (err) {
        setError(err.message)
      } else {
        setEditing(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <button
        onClick={function () { setEditing(true) }}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors"
        style={{ color: '#C75B2A', border: '1px solid #C75B2A' }}
      >
        <Pencil size={14} />
        Edit Profile
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#9B9590' }}>
          Edit Organization
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={function () { setEditing(false); setForm(org); setError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={14} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: '#C75B2A' }}
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EDITABLE_FIELDS.map(function (field) {
          const value = form[field.key] as string | null
          const inputType = field.type || 'text'
          return (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-xs font-medium mb-1" style={{ color: '#5c6474' }}>
                {field.label}
              </label>
              {inputType === 'textarea' ? (
                <textarea
                  value={value || ''}
                  onChange={function (e) { handleChange(field.key, e.target.value) }}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
                  style={{ borderColor: '#E8E4DF', background: '#FAF8F5' }}
                />
              ) : (
                <input
                  type={inputType}
                  value={value || ''}
                  onChange={function (e) { handleChange(field.key, e.target.value) }}
                  className="w-full px-3 py-2 text-sm border focus:outline-none focus:ring-1"
                  style={{ borderColor: '#E8E4DF', background: '#FAF8F5' }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
