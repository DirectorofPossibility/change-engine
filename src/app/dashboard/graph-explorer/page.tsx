import type { Metadata } from 'next'
import { getGraphExplorerData } from '@/lib/data/dashboard'
import { ForceGraph } from './ForceGraph'

export const metadata: Metadata = {
  title: 'Graph Explorer — Pipeline Admin',
  description: 'Interactive force-directed visualization of the knowledge graph.',
}

export default async function GraphExplorerPage() {
  const { nodes, edges } = await getGraphExplorerData()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Graph Explorer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Live force-directed graph of {nodes.length} entities and {edges.length} edges. Click nodes to inspect. Scroll to zoom. Drag to pan.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <ForceGraph nodes={nodes} edges={edges} />
      </div>
    </div>
  )
}
