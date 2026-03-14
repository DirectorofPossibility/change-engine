/**
 * @fileoverview Data Freshness monitoring dashboard.
 *
 * Shows staleness indicators for all entity tables, record counts,
 * update recency, and RSS feed polling status.
 *
 * @datasource Multiple entity tables (content_published, elected_officials, etc.)
 * @route GET /dashboard/data-freshness
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Database, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'

/* ── Table config ── */

const TABLE_CONFIG = [
  { table: 'content_published', label: 'Published Content', timeCol: 'last_updated' },
  { table: 'elected_officials', label: 'Elected Officials', timeCol: 'last_updated' },
  { table: 'policies', label: 'Policies', timeCol: 'last_updated' },
  { table: 'services_211', label: 'Services (211)', timeCol: 'last_updated' },
  { table: 'organizations', label: 'Organizations', timeCol: 'last_updated' },
  { table: 'opportunities', label: 'Opportunities', timeCol: 'last_updated' },
  { table: 'foundations', label: 'Foundations', timeCol: 'last_updated' },
  { table: 'events', label: 'Events', timeCol: 'last_updated' },
  { table: 'content_inbox', label: 'Inbox', timeCol: 'created_at' },
] as const

type TableInfo = {
  table: string
  label: string
  timeCol: string
  totalRecords: number
  mostRecent: Date | null
  updatedThisWeek: number
  stale30: number
  stale90: number
}

type RssFeed = {
  feed_name: string
  last_polled: string | null
  is_active: boolean
}

/* ── Helpers ── */

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getStaleness(date: Date | null): { label: string; color: string; bg: string } {
  if (!date) return { label: 'No Data', color: 'text-gray-400', bg: 'bg-gray-100' }
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60)
  if (hours < 24) return { label: 'Fresh', color: 'text-green-700', bg: 'bg-green-100' }
  if (hours < 7 * 24) return { label: 'Aging', color: 'text-yellow-700', bg: 'bg-yellow-100' }
  return { label: 'Stale', color: 'text-red-700', bg: 'bg-red-100' }
}

/* ── Page ── */

