'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { scoreAllEntities, enrichEntities } from '@/lib/data/edge-functions'
import { TierBadge } from '@/components/ui/TierBadge'
import {
  ENTITY_TYPE_META,
  TIER_CONFIG,
  type FidelityOverview,
  type EntityCompleteness,
} from '@/lib/types/dashboard'

interface Props {
  overview: FidelityOverview[]
}

const TIERS = ['platinum', 'gold', 'silver', 'bronze'] as const
const PAGE_SIZE = 50
const ENRICHABLE_TYPES = new Set(['organization', 'official', 'content'])

export function FidelityClient({ overview }: Props) {
  const [scoring, setScoring] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const [entities, setEntities] = useState<EntityCompleteness[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState<string | null>(null) // 'bronze-{type}' or entity_id
  const [enrichResult, setEnrichResult] = useState<string | null>(null)

  async function handleScore() {
    setScoring(true)
    try {
      const result = await scoreAllEntities()
      if (!result.ok) {
        alert('Scoring failed: ' + result.error)
        return
      }
      window.location.reload()
    } catch (err) {
      alert('Scoring failed: ' + (err as Error).message)
    } finally {
      setScoring(false)
    }
  }

  async function handleEnrichBronze(entityType: string, e: React.MouseEvent) {
    e.stopPropagation()
    const key = `bronze-${entityType}`
    setEnriching(key)
    setEnrichResult(null)
    try {
      // Fetch bronze entity IDs for this type
      const supabase = createClient()
      const { data: bronzeRows } = await supabase
        .from('entity_completeness' as any)
        .select('entity_id')
        .eq('entity_type', entityType)
        .eq('completeness_tier', 'bronze')
        .limit(20)
      const ids = (bronzeRows as unknown as { entity_id: string }[] || []).map(r => r.entity_id)
      if (ids.length === 0) {
        setEnrichResult('No bronze entities to enrich.')
        return
      }
      const result = await enrichEntities(entityType, ids)
      if (!result.ok) {
        setEnrichResult(`Enrichment failed: ${result.error}`)
        return
      }
      // Re-score and refresh
      await scoreAllEntities()
      window.location.reload()
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
    } finally {
      setEnriching(null)
    }
  }

  async function handleEnrichRow(entityType: string, entityId: string) {
    setEnriching(entityId)
    setEnrichResult(null)
    try {
      const result = await enrichEntities(entityType, [entityId])
      if (!result.ok) {
        setEnrichResult(`Enrichment failed: ${result.error}`)
        return
      }
      // Re-score then refresh the drilldown
      await scoreAllEntities()
      fetchEntities(entityType, tierFilter, page)
      setEnrichResult('Enriched successfully.')
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
    } finally {
      setEnriching(null)
    }
  }

  async function fetchEntities(entityType: string, tier: string | null, pageNum: number) {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('entity_completeness' as any)
        .select('*', { count: 'exact' })
        .eq('entity_type', entityType)
        .order('completeness_score', { ascending: true })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (tier) {
        query = query.eq('completeness_tier', tier)
      }

      const { data, count } = await query
      setEntities((data as unknown as EntityCompleteness[]) || [])
      setTotal(count ?? 0)
    } catch (err) {
      console.error('Failed to fetch entities:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCardClick(entityType: string) {
    setSelectedType(entityType)
    setTierFilter(null)
    setPage(0)
    fetchEntities(entityType, null, 0)
  }

  function handleTierFilter(tier: string | null) {
    setTierFilter(tier)
    setPage(0)
    if (selectedType) fetchEntities(selectedType, tier, 0)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    if (selectedType) fetchEntities(selectedType, tierFilter, newPage)
  }

  function tierColor(score: number): string {
    if (score >= 95) return 'text-purple-600'
    if (score >= 80) return 'text-amber-600'
    if (score >= 50) return 'text-gray-600'
    return 'text-orange-600'
  }

  const totalEntities = overview.reduce((sum, o) => sum + o.count, 0)
  const globalAvg = totalEntities > 0
    ? Math.round(overview.reduce((sum, o) => sum + o.avgScore * o.count, 0) / totalEntities)
    : 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-text">Entity Fidelity</h1>
          <p className="text-sm text-brand-muted mt-1">
            {totalEntities} entities scored — {globalAvg}% average completeness
          </p>
        </div>
        <button
          onClick={handleScore}
          disabled={scoring}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
        >
          {scoring ? 'Scoring...' : 'Score Now'}
        </button>
      </div>

      {/* Enrich status */}
      {enrichResult && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 border border-brand-border text-sm text-brand-muted">
          <span>{enrichResult}</span>
          <button onClick={() => setEnrichResult(null)} className="text-xs text-brand-muted hover:text-brand-text ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overview.map((o) => {
          const meta = ENTITY_TYPE_META[o.entityType] || { label: o.entityType, singular: o.entityType }
          const isSelected = selectedType === o.entityType
          return (
            <button
              key={o.entityType}
              onClick={() => handleCardClick(o.entityType)}
              className={`text-left p-5 rounded-xl border transition-all hover:shadow-md ${
                isSelected
                  ? 'border-brand-accent bg-brand-accent/5 shadow-md'
                  : 'border-brand-border bg-white hover:border-brand-accent/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-brand-muted">{meta.label}</p>
                  <p className="text-xs text-brand-muted/60">{o.count} entities</p>
                </div>
                <span className={`text-3xl font-bold ${tierColor(o.avgScore)}`}>
                  {o.avgScore}
                </span>
              </div>

              {/* Tier distribution bar */}
              <div className="flex rounded-full overflow-hidden h-2 mb-3">
                {TIERS.map((tier) => {
                  const pct = o.count > 0 ? (o.tiers[tier] / o.count) * 100 : 0
                  if (pct === 0) return null
                  const cfg = TIER_CONFIG[tier]
                  return (
                    <div
                      key={tier}
                      className={cfg.dot}
                      style={{ width: `${pct}%` }}
                      title={`${cfg.label}: ${o.tiers[tier]} (${Math.round(pct)}%)`}
                    />
                  )
                })}
              </div>

              {/* Tier counts */}
              <div className="flex gap-3 text-xs text-brand-muted mb-3">
                {TIERS.map((tier) => (
                  <span key={tier} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${TIER_CONFIG[tier].dot}`} />
                    {o.tiers[tier]}
                  </span>
                ))}
              </div>

              {/* Top critical missing */}
              {o.topMissing.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-brand-muted/50 font-medium">Critical gaps</p>
                  {o.topMissing.slice(0, 3).map((m) => (
                    <div key={m.field} className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted truncate">{m.field}</span>
                      <span className="text-red-500 font-medium ml-2">{m.pct}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Enrich Bronze button */}
              {ENRICHABLE_TYPES.has(o.entityType) && o.tiers.bronze > 0 && (
                <button
                  onClick={(e) => handleEnrichBronze(o.entityType, e)}
                  disabled={enriching === `bronze-${o.entityType}`}
                  className="mt-3 w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {enriching === `bronze-${o.entityType}` ? 'Enriching...' : `Enrich ${o.tiers.bronze} Bronze`}
                </button>
              )}
            </button>
          )
        })}
      </div>

      {/* No data state */}
      {overview.length === 0 && (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-lg mb-2">No scores yet</p>
          <p className="text-sm">Click "Score Now" to compute entity completeness scores.</p>
        </div>
      )}

      {/* Drilldown Table */}
      {selectedType && (
        <div className="bg-white rounded-xl border border-brand-border">
          <div className="p-4 border-b border-brand-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-brand-text">
                {ENTITY_TYPE_META[selectedType]?.label || selectedType}
              </h2>
              <button
                onClick={() => setSelectedType(null)}
                className="text-xs text-brand-muted hover:text-brand-text"
              >
                Close
              </button>
            </div>
            {/* Tier filter tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleTierFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  !tierFilter ? 'bg-brand-accent text-white' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleTierFilter(tier)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tierFilter === tier
                      ? `${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].text}`
                      : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
                  }`}
                >
                  {TIER_CONFIG[tier].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-brand-muted">Loading...</div>
          ) : entities.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No entities found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-brand-muted">Name</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-20">Score</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-24">Tier</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-24">Filled</th>
                      <th className="text-left px-4 py-3 font-medium text-brand-muted">Critical Missing</th>
                      {selectedType && ENRICHABLE_TYPES.has(selectedType) && (
                        <th className="text-center px-4 py-3 font-medium text-brand-muted w-24">Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((e) => (
                      <tr key={e.entity_id} className="border-b border-brand-border/50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-brand-text font-medium truncate max-w-[300px]">
                          {e.entity_name || e.entity_id}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${tierColor(e.completeness_score)}`}>
                            {e.completeness_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <TierBadge tier={e.completeness_tier} />
                        </td>
                        <td className="px-4 py-3 text-center text-brand-muted">
                          {e.filled_fields}/{e.total_fields}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(e.critical_missing || []).map((field) => (
                              <span
                                key={field}
                                className="inline-block px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 rounded"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </td>
                        {selectedType && ENRICHABLE_TYPES.has(selectedType) && (
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleEnrichRow(selectedType, e.entity_id)}
                              disabled={enriching === e.entity_id}
                              className="px-2.5 py-1 text-[11px] font-medium rounded border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 disabled:opacity-50 transition-colors"
                            >
                              {enriching === e.entity_id ? 'Enriching...' : 'Enrich'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
                  <p className="text-xs text-brand-muted">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
