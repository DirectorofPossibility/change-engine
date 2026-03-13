/**
 * @fileoverview Wayfinder Analytics dashboard page.
 *
 * Shows engagement data from the wayfinder_events table:
 * - Total events, unique sessions, events today
 * - Breakdown by event type (pathway_click, archetype_select, zip_set, etc.)
 * - Recent events log
 * - Top pathways clicked, top search terms
 *
 * @datasource Supabase table: wayfinder_events
 * @route GET /dashboard/analytics
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BarChart3, Users, Activity, MousePointer } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'

const EVENT_LABELS: Record<string, string> = {
  pathway_click: 'Pathway Click',
  archetype_select: 'Archetype Select',
  zip_set: 'ZIP Set',
  search: 'Search',
  detail_view: 'Detail View',
  tier_expand: 'Tier Expand',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch all stats in parallel
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalEvents },
    { data: sessionsRaw },
    { count: todayEvents },
    { data: byType },
    { data: recentEvents },
    { data: pathwayClicks },
    { data: searchEvents },
  ] = await Promise.all([
    // Total events
    supabase.from('wayfinder_events' as any).select('id', { count: 'exact', head: true }),
    // Unique sessions
    supabase.from('wayfinder_events' as any).select('session_id').limit(10000),
    // Events today
    supabase.from('wayfinder_events' as any).select('id', { count: 'exact', head: true }).gte('created_at', today),
    // Breakdown by event type
    supabase.from('wayfinder_events' as any).select('event_type').limit(10000),
    // Recent events
    supabase.from('wayfinder_events' as any).select('*').order('created_at', { ascending: false }).limit(50),
    // Pathway clicks (event_data has pathway info)
    supabase.from('wayfinder_events' as any).select('event_data').eq('event_type', 'pathway_click').limit(5000),
    // Search events
    supabase.from('wayfinder_events' as any).select('event_data').eq('event_type', 'search').limit(1000),
  ])

  // Count unique sessions
  const uniqueSessions = new Set((sessionsRaw ?? []).map((r: any) => r.session_id)).size

  // Count by event type
  const typeCounts: Record<string, number> = {}
  for (const row of (byType ?? []) as any[]) {
    typeCounts[row.event_type] = (typeCounts[row.event_type] || 0) + 1
  }
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1

  // Top pathways clicked
  const pathwayCounts: Record<string, number> = {}
  for (const row of (pathwayClicks ?? []) as any[]) {
    const pw = row.event_data?.pathway || row.event_data?.theme_id || 'unknown'
    pathwayCounts[pw] = (pathwayCounts[pw] || 0) + 1
  }
  const topPathways = Object.entries(pathwayCounts).sort((a, b) => b[1] - a[1]).slice(0, 7)

  // Top search terms
  const searchCounts: Record<string, number> = {}
  for (const row of (searchEvents ?? []) as any[]) {
    const q = (row.event_data?.query || '').toLowerCase().trim()
    if (q) searchCounts[q] = (searchCounts[q] || 0) + 1
  }
  const topSearches = Object.entries(searchCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const noData = (totalEvents || 0) === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wayfinder Analytics</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Events" value={totalEvents || 0} icon={<Activity size={28} />} />
        <StatsCard label="Unique Sessions" value={uniqueSessions} icon={<Users size={28} />} />
        <StatsCard label="Events Today" value={todayEvents || 0} icon={<BarChart3 size={28} />} />
        <StatsCard label="Event Types" value={sortedTypes.length} icon={<MousePointer size={28} />} />
      </div>

      {noData && (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-8 text-center">
          <p className="text-brand-muted text-lg">No engagement data yet.</p>
          <p className="text-brand-muted-light text-sm mt-2">
            Events will appear here as users interact with the Wayfinder — pathway clicks, searches, ZIP codes, and more.
          </p>
        </div>
      )}

      {!noData && (
        <>
          {/* Event Type Breakdown + Top Pathways */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Events by Type</h3>
              <div className="space-y-3">
                {sortedTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-36 truncate">{EVENT_LABELS[type] || type}</span>
                    <div className="flex-1 bg-brand-bg rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-accent/40"
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Top Pathways</h3>
              {topPathways.length === 0 ? (
                <p className="text-sm text-brand-muted-light">No pathway clicks yet</p>
              ) : (
                <div className="space-y-3">
                  {topPathways.map(([pw, count]) => (
                    <div key={pw} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pw}</span>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Searches + Recent Events */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Top Searches</h3>
              {topSearches.length === 0 ? (
                <p className="text-sm text-brand-muted-light">No searches yet</p>
              ) : (
                <div className="space-y-2">
                  {topSearches.map(([term, count]) => (
                    <div key={term} className="flex items-center justify-between">
                      <span className="text-sm italic">&ldquo;{term}&rdquo;</span>
                      <span className="text-sm font-medium text-brand-muted">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Recent Events</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border text-left text-brand-muted">
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Details</th>
                      <th className="pb-2 font-medium">Session</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {(recentEvents as any[] ?? []).map((ev: any) => {
                      const details = ev.event_data
                        ? Object.entries(ev.event_data)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                        : ''
                      const time = new Date(ev.created_at)
                      const ago = getTimeAgo(time)
                      return (
                        <tr key={ev.id} className="text-sm">
                          <td className="py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-bg text-brand-text">
                              {EVENT_LABELS[ev.event_type] || ev.event_type}
                            </span>
                          </td>
                          <td className="py-2 text-brand-muted max-w-xs truncate">{details}</td>
                          <td className="py-2 font-mono text-xs text-brand-muted-light">{(ev.session_id || '').slice(0, 8)}</td>
                          <td className="py-2 text-brand-muted-light whitespace-nowrap">{ago}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

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
