import type { Metadata } from 'next'
import { getCircleGraphData } from '@/lib/data/exchange'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'

export const metadata: Metadata = {
  title: 'Knowledge Graph — Pipeline Admin',
}

export default async function KnowledgeGraphPage() {
  const data = await getCircleGraphData()
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Graph</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CircleKnowledgeGraph data={data} />
      </div>
    </div>
  )
}
