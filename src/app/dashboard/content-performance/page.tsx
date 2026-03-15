/**
 * @fileoverview Content Performance dashboard page.
 *
 * Shows engagement data by joining wayfinder_events (detail_view) with
 * content_published to surface which content gets the most attention:
 * - Total views, unique content viewed, avg views per item, views this week
 * - Top 10 most viewed content with title, pathway, view count, last viewed
 * - Views by pathway (bar chart)
 * - Views by content type breakdown
 * - Views over the last 14 days
 *
 * @datasource Supabase tables: wayfinder_events, content_published
 * @route GET /dashboard/content-performance
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Eye, FileText, TrendingUp, Calendar } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'

export default async function ContentPerformancePage() {
  const supabase = await createClient()

  // Date boundaries
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch all data in parallel
  const [
    { data: detailViews },
    { data: weekViews },
    { data: recentViews },
    { data: contentItems },
  ] = await Promise.all([
    // All detail_view events
    supabase
      .from('wayfinder_events' as any)
      .select('event_data, session_id, created_at')
      .eq('event_type', 'detail_view')
      .limit(10000),
    // Detail views this week
    supabase
      .from('wayfinder_events' as any)
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'detail_view')
      .gte('created_at', weekAgo),
    // Detail views last 14 days (for timeline)
    supabase
      .from('wayfinder_events' as any)
      .select('created_at')
      .eq('event_type', 'detail_view')
      .gte('created_at', fourteenDaysAgo)
      .limit(10000),
    // All published content for joining
    supabase
      .from('content_published' as any)
      .select('id, title_6th_grade, pathway_primary, center, content_type')
      .limit(5000),
  ])

  const allViews = (detailViews ?? []) as any[]
  const allContent = (contentItems ?? []) as any[]

  // Build content lookup by id
  const contentMap = new Map<string, any>()
  for (const item of allContent) {
    contentMap.set(item.id, item)
  }

  // --- Stats ---
  const totalViews = allViews.length
  const viewedEntityIds = new Set(
    allViews.map((v) => v.event_data?.entity_id).filter(Boolean)
  )
  const uniqueContentViewed = viewedEntityIds.size
  const avgViewsPerItem = uniqueContentViewed > 0 ? Math.round(totalViews / uniqueContentViewed) : 0
  const viewsThisWeek = weekViews ?? 0

  // --- Top 10 Most Viewed ---
  const viewsByEntity: Record<string, { count: number; lastViewed: string }> = {}
  for (const v of allViews) {
    const entityId = v.event_data?.entity_id
    if (!entityId) continue
    if (!viewsByEntity[entityId]) {
      viewsByEntity[entityId] = { count: 0, lastViewed: v.created_at }
    }
    viewsByEntity[entityId].count++
    if (v.created_at > viewsByEntity[entityId].lastViewed) {
      viewsByEntity[entityId].lastViewed = v.created_at
    }
  }

  const topContent = Object.entries(viewsByEntity)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([entityId, stats]) => {
      const content = contentMap.get(entityId)
      return {
        entityId,
        title: content?.title_6th_grade || 'Unknown Content',
        pathway: content?.pathway_primary || '—',
        contentType: content?.content_type || '—',
        count: stats.count,
        lastViewed: stats.lastViewed,
      }
    })

  // --- Views by Pathway ---
  const pathwayCounts: Record<string, number> = {}
  for (const v of allViews) {
    const entityId = v.event_data?.entity_id
    if (!entityId) continue
    const content = contentMap.get(entityId)
    const pw = content?.pathway_primary || 'unknown'
    pathwayCounts[pw] = (pathwayCounts[pw] || 0) + 1
  }
  const sortedPathways = Object.entries(pathwayCounts).sort((a, b) => b[1] - a[1])
  const maxPathwayCount = sortedPathways.length > 0 ? sortedPathways[0][1] : 1

  // --- Views by Content Type ---
  const typeCounts: Record<string, number> = {}
  for (const v of allViews) {
    const entityId = v.event_data?.entity_id
    if (!entityId) continue
    const content = contentMap.get(entityId)
    const ct = content?.content_type || 'unknown'
    typeCounts[ct] = (typeCounts[ct] || 0) + 1
  }
  const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const maxTypeCount = sortedTypes.length > 0 ? sortedTypes[0][1] : 1

  // --- Views Over Time (last 14 days) ---
  const dailyCounts: Record<string, number> = {}
  // Pre-fill all 14 days with 0
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dailyCounts[d.toISOString().split('T')[0]] = 0
  }
  for (const v of (recentViews ?? []) as any[]) {
    const day = v.created_at?.split('T')[0]
    if (day && dailyCounts.hasOwnProperty(day)) {
      dailyCounts[day]++
    }
  }
  const dailyEntries = Object.entries(dailyCounts)
  const maxDailyCount = Math.max(...dailyEntries.map(([, c]) => c), 1)

  const noData = totalViews === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Content Performance</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Views" value={totalViews} icon={<Eye size={28} />} />
        <StatsCard label="Unique Content Viewed" value={uniqueContentViewed} icon={<FileText size={28} />} />
        <StatsCard label="Avg Views / Item" value={avgViewsPerItem} icon={<TrendingUp size={28} />} />
        <StatsCard label="Views This Week" value={typeof viewsThisWeek === 'number' ? viewsThisWeek : 0} icon={<Calendar size={28} />} />
      </div>

      {noData && (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-8 text-center">
          <p className="text-brand-muted text-lg">No content view data yet.</p>
          <p className="text-brand-muted-light text-sm mt-2">
            Views will appear here as users view content detail pages through the Wayfinder.
          </p>
        </div>
      )}

      {!noData && (
        <>
          {/* Top 10 Most Viewed Content */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Top 10 Most Viewed Content</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left text-brand-muted">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium">Pathway</th>
                    <th className="pb-2 font-medium text-right">Views</th>
                    <th className="pb-2 font-medium">Last Viewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {topContent.map((item, idx) => (
                    <tr key={item.entityId}>
                      <td className="py-2 text-brand-muted-light">{idx + 1}</td>
                      <td className="py-2 font-medium max-w-xs truncate">{item.title}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-bg text-brand-text">
                          {item.pathway}
                        </span>
                      </td>
                      <td className="py-2 text-right font-bold">{item.count}</td>
                      <td className="py-2 text-brand-muted-light whitespace-nowrap">{getTimeAgo(new Date(item.lastViewed))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Views by Pathway + Views by Content Type */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Views by Pathway</h3>
              <div className="space-y-3">
                {sortedPathways.map(([pathway, count]) => (
                  <div key={pathway} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{pathway}</span>
                    <div className="flex-1 bg-brand-bg rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-accent/40"
                        style={{ width: `${(count / maxPathwayCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-10 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Views by Content Type</h3>
              <div className="space-y-3">
                {sortedTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{type}</span>
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
          </div>

          {/* Views Over Time — Last 14 Days */}
          <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Views Over Time — Last 14 Days</h3>
            <div className="flex items-end gap-1 h-40">
              {dailyEntries.map(([date, count]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-brand-muted">{count > 0 ? count : ''}</span>
                  <div
                    className="w-full bg-brand-accent/40 rounded-t"
                    style={{
                      height: `${Math.max((count / maxDailyCount) * 100, count > 0 ? 4 : 0)}%`,
                      minHeight: count > 0 ? '4px' : '0px',
                    }}
                  />
                  <span className="text-xs text-brand-muted-light">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
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
