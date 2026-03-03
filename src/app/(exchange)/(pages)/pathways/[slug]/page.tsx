import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { THEMES, CENTERS } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway, getLifeSituations, getLearningPaths,
  getRelatedOpportunities, getRelatedPolicies, getFocusAreas,
  getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { ContentCard } from '@/components/exchange/ContentCard'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { LearningPathCard } from '@/components/exchange/LearningPathCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { PathwayFilterClient } from './PathwayFilterClient'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'

function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) return { title: 'Not Found' }
  return {
    title: theme.name,
    description: theme.description,
  }
}

const CENTER_ICONS: Record<string, string> = {
  Learning: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  Action: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  Resource: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  Accountability: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
}

const CENTER_COLORS: Record<string, string> = {
  Learning: '#4C9F38',
  Action: '#DD1367',
  Resource: '#26BDE2',
  Accountability: '#8B6BA8',
}

export default async function SinglePathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  const [content, centerCounts, situations, paths, allFocusAreas] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getLifeSituations(),
    getLearningPaths(),
    getFocusAreas(),
  ])

  const themeFocusAreas = allFocusAreas.filter(function (fa) { return fa.theme_id === theme.id })

  const focusAreaIds: string[] = []
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

  const langId = await getLangId()
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  let opportunityTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(function (c) { return c.inbox_id }).filter(function (id): id is string { return id != null })
    const oppIds = opportunities.map(function (o) { return o.opportunity_id })
    const polIds = policies.map(function (p) { return p.policy_id })
    ;[contentTranslations, opportunityTranslations, policyTranslations] = await Promise.all([
      contentIds.length > 0 ? fetchTranslationsForTable('content_published', contentIds, langId) : {},
      oppIds.length > 0 ? fetchTranslationsForTable('opportunities', oppIds, langId) : {},
      polIds.length > 0 ? fetchTranslationsForTable('policies', polIds, langId) : {},
    ])
  }

  const centerEntries = Object.entries(CENTERS)
  const totalResources = content.length

  return (
    <div>
      {/* Hero with gradient + circle mesh */}
      <PageHero
        variant="gradient"
        title={theme.name}
        subtitle={theme.description}
        gradientColor={theme.color}
        showCircleMesh
        height="md"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[
          { label: 'Pathways', href: '/pathways' },
          { label: theme.name }
        ]} />

        {/* ── 4 Centers / Pillars ── */}
        <section className="py-8">
          <h2 className="text-xl font-serif font-bold text-brand-text mb-6">Four Ways to Engage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {centerEntries.map(function ([name, center]) {
              const count = centerCounts[name] ?? 0
              const iconPath = CENTER_ICONS[name]
              const color = CENTER_COLORS[name]
              return (
                <Link
                  key={name}
                  href={'/centers/' + center.slug}
                  className="group relative bg-white rounded-2xl border border-brand-border p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  {/* Color accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 transition-all duration-200 group-hover:h-1.5" style={{ backgroundColor: color }} />
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: color + '12' }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                  </div>
                  <h3 className="font-bold text-brand-text text-base mb-1">{name}</h3>
                  <p className="text-sm text-brand-muted italic leading-snug mb-3">{center.question}</p>
                  {count > 0 && (
                    <span className="text-xs font-semibold tabular-nums" style={{ color }}>{count} resources</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Focus Areas / Sub-Topics ── */}
        {themeFocusAreas.length > 0 && (
          <section className="py-6">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-5">Explore Topics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {themeFocusAreas.map(function (fa) {
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="group relative bg-white rounded-xl border border-brand-border p-4 hover:shadow-md hover:border-transparent transition-all duration-200 overflow-hidden"
                  >
                    {/* Left color accent */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 group-hover:w-1.5"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="block text-sm font-medium text-brand-text leading-snug pl-2">{fa.focus_area_name}</span>
                    {fa.description && (
                      <span className="block text-xs text-brand-muted mt-1 line-clamp-2 pl-2">{fa.description}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="h-px bg-brand-border my-4" />

        {/* ── Content Grid + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-8">
          <div className="lg:col-span-3">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-4">
              News
              <span className="text-sm font-normal text-brand-muted ml-2">({totalResources})</span>
            </h2>
            <PathwayFilterClient
              themeId={theme.id}
              centerCounts={centerCounts}
              initialContent={content}
              translations={contentTranslations}
            />
          </div>

          <div className="space-y-8">
            {opportunities.length > 0 && (
              <div>
                <h3 className="font-serif font-bold text-brand-text mb-3">Opportunities</h3>
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

            {policies.length > 0 && (
              <div>
                <h3 className="font-serif font-bold text-brand-text mb-3">Related Policies</h3>
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

            {relatedSituations.length > 0 && (
              <div>
                <h3 className="font-serif font-bold text-brand-text mb-3">Life Situations</h3>
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
                <h3 className="font-serif font-bold text-brand-text mb-3">Learning Paths</h3>
                <div className="space-y-3">
                  {relatedPaths.map(function (p) {
                    return (
                      <Link key={p.path_id} href={'/learn/' + p.path_id}>
                        <LearningPathCard
                          name={p.path_name}
                          description={p.description_5th_grade}
                          themeId={p.theme_id}
                          difficulty={p.difficulty_level}
                          moduleCount={p.module_count}
                          estimatedMinutes={p.estimated_minutes}
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
