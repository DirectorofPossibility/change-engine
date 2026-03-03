import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import {
  getFocusAreasByIds, getContentByFocusArea, getRelatedOpportunities, getRelatedPolicies,
  getSDGMap, getSDOHMap, getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { ThemePill } from '@/components/ui/ThemePill'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { ContentCard } from '@/components/exchange/ContentCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { ClusteredMap, type MarkerData } from '@/components/maps'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const areas = await getFocusAreasByIds([id])
  if (areas.length === 0) return { title: 'Not Found' }
  return {
    title: areas[0].focus_area_name + ' — The Change Engine',
    description: areas[0].description || 'Explore resources related to ' + areas[0].focus_area_name,
  }
}

export default async function FocusAreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const areas = await getFocusAreasByIds([id])
  if (areas.length === 0) notFound()
  const fa = areas[0]

  const [content, opportunities, policies, sdgMap, sdohMap] = await Promise.all([
    getContentByFocusArea(id),
    getRelatedOpportunities([id]),
    getRelatedPolicies([id]),
    fa.sdg_id ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    fa.sdoh_code ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
  ])

  // Fetch translations for content if non-English
  const langId = await getLangId()
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  let opportunityTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(function (c) { return c.inbox_id }).filter(function (cid): cid is string { return cid != null })
    const oppIds = opportunities.map(function (o) { return o.opportunity_id })
    const polIds = policies.map(function (p) { return p.policy_id })
    ;[contentTranslations, opportunityTranslations, policyTranslations] = await Promise.all([
      contentIds.length > 0 ? fetchTranslationsForTable('content_published', contentIds, langId) : {},
      oppIds.length > 0 ? fetchTranslationsForTable('opportunities', oppIds, langId) : {},
      polIds.length > 0 ? fetchTranslationsForTable('policies', polIds, langId) : {},
    ])
  }

  // Build opportunity map markers (only if opportunities have coordinates)
  const opportunityMarkers: MarkerData[] = opportunities
    .filter(o => (o as any).latitude != null && (o as any).longitude != null)
    .map(o => ({
      id: o.opportunity_id,
      lat: (o as any).latitude as number,
      lng: (o as any).longitude as number,
      title: o.opportunity_name,
      type: 'opportunity' as const,
      address: [o.address, o.city].filter(Boolean).join(', '),
    }))

  // Theme info
  let themeSlug: string | null = null
  if (fa.theme_id && THEMES[fa.theme_id as keyof typeof THEMES]) {
    themeSlug = THEMES[fa.theme_id as keyof typeof THEMES].slug
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <h1 className="text-3xl font-bold text-brand-text mb-3">{fa.focus_area_name}</h1>
      {fa.description && (
        <p className="text-brand-muted mb-6 max-w-3xl">{fa.description}</p>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {fa.theme_id && themeSlug && (
          <ThemePill themeId={fa.theme_id} size="sm" />
        )}
        {fa.sdg_id && sdgMap[fa.sdg_id] && (
          <SDGBadge
            sdgNumber={sdgMap[fa.sdg_id].sdg_number}
            sdgName={sdgMap[fa.sdg_id].sdg_name}
            sdgColor={sdgMap[fa.sdg_id].sdg_color}
            linkToExplore
          />
        )}
        {fa.sdoh_code && sdohMap[fa.sdoh_code] && (
          <SDOHBadge
            sdohCode={fa.sdoh_code}
            sdohName={sdohMap[fa.sdoh_code].sdoh_name}
            sdohDescription={sdohMap[fa.sdoh_code].sdoh_description}
            linkToExplore
          />
        )}
        {fa.is_bridging && (
          <span className="text-xs px-2 py-0.5 rounded-full border border-dashed border-brand-muted text-brand-muted font-medium">
            Bridging Area
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main: Related Resources */}
        <div className="lg:col-span-2">
          {content.length > 0 ? (
            <>
              <h2 className="text-xl font-bold text-brand-text mb-4">Related Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {content.map(function (c) {
                  const t = c.inbox_id ? contentTranslations[c.inbox_id] : undefined
                  return (
                    <ContentCard
                      key={c.id}
                      id={c.id}
                      title={c.title_6th_grade}
                      summary={c.summary_6th_grade}
                      pathway={c.pathway_primary}
                      center={c.center}
                      sourceUrl={c.source_url}
                      publishedAt={c.published_at}
                      translatedTitle={t?.title}
                      translatedSummary={t?.summary}
                    />
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-brand-muted py-8">No resources found for this focus area yet.</p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Opportunities Map */}
          {opportunityMarkers.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Opportunities Map</h3>
              <ClusteredMap markers={opportunityMarkers} className="w-full h-[250px] rounded-xl" showLegend={false} />
            </div>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <div>
              <h3 className="font-semibold text-brand-text mb-3">Opportunities</h3>
              <div className="space-y-3">
                {opportunities.slice(0, 5).map(function (o) {
                  const ot = opportunityTranslations[o.opportunity_id]
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
                      translatedName={ot?.title}
                      translatedDescription={ot?.summary}
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
                  const pt = policyTranslations[p.policy_id]
                  return (
                    <PolicyCard
                      key={p.policy_id}
                      name={p.policy_name}
                      summary={p.summary_5th_grade}
                      billNumber={p.bill_number}
                      status={p.status}
                      level={p.level}
                      sourceUrl={p.source_url}
                      translatedName={pt?.title}
                      translatedSummary={pt?.summary}
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
