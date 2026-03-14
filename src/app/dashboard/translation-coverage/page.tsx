export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { getTranslationStats } from '@/lib/data/dashboard'
import { StatsCard } from '@/components/ui/StatsCard'

const ENTITY_LABELS: Record<string, string> = {
  content_published: 'Published Content',
  elected_officials: 'Elected Officials',
  services_211: 'Services (211)',
  policies: 'Policies',
  organizations: 'Organizations',
  opportunities: 'Opportunities',
  foundations: 'Foundations',
  events: 'Events',
  campaigns: 'Campaigns',
  learning_paths: 'Learning Paths',
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}

function fmt(n: number): string {
  return n.toLocaleString()
}

export default async function TranslationCoveragePage() {
  const stats = await getTranslationStats()

  // Field-level breakdown: count translations grouped by field_name
  const supabase = await createClient()
  const { data: fieldRows } = await supabase
    .from('translations')
    .select('field_name, language_id, content_id')

  // Deduplicate by content_id per field_name + language
  const fieldCounts: Record<string, { es: number; vi: number }> = {}
  const seen: Record<string, Set<string>> = {}

  for (const row of fieldRows || []) {
    if (!row.content_id || !row.field_name || !row.language_id) continue
    const key = `${row.field_name}__${row.language_id}`
    if (!seen[key]) seen[key] = new Set()
    if (seen[key].has(row.content_id)) continue
    seen[key].add(row.content_id)

    const fn = row.field_name as string
    if (!fieldCounts[fn]) fieldCounts[fn] = { es: 0, vi: 0 }
    if (row.language_id === 'LANG-ES') fieldCounts[fn].es++
    if (row.language_id === 'LANG-VI') fieldCounts[fn].vi++
  }

  // Aggregate title fields and summary fields
  const titleEs = (fieldCounts['title']?.es ?? 0) + (fieldCounts['title_6th_grade']?.es ?? 0)
  const titleVi = (fieldCounts['title']?.vi ?? 0) + (fieldCounts['title_6th_grade']?.vi ?? 0)
  const summaryEs = (fieldCounts['summary']?.es ?? 0) + (fieldCounts['summary_6th_grade']?.es ?? 0)
  const summaryVi = (fieldCounts['summary']?.vi ?? 0) + (fieldCounts['summary_6th_grade']?.vi ?? 0)

  const { esCount, viCount, totalPublished, breakdown } = stats
  const overallCoverage = pct(esCount + viCount, totalPublished * 2)

  // Sort breakdown by worst coverage for gap analysis
  const gapAnalysis = [...breakdown]
    .map((b) => ({
      ...b,
      label: ENTITY_LABELS[b.entity] || b.entity,
      coveragePct: pct(b.es + b.vi, b.total * 2),
      gap: b.total * 2 - b.es - b.vi,
    }))
    .sort((a, b) => a.coveragePct - b.coveragePct)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Translation Coverage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track Spanish and Vietnamese translation progress across all entity types and fields.
        </p>
      </div>

      {/* 1. Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Items" value={totalPublished} />
        <StatsCard label="Spanish Translated" value={esCount} />
        <StatsCard label="Vietnamese Translated" value={viCount} />
        <StatsCard label="Overall Coverage" value={`${overallCoverage}%`} />
      </div>

      {/* 2. Coverage Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
          <h2 className="text-lg font-semibold mb-1">Spanish Coverage</h2>
          <p className="text-sm text-brand-muted mb-3">
            {fmt(esCount)} / {fmt(totalPublished)} items = {pct(esCount, totalPublished)}%
          </p>
          <div className="w-full h-4 rounded-full bg-brand-bg">
            <div
              className="h-4 rounded-full bg-brand-accent/40"
              style={{ width: `${pct(esCount, totalPublished)}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
          <h2 className="text-lg font-semibold mb-1">Vietnamese Coverage</h2>
          <p className="text-sm text-brand-muted mb-3">
            {fmt(viCount)} / {fmt(totalPublished)} items = {pct(viCount, totalPublished)}%
          </p>
          <div className="w-full h-4 rounded-full bg-brand-bg">
            <div
              className="h-4 rounded-full bg-brand-accent/40"
              style={{ width: `${pct(viCount, totalPublished)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Coverage by Entity Type */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Coverage by Entity Type</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="py-2 pr-4 font-medium text-brand-muted">Entity Type</th>
                <th className="py-2 pr-4 font-medium text-brand-muted text-right">Total</th>
                <th className="py-2 pr-4 font-medium text-brand-muted">Spanish</th>
                <th className="py-2 pr-4 font-medium text-brand-muted">Vietnamese</th>
                <th className="py-2 font-medium text-brand-muted text-right">Gap</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => {
                const esPct = pct(b.es, b.total)
                const viPct = pct(b.vi, b.total)
                const gap = b.total * 2 - b.es - b.vi
                return (
                  <tr key={b.entity} className="border-b border-brand-border/50">
                    <td className="py-3 pr-4 font-medium">
                      {ENTITY_LABELS[b.entity] || b.entity}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{fmt(b.total)}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 rounded-full bg-brand-bg min-w-[80px]">
                          <div
                            className="h-3 rounded-full bg-brand-accent/40"
                            style={{ width: `${esPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-brand-muted tabular-nums w-16 text-right">
                          {fmt(b.es)} ({esPct}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-3 rounded-full bg-brand-bg min-w-[80px]">
                          <div
                            className="h-3 rounded-full bg-brand-accent/40"
                            style={{ width: `${viPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-brand-muted tabular-nums w-16 text-right">
                          {fmt(b.vi)} ({viPct}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums">{fmt(gap)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Translation Gap Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Translation Gap Analysis</h2>
        <p className="text-sm text-brand-muted mb-4">
          Entity types sorted by lowest combined coverage (ES + VI). Focus translation efforts here first.
        </p>
        <div className="space-y-3">
          {gapAnalysis.map((g) => (
            <div key={g.entity}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{g.label}</span>
                <span className="text-xs text-brand-muted tabular-nums">
                  {g.coveragePct}% covered — {fmt(g.gap)} translations needed
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-brand-bg">
                <div
                  className={`h-3 rounded-full ${
                    g.coveragePct >= 75
                      ? 'bg-green-400'
                      : g.coveragePct >= 40
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                  }`}
                  style={{ width: `${g.coveragePct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Field Coverage */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border p-6">
        <h2 className="text-lg font-semibold mb-1">Field Coverage</h2>
        <p className="text-sm text-brand-muted mb-4">
          Breakdown by translated field type (title fields vs summary fields).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="py-2 pr-4 font-medium text-brand-muted">Field Group</th>
                <th className="py-2 pr-4 font-medium text-brand-muted text-right">Spanish</th>
                <th className="py-2 pr-4 font-medium text-brand-muted text-right">Vietnamese</th>
                <th className="py-2 font-medium text-brand-muted text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-border/50">
                <td className="py-3 pr-4 font-medium">Title Fields</td>
                <td className="py-3 pr-4 text-right tabular-nums">{fmt(titleEs)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{fmt(titleVi)}</td>
                <td className="py-3 text-right tabular-nums">{fmt(titleEs + titleVi)}</td>
              </tr>
              <tr className="border-b border-brand-border/50">
                <td className="py-3 pr-4 font-medium">Summary Fields</td>
                <td className="py-3 pr-4 text-right tabular-nums">{fmt(summaryEs)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{fmt(summaryVi)}</td>
                <td className="py-3 text-right tabular-nums">{fmt(summaryEs + summaryVi)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Per-field detail */}
        <h3 className="text-sm font-semibold mt-6 mb-3 text-brand-muted">Individual Fields</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="py-2 pr-4 font-medium text-brand-muted">Field Name</th>
                <th className="py-2 pr-4 font-medium text-brand-muted text-right">Spanish</th>
                <th className="py-2 font-medium text-brand-muted text-right">Vietnamese</th>
              </tr>
            </thead>
            <tbody>
              {['title', 'title_6th_grade', 'summary', 'summary_6th_grade'].map((fn) => (
                <tr key={fn} className="border-b border-brand-border/50">
                  <td className="py-2 pr-4 font-mono text-xs">{fn}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{fmt(fieldCounts[fn]?.es ?? 0)}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(fieldCounts[fn]?.vi ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
