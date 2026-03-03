'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { addFeed, updateFeed, deleteFeed, addTrustDomain, updateTrust, pollRssFeedsAction } from './actions'
import type { RssFeed } from '@/lib/types/dashboard'

const TABS = ['Pipeline Logs', 'RSS Feeds', 'Source Trust', 'Process Flow'] as const

interface PipelineFlowStats {
  inbox: { pending: number; classified: number; flagged: number; needs_review: number }
  review: { pending: number; auto_approved: number; approved: number; flagged: number; rejected: number }
  published: number
}

export function IngestionClient({
  initialLogs,
  initialFeeds,
  initialTrust,
  pipelineStats,
}: {
  initialLogs: any[]
  initialFeeds: RssFeed[]
  initialTrust: any[]
  pipelineStats: PipelineFlowStats
}) {
  const [activeTab, setActiveTab] = useState<string>('Pipeline Logs')
  const [logs] = useState(initialLogs)
  const [feeds, setFeeds] = useState(initialFeeds)
  const [trust] = useState(initialTrust)

  // Filters
  const [logTypeFilter, setLogTypeFilter] = useState('')
  const [logStatusFilter, setLogStatusFilter] = useState('')

  // Modals
  const [feedModal, setFeedModal] = useState<'add' | RssFeed | null>(null)
  const [trustModal, setTrustModal] = useState<'add' | any | null>(null)
  const [saving, setSaving] = useState(false)
  const [polling, setPolling] = useState(false)

  const eventTypes = Array.from(new Set(logs.map((l) => l.event_type).filter(Boolean)))
  const filteredLogs = logs.filter((l) => {
    if (logTypeFilter && l.event_type !== logTypeFilter) return false
    if (logStatusFilter && l.status !== logStatusFilter) return false
    return true
  })

  const [pollError, setPollError] = useState('')

  async function handlePollNow() {
    setPolling(true)
    setPollError('')
    try {
      const result = await pollRssFeedsAction()
      if (result?.error) {
        setPollError(result.error)
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setPollError(err.message || 'RSS poll failed')
    } finally {
      setPolling(false)
    }
  }

  async function handleToggleFeed(feed: RssFeed) {
    const result = await updateFeed(feed.id, { is_active: !feed.is_active })
    if (result && 'error' in result) {
      setPollError(result.error || 'Update failed')
      return
    }
    setFeeds(feeds.map(f => f.id === feed.id ? { ...f, is_active: !f.is_active } : f))
  }

  async function handleDeleteFeed(id: string) {
    if (!confirm('Delete this feed?')) return
    const result = await deleteFeed(id)
    if (result && 'error' in result) {
      setPollError(result.error || 'Delete failed')
      return
    }
    setFeeds(feeds.filter(f => f.id !== id))
  }

  async function handleSaveFeed(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setPollError('')
    try {
      const form = new FormData(e.currentTarget)
      const data = {
        feed_name: form.get('feed_name') as string,
        feed_url: form.get('feed_url') as string,
        source_domain: form.get('source_domain') as string,
        poll_interval_hours: parseInt(form.get('poll_interval_hours') as string) || 1,
      }
      let result
      if (feedModal === 'add') {
        result = await addFeed(data)
      } else if (feedModal && typeof feedModal === 'object') {
        result = await updateFeed(feedModal.id, data)
      }
      if (result?.error) {
        setPollError(result.error)
        return
      }
      setFeedModal(null)
      window.location.reload()
    } catch (err) {
      setPollError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTrust(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(e.currentTarget)
      const autoPublish = form.get('auto_publish') === 'on'
      let result
      if (trustModal === 'add') {
        result = await addTrustDomain({
          domain: form.get('domain') as string,
          trust_level: form.get('trust_level') as string,
          notes: form.get('notes') as string,
          auto_publish: autoPublish,
        })
      } else if (trustModal && typeof trustModal === 'object') {
        result = await updateTrust(trustModal.id, {
          trust_level: form.get('trust_level') as string,
          notes: form.get('notes') as string,
          auto_publish: autoPublish,
        })
      }
      if (result && 'error' in result) {
        setPollError(result.error || 'Save failed')
        return
      }
      setTrustModal(null)
      window.location.reload()
    } catch (err) {
      setPollError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ingestion Monitor</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg border border-brand-border p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-brand-accent text-white'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Pipeline Logs */}
      {activeTab === 'Pipeline Logs' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <select
              value={logTypeFilter}
              onChange={(e) => setLogTypeFilter(e.target.value)}
              className="border border-brand-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Event Types</option>
              {eventTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value)}
              className="border border-brand-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="skipped">Skipped</option>
            </select>
            <span className="text-sm text-brand-muted self-center">{filteredLogs.length} entries</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-3 font-medium">Event Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                    <td className="px-4 py-3 font-medium">{log.event_type}</td>
                    <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-4 py-3 text-brand-muted text-xs">{log.source_url?.substring(0, 40) || '-'}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs max-w-xs truncate">{log.message || '-'}</td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <div className="text-center py-12 text-brand-muted">No log entries found.</div>
            )}
          </div>
        </>
      )}

      {/* RSS Feeds */}
      {activeTab === 'RSS Feeds' && (
        <>
          <div className="flex gap-3">
            <button
              onClick={() => setFeedModal('add')}
              className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:opacity-90"
            >
              + Add Feed
            </button>
            <button
              onClick={handlePollNow}
              disabled={polling}
              className="px-4 py-2 text-sm border border-brand-border rounded-lg hover:bg-brand-bg disabled:opacity-50"
            >
              {polling ? 'Polling...' : 'Poll All Now'}
            </button>
          </div>
          {pollError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {pollError}
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-3 font-medium">Feed Name</th>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Interval</th>
                  <th className="px-4 py-3 font-medium">Last Polled</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium text-center">Active</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((feed) => (
                  <tr key={feed.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                    <td className="px-4 py-3 font-medium">{feed.feed_name}</td>
                    <td className="px-4 py-3 text-xs text-brand-muted max-w-xs truncate">{feed.feed_url}</td>
                    <td className="px-4 py-3 text-xs">{feed.source_domain || '-'}</td>
                    <td className="px-4 py-3 text-xs">{feed.poll_interval_hours}h</td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {feed.last_polled ? new Date(feed.last_polled).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-xs">{feed.last_item_count ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleFeed(feed)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${feed.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${feed.is_active ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setFeedModal(feed)} className="text-brand-accent text-xs hover:underline">Edit</button>
                        <button onClick={() => handleDeleteFeed(feed.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {feeds.length === 0 && (
              <div className="text-center py-12 text-brand-muted">No RSS feeds configured.</div>
            )}
          </div>
        </>
      )}

      {/* Source Trust */}
      {activeTab === 'Source Trust' && (
        <>
          <div className="flex gap-3">
            <button
              onClick={() => setTrustModal('add')}
              className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:opacity-90"
            >
              + Add Domain
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Trust Level</th>
                  <th className="px-4 py-3 font-medium">Auto Publish</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trust.map((t: any) => (
                  <tr key={t.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                    <td className="px-4 py-3 font-medium">{t.domain}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        t.trust_level === 'trusted' ? 'bg-green-100 text-green-700' :
                        t.trust_level === 'verified' ? 'bg-blue-100 text-blue-700' :
                        t.trust_level === 'unknown' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {t.trust_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.auto_publish ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Auto</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs max-w-sm truncate">{t.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setTrustModal(t)} className="text-brand-accent text-xs hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trust.length === 0 && (
              <div className="text-center py-12 text-brand-muted">No trust domains configured.</div>
            )}
          </div>
        </>
      )}

      {/* Process Flow */}
      {activeTab === 'Process Flow' && (
        <div className="space-y-6">
          {/* Pipeline Diagram */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
            <h2 className="text-lg font-semibold mb-6">Content Pipeline</h2>
            <div className="flex flex-col items-center gap-2">
              {/* Row 1: Source */}
              <div className="flex items-center gap-3">
                <PipelineBox label="Source" sublabel="URL / RSS / Batch" color="bg-blue-50 border-blue-300 text-blue-800" />
              </div>
              <PipelineArrow />

              {/* Row 2: Scrape + Classify */}
              <div className="flex items-center gap-3">
                <PipelineBox label="Scrape" sublabel="Extract text & metadata" color="bg-indigo-50 border-indigo-300 text-indigo-800" />
                <PipelineArrow horizontal />
                <PipelineBox label="Classify" sublabel="AI taxonomy mapping" color="bg-purple-50 border-purple-300 text-purple-800" />
              </div>
              <PipelineArrow />

              {/* Row 3: Inbox */}
              <div className="flex items-center gap-6">
                <PipelineBox
                  label="Inbox"
                  sublabel={`${pipelineStats.inbox.pending + pipelineStats.inbox.needs_review + pipelineStats.inbox.classified + pipelineStats.inbox.flagged} total`}
                  color="bg-yellow-50 border-yellow-300 text-yellow-800"
                  counts={[
                    { label: 'Pending', value: pipelineStats.inbox.pending },
                    { label: 'Needs Review', value: pipelineStats.inbox.needs_review },
                    { label: 'Classified', value: pipelineStats.inbox.classified },
                    { label: 'Flagged', value: pipelineStats.inbox.flagged },
                  ]}
                />
              </div>

              {/* Split into two paths */}
              <div className="flex items-start gap-12 mt-2">
                {/* Left path: Manual review */}
                <div className="flex flex-col items-center gap-2">
                  <PipelineArrow />
                  <PipelineBox
                    label="Review Queue"
                    sublabel="Human review"
                    color="bg-orange-50 border-orange-300 text-orange-800"
                    counts={[
                      { label: 'Pending', value: pipelineStats.review.pending },
                      { label: 'Approved', value: pipelineStats.review.approved },
                      { label: 'Flagged', value: pipelineStats.review.flagged },
                      { label: 'Rejected', value: pipelineStats.review.rejected },
                    ]}
                  />
                  <PipelineArrow />
                </div>

                {/* Right path: Auto-publish bypass */}
                <div className="flex flex-col items-center gap-2">
                  <PipelineArrow />
                  <PipelineBox
                    label="Auto-Publish"
                    sublabel="Trusted sources"
                    color="bg-green-50 border-green-300 text-green-800"
                    counts={[
                      { label: 'Auto-Approved', value: pipelineStats.review.auto_approved },
                    ]}
                  />
                  <PipelineArrow />
                </div>
              </div>

              {/* Row: Published */}
              <PipelineBox
                label="Published"
                sublabel={`${pipelineStats.published} items live`}
                color="bg-green-50 border-green-400 text-green-800"
                large
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Inbox" value={pipelineStats.inbox.pending + pipelineStats.inbox.needs_review + pipelineStats.inbox.classified + pipelineStats.inbox.flagged} />
            <StatCard label="Awaiting Review" value={pipelineStats.review.pending} />
            <StatCard label="Auto-Approved" value={pipelineStats.review.auto_approved} />
            <StatCard label="Published" value={pipelineStats.published} />
          </div>
        </div>
      )}

      {/* Feed Modal */}
      <Modal
        open={!!feedModal}
        onClose={() => setFeedModal(null)}
        title={feedModal === 'add' ? 'Add RSS Feed' : 'Edit RSS Feed'}
      >
        <form onSubmit={handleSaveFeed} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Feed Name</label>
            <input
              name="feed_name"
              defaultValue={feedModal !== 'add' && feedModal ? feedModal.feed_name : ''}
              required
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Feed URL</label>
            <input
              name="feed_url"
              defaultValue={feedModal !== 'add' && feedModal ? feedModal.feed_url : ''}
              required
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source Domain</label>
              <input
                name="source_domain"
                defaultValue={feedModal !== 'add' && feedModal ? feedModal.source_domain || '' : ''}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Poll Interval (hours)</label>
              <input
                name="poll_interval_hours"
                type="number"
                min="1"
                defaultValue={feedModal !== 'add' && feedModal ? feedModal.poll_interval_hours : 1}
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFeedModal(null)} className="px-4 py-2 text-sm border border-brand-border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Trust Modal */}
      <Modal
        open={!!trustModal}
        onClose={() => setTrustModal(null)}
        title={trustModal === 'add' ? 'Add Trust Domain' : 'Edit Trust Level'}
      >
        <form onSubmit={handleSaveTrust} className="space-y-4">
          {trustModal === 'add' && (
            <div>
              <label className="block text-sm font-medium mb-1">Domain</label>
              <input
                name="domain"
                required
                placeholder="example.org"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Trust Level</label>
            <select
              name="trust_level"
              defaultValue={trustModal !== 'add' && trustModal ? trustModal.trust_level : 'unknown'}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="trusted">Trusted</option>
              <option value="verified">Verified</option>
              <option value="unknown">Unknown</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              defaultValue={trustModal !== 'add' && trustModal ? trustModal.notes || '' : ''}
              rows={3}
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                name="auto_publish"
                defaultChecked={trustModal !== 'add' && trustModal ? trustModal.auto_publish === true : false}
                className="w-4 h-4 rounded border-brand-border text-brand-accent"
              />
              Auto Publish
            </label>
            <p className="text-xs text-brand-muted mt-1">Content from this source will bypass review and publish automatically.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTrustModal(null)} className="px-4 py-2 text-sm border border-brand-border rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

// ── Pipeline diagram helpers ─────────────────────────────────────────

function PipelineBox({ label, sublabel, color, counts, large }: {
  label: string
  sublabel: string
  color: string
  counts?: Array<{ label: string; value: number }>
  large?: boolean
}) {
  return (
    <div className={`border-2 rounded-lg px-4 py-3 text-center ${color} ${large ? 'px-8 py-4' : ''}`} style={{ minWidth: large ? 220 : 180 }}>
      <div className={`font-semibold ${large ? 'text-lg' : 'text-sm'}`}>{label}</div>
      <div className="text-xs opacity-70">{sublabel}</div>
      {counts && counts.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {counts.map((c) => (
            <span key={c.label} className="text-xs">
              <span className="font-medium">{c.value}</span> {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function PipelineArrow({ horizontal }: { horizontal?: boolean }) {
  if (horizontal) {
    return <div className="text-brand-muted text-lg">&rarr;</div>
  }
  return <div className="text-brand-muted text-lg">&darr;</div>
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-brand-border p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-brand-muted mt-1">{label}</div>
    </div>
  )
}
