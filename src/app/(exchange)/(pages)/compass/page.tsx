import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getExchangeStats, getPathwayCounts, getCenterCounts, getPathwayBridges, getCompassPreview } from '@/lib/data/exchange'
import { CompassEntry } from '@/components/exchange/CompassEntry'
import { CompassView } from '@/components/exchange/CompassView'
import { CompassNeighborhoodWelcome } from './CompassNeighborhoodWelcome'
import { THEMES } from '@/lib/constants'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'The Compass | Community Exchange',
  description: 'Navigate community life in Houston. Find resources, services, and civic opportunities organized by pathway and purpose.',
}

export default async function CompassPage() {
  const [stats, pathwayCounts, centerCounts, bridges, preview] = await Promise.all([
    getExchangeStats(),
    getPathwayCounts(),
    getCenterCounts(),
    getPathwayBridges(),
    getCompassPreview(),
  ])

  // Build a spectrum color bar from the 7 theme colors
  const themeColors = Object.values(THEMES).map(t => t.color)

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Compact hero */}
      <header className="mb-8">
        {/* Spectrum color bar */}
        <div className="flex h-1 rounded-full overflow-hidden mb-6">
          {themeColors.map((color, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text">
          The Compass
        </h1>
        <p className="text-base text-brand-muted mt-2 font-serif italic">
          Where am I, and what&rsquo;s around me?
        </p>
        <p className="text-sm text-brand-muted mt-1">
          Born in Houston. Built for Everyone.
        </p>
      </header>

      {/* Neighborhood welcome — shows when user has ZIP set */}
      <CompassNeighborhoodWelcome />

      {/* Center entry cards — 4 doors */}
      <CompassEntry centerCounts={centerCounts} />

      {/* Interactive pathway visualization */}
      <CompassView
        pathwayCounts={pathwayCounts}
        bridges={bridges}
        preview={preview}
      />
    </div>
  )
}
