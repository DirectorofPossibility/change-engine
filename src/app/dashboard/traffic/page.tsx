/**
 * @fileoverview SEO / Traffic Overview dashboard page.
 *
 * Lightweight traffic analytics built from internal data sources:
 * - Session activity over the last 14 days
 * - Top search queries by frequency
 * - User journey patterns (event type penetration across sessions)
 * - Top landing pathways
 * - Geographic reach by ZIP code
 *
 * @datasource Supabase tables: wayfinder_events, content_published
 * @route GET /dashboard/traffic
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { BarChart3, Users, Activity, Search } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'

export default async function TrafficPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Build date for 14 days ago
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0]

  const [
    { count: totalEvents },
    { data: allSessionIds },
    { count: eventsToday },
    { count: searchesToday },
    { data: last14DaysEvents },
    { data: searchEvents },
    { data: allEventsForJourney },
    { data: pathwayClicks },
    { data: zipEvents },
  ] = await Promise.all([
    // Total events
    supabase.from('wayfinder_events' as any).select('id', { count: 'exact', head: true }),
    // All session IDs for total unique count
    supabase.from('wayfinder_events' as any).select('session_id').limit(50000),
    // Events today
    supabase.from('wayfinder_events' as any).select('id', { count: 'exact', head: true }).gte('created_at', today),
    // Searches today
    supabase.from('wayfinder_events' as any).select('id', { count: 'exact', head: true }).eq('event_type', 'search').gte('created_at', today),
    // Last 14 days events (session_id + created_at for daily breakdown)
    supabase.from('wayfinder_events' as any).select('session_id, created_at').gte('created_at', fourteenDaysAgoStr).limit(50000),
    // All search events for top searches
    supabase.from('wayfinder_events' as any).select('event_data').eq('event_type', 'search').limit(5000),
    // All events for journey pattern analysis
    supabase.from('wayfinder_events' as any).select('session_id, event_type').limit(50000),
    // Pathway clicks
    supabase.from('wayfinder_events' as any).select('event_data').eq('event_type', 'pathway_click').limit(5000),
    // ZIP set events
    supabase.from('wayfinder_events' as any).select('event_data').eq('event_type', 'zip_set').limit(5000),
  ])

  // ── Stats Row ──
  const totalSessions = new Set((allSessionIds ?? []).map((r: any) => r.session_id)).size

  // ── Session Activity (last 14 days) ──
  const dayMap: Record<string, { sessions: Set<string>; events: number }> = {}
  for (const row of (last14DaysEvents ?? []) as any[]) {
    const day = row.created_at?.split('T')[0]
    if (!day) continue
    if (!dayMap[day]) dayMap[day] = { sessions: new Set(), events: 0 }
    dayMap[day].sessions.add(row.session_id)
    dayMap[day].events++
  }

  // Build sorted array for last 14 days (fill in missing days with zeros)
  const activityDays: { day: string; sessions: number; events: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const entry = dayMap[key]
    activityDays.push({
      day: key,
      sessions: entry ? entry.sessions.size : 0,
      events: entry ? entry.events : 0,
    })
  }

  // ── Top Searches ──
  const searchCounts: Record<string, number> = {}
  for (const row of (searchEvents ?? []) as any[]) {
    const q = (row.event_data?.query || row.event_data?.term || '').toLowerCase().trim()
    if (q) searchCounts[q] = (searchCounts[q] || 0) + 1
  }
  const topSearches = Object.entries(searchCounts).sort((a, b) => b[1] - a[1]).slice(0, 15)

  // ── User Journey Patterns ──
  const sessionEventTypes: Record<string, Set<string>> = {}
  for (const row of (allEventsForJourney ?? []) as any[]) {
    if (!row.session_id) continue
    if (!sessionEventTypes[row.session_id]) sessionEventTypes[row.session_id] = new Set()
    sessionEventTypes[row.session_id].add(row.event_type)
  }
  const journeyTotal = Object.keys(sessionEventTypes).length || 1
  const eventTypePenetration: Record<string, number> = {}
  for (const types of Object.values(sessionEventTypes)) {
    types.forEach(function (t) {
      eventTypePenetration[t] = (eventTypePenetration[t] || 0) + 1
    })
  }
  const journeyPatterns = Object.entries(eventTypePenetration)
    .map(([type, count]) => ({
      type,
      count,
      pct: Math.round((count / journeyTotal) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)

  const EVENT_LABELS: Record<string, string> = {
    pathway_click: 'Pathway Click',
    archetype_select: 'Archetype Select',
    zip_set: 'ZIP Set',
    search: 'Search',
    detail_view: 'Detail View',
    tier_expand: 'Tier Expand',
  }

  // ── Top Landing Pathways ──
  const pathwayCounts: Record<string, number> = {}
  for (const row of (pathwayClicks ?? []) as any[]) {
    const pw = row.event_data?.pathway || row.event_data?.theme_id || 'unknown'
    pathwayCounts[pw] = (pathwayCounts[pw] || 0) + 1
  }
  const topPathways = Object.entries(pathwayCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxPathwayCount = topPathways.length > 0 ? topPathways[0][1] : 1

  // ── Geographic Reach ──
  const zipCounts: Record<string, number> = {}
  for (const row of (zipEvents ?? []) as any[]) {
    const zip = row.event_data?.zip || row.event_data?.zip_code || row.event_data?.zipCode || ''
    if (zip) zipCounts[zip] = (zipCounts[zip] || 0) + 1
  }
  const topZips = Object.entries(zipCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxZipCount = topZips.length > 0 ? topZips[0][1] : 1

  const noData = (totalEvents || 0) === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Traffic Overview</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Sessions" value={totalSessions} icon={<Users size={28} />} />
        <StatsCard label="Total Events" value={totalEvents || 0} icon={<Activity size={28} />} />
        <StatsCard label="Events Today" value={eventsToday || 0} icon={<BarChart3 size={28} />} />
        <StatsCard label="Searches Today" value={searchesToday || 0} icon={<Search size={28} />} />
      </div>

      {noData && (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-8 text-center">
          <p className="text-brand-muted text-lg">No traffic data yet.</p>
          <p className="text-brand-muted-light text-sm mt-2">
            Data will populate as users interact with the site — page views, searches, pathway clicks, and ZIP code entries.
          </p>
        </div>
      )}

      {!noData && (
        <>
          {/* Session Activity — Last 14 Days */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Session Activity — Last 14 Days</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left text-brand-muted">
                    <th className="pb-2 font-medium">Day</th>
                    <th className="pb-2 font-medium text-right">Sessions</th>
                    <th className="pb-2 font-medium text-right">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {activityDays.map((d) => (
                    <tr key={d.day} className={d.day === today ? 'bg-brand-bg/50' : ''}>
                      <td className="py-2 font-mono text-xs">{d.day}</td>
                      <td className="py-2 text-right font-medium">{d.sessions}</td>
                      <td className="py-2 text-right font-medium">{d.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Searches + User Journey Patterns */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Searches */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Top Searches</h3>
              {topSearches.length === 0 ? (
                <p className="text-sm text-brand-muted-light">No searches recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {topSearches.map(([term, count], i) => (
                    <div key={term} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-brand-muted-light w-5 text-right">{i + 1}.</span>
                        <span className="text-sm italic">&ldquo;{term}&rdquo;</span>
                      </div>
                      <span className="text-sm font-medium text-brand-muted">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Journey Patterns */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">User Journey Patterns</h3>
              <p className="text-xs text-brand-muted-light mb-4">Percentage of sessions that include each event type</p>
              <div className="space-y-3">
                {journeyPatterns.map(({ type, count, pct }) => (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{EVENT_LABELS[type] || type}</span>
                      <span className="text-brand-muted">{pct}% <span className="text-xs text-brand-muted-light">({count.toLocaleString()})</span></span>
                    </div>
                    <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-accent/50"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Landing Pathways + Geographic Reach */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Landing Pathways */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Top Landing Pathways</h3>
              {topPathways.length === 0 ? (
                <p className="text-sm text-brand-muted-light">No pathway clicks recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {topPathways.map(([pw, count]) => (
                    <div key={pw} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-32 truncate capitalize">{pw.replace(/_/g, ' ')}</span>
                      <div className="flex-1 bg-brand-bg rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-accent/40"
                          style={{ width: `${(count / maxPathwayCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Geographic Reach */}
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Geographic Reach</h3>
              {topZips.length === 0 ? (
                <p className="text-sm text-brand-muted-light">No ZIP codes recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {topZips.map(([zip, count]) => (
                    <div key={zip} className="flex items-center gap-3">
                      <span className="text-sm font-mono font-medium w-16">{zip}</span>
                      <div className="flex-1 bg-brand-bg rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-accent/40"
                          style={{ width: `${(count / maxZipCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
