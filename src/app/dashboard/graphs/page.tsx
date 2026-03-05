/**
 * @fileoverview Unified Graphs page with tabs for each graph type.
 *
 * Consolidates Knowledge Graph, Circle Graph, Coverage Heatmap, and
 * Graph Explorer into a single page with a tabbed interface.
 *
 * @route GET /dashboard/graphs
 */

import type { Metadata } from 'next'
import { getGraphExplorerData, getGraphCoverage } from '@/lib/data/dashboard'
import { GraphsClient } from './GraphsClient'

export const metadata: Metadata = {
  title: 'Graphs — Pipeline Admin',
  description: 'Unified graph visualizations: knowledge graph, circles, coverage, and explorer.',
}

export default async function GraphsPage() {
  const [{ nodes, edges }, { cells, entityCounts }] = await Promise.all([
    getGraphExplorerData(),
    getGraphCoverage(),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Graphs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualize the knowledge graph from multiple perspectives.
        </p>
      </div>
      <GraphsClient
        explorerNodes={nodes}
        explorerEdges={edges}
        coverageCells={cells}
        coverageEntityCounts={entityCounts}
      />
    </div>
  )
}
