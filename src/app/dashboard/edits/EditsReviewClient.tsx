'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, ExternalLink, Mail, ChevronDown } from 'lucide-react'

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

export function EditsReviewClient({ edits: initialEdits, counts }: EditsReviewClientProps) {
  const [edits, setEdits] = useState(initialEdits)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
        <p className="text-sm text-brand-muted mt-1">Review and act on community-submitted corrections and suggestions</p>
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
                  {/* Status dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: edit.status === 'pending' ? '#d97706' : edit.status === 'approved' ? '#16a34a' : '#dc2626',
                    }}
                  />

                  {/* Entity info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-text truncate">
                      {edit.entity_name || edit.entity_id}
                    </p>
                    <p className="text-[11px] text-brand-muted">
                      {edit.entity_type.replace(/_/g, ' ')}
                      {edit.field_name && <span className="ml-2 font-mono">{FEEDBACK_LABELS[edit.field_name] || edit.field_name}</span>}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={'text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ' + statusConf.bg + ' ' + statusConf.color}>
                    {statusConf.label}
                  </span>

                  {/* Timestamp */}
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
                  <div className="border-t border-brand-border px-4 py-4 space-y-3">
                    {/* Reason/message */}
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-light mb-1">Message</p>
                      <p className="text-sm text-brand-text bg-brand-bg rounded-lg p-3">
                        {edit.reason || 'No message provided'}
                      </p>
                    </div>

                    {/* Suggested value if provided */}
                    {edit.suggested_value && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-muted-light mb-1">Suggested Value</p>
                        <p className="text-sm text-brand-text bg-green-50 rounded-lg p-3 border border-green-200">
                          {edit.suggested_value}
                        </p>
                      </div>
                    )}

                    {/* Meta row */}
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
                          View entity
                        </Link>
                      )}
                      {edit.reviewed_at && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          Reviewed {new Date(edit.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {edit.status === 'pending' && (
                      <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
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
                        {link && (
                          <Link
                            href={link}
                            target="_blank"
                            className="ml-auto flex items-center gap-1 px-3 py-2 text-sm text-brand-muted hover:text-brand-accent transition-colors"
                          >
                            <ExternalLink size={14} />
                            Open page to edit
                          </Link>
                        )}
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
