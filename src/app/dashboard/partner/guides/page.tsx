/**
 * @fileoverview Partner guides listing page.
 *
 * Lists all guides belonging to the partner's organization with status badges
 * and links to create new or edit existing guides.
 *
 * @route GET /dashboard/partner/guides
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'

export default async function PartnerGuidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/guides')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  const { data: guides } = await supabase
    .from('guides')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  const allGuides = (guides || []) as any[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text font-serif">My Guides</h1>
          <p className="text-brand-muted mt-1">Create and manage guides for your community</p>
        </div>
        <Link
          href="/dashboard/partner/guides/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium"
        >
          + New Guide
        </Link>
      </div>

      {/* Guides List */}
      {allGuides.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted mb-4">You have not created any guides yet.</p>
          <Link
            href="/dashboard/partner/guides/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium"
          >
            Create Your First Guide
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Pathway</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allGuides.map((guide: any) => {
                const theme = guide.theme_id ? (THEMES as any)[guide.theme_id] : null
                return (
                  <tr key={guide.guide_id} className="border-b border-brand-border/50 hover:bg-brand-bg/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-brand-text">{guide.title}</p>
                        {guide.description && (
                          <p className="text-xs text-brand-muted mt-0.5 truncate max-w-xs">
                            {guide.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {theme ? (
                        <span
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded"
                          style={{ backgroundColor: theme.color + '20', color: theme.color }}
                        >
                          {theme.name}
                        </span>
                      ) : (
                        <span className="text-brand-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ReviewStatusBadge status={guide.review_status} />
                    </td>
                    <td className="px-4 py-3">
                      {guide.is_active ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Active" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" title="Inactive" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {guide.updated_at
                        ? new Date(guide.updated_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/partner/guides/${guide.guide_id}`}
                        className="text-brand-accent hover:underline text-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
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
