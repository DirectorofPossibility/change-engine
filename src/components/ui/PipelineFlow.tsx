import type { PipelineStats, ReviewStatusBreakdown } from '@/lib/types/dashboard'

interface PipelineFlowProps {
  stats: PipelineStats
  breakdown: ReviewStatusBreakdown & { total: number }
}

export function PipelineFlow({ stats, breakdown }: PipelineFlowProps) {
  return (
    <div className="bg-white shadow-sm border border-brand-border p-6">
      <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wide mb-4">Pipeline Flow</h3>
      <div className="flex items-center gap-2">
        {/* Inbox */}
        <div className="flex-1 bg-blue-50 border border-blue-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{stats.totalIngested}</p>
          <p className="text-xs text-blue-600 mt-1">Inbox</p>
        </div>

        <span className="text-brand-muted text-xl">→</span>

        {/* Review */}
        <div className="flex-1 bg-gray-50 border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold">{breakdown.total}</p>
          <p className="text-xs text-brand-muted mt-1">Review</p>
          <div className="flex justify-center gap-2 mt-2 text-xs">
            <span className="text-green-600">{breakdown.auto_approved} approved</span>
            <span className="text-yellow-600">{breakdown.pending} pending</span>
            {breakdown.flagged > 0 && <span className="text-red-600">{breakdown.flagged} flagged</span>}
          </div>
        </div>

        <span className="text-brand-muted text-xl">→</span>

        {/* Published */}
        <div className="flex-1 bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.published}</p>
          <p className="text-xs text-green-600 mt-1">Published</p>
        </div>
      </div>
    </div>
  )
}
