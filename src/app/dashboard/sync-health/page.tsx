/**
 * @fileoverview Sync Health monitoring dashboard.
 *
 * Displays operational health of all cron jobs, RSS feeds, and the ingestion
 * pipeline. Surfaces errors, staleness, and performance metrics so operators
 * can spot problems at a glance.
 *
 * @datasource Supabase tables: ingestion_log, rss_feeds
 * @route GET /dashboard/sync-health
 */

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { StatsCard } from '@/components/ui/StatsCard'

/* ── Cron definitions ── */

const CRON_JOBS = [
  { name: 'sync-polling-places', schedule: '0 6 * * *', label: 'Polling Places', freq: 'Daily 6 AM' },
  { name: 'poll-rss', schedule: '0 3 * * *', label: 'RSS Feeds', freq: 'Daily 3 AM' },
  { name: 'batch-translate', schedule: '0 1 * * *', label: 'Batch Translate', freq: 'Daily 1 AM' },
  { name: 'retry-failed', schedule: '0 2 * * *', label: 'Retry Failed', freq: 'Daily 2 AM' },
  { name: 'sync-city-houston', schedule: '0 7 * * *', label: 'City of Houston', freq: 'Daily 7 AM' },
  { name: 'sync-county-harris', schedule: '0 8 * * *', label: 'Harris County', freq: 'Daily 8 AM' },
  { name: 'sync-officials', schedule: '0 9 * * *', label: 'Officials', freq: 'Daily 9 AM' },
  { name: 'sync-state-texas', schedule: '0 10 * * *', label: 'State of Texas', freq: 'Daily 10 AM' },
  { name: 'sync-elections', schedule: '30 5 * * 1', label: 'Elections', freq: 'Mon 5:30 AM' },
  { name: 'sync-federal-spending', schedule: '0 5 * * 1', label: 'Federal Spending', freq: 'Mon 5 AM' },
  { name: 'classify-pending', schedule: '0 11 * * *', label: 'Classify Pending', freq: 'Daily 11 AM' },
  { name: 'rewrite-descriptions', schedule: '0 12 * * *', label: 'Rewrite Descriptions', freq: 'Daily 12 PM' },
  { name: 'send-reminders', schedule: '0 14 * * *', label: 'Send Reminders', freq: 'Daily 2 PM' },
  { name: 'crawl-orgs', schedule: '0 4 * * 0', label: 'Crawl Orgs', freq: 'Sun 4 AM' },
  { name: 'sync-city-sf', schedule: '30 7 * * *', label: 'City of SF', freq: 'Daily 7:30 AM' },
  { name: 'poll-ics', schedule: '0 4 * * *', label: 'ICS Calendars', freq: 'Daily 4 AM' },
]

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

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

function stalenessBadge(lastPolled: string | null) {
  if (!lastPolled) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Never</span>
  const hoursAgo = (Date.now() - new Date(lastPolled).getTime()) / (1000 * 60 * 60)
  if (hoursAgo < 24) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Fresh</span>
  if (hoursAgo < 48) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Stale</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Overdue</span>
}

/* ── Page ── */

