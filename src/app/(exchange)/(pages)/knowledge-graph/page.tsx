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
        <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">Civic Knowledge Graph</h1>
        <p className="text-brand-muted max-w-2xl">
          See how Houston&apos;s seven pathways connect. Each circle represents a pathway, each dot a focus area, and the lines between them show shared resources, services, and officials. Click any node to explore.
        </p>
      </div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <CircleKnowledgeGraph data={data} />
      </div>
    </div>
  )
}
