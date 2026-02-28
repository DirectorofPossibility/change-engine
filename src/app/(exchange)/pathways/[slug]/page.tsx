import { notFound } from 'next/navigation'
import { THEMES, CENTERS } from '@/lib/constants'
import { getPathwayContent, getCenterContentForPathway, getLifeSituations, getLearningPaths } from '@/lib/data/exchange'
import { ContentCard } from '@/components/exchange/ContentCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { PathwayFilterClient } from './PathwayFilterClient'

// Resolve slug to themeId
function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

export default async function SinglePathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  const [content, centerCounts, situations, paths] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getLifeSituations(),
    getLearningPaths(),
  ])

  const relatedSituations = situations.filter(s => s.theme_id === theme.id).slice(0, 5)
  const relatedPaths = paths.filter(p => p.theme_id === theme.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">{theme.emoji}</span>
        <h1 className="text-3xl font-bold text-brand-text">{theme.name}</h1>
      </div>
      <div className="flex items-center gap-2 mb-8">
        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.color }} />
        <span className="text-brand-muted">{content.length} resources</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-3">
          <PathwayFilterClient
            themeId={theme.id}
            centerCounts={centerCounts}
            initialContent={content}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {relatedSituations.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Related Life Situations</h3>
              <div className="space-y-3">
                {relatedSituations.map((s) => (
                  <LifeSituationCard
                    key={s.situation_id}
                    name={s.situation_name}
                    slug={s.situation_slug}
                    description={null}
                    urgency={s.urgency_level}
                    iconName={s.icon_name}
                  />
                ))}
              </div>
            </div>
          )}
          {relatedPaths.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Learning Paths</h3>
              <div className="space-y-3">
                {relatedPaths.map((p) => (
                  <LearningPathCard
                    key={p.path_id}
                    name={p.path_name}
                    description={p.description_5th_grade}
                    themeId={p.theme_id}
                    difficulty={p.difficulty_level}
                    moduleCount={p.module_count}
                    estimatedMinutes={p.estimated_minutes}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
