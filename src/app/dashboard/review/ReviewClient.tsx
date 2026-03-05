'use client'

import { useState } from 'react'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { SlidePanel } from '@/components/ui/SlidePanel'
import { approveItem, rejectItem, flagItem, bulkApproveItems, bulkRejectItems, bulkFlagItems } from './actions'
import type { AiClassification } from '@/lib/types/dashboard'

/** Review queue item from the Supabase join between content_review_queue and content_inbox. */
interface ReviewItem {
  id: string
  inbox_id: string | null
  review_status: string | null
  confidence: number | null
  ai_classification: unknown
  created_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  content_inbox?: {
    title: string | null
    source_domain: string | null
    source_url: string | null
  } | null
}

const STATUS_TABS = ['all', 'pending', 'flagged', 'approved', 'auto_approved', 'rejected'] as const

export function ReviewClient({ initialItems, segmentMap = {} }: { initialItems: ReviewItem[]; segmentMap?: Record<string, string> }) {
  const [items, setItems] = useState(initialItems)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selected, setSelected] = useState<ReviewItem | null>(null)
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const PAGE_SIZE = 25

  const filtered = activeTab === 'all'
    ? items
    : items.filter((i: ReviewItem) => i.review_status === activeTab)

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const tabCounts: Record<string, number> = {
    all: items.length,
    pending: items.filter((i: ReviewItem) => i.review_status === 'pending').length,
    flagged: items.filter((i: ReviewItem) => i.review_status === 'flagged').length,
    approved: items.filter((i: ReviewItem) => i.review_status === 'approved').length,
    auto_approved: items.filter((i: ReviewItem) => i.review_status === 'auto_approved').length,
    rejected: items.filter((i: ReviewItem) => i.review_status === 'rejected').length,
  }

  const classification = selected?.ai_classification as AiClassification | null

  async function handleApprove() {
    if (!selected || !classification || !selected.inbox_id) return
    setActing(true)
    setActionError(null)
    try {
      const result = await approveItem(selected.id, selected.inbox_id, classification)
      if ('error' in result) {
        setActionError(result.error || 'Unknown error')
        setActing(false)
        return
      }
      // Update local state: mark as approved
      setItems((prev) => prev.map((i) =>
        i.id === selected.id ? { ...i, review_status: 'approved', reviewed_at: new Date().toISOString() } : i
      ))
      setSelected(null)
      setActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approve failed')
      setActing(false)
    }
  }

  async function handleReject() {
    if (!selected) return
    setActing(true)
    setActionError(null)
    try {
      const result = await rejectItem(selected.id, rejectNotes)
      if ('error' in result) {
        setActionError(result.error || 'Unknown error')
        setActing(false)
        return
      }
      setItems((prev) => prev.map((i) =>
        i.id === selected.id ? { ...i, review_status: 'rejected', reviewed_at: new Date().toISOString() } : i
      ))
      setSelected(null)
      setRejectNotes('')
      setActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reject failed')
      setActing(false)
    }
  }

  async function handleFlag() {
    if (!selected) return
    setActing(true)
    setActionError(null)
    try {
      const result = await flagItem(selected.id)
      if ('error' in result) {
        setActionError(result.error || 'Unknown error')
        setActing(false)
        return
      }
      setItems((prev) => prev.map((i) =>
        i.id === selected.id ? { ...i, review_status: 'flagged', reviewed_at: new Date().toISOString() } : i
      ))
      setSelected(null)
      setActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Flag failed')
      setActing(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const pageIds = paginated.map((i) => i.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id))
      } else {
        pageIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.id))

  async function handleBulkApprove() {
    const approvable = selectedItems.filter(
      (i) => i.inbox_id && i.ai_classification && (i.review_status === 'pending' || i.review_status === 'flagged' || i.review_status === 'auto_approved')
    )
    if (approvable.length === 0) {
      setActionError(`None of the ${selectedIds.size} selected items can be approved (they may already be approved or lack classification data).`)
      return
    }
    setBulkActing(true)
    setActionError(null)
    try {
      const results = await bulkApproveItems(
        approvable.map((i) => ({
          reviewId: i.id,
          inboxId: i.inbox_id!,
          classification: i.ai_classification as AiClassification,
        }))
      )
      const failures = results.filter((r) => r.error)
      const successes = results.filter((r) => r.success)

      // Update local state for successful items
      if (successes.length > 0) {
        const successIds = new Set(successes.map((r) => r.reviewId))
        setItems((prev) => prev.map((i) =>
          successIds.has(i.id) ? { ...i, review_status: 'approved', reviewed_at: new Date().toISOString() } : i
        ))
      }

      if (failures.length > 0) {
        setActionError(`${successes.length} approved, ${failures.length} failed: ${failures[0].error}`)
      }

      setSelectedIds(new Set())
      setBulkActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Bulk approve failed')
      setBulkActing(false)
    }
  }

  async function handleBulkReject() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkActing(true)
    setActionError(null)
    try {
      const result = await bulkRejectItems(ids)
      if ('error' in result) {
        setActionError(result.error || 'Unknown error')
        setBulkActing(false)
        return
      }
      setItems((prev) => prev.map((i) =>
        ids.includes(i.id) ? { ...i, review_status: 'rejected', reviewed_at: new Date().toISOString() } : i
      ))
      setSelectedIds(new Set())
      setBulkActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Bulk reject failed')
      setBulkActing(false)
    }
  }

  async function handleBulkFlag() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setBulkActing(true)
    setActionError(null)
    try {
      const result = await bulkFlagItems(ids)
      if ('error' in result) {
        setActionError(result.error || 'Unknown error')
        setBulkActing(false)
        return
      }
      setItems((prev) => prev.map((i) =>
        ids.includes(i.id) ? { ...i, review_status: 'flagged', reviewed_at: new Date().toISOString() } : i
      ))
      setSelectedIds(new Set())
      setBulkActing(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Bulk flag failed')
      setBulkActing(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Review Queue</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-brand-border p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); setSelectedIds(new Set()) }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-accent text-white'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
            }`}
          >
            {tab === 'all' ? 'All' : tab === 'auto_approved' ? 'Auto-Approved' : tab === 'approved' ? 'Approved' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">({tabCounts[tab]})</span>
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {actionError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <span className="text-sm text-red-800 flex-1">{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-sm font-medium">Dismiss</button>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleBulkApprove}
              disabled={bulkActing}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {bulkActing ? 'Processing...' : 'Approve All'}
            </button>
            <button
              onClick={handleBulkFlag}
              disabled={bulkActing}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
            >
              {bulkActing ? 'Processing...' : 'Flag All'}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={bulkActing}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {bulkActing ? 'Processing...' : 'Reject All'}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-brand-border hover:bg-brand-bg"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && paginated.every((i) => selectedIds.has(i.id))}
                  onChange={toggleSelectAll}
                  className="rounded border-brand-border"
                />
              </th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Confidence</th>
              <th className="px-4 py-3 font-medium">Pathway</th>
              <th className="px-4 py-3 font-medium">Center</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item: ReviewItem) => {
              const c = item.ai_classification as AiClassification | null
              return (
                <tr
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={`border-b border-brand-border/50 hover:bg-brand-bg/50 cursor-pointer ${selectedIds.has(item.id) ? 'bg-blue-50/50' : ''}`}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-brand-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">
                    {c?.title_6th_grade || item.content_inbox?.title || 'Untitled'}
                  </td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {item.content_inbox?.source_domain || '-'}
                  </td>
                  <td className="px-4 py-3"><ConfidenceBadge confidence={item.confidence} /></td>
                  <td className="px-4 py-3"><ThemePill themeId={c?.theme_primary || null} /></td>
                  <td className="px-4 py-3"><CenterBadge center={c?.center || null} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.review_status} /></td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-brand-muted text-xs">
                    {item.reviewed_at ? (
                      <span title={item.reviewed_by || ''}>
                        {new Date(item.reviewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' '}
                        <span className="opacity-60">{new Date(item.reviewed_at).toLocaleDateString()}</span>
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-brand-muted">No items in this category.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-brand-border px-4 py-3">
          <span className="text-sm text-brand-muted">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-brand-border hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                typeof p === 'string' ? (
                  <span key={'ellipsis-' + i} className="text-brand-muted text-sm px-1">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm font-medium rounded-md ${
                      p === page
                        ? 'bg-brand-accent text-white'
                        : 'border border-brand-border hover:bg-brand-bg'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-brand-border hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <SlidePanel open={!!selected} onClose={() => setSelected(null)} title="Review Detail">
        {selected && classification && (
          <div className="space-y-6">
            {/* Original vs AI */}
            <div>
              <h4 className="text-xs font-semibold text-brand-muted uppercase mb-2">Original Title</h4>
              <p className="text-sm">{selected.content_inbox?.title || '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-brand-muted uppercase mb-2">AI Title (6th Grade)</h4>
              <p className="text-sm font-medium">{classification.title_6th_grade}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-brand-muted uppercase mb-2">AI Summary (6th Grade)</h4>
              <p className="text-sm">{classification.summary_6th_grade}</p>
            </div>

            {/* Classification */}
            <div className="border-t border-brand-border pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-brand-muted uppercase mb-2">Classification</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-brand-muted text-xs">Pathway</span>
                  <div className="mt-1"><ThemePill themeId={classification.theme_primary} size="md" /></div>
                </div>
                <div>
                  <span className="text-brand-muted text-xs">Center</span>
                  <div className="mt-1"><CenterBadge center={classification.center} /></div>
                </div>
                <div>
                  <span className="text-brand-muted text-xs">Confidence</span>
                  <div className="mt-1"><ConfidenceBadge confidence={classification.confidence} /></div>
                </div>
                <div>
                  <span className="text-brand-muted text-xs">SDOH</span>
                  <div className="mt-1 text-xs">{classification.sdoh_code || '-'}</div>
                </div>
              </div>

              <div>
                <span className="text-brand-muted text-xs">Focus Areas</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(classification.focus_area_ids || []).map((id: string) => (
                    <span key={id} className="text-xs bg-brand-bg px-2 py-0.5 rounded">{id}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">SDGs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(classification.sdg_ids || []).map((id: string) => (
                    <span key={id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{id}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">Audience</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(classification.audience_segment_ids || []).map((id: string) => (
                    <span key={id} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{segmentMap[id] || id.replace('SEG_', '').replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">Life Situations</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(classification.life_situation_ids || []).map((id: string) => (
                    <span key={id} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">{id}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">Action Items</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(classification.action_items || {}).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-brand-muted">{k}:</span>{' '}
                      <a href={v as string} target="_blank" rel="noreferrer" className="text-brand-accent underline">{(v as string).substring(0, 60)}</a>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">Keywords</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(classification.keywords || []).length > 0
                    ? classification.keywords!.map((kw: string) => (
                        <span key={kw} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{kw}</span>
                      ))
                    : <span className="text-xs text-brand-muted italic">None extracted</span>
                  }
                </div>
              </div>
              <div>
                <span className="text-brand-muted text-xs">Reasoning</span>
                <p className="mt-1 text-xs text-brand-muted">{classification.reasoning}</p>
              </div>
            </div>

            {/* Source Link */}
            {selected.content_inbox?.source_url && (
              <div className="border-t border-brand-border pt-4">
                <a href={selected.content_inbox.source_url} target="_blank" rel="noreferrer" className="text-sm text-brand-accent underline">
                  View Source →
                </a>
              </div>
            )}

            {/* Actions */}
            {(selected.review_status === 'pending' || selected.review_status === 'flagged' || selected.review_status === 'auto_approved') && (
              <div className="border-t border-brand-border pt-4 space-y-3">
                {actionError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                    {actionError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={acting}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {acting ? 'Processing...' : 'Approve & Publish'}
                  </button>
                  <button
                    onClick={handleFlag}
                    disabled={acting}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {acting ? '...' : 'Flag'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={acting}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {acting ? 'Processing...' : 'Reject'}
                  </button>
                </div>
                <textarea
                  placeholder="Reviewer notes (optional)..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  )
}
