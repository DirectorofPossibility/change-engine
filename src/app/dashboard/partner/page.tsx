/**
 * @fileoverview Partner portal overview page.
 *
 * Displays organization name, content stats (guides by status, events count),
 * quick-action links, and recent activity for the partner's organization.
 *
 * @route GET /dashboard/partner
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerSubmissionTracker } from '@/components/dashboard/PartnerSubmissionTracker'

export default async function PartnerOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  // Fetch org name
  const { data: org } = await supabase
    .from('organizations')
    .select('org_name')
    .eq('org_id', orgId)
    .single()

  // Fetch guides stats
  const { data: guides } = await supabase
    .from('guides')
    .select('guide_id, review_status, is_active, updated_at')
    .eq('org_id', orgId)

  const allGuides = guides || []
  const pendingGuides = allGuides.filter((g: any) => g.review_status === 'pending').length
  const approvedGuides = allGuides.filter((g: any) => g.review_status === 'approved').length
  const rejectedGuides = allGuides.filter((g: any) => g.review_status === 'rejected').length

  // Fetch events stats
  const { data: events } = await supabase
    .from('opportunities')
    .select('opportunity_id, start_date, end_date, last_updated')
    .eq('org_id', orgId)

  const allEvents = events || []
  const now = new Date().toISOString()
  const upcomingEvents = allEvents.filter((e: any) => e.start_date && e.start_date >= now).length

  // Recent activity (last 5 updated guides + events, sorted by date)
  const recentGuides = allGuides
    .filter((g: any) => g.updated_at)
    .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const recentEvents = allEvents
    .filter((e: any) => e.last_updated)
    .sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-text font-serif">
          {org?.org_name || 'Partner Portal'}
        </h1>
        <p className="text-brand-muted mt-1">
          Manage your guides and community events
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <p className="text-sm text-brand-muted">Total Guides</p>
          <p className="text-3xl font-bold text-brand-text mt-1">{allGuides.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <p className="text-sm text-brand-muted">Approved Guides</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{approvedGuides}</p>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <p className="text-sm text-brand-muted">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingGuides}</p>
        </div>
        <div className="bg-white rounded-xl border border-brand-border p-6">
          <p className="text-sm text-brand-muted">Events</p>
          <p className="text-3xl font-bold text-brand-text mt-1">{allEvents.length}</p>
          <p className="text-xs text-brand-muted mt-1">{upcomingEvents} upcoming</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/partner/guides/new"
          className="bg-white rounded-xl border border-brand-border p-6 hover:border-brand-accent transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">+</span>
            <div>
              <p className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                Create a New Guide
              </p>
              <p className="text-sm text-brand-muted">
                Share knowledge and resources with the community
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/dashboard/partner/events/new"
          className="bg-white rounded-xl border border-brand-border p-6 hover:border-brand-accent transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">+</span>
            <div>
              <p className="font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                Create a New Event
              </p>
              <p className="text-sm text-brand-muted">
                Add volunteer opportunities and community events
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Status Overview */}
      {rejectedGuides > 0 && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-700">
            <span className="font-semibold">{rejectedGuides} guide{rejectedGuides > 1 ? 's' : ''}</span>{' '}
            need{rejectedGuides === 1 ? 's' : ''} revision.{' '}
            <Link href="/dashboard/partner/guides" className="underline hover:text-red-900">
              View guides
            </Link>
          </p>
        </div>
      )}

      {/* Submission Tracker */}
      <PartnerSubmissionTracker orgId={orgId} />

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-brand-border p-6">
        <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
          Recent Activity
        </h2>
        {recentGuides.length === 0 && recentEvents.length === 0 ? (
          <p className="text-brand-muted text-sm">
            No activity yet. Create your first guide or event to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {recentGuides.map((g: any) => (
              <div key={g.guide_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-brand-muted">Guide</span>
                  <span className="font-medium text-brand-text truncate max-w-xs">
                    {g.guide_id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ReviewStatusBadge status={g.review_status} />
                  <span className="text-xs text-brand-muted">
                    {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            ))}
            {recentEvents.map((e: any) => (
              <div key={e.opportunity_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-brand-muted">Event</span>
                  <span className="font-medium text-brand-text truncate max-w-xs">
                    {e.opportunity_id}
                  </span>
                </div>
                <span className="text-xs text-brand-muted">
                  {e.last_updated ? new Date(e.last_updated).toLocaleDateString() : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Inline helper ── */

function ReviewStatusBadge({ status }: { status: string | null }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending:  { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pending' },
    approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Approved' },
    rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rejected' },
  }
  const c = config[status || ''] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || '-' }
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}