export default async function DataFreshnessPage() {
  const supabase = await createClient()
  const now = Date.now()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch data for all tables in parallel
  const tableResults: TableInfo[] = await Promise.all(
    TABLE_CONFIG.map(async ({ table, label, timeCol }) => {
      const [
        { count: totalRecords },
        { data: mostRecentRow },
        { count: updatedThisWeek },
        { count: stale30 },
        { count: stale90 },
      ] = await Promise.all([
        // Total records
        supabase.from(table as any).select('*', { count: 'exact', head: true }),
        // Most recent update
        supabase.from(table as any).select(timeCol).order(timeCol, { ascending: false }).limit(1),
        // Updated in last 7 days
        supabase.from(table as any).select('*', { count: 'exact', head: true }).gte(timeCol, weekAgo),
        // NOT updated in 30+ days
        supabase.from(table as any).select('*', { count: 'exact', head: true }).lt(timeCol, thirtyDaysAgo),
        // NOT updated in 90+ days
        supabase.from(table as any).select('*', { count: 'exact', head: true }).lt(timeCol, ninetyDaysAgo),
      ])

      const firstRow = mostRecentRow?.[0] as Record<string, any> | undefined
      const mostRecent = firstRow?.[timeCol]
        ? new Date(firstRow[timeCol])
        : null

      return {
        table,
        label,
        timeCol,
        totalRecords: totalRecords || 0,
        mostRecent,
        updatedThisWeek: updatedThisWeek || 0,
        stale30: stale30 || 0,
        stale90: stale90 || 0,
      }
    })
  )

  // Fetch RSS feeds using service-role key (no RLS SELECT policy)
  let rssFeeds: RssFeed[] = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
    const res = await fetch(
      `${url}/rest/v1/rss_feeds?select=feed_name,last_polled,is_active&order=feed_name`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      }
    )
    if (res.ok) {
      rssFeeds = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch rss_feeds:', err)
  }

  // Compute top-level stats
  const totalTables = TABLE_CONFIG.length
  const totalUpdatedThisWeek = tableResults.reduce((sum, t) => sum + t.updatedThisWeek, 0)

  const tablesWithDates = tableResults.filter((t) => t.mostRecent)
  const freshest = tablesWithDates.length > 0
    ? tablesWithDates.reduce((a, b) => (a.mostRecent! > b.mostRecent! ? a : b))
    : null
  const stalest = tablesWithDates.length > 0
    ? tablesWithDates.reduce((a, b) => (a.mostRecent! < b.mostRecent! ? a : b))
    : null

  // Sort for grid: stale first
  const sortedTables = [...tableResults].sort((a, b) => {
    if (!a.mostRecent && !b.mostRecent) return 0
    if (!a.mostRecent) return -1
    if (!b.mostRecent) return 1
    return a.mostRecent.getTime() - b.mostRecent.getTime()
  })

  const staleTables = tableResults.filter((t) => {
    const s = getStaleness(t.mostRecent)
    return s.label === 'Stale'
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Data Freshness</h1>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          label="Entity Tables"
          value={totalTables}
          icon={<Database size={28} />}
        />
        <StatsCard
          label="Freshest Table"
          value={freshest?.label || 'N/A'}
          icon={<CheckCircle size={28} />}
        />
        <StatsCard
          label="Stalest Table"
          value={stalest?.label || 'N/A'}
          icon={<AlertTriangle size={28} />}
        />
        <StatsCard
          label="Updated This Week"
          value={totalUpdatedThisWeek}
          icon={<Clock size={28} />}
        />
      </div>

      {/* ── Freshness Overview Grid ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
          Freshness Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted">
                <th className="pb-2 font-medium">Table</th>
                <th className="pb-2 font-medium text-right">Records</th>
                <th className="pb-2 font-medium">Last Updated</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Updated (7d)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {sortedTables.map((t) => {
                const staleness = getStaleness(t.mostRecent)
                return (
                  <tr key={t.table}>
                    <td className="py-3">
                      <span className="font-medium">{t.label}</span>
                      <span className="text-brand-muted-light text-xs ml-2">
                        {t.table}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">
                      {t.totalRecords.toLocaleString()}
                    </td>
                    <td className="py-3 text-brand-muted">
                      {t.mostRecent ? getTimeAgo(t.mostRecent) : 'Never'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${staleness.bg} ${staleness.color}`}
                      >
                        {staleness.label}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">
                      {t.updatedThisWeek.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Freshness Timeline ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
          Freshness Timeline
        </h3>
        <div className="space-y-3">
          {tableResults.map((t) => {
            const staleness = getStaleness(t.mostRecent)
            return (
              <div key={t.table} className="flex items-center gap-3">
                <span className="text-sm font-medium w-40 truncate">{t.label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      staleness.label === 'Fresh'
                        ? 'bg-green-500'
                        : staleness.label === 'Aging'
                          ? 'bg-yellow-500'
                          : staleness.label === 'Stale'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                    }`}
                  />
                  <span className={`text-sm ${staleness.color}`}>
                    {t.mostRecent ? `Last updated ${getTimeAgo(t.mostRecent)}` : 'No data'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Stale Records Breakdown ── */}
      {staleTables.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
          <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
            Stale Records Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted">
                  <th className="pb-2 font-medium">Table</th>
                  <th className="pb-2 font-medium text-right">Total Records</th>
                  <th className="pb-2 font-medium text-right">30+ Days Old</th>
                  <th className="pb-2 font-medium text-right">90+ Days Old</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {staleTables.map((t) => (
                  <tr key={t.table}>
                    <td className="py-3 font-medium">{t.label}</td>
                    <td className="py-3 text-right font-mono">
                      {t.totalRecords.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-yellow-700">
                      {t.stale30.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-red-700">
                      {t.stale90.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── RSS Feed Freshness ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">
          RSS Feed Freshness
        </h3>
        {rssFeeds.length === 0 ? (
          <p className="text-sm text-brand-muted-light">No RSS feeds found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted">
                  <th className="pb-2 font-medium">Feed</th>
                  <th className="pb-2 font-medium">Last Polled</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {rssFeeds.map((feed) => {
                  const polledDate = feed.last_polled ? new Date(feed.last_polled) : null
                  const staleness = getStaleness(polledDate)
                  return (
                    <tr key={feed.feed_name}>
                      <td className="py-3 font-medium">{feed.feed_name}</td>
                      <td className="py-3 text-brand-muted">
                        {polledDate ? getTimeAgo(polledDate) : 'Never'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${staleness.bg} ${staleness.color}`}
                        >
                          {staleness.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            feed.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {feed.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
