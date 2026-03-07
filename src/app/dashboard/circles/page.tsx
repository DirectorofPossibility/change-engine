import type { Metadata } from 'next'
import { getCircleGraphData } from '@/lib/data/exchange'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'

export const metadata: Metadata = {
  title: 'Circle Knowledge Graph — Pipeline Admin',
  description: 'Interactive visualization of the 7-pathway circle knowledge graph.',
}

export default async function CirclesPage() {
  const data = await getCircleGraphData()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Circle Knowledge Graph</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interactive visualization of 7 pathways, focus areas, and entity connections.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-6">
        <CircleKnowledgeGraph data={data} />
      </div>
    </div>
  )
}
