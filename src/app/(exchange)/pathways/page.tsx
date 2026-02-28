import { THEMES, CENTERS } from '@/lib/constants'
import { getPathwayCounts, getCenterContentForPathway } from '@/lib/data/exchange'
import { PathwayCard } from '@/components/exchange/PathwayCard'

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
      <h1 className="text-3xl font-bold text-brand-text mb-2">Seven Pathways</h1>
      <p className="text-brand-muted mb-8">Explore community life through seven interconnected themes.</p>

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
