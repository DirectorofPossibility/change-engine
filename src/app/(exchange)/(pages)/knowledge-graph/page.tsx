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
  title: 'Civic Knowledge Galaxy — Community Exchange',
  description: 'Explore the Civic Knowledge Galaxy: ~35 dimensions per node across 7 pathways, 4 centers, 5 content rings, 312 focus areas, and 1,560 crosswalks.',
}

export default function KnowledgeGraphPage() {
  return (
    <div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <Breadcrumb items={[{ label: 'Civic Knowledge Galaxy' }]} />
      </div>
      <div className="max-w-[1400px] mx-auto">
        <KnowledgeGraphClient />
      </div>
    </div>
  )
}
