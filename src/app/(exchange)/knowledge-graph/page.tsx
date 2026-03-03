import type { Metadata } from 'next'
import KnowledgeGraphClient from '@/components/KnowledgeGraphClient'

export const metadata: Metadata = {
  title: 'Civic Knowledge Mesh — The Change Engine',
  description: 'Explore the interconnected civic knowledge mesh: ~35 dimensions per node across 7 pathways, 4 centers, 5 content rings, 312 focus areas, and 1,560 crosswalks.',
}

export default function KnowledgeGraphPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <KnowledgeGraphClient />
    </div>
  )
}
