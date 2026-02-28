import { notFound } from 'next/navigation'
import { THEMES, CENTERS } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway, getLifeSituations, getLearningPaths,
  getFocusAreaMap, getRelatedOpportunities, getRelatedPolicies,
} from '@/lib/data/exchange'
import { ContentCard } from '@/components/exchange/ContentCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
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

  const [content, centerCounts, situations, paths, focusAreaMap] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getLifeSituations(),
    getLearningPaths(),
    getFocusAreaMap(),
  ])

  // Collect unique focus area IDs from content in this pathway
  var focusAreaIds: string[] = []
  content.forEach(function (c) {
    if (c.focus_area_ids) {
      c.focus_area_ids.forEach(function (id) {
        if (focusAreaIds.indexOf(id) === -1) focusAreaIds.push(id)
      })
    }
  })

  const [opportunities, policies] = await Promise.all([
    getRelatedOpportunities(focusAreaIds),
    getRelatedPolicies(focusAreaIds),
  ])

  const relatedSituations = situations.filter(function (s) { return s.theme_id === theme.id }).slice(0, 5)
  const relatedPaths = paths.filter(function (p) { return p.theme_id === theme.id })

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
          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Opportunities</h3>
              <div className="space-y-3">
                {opportunities.slice(0, 5).map(function (o) {
                  return (
                    <OpportunityCard
                      key={o.opportunity_id}
                      name={o.opportunity_name}
                      description={o.description_5th_grade}
                      startDate={o.start_date}
                      endDate={o.end_date}
                      address={o.address}
                      city={o.city}
                      isVirtual={o.is_virtual}
                      registrationUrl={o.registration_url}
                      spotsAvailable={o.spots_available}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Policies */}
          {policies.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Related Policies</h3>
              <div className="space-y-3">
                {policies.slice(0, 5).map(function (p) {
                  return (
                    <PolicyCard
                      key={p.policy_id}
                      name={p.policy_name}
                      summary={p.summary_5th_grade}
                      billNumber={p.bill_number}
                      status={p.status}
                      level={p.level}
                      sourceUrl={p.source_url}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {relatedSituations.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Related Life Situations</h3>
              <div className="space-y-3">
                {relatedSituations.map(function (s) {
                  return (
                    <LifeSituationCard
                      key={s.situation_id}
                      name={s.situation_name}
                      slug={s.situation_slug}
                      description={null}
                      urgency={s.urgency_level}
                      iconName={s.icon_name}
                    />
                  )
                })}
              </div>
            </div>
          )}
          {relatedPaths.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Learning Paths</h3>
              <div className="space-y-3">
                {relatedPaths.map(function (p) {
                  return (
                    <LearningPathCard
                      key={p.path_id}
                      name={p.path_name}
                      description={p.description_5th_grade}
                      themeId={p.theme_id}
                      difficulty={p.difficulty_level}
                      moduleCount={p.module_count}
                      estimatedMinutes={p.estimated_minutes}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
