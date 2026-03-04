/**
 * @fileoverview Public knowledge graph visualization page.
 *
 * Renders an interactive force-directed graph of the civic knowledge mesh.
 * The visualization is entirely client-side (KnowledgeGraphClient) and
 * displays ~35 dimensions per node spanning 7 pathways, 4 centers,
 * 5 content rings, 312 focus areas, and 1,560 crosswalks.
 *
 * @caching Static (no dynamic data fetching at the page level)
 * @route GET /knowledge-graph
 */

import type { Metadata } from 'next'
import KnowledgeGraphClient from '@/components/KnowledgeGraphClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const metadata: Metadata = {
  title: 'Civic Knowledge Mesh — The Change Engine',
  description: 'Explore the interconnected civic knowledge mesh: ~35 dimensions per node across 7 pathways, 4 centers, 5 content rings, 312 focus areas, and 1,560 crosswalks.',
}

export default function KnowledgeGraphPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Knowledge Graph' }]} />
      <KnowledgeGraphClient />
    </div>
  )
}
