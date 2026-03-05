'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GuideSubmission {
  guide_id: string
  title: string
  review_status: string | null
  is_active: boolean | null
  updated_at: string | null
}

interface EventSubmission {
  opportunity_id: string
  opportunity_name: string
  review_status: string | null
  start_date: string | null
  last_updated: string | null
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Review' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Needs Revision' },
}

export function PartnerSubmissionTracker({ orgId }: { orgId: string }) {
  const [guides, setGuides] = useState<GuideSubmission[]>([])
  const [events, setEvents] = useState<EventSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'guides' | 'events'>('guides')

  useEffect(function () {
    const supabase = createClient()

    Promise.all([
      supabase
        .from('guides')
        .select('guide_id, title, review_status, is_active, updated_at')
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(25),
      supabase
        .from('opportunities')
        .select('opportunity_id, opportunity_name, review_status, start_date, last_updated')
        .eq('org_id', orgId)
        .order('last_updated', { ascending: false })
        .limit(25),
    ]).then(function ([guidesRes, eventsRes]) {
      setGuides((guidesRes.data || []) as unknown as GuideSubmission[])
      setEvents((eventsRes.data || []) as unknown as EventSubmission[])
      setLoading(false)
    })
  }, [orgId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <div className="h-4 w-48 bg-brand-bg rounded animate-pulse mb-3" />
        <div className="h-4 w-32 bg-brand-bg rounded animate-pulse" />
      </div>
    )
  }

  const pendingGuides = guides.filter(function (g) { return g.review_status === 'pending' }).length
  const pendingEvents = events.filter(function (e) { return e.review_status === 'pending' }).length

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-border">
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide">
          Submission Tracker
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={function () { setTab('guides') }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'guides'
              ? 'text-brand-accent border-b-2 border-brand-accent'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Guides {pendingGuides > 0 && (
            <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
              {pendingGuides}
            </span>
          )}
        </button>
        <button
          onClick={function () { setTab('events') }}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === 'events'
              ? 'text-brand-accent border-b-2 border-brand-accent'
              : 'text-brand-muted hover:text-brand-text'
          }`}
        >
          Events {pendingEvents > 0 && (
            <span className="ml-1 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
              {pendingEvents}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-brand-border">
        {tab === 'guides' && (
          guides.length === 0 ? (
            <div className="p-6 text-center text-sm text-brand-muted">
              No guides submitted yet.
            </div>
          ) : (
            guides.map(function (g) {
              const sc = STATUS_CONFIG[g.review_status || ''] || { bg: 'bg-gray-50', text: 'text-gray-600', label: g.review_status || 'Draft' }
              return (
                <div key={g.guide_id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-text font-medium truncate">{g.title}</p>
                    {g.updated_at && (
                      <p className="text-xs text-brand-muted">
                        Updated {new Date(g.updated_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>
                </div>
              )
            })
          )
        )}

        {tab === 'events' && (
          events.length === 0 ? (
            <div className="p-6 text-center text-sm text-brand-muted">
              No events submitted yet.
            </div>
          ) : (
            events.map(function (e) {
              const sc = STATUS_CONFIG[e.review_status || ''] || { bg: 'bg-gray-50', text: 'text-gray-600', label: e.review_status || 'Draft' }
              return (
                <div key={e.opportunity_id} className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-text font-medium truncate">{e.opportunity_name}</p>
                    <p className="text-xs text-brand-muted">
                      {e.start_date ? new Date(e.start_date).toLocaleDateString() : 'No date set'}
                      {e.last_updated && <span> — Updated {new Date(e.last_updated).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}