export default async function SyncHealthPage() {
  const supabase = await createClient()
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Fetch rss_feeds via service-role key (no RLS SELECT for anon)
  const rssUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const rssKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  const rssFetch = fetch(`${rssUrl}/rest/v1/rss_feeds?order=feed_name`, {
    headers: { apikey: rssKey, Authorization: `Bearer ${rssKey}` },
    cache: 'no-store',
  })

  const [
    { data: recentLogs },
    { count: totalSyncs24h },
    { count: successCount24h },
    { count: failedCount24h },
    { data: durationRows },
    { data: allLogs },
    { data: errorLogs },
    rssRes,
  ] = await Promise.all([
    // Recent 20 entries
    supabase
      .from('ingestion_log' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
    // Total syncs in last 24h
    supabase
      .from('ingestion_log' as any)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo),
    // Success count in last 24h
    supabase
      .from('ingestion_log' as any)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)
      .eq('status', 'success'),
    // Failed count in last 24h
    supabase
      .from('ingestion_log' as any)
      .select('id', { count: 'exact', head: true })
      .gte('created_at', twentyFourHoursAgo)
      .eq('status', 'error'),
    // Duration rows for average calculation
    supabase
      .from('ingestion_log' as any)
      .select('duration_ms')
      .gte('created_at', twentyFourHoursAgo)
      .not('duration_ms', 'is', null),
    // All recent logs for cron job matching (wider window)
    supabase
      .from('ingestion_log' as any)
      .select('source, status, item_count, created_at, event_type')
      .order('created_at', { ascending: false })
      .limit(500),
    // Error logs (last 10)
    supabase
      .from('ingestion_log' as any)
      .select('*')
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(10),
    // RSS feeds
    rssFetch,
  ])

  // Parse RSS feeds
  let rssFeeds: any[] = []
  try {
    if (rssRes.ok) rssFeeds = await rssRes.json()
  } catch { /* ignore parse errors */ }

  // Compute stats
  const total24 = totalSyncs24h || 0
  const success24 = successCount24h || 0
  const failed24 = failedCount24h || 0
  const successRate = total24 > 0 ? `${Math.round((success24 / total24) * 100)}%` : '—'

  const durations = ((durationRows ?? []) as any[]).map((r: any) => r.duration_ms).filter(Boolean)
  const avgDuration = durations.length > 0
    ? `${(durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 1000).toFixed(1)}s`
    : '—'

  // Build cron job health map: source → most recent log entry
  const cronMap: Record<string, any> = {}
  for (const row of (allLogs ?? []) as any[]) {
    const src = row.source || row.event_type || ''
    if (!cronMap[src]) cronMap[src] = row
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sync Health</h1>

      {/* ── 1. Stats Row ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard label="Total Syncs (24h)" value={total24} icon={<Activity size={28} />} />
        <StatsCard label="Success Rate" value={successRate} icon={<CheckCircle size={28} />} />
        <StatsCard label="Failed Syncs (24h)" value={failed24} icon={<AlertTriangle size={28} />} />
        <StatsCard label="Avg Duration" value={avgDuration} icon={<Clock size={28} />} />
      </div>

      {/* ── 2. Cron Job Health Grid ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Cron Job Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {CRON_JOBS.map((job) => {
            // Try matching by source name (may appear as "sync-officials", "poll-rss", etc.)
            const match = cronMap[job.name] || cronMap[job.name.replace(/-/g, '_')] || cronMap[job.label]
            const lastRun = match?.created_at ? new Date(match.created_at) : null
            const status = match?.status || 'unknown'
            const items = match?.item_count ?? '—'

            const borderColor = status === 'success'
              ? 'border-l-green-500'
              : status === 'error'
                ? 'border-l-red-500'
                : 'border-l-yellow-500'

            return (
              <div key={job.name} className={`border border-brand-border rounded-lg p-4 border-l-4 ${borderColor}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold truncate">{job.label}</span>
                  {statusBadge(status)}
                </div>
                <p className="text-xs text-brand-muted">{job.freq}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-brand-muted-light">
                  <span>{lastRun ? getTimeAgo(lastRun) : 'No runs'}</span>
                  <span>{items !== '—' ? `${items} items` : ''}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 3. Recent Sync Activity ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Recent Sync Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted">
                <th className="pb-2 font-medium">Event</th>
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Message</th>
                <th className="pb-2 font-medium text-right">Items</th>
                <th className="pb-2 font-medium text-right">Duration</th>
                <th className="pb-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              {((recentLogs ?? []) as any[]).map((log: any) => (
                <tr key={log.id} className="text-sm">
                  <td className="py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-bg text-brand-text">
                      {log.event_type || '—'}
                    </span>
                  </td>
                  <td className="py-2 text-brand-muted">{log.source || '—'}</td>
                  <td className="py-2">{statusBadge(log.status)}</td>
                  <td className="py-2 text-brand-muted max-w-xs truncate">{log.message || '—'}</td>
                  <td className="py-2 text-right font-mono">{log.item_count ?? '—'}</td>
                  <td className="py-2 text-right font-mono text-brand-muted-light">
                    {log.duration_ms != null ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-2 text-right text-brand-muted-light whitespace-nowrap">
                    {log.created_at ? getTimeAgo(new Date(log.created_at)) : '—'}
                  </td>
                </tr>
              ))}
              {((recentLogs ?? []) as any[]).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-brand-muted-light">No sync activity recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. RSS Feed Health ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">RSS Feed Health</h3>
        {rssFeeds.length === 0 ? (
          <p className="text-sm text-brand-muted-light">No RSS feeds configured.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-brand-muted">
                  <th className="pb-2 font-medium">Feed Name</th>
                  <th className="pb-2 font-medium">URL</th>
                  <th className="pb-2 font-medium">Active</th>
                  <th className="pb-2 font-medium">Last Polled</th>
                  <th className="pb-2 font-medium">Staleness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/50">
                {rssFeeds.map((feed: any) => (
                  <tr key={feed.feed_url || feed.feed_name} className="text-sm">
                    <td className="py-2 font-medium">{feed.feed_name || '—'}</td>
                    <td className="py-2 text-brand-muted max-w-xs truncate">
                      <a href={feed.feed_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {feed.feed_url || '—'}
                      </a>
                    </td>
                    <td className="py-2">
                      {feed.is_active
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Active</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                      }
                    </td>
                    <td className="py-2 text-brand-muted-light whitespace-nowrap">
                      {feed.last_polled ? getTimeAgo(new Date(feed.last_polled)) : 'Never'}
                    </td>
                    <td className="py-2">{stalenessBadge(feed.last_polled)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Error Log ── */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Recent Errors</h3>
        {((errorLogs ?? []) as any[]).length === 0 ? (
          <p className="text-sm text-brand-muted-light">No errors recorded. All systems healthy.</p>
        ) : (
          <div className="space-y-3">
            {((errorLogs ?? []) as any[]).map((err: any) => (
              <div key={err.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      {err.event_type || err.source || 'error'}
                    </span>
                    {err.source && err.source !== err.event_type && (
                      <span className="text-xs text-brand-muted">{err.source}</span>
                    )}
                  </div>
                  <span className="text-xs text-brand-muted-light whitespace-nowrap">
                    {err.created_at ? getTimeAgo(new Date(err.created_at)) : '—'}
                  </span>
                </div>
                <p className="text-sm text-red-900 mt-1">{err.message || 'No error message'}</p>
                {err.source_url && (
                  <a
                    href={err.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 hover:underline mt-1 block truncate"
                  >
                    {err.source_url}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
