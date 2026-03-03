import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { THEMES, CENTERS } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway, getLifeSituations, getLearningPaths,
  getRelatedOpportunities, getRelatedPolicies, getRelatedServices, getRelatedOfficials,
  getFocusAreas,
  getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { PathwayFilterClient } from './PathwayFilterClient'
import { PathwayPanelClient } from './PathwayPanelClient'
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

/* SVG icon paths for each entity section heading */
const SECTION_ICONS: Record<string, string> = {
  news: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
  services: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z',
  officials: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  policies: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z',
  opportunities: 'M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904m7.846-9.772H5.904m7.846 0a3 3 0 00-2.266-1.03H5.904a2.25 2.25 0 00-2.154 1.63l-2 6.75A2.25 2.25 0 003.904 18h.696',
  situations: 'M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z',
  paths: 'M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
}

function SectionHeading({ icon, title, count, color }: { icon: string; title: string; count: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (color || '#8B7E74') + '14' }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color || '#8B7E74'}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-serif font-bold text-brand-text">{title}</h2>
        <span className="text-sm text-brand-muted">{count} {count === 1 ? 'item' : 'items'}</span>
      </div>
    </div>
  )
}

export default async function SinglePathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  // Phase 1: fetch content + focus areas
  const [content, centerCounts, situations, paths, allFocusAreas] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getLifeSituations(),
    getLearningPaths(),
    getFocusAreas(),
  ])

  const themeFocusAreas = allFocusAreas.filter(function (fa) { return fa.theme_id === theme.id })
  const themeFocusAreaIds = themeFocusAreas.map(function (fa) { return fa.focus_id })

  // Phase 2: fetch all related entities via focus area junctions
  const [opportunities, policies, relatedServices, relatedOfficials] = await Promise.all([
    getRelatedOpportunities(themeFocusAreaIds),
    getRelatedPolicies(themeFocusAreaIds),
    getRelatedServices(themeFocusAreaIds),
    getRelatedOfficials(themeFocusAreaIds),
  ])

  const relatedSituations = situations.filter(function (s) { return s.theme_id === theme.id })
  const relatedPaths = paths.filter(function (p) { return p.theme_id === theme.id })

  // Translations
  const langId = await getLangId()
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  let opportunityTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  let officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(function (c) { return c.inbox_id }).filter(function (id): id is string { return id != null })
    const oppIds = opportunities.map(function (o) { return o.opportunity_id })
    const polIds = policies.map(function (p) { return p.policy_id })
    const offIds = relatedOfficials.map(function (o) { return o.official_id })
    const svcIds = relatedServices.map(function (s) { return s.service_id })
    ;[contentTranslations, opportunityTranslations, policyTranslations, officialTranslations, serviceTranslations] = await Promise.all([
      contentIds.length > 0 ? fetchTranslationsForTable('content_published', contentIds, langId) : {},
      oppIds.length > 0 ? fetchTranslationsForTable('opportunities', oppIds, langId) : {},
      polIds.length > 0 ? fetchTranslationsForTable('policies', polIds, langId) : {},
      offIds.length > 0 ? fetchTranslationsForTable('elected_officials', offIds, langId) : {},
      svcIds.length > 0 ? fetchTranslationsForTable('services_211', svcIds, langId) : {},
    ])
  }

  const centerEntries = Object.entries(CENTERS)

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

        {/* ── Divider ── */}
        <div className="h-px bg-brand-border my-4" />

        {/* ── News Feed ── */}
        {content.length > 0 && (
          <section className="py-8">
            <SectionHeading icon={SECTION_ICONS.news} title="News" count={content.length} color={theme.color} />
            <PathwayFilterClient
              themeId={theme.id}
              centerCounts={centerCounts}
              initialContent={content}
              translations={contentTranslations}
            />
          </section>
        )}

        {/* ── Entity sections with slide-out detail panel ── */}
        <PathwayPanelClient
          themeColor={theme.color}
          services={relatedServices}
          officials={relatedOfficials}
          policies={policies}
          opportunities={opportunities}
          situations={relatedSituations}
          paths={relatedPaths}
          serviceTranslations={serviceTranslations}
          officialTranslations={officialTranslations}
          policyTranslations={policyTranslations}
          opportunityTranslations={opportunityTranslations}
        />

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}
