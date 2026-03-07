import type { Metadata } from 'next'
import { getCircleGraphData } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'

export const metadata: Metadata = {
  title: 'Civic Knowledge Graph — Community Exchange',
  description: 'Explore the Civic Knowledge Graph: 7 pathways, hundreds of focus areas, and thousands of connected entities across Houston.',
}

export const revalidate = 300

export default async function KnowledgeGraphPage() {
  const data = await getCircleGraphData()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb items={[{ label: 'Knowledge Graph' }]} />
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">The Civic Knowledge Galaxy.</h1>
        <p className="text-sm font-semibold text-brand-muted mb-1">Not a list. Not a directory. A living map of how it all fits together.</p>
        <p className="text-brand-muted max-w-2xl">
          A city council vote affects a neighborhood. A nonprofit serves families in that neighborhood. A foundation funds the nonprofit. A state law shapes what the foundation can do. Those connections are real. Until now, nobody was showing them to you.
        </p>
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <CircleKnowledgeGraph data={data} />
      </div>
    </div>
  )
}
