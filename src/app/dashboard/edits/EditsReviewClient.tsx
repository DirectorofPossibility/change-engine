'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ExternalLink, Mail, ChevronDown, Pencil, Save, Loader2 } from 'lucide-react'

interface CommunityEdit {
  edit_id: string
  entity_type: string
  entity_id: string
  entity_name: string | null
  field_name: string | null
  suggested_value: string | null
  reason: string | null
  submitter_email: string | null
  status: string
  created_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
}

interface EditsReviewClientProps {
  edits: CommunityEdit[]
  counts: { pending: number; approved: number; rejected: number; total: number }
}

const ENTITY_ROUTES: Record<string, string> = {
  content_published: '/content/',
  organizations: '/organizations/',
  services_211: '/services/',
  elected_officials: '/officials/',
  policies: '/policies/',
  opportunities: '/opportunities/',
}

const FEEDBACK_LABELS: Record<string, string> = {
  correction: 'Something is wrong',
  outdated: 'Info is outdated',
  missing: 'Something is missing',
  other: 'Other feedback',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
}

// Fields to show in the inline editor per entity type
const EDITABLE_FIELDS: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'url' }>> = {
  content_published: [
    { key: 'title_6th_grade', label: 'Title', type: 'text' },
    { key: 'summary_6th_grade', label: 'Summary', type: 'textarea' },
    { key: 'body_6th_grade', label: 'Body', type: 'textarea' },
    { key: 'source_url', label: 'Source URL', type: 'url' },
  ],
  organizations: [
    { key: 'org_name', label: 'Name', type: 'text' },
    { key: 'description_5th_grade', label: 'Description', type: 'textarea' },
    { key: 'website', label: 'Website', type: 'url' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'address', label: 'Address', type: 'text' },
  ],
  services_211: [
    { key: 'service_name', label: 'Service Name', type: 'text' },
    { key: 'description_5th_grade', label: 'Description', type: 'textarea' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
    { key: 'address', label: 'Address', type: 'text' },
    { key: 'hours', label: 'Hours', type: 'text' },
  ],
  elected_officials: [
    { key: 'official_name', label: 'Name', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'website', label: 'Website', type: 'url' },
    { key: 'office_address', label: 'Office Address', type: 'text' },
  ],
  policies: [
    { key: 'policy_name', label: 'Policy Name', type: 'text' },
    { key: 'title_6th_grade', label: 'Title', type: 'text' },
    { key: 'summary_6th_grade', label: 'Summary', type: 'textarea' },
    { key: 'source_url', label: 'Source URL', type: 'url' },
  ],
  opportunities: [
    { key: 'opportunity_name', label: 'Name', type: 'text' },
    { key: 'description_5th_grade', label: 'Description', type: 'textarea' },
    { key: 'website', label: 'Website', type: 'url' },
  ],
}

export function EditsReviewClient({ edits: initialEdits, counts }: EditsReviewClientProps) {
  const [edits, setEdits] = useState(initialEdits)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Inline editor state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [entityData, setEntityData] = useState<Record<string, any> | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [loadingEntity, setLoadingEntity] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const filtered = filter === 'all' ? edits : edits.filter(function (e) { return e.status === filter })

  async function handleAction(editId: string, action: 'approved' | 'rejected') {
    setProcessing(editId)
    try {
      const res = await fetch('/api/admin/review-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_id: editId, status: action }),
      })
      if (res.ok) {
        setEdits(function (prev) {
          return prev.map(function (e) {
            if (e.edit_id === editId) {
              return { ...e, status: action, reviewed_at: new Date().toISOString() }
            }
            return e
          })
        })
      }
    } finally {
      setProcessing(null)
    }
  }

  async function loadEntity(edit: CommunityEdit) {
    setLoadingEntity(true)
    setEditingId(edit.edit_id)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/admin/get-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: edit.entity_type, entityId: edit.entity_id }),
      })
      if (res.ok) {
        const data = await res.json()
        setEntityData(data.entity)
        // Pre-fill edit values with current data
        const fields = EDITABLE_FIELDS[edit.entity_type] || []
        const values: Record<string, string> = {}
        for (const f of fields) {
          values[f.key] = data.entity?.[f.key] || ''
        }
        setEditValues(values)
      }
    } finally {
      setLoadingEntity(false)
    }
  }

  async function saveEntity(edit: CommunityEdit) {
    if (!entityData) return
    setSaving(true)
    setSaveMessage(null)

    // Find changed fields
    const fields = EDITABLE_FIELDS[edit.entity_type] || []
    const updates: Record<string, string> = {}
    for (const f of fields) {
      if (editValues[f.key] !== (entityData[f.key] || '')) {
        updates[f.key] = editValues[f.key]
      }
    }

    if (Object.keys(updates).length === 0) {
      setSaveMessage('No changes to save')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/admin/edit-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: edit.entity_type,
          entityId: edit.entity_id,
          updates,
        }),
      })

      if (res.ok) {
        setSaveMessage('Saved successfully')
        // Update local entity data
        setEntityData(function (prev) { return { ...prev, ...updates } })
        // Auto-approve the edit
        await handleAction(edit.edit_id, 'approved')
        // Close editor after a moment
        setTimeout(function () {
          setEditingId(null)
          setEntityData(null)
          setSaveMessage(null)
        }, 1500)
      } else {
        setSaveMessage('Error saving changes')
      }
    } finally {
      setSaving(false)
    }
  }

  function entityLink(edit: CommunityEdit) {
    const base = ENTITY_ROUTES[edit.entity_type]
    if (!base) return null
    return base + edit.entity_id
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">Feedback Loop — Community Edits</h1>
        <p className="text-sm text-brand-muted mt-1">Review feedback, edit entities inline, approve or reject</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', value: counts.pending, color: '#d97706', filterVal: 'pending' as const },
          { label: 'Approved', value: counts.approved, color: '#16a34a', filterVal: 'approved' as const },
          { label: 'Rejected', value: counts.rejected, color: '#dc2626', filterVal: 'rejected' as const },
          { label: 'Total', value: counts.total, color: '#6B6560', filterVal: 'all' as const },
        ].map(function (stat) {
          const isActive = filter === stat.filterVal
          return (
            <button
              key={stat.label}
              onClick={function () { setFilter(stat.filterVal) }}
              className="p-4 rounded-lg border-2 text-left transition-all"
              style={{
                borderColor: isActive ? stat.color : '#E2DDD5',
                backgroundColor: isActive ? stat.color + '10' : 'white',
              }}
            >
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-brand-muted">{stat.label}</p>
            </button>
          )
        })}
      </div>

      {/* Edit list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-lg font-serif">No {filter === 'all' ? '' : filter} edits</p>
          <p className="text-sm mt-1">Community feedback will appear here as it comes in</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(function (edit) {
            const statusConf = STATUS_CONFIG[edit.status] || STATUS_CONFIG.pending
            const link = entityLink(edit)
            const isExpanded = expandedId === edit.edit_id
            const isEditing = editingId === edit.edit_id
            const fields = EDITABLE_FIELDS[edit.entity_type] || []

            return (
              <div
                key={edit.edit_id}
                className="bg-white rounded-lg border-2 border-brand-border overflow-hidden"
                style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
              >
                {/* Row header */}
                <button
                  onClick={function () { setExpandedId(isExpanded ? null : edit.edit_id) }}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-brand-bg/50 transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: edit.status === 'pending' ? '#d97706' : edit.status === 'approved' ? '#16a34a' : '#dc2626',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text truncate">
                      {edit.entity_name || edit.entity_id}
                    </p>
                    <p className="text-[11px] text-brand-muted">
                      {edit.entity_type.replace(/_/g, ' ')}
                      {edit.field_name && <span className="ml-2 font-mono">{FEEDBACK_LABELS[edit.field_name] || edit.field_name}</span>}
                    </p>
                  </div>
                  <span className={'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ' + statusConf.bg + ' ' + statusConf.color}>
                    {statusConf.label}
                  </span>
                  <span className="text-[11px] text-brand-muted-light flex-shrink-0">
                    {edit.created_at ? new Date(edit.created_at).toLocaleDateString() : ''}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-brand-muted transition-transform flex-shrink-0"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-brand-border px-4 py-4 space-y-4">
                    {/* Feedback message */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-light mb-1">Community Feedback</p>
                      <p className="text-sm text-brand-text bg-amber-50 rounded-lg p-3 border border-amber-200">
                        {edit.reason || 'No message provided'}
                      </p>
                    </div>

                    {edit.suggested_value && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-light mb-1">Suggested Value</p>
                        <p className="text-sm text-brand-text bg-green-50 rounded-lg p-3 border border-green-200">
                          {edit.suggested_value}
                        </p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-brand-muted">
                      {edit.submitter_email && (
                        <a href={'mailto:' + edit.submitter_email} className="flex items-center gap-1 hover:text-brand-accent">
                          <Mail size={12} />
                          {edit.submitter_email}
                        </a>
                      )}
                      {link && (
                        <Link href={link} target="_blank" className="flex items-center gap-1 hover:text-brand-accent">
                          <ExternalLink size={12} />
                          View live page
                        </Link>
                      )}
                      {edit.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Reviewed {new Date(edit.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Inline editor */}
                    {isEditing && (
                      <div className="border-2 border-blue-200 rounded-lg bg-blue-50/30 p-4 space-y-3">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">Edit Entity</p>

                        {loadingEntity ? (
                          <div className="flex items-center gap-2 py-4 text-sm text-brand-muted">
                            <Loader2 size={16} className="animate-spin" />
                            Loading current data...
                          </div>
                        ) : (
                          <>
                            {fields.map(function (field) {
                              return (
                                <div key={field.key}>
                                  <label className="block text-[11px] font-semibold text-brand-muted mb-1">{field.label}</label>
                                  {field.type === 'textarea' ? (
                                    <textarea
                                      value={editValues[field.key] || ''}
                                      onChange={function (e) {
                                        setEditValues(function (prev) { return { ...prev, [field.key]: e.target.value } })
                                      }}
                                      rows={3}
                                      className="w-full text-sm border border-brand-border rounded-lg px-3 py-2 bg-white text-brand-text focus:outline-none focus:border-blue-400 resize-none"
                                    />
                                  ) : (
                                    <input
                                      type={field.type}
                                      value={editValues[field.key] || ''}
                                      onChange={function (e) {
                                        setEditValues(function (prev) { return { ...prev, [field.key]: e.target.value } })
                                      }}
                                      className="w-full text-sm border border-brand-border rounded-lg px-3 py-2 bg-white text-brand-text focus:outline-none focus:border-blue-400"
                                    />
                                  )}
                                </div>
                              )
                            })}

                            {saveMessage && (
                              <p className={'text-sm font-semibold ' + (saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600')}>
                                {saveMessage}
                              </p>
                            )}

                            <div className="flex items-center gap-3">
                              <button
                                onClick={function () { saveEntity(edit) }}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {saving ? 'Saving...' : 'Save & Approve'}
                              </button>
                              <button
                                onClick={function () { setEditingId(null); setEntityData(null); setSaveMessage(null) }}
                                className="px-4 py-2 text-sm text-brand-muted hover:text-brand-text transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {edit.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-3 border-t border-brand-border">
                        {!isEditing && fields.length > 0 && (
                          <button
                            onClick={function () { loadEntity(edit) }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Pencil size={14} />
                            Edit & Apply
                          </button>
                        )}
                        <button
                          onClick={function () { handleAction(edit.edit_id, 'approved') }}
                          disabled={processing === edit.edit_id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          Approve
                        </button>
                        <button
                          onClick={function () { handleAction(edit.edit_id, 'rejected') }}
                          disabled={processing === edit.edit_id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
