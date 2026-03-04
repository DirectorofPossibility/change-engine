/**
 * @fileoverview Circle Knowledge Graph visualization in the admin dashboard.
 *
 * Renders the interactive 7-pathway circle graph that shows how the
 * Community Exchange knowledge graph is structured — pathways, centers,
 * bridge connections, SDGs, and social determinants of health.
 *
 * @route GET /dashboard/circles
 */

import type { Metadata } from 'next'
import CircleKnowledgeGraph from '@/components/exchange/CircleKnowledgeGraph'

export const metadata: Metadata = {
  title: 'Circle Knowledge Graph — Pipeline Admin',
  description: 'Interactive visualization of the 7-pathway circle knowledge graph.',
}

export default function CirclesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Circle Knowledge Graph</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interactive visualization of 7 pathways, 4 centers, bridge connections, SDGs, and social determinants.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <CircleKnowledgeGraph />
      </div>
    </div>
  )
}
