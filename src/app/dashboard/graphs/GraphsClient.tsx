'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CoverageHeatmap } from '../graph-coverage/CoverageHeatmap'

const CircleKnowledgeGraph = dynamic(
  () => import('@/components/exchange/CircleKnowledgeGraph'),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center text-gray-400">Loading graph...</div> }
)

const KnowledgeGraphClient = dynamic(
  () => import('@/components/KnowledgeGraphClient'),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center text-gray-400">Loading graph...</div> }
)

const ForceGraph = dynamic(
  () => import('../graph-explorer/ForceGraph').then(m => ({ default: m.ForceGraph })),
  { ssr: false, loading: () => <div className="h-[600px] flex items-center justify-center text-gray-400">Loading graph...</div> }
)

const TABS = [
  { id: 'knowledge', label: 'Knowledge Graph' },
  { id: 'circles', label: 'Circle Graph' },
  { id: 'coverage', label: 'Coverage Heatmap' },
  { id: 'explorer', label: 'Graph Explorer' },
] as const

type TabId = typeof TABS[number]['id']

interface GraphsClientProps {
  explorerNodes: any[]
  explorerEdges: any[]
  coverageCells: any[]
  coverageEntityCounts: any
}

export function GraphsClient({ explorerNodes, explorerEdges, coverageCells, coverageEntityCounts }: GraphsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('knowledge')

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-brand-accent text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {activeTab === 'knowledge' && (
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Full knowledge graph showing entities, relationships, and taxonomy mappings.
              </p>
            </div>
            <KnowledgeGraphClient />
          </div>
        )}

        {activeTab === 'circles' && (
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Interactive visualization of 7 pathways, 4 centers, bridge connections, SDGs, and social determinants.
              </p>
            </div>
            <CircleKnowledgeGraph />
          </div>
        )}

        {activeTab === 'coverage' && (
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Edge density across entity types and taxonomy dimensions. Bright = well-connected. Dark = gaps to fill.
              </p>
            </div>
            <div className="p-5">
              <CoverageHeatmap cells={coverageCells} entityCounts={coverageEntityCounts} />
            </div>
          </div>
        )}

        {activeTab === 'explorer' && (
          <div>
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Live force-directed graph of {explorerNodes.length} entities and {explorerEdges.length} edges. Click nodes to inspect. Scroll to zoom. Drag to pan.
              </p>
            </div>
            <div style={{ height: 'calc(100vh - 280px)' }}>
              <ForceGraph nodes={explorerNodes} edges={explorerEdges} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
