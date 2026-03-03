import type { Metadata } from 'next'
import { THEMES, CENTERS } from '@/lib/constants'
import { getPathwayCounts, getCenterContentForPathway } from '@/lib/data/exchange'
import { PathwayCard } from '@/components/exchange/PathwayCard'
import { PageHeader } from '@/components/exchange/PageHeader'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seven Pathways Into Community Life',
  description: 'Explore health, families, neighborhood, voice, money, planet, and bridging divides.',
}

export default async function PathwaysPage() {
  const pathwayCounts = await getPathwayCounts()

  // Get center sub-counts for each pathway
  const centerCountsPerPathway: Record<string, Record<string, number>> = {}
  await Promise.all(
    Object.keys(THEMES).map(async (id) => {
      centerCountsPerPathway[id] = await getCenterContentForPathway(id)
    })
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader titleKey="pathways.title" subtitleKey="pathways.subtitle" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(THEMES).map(([id, theme]) => (
          <div key={id} className="space-y-3">
            <PathwayCard
              themeId={id}
              name={theme.name}
              color={theme.color}
              emoji={theme.emoji}
              slug={theme.slug}
              count={pathwayCounts[id] || 0}
            />
            {/* Center sub-counts */}
            <div className="flex gap-2 flex-wrap pl-2">
              {Object.entries(CENTERS).map(([centerName, config]) => {
                const count = centerCountsPerPathway[id]?.[centerName] || 0
                if (count === 0) return null
                return (
                  <span key={centerName} className="text-xs text-brand-muted">
                    {config.emoji} {count}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
