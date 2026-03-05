import type { Metadata } from 'next'
import { getGraphCoverage } from '@/lib/data/dashboard'
import { CoverageHeatmap } from './CoverageHeatmap'

export const metadata: Metadata = {
  title: 'Graph Coverage — Pipeline Admin',
  description: 'Heatmap showing edge density across entity types and taxonomy dimensions.',
}

export default async function GraphCoveragePage() {
  const { cells, entityCounts } = await getGraphCoverage()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Graph Coverage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edge density across entity types and taxonomy dimensions. Bright = well-connected. Dark = gaps to fill.
        </p>
      </div>
      <CoverageHeatmap cells={cells} entityCounts={entityCounts} />
    </div>
  )
}
