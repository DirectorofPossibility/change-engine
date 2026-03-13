/**
 * @fileoverview Admin dashboard overview page.
 *
 * Displays at-a-glance pipeline health: total ingested, needs-review,
 * published, and translated counts; a pipeline flow visualization;
 * content distribution charts by pathway and center; a recent activity
 * log from the ingestion_log table; and the status of all scheduled
 * cron jobs.
 *
 * All data is fetched server-side in parallel via dashboard helpers.
 *
 * @datasource Supabase tables: content (aggregated), ingestion_log;
 *   CRON_JOBS constant from dashboard types
 * @caching Dynamic (no explicit revalidate; re-fetched on each request)
 * @route GET /dashboard
 */

import { getPipelineStats, getReviewStatusBreakdown, getContentByPathway, getContentByCenter, getIngestionLog, getEntityCounts } from '@/lib/data/dashboard'
import Link from 'next/link'
import { Inbox, Search, CheckCircle, Globe, Database } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'
import { PipelineFlow } from '@/components/ui/PipelineFlow'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CRON_JOBS } from '@/lib/types/dashboard'

export default async function DashboardPage() {
  const [stats, breakdown, byPathway, byCenter, activity, entityCounts] = await Promise.all([
    getPipelineStats(),
    getReviewStatusBreakdown(),
    getContentByPathway(),
    getContentByCenter(),
    getIngestionLog(10),
    getEntityCounts(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Ingested" value={stats.totalIngested} icon={<Inbox size={28} />} />
        <StatsCard label="Needs Review" value={stats.needsReview} icon={<Search size={28} />} />
        <StatsCard label="Published" value={stats.published} icon={<CheckCircle size={28} />} />
        <StatsCard label="Translated" value={stats.translated} icon={<Globe size={28} />} />
      </div>

      {/* ── Entity Counts ── */}
      {(() => {
        const ENTITY_LINKS: Record<string, string> = {
          content_published: '/news',
          elected_officials: '/officials',
          policies: '/policies',
          services_211: '/services',
          organizations: '/organizations',
          opportunities: '/opportunities',
          focus_areas: '/pathways',
          learning_paths: '/learning',
          neighborhoods: '/neighborhoods',
          foundations: '/foundations',
          campaigns: '/community',
          events: '/calendar',
          kb_documents: '/library',
        }
        const entityTables = entityCounts.filter(e => !e.table.startsWith('content_type:'))
        const contentTypes = entityCounts.filter(e => e.table.startsWith('content_type:'))
        const entityTotal = entityTables.reduce((sum, e) => sum + e.count, 0)
        const contentTypeTotal = contentTypes.reduce((sum, e) => sum + e.count, 0)
        return (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database size={16} className="text-brand-muted" />
                <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide">Object Types</h3>
                <span className="text-xs text-brand-muted ml-auto">
                  {entityTotal.toLocaleString()} total records
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {entityTables
                  .sort((a, b) => b.count - a.count)
                  .map((entity) => {
                    const href = ENTITY_LINKS[entity.table]
                    return href ? (
                      <Link key={entity.table} href={href} className="flex items-center justify-between bg-brand-bg rounded-lg px-4 py-3 hover:bg-brand-accent/10 transition-colors">
                        <span className="text-sm font-medium truncate mr-2">{entity.label}</span>
                        <span className="text-lg font-bold text-brand-accent tabular-nums">{entity.count.toLocaleString()}</span>
                      </Link>
                    ) : (
                      <div key={entity.table} className="flex items-center justify-between bg-brand-bg rounded-lg px-4 py-3">
                        <span className="text-sm font-medium truncate mr-2">{entity.label}</span>
                        <span className="text-lg font-bold text-brand-accent tabular-nums">{entity.count.toLocaleString()}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
            {contentTypes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database size={16} className="text-brand-muted" />
                  <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide">Content by Type</h3>
                  <span className="text-xs text-brand-muted ml-auto">
                    {contentTypeTotal.toLocaleString()} classified items
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {contentTypes.map((ct) => {
                    const typeKey = ct.table.replace('content_type:', '')
                    return (
                      <Link key={ct.table} href={'/news?type=' + typeKey} className="flex items-center justify-between bg-brand-bg rounded-lg px-4 py-3 hover:bg-brand-accent/10 transition-colors">
                        <span className="text-sm font-medium truncate mr-2">{ct.label}</span>
                        <span className="text-lg font-bold text-brand-accent tabular-nums">{ct.count.toLocaleString()}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* ── Pipeline Flow ── */}
      <PipelineFlow stats={stats} breakdown={breakdown} />

      {/* ── Content by Pathway + Center ── */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Content by Pathway</h3>
          <div className="space-y-3">
            {Object.entries(byPathway)
              .sort((a, b) => b[1] - a[1])
              .map(([themeId, count]) => (
                <div key={themeId} className="flex items-center gap-3">
                  <ThemePill themeId={themeId} size="md" linkable={false} />
                  <div className="flex-1 bg-brand-bg rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-accent/30"
                      style={{ width: `${stats.published > 0 ? Math.min((count / stats.published) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Content by Center</h3>
          <div className="space-y-4">
            {Object.entries(byCenter).map(([center, count]) => (
              <div key={center} className="flex items-center justify-between">
                <CenterBadge center={center} linkable={false} />
                <span className="text-lg font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted">
                <th className="pb-2 font-medium">Event</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Message</th>
                <th className="pb-2 font-medium">Items</th>
                <th className="pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((log) => (
                <tr key={log.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                  <td className="py-2 font-mono text-xs">{log.event_type}</td>
                  <td className="py-2 text-brand-muted">{log.source}</td>
                  <td className="py-2"><StatusBadge status={log.status} /></td>
                  <td className="py-2 text-xs max-w-xs truncate">{log.message}</td>
                  <td className="py-2">{log.item_count}</td>
                  <td className="py-2 text-brand-muted text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Cron Status ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Cron Jobs ({CRON_JOBS.length} Active)</h3>
        <div className="grid grid-cols-2 gap-3">
          {CRON_JOBS.map((job) => (
            <div key={job.name} className="flex items-center justify-between bg-brand-bg rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium">{job.name}</p>
                <p className="text-xs text-brand-muted">{job.description}</p>
              </div>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-brand-border">{job.schedule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
