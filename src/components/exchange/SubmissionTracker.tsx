'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Submission {
  inbox_id: string
  source_url: string
  status: string
  notes: string | null
  created_at: string
}

export function SubmissionTracker({ authId }: { authId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(function () {
    const supabase = createClient()
    supabase
      .from('content_inbox')
      .select('inbox_id, source_url, status, notes, created_at')
      .eq('submitted_by', authId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(function ({ data }) {
        setSubmissions((data || []) as unknown as Submission[])
        setLoading(false)
      })
  }, [authId])

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold text-brand-text mb-4">My Submissions</h2>
        <div className="bg-white border border-brand-border p-6">
          <div className="h-4 w-32 bg-brand-bg rounded animate-pulse" />
        </div>
      </section>
    )
  }

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending:       { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending Review' },
    needs_review:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Under Review' },
    approved:      { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
    published:     { bg: 'bg-green-50', text: 'text-green-700', label: 'Published' },
    rejected:      { bg: 'bg-red-50', text: 'text-red-700', label: 'Not Selected' },
    flagged:       { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Flagged' },
  }

  return (
    <section>
      <h2 className="text-lg font-bold text-brand-text mb-4">My Submissions</h2>
      {submissions.length === 0 ? (
        <div className="bg-white border border-brand-border p-6 text-center">
          <p className="text-brand-muted text-sm">No submissions yet. Share a resource to get started!</p>
        </div>
      ) : (
        <div className="bg-white border border-brand-border divide-y divide-brand-border">
          {submissions.map(function (s) {
            const sc = statusConfig[s.status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: s.status }
            let displayUrl = s.source_url
            try { displayUrl = new URL(s.source_url).hostname } catch { /* keep full url */ }
            return (
              <div key={s.inbox_id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-brand-text truncate" title={s.source_url}>
                    {displayUrl}
                  </p>
                  <p className="text-xs text-brand-muted">
                    {new Date(s.created_at).toLocaleDateString()}
                    {s.notes && <span className="ml-2">— {s.notes}</span>}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
