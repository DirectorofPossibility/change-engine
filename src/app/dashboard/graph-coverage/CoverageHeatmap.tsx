'use client'

import { useState, useMemo } from 'react'
import type { CoverageCell } from '@/lib/data/dashboard'

const DIMENSION_LABELS: Record<string, string> = {
  pathways: 'Pathways',
  sdgs: 'SDGs',
  focus_areas: 'Focus Areas',
  audience_segments: 'Audiences',
  life_situations: 'Life Situations',
  service_categories: 'Service Cats',
  neighborhoods: 'Neighborhoods',
}

const ENTITY_LABELS: Record<string, string> = {
  organization: 'Organizations',
  content: 'Content',
  policy: 'Policies',
  opportunity: 'Opportunities',
  official: 'Officials',
  foundation: 'Foundations',
  campaign: 'Campaigns',
  service: 'Services 211',
  benefit: 'Benefits',
  ballot_item: 'Ballot Items',
  agency: 'Agencies',
}

function heatColor(value: number, max: number): string {
  if (max === 0) return 'bg-gray-100'
  const ratio = value / max
  if (value === 0) return 'bg-gray-100'
  if (ratio < 0.01) return 'bg-amber-100'
  if (ratio < 0.05) return 'bg-amber-200'
  if (ratio < 0.1) return 'bg-orange-300'
  if (ratio < 0.25) return 'bg-orange-400'
  if (ratio < 0.5) return 'bg-orange-500 text-white'
  return 'bg-red-500 text-white'
}

interface Props {
  cells: CoverageCell[]
  entityCounts: Record<string, number>
}

export function CoverageHeatmap({ cells, entityCounts }: Props) {
  const [hoveredCell, setHoveredCell] = useState<CoverageCell | null>(null)

  const { grid, maxEdges, dimensions, entities, totalEdges, connectedPairs, totalPairs } = useMemo(() => {
    const grid = new Map<string, CoverageCell>()
    let maxEdges = 0
    let totalEdges = 0
    let connectedPairs = 0

    const dims = new Set<string>()
    const ents = new Set<string>()

    for (const cell of cells) {
      const key = `${cell.entity}:${cell.dimension}`
      grid.set(key, cell)
      if (cell.edgeCount > maxEdges) maxEdges = cell.edgeCount
      totalEdges += cell.edgeCount
      if (cell.edgeCount > 0) connectedPairs++
      dims.add(cell.dimension)
      ents.add(cell.entity)
    }

    return {
      grid,
      maxEdges,
      dimensions: Array.from(dims),
      entities: Array.from(ents).sort((a, b) => (entityCounts[b] ?? 0) - (entityCounts[a] ?? 0)),
      totalEdges,
      connectedPairs,
      totalPairs: dims.size * ents.size,
    }
  }, [cells, entityCounts])

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Edges</p>
          <p className="text-2xl font-bold text-gray-900">{totalEdges.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Connected Pairs</p>
          <p className="text-2xl font-bold text-gray-900">{connectedPairs} / {totalPairs}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Coverage</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalPairs > 0 ? Math.round((connectedPairs / totalPairs) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Densest Edge</p>
          <p className="text-2xl font-bold text-gray-900">{maxEdges.toLocaleString()}</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-medium text-gray-600 sticky left-0 bg-white min-w-[140px]">
                Entity Type
              </th>
              <th className="p-3 text-center text-xs text-gray-500 font-medium min-w-[60px]">
                Count
              </th>
              {dimensions.map((dim) => (
                <th key={dim} className="p-3 text-center text-xs text-gray-500 font-medium min-w-[100px]">
                  {DIMENSION_LABELS[dim] || dim}
                </th>
              ))}
              <th className="p-3 text-center text-xs text-gray-500 font-medium min-w-[80px]">
                Total Edges
              </th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => {
              const rowTotal = dimensions.reduce((sum, dim) => {
                const cell = grid.get(`${entity}:${dim}`)
                return sum + (cell?.edgeCount ?? 0)
              }, 0)

              return (
                <tr key={entity} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    {ENTITY_LABELS[entity] || entity}
                  </td>
                  <td className="p-3 text-center text-gray-600 font-mono text-xs">
                    {entityCounts[entity] ?? 0}
                  </td>
                  {dimensions.map((dim) => {
                    const cell = grid.get(`${entity}:${dim}`)
                    const count = cell?.edgeCount ?? -1
                    const isMissing = count === -1

                    return (
                      <td
                        key={dim}
                        className="p-1"
                        onMouseEnter={() => cell && setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {isMissing ? (
                          <div className="rounded-md p-3 text-center text-xs text-gray-300 bg-gray-50">
                            N/A
                          </div>
                        ) : (
                          <div className={`rounded-md p-3 text-center text-xs font-mono font-medium transition-all ${heatColor(count, maxEdges)}`}>
                            {count.toLocaleString()}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="p-3 text-center font-mono text-xs font-semibold text-gray-700">
                    {rowTotal.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-50">
              <td className="p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50">Column Totals</td>
              <td className="p-3 text-center font-mono text-xs font-semibold text-gray-700">
                {Object.values(entityCounts).reduce((a, b) => a + b, 0)}
              </td>
              {dimensions.map((dim) => {
                const colTotal = entities.reduce((sum, entity) => {
                  const cell = grid.get(`${entity}:${dim}`)
                  return sum + (cell?.edgeCount ?? 0)
                }, 0)
                return (
                  <td key={dim} className="p-3 text-center font-mono text-xs font-semibold text-gray-700">
                    {colTotal.toLocaleString()}
                  </td>
                )
              })}
              <td className="p-3 text-center font-mono text-xs font-bold text-gray-900">
                {totalEdges.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hover detail */}
      {hoveredCell && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-lg shadow-xl p-4 text-sm z-50 max-w-xs">
          <p className="font-semibold">{ENTITY_LABELS[hoveredCell.entity]} x {DIMENSION_LABELS[hoveredCell.dimension]}</p>
          <p className="text-gray-300 mt-1">
            {hoveredCell.edgeCount.toLocaleString()} edges across {hoveredCell.entityCount} entities
          </p>
          {hoveredCell.entityCount > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              ~{(hoveredCell.edgeCount / hoveredCell.entityCount).toFixed(1)} edges per entity
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Density:</span>
        <span className="inline-block w-6 h-4 rounded bg-gray-100 border border-gray-200" /> 0
        <span className="inline-block w-6 h-4 rounded bg-amber-100" /> Low
        <span className="inline-block w-6 h-4 rounded bg-amber-200" />
        <span className="inline-block w-6 h-4 rounded bg-orange-300" />
        <span className="inline-block w-6 h-4 rounded bg-orange-400" />
        <span className="inline-block w-6 h-4 rounded bg-orange-500" />
        <span className="inline-block w-6 h-4 rounded bg-red-500" /> High
        <span className="ml-4 text-gray-400">N/A = junction table does not exist for this combination</span>
      </div>
    </div>
  )
}
