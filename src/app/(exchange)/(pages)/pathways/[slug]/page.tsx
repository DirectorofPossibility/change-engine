import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { THEMES } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway,
  getRelatedOpportunities, getRelatedPolicies, getRelatedServices, getRelatedOfficials,
  getFocusAreas, getFoundationsByPathway, getBridgesForPathway,
  getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { ShelfBraid } from '@/components/exchange/ShelfBraid'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { getLibraryNuggets } from '@/lib/data/library'
import { getUIStrings } from '@/lib/i18n'

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

export default async function SinglePathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  // Phase 1: fetch content + focus areas + bridges
  const [content, centerCounts, allFocusAreas, bridgeData] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getFocusAreas(),
    getBridgesForPathway(theme.id),
  ])

  const themeFocusAreas = allFocusAreas.filter(function (fa) { return fa.theme_id === theme.id })
  const themeFocusAreaIds = themeFocusAreas.map(function (fa) { return fa.focus_id })

  // Phase 2: fetch all related entities via focus area junctions
  const [opportunities, policies, relatedServices, relatedOfficials, foundations, libraryNuggets] = await Promise.all([
    getRelatedOpportunities(themeFocusAreaIds),
    getRelatedPolicies(themeFocusAreaIds),
    getRelatedServices(themeFocusAreaIds),
    getRelatedOfficials(themeFocusAreaIds),
    getFoundationsByPathway(theme.id),
    getLibraryNuggets([theme.id], themeFocusAreaIds, 3),
  ])

  // Translations
  const langId = await getLangId()
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(function (c) { return c.inbox_id }).filter(function (id): id is string { return id != null })
    if (contentIds.length > 0) {
      contentTranslations = await fetchTranslationsForTable('content_published', contentIds, langId)
    }
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div className="bg-brand-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Breadcrumb variant="dark" items={[
            { label: t('nav.pathways'), href: '/pathways' },
            { label: theme.name }
          ]} />

          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
              <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.color, opacity: 0.4 }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              {theme.name}
            </h1>
            <p className="text-base font-serif italic text-white/60 mt-2 max-w-2xl leading-relaxed">
              {theme.description}
            </p>
          </div>

          {/* Connected pathways */}
          {bridgeData.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-5">
              <span className="text-xs text-white/30 font-serif italic">Connected to</span>
              {bridgeData.map(function (b) {
                return (
                  <Link
                    key={b.targetThemeId}
                    href={'/pathways/' + b.targetSlug}
                    className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
                    style={{ color: b.targetColor }}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: b.targetColor }} />
                    {b.targetName}
                    <span className="text-white/30">({b.sharedCount})</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.color}, transparent 60%)` }} />
      </div>

      {/* ── Shelf Braid: 4 centers with mixed entity types ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ShelfBraid
          content={content}
          contentTranslations={contentTranslations}
          services={relatedServices}
          officials={relatedOfficials}
          policies={policies}
          opportunities={opportunities}
          themeColor={theme.color}
        />

        {/* ── Library Nuggets ── */}
        <div className="mt-6">
          <LibraryNugget
            nuggets={libraryNuggets}
            variant="sidebar"
            color={theme.color}
            labels={{ fromThe: t('library.from_the'), readMore: t('library.read_more') }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Focus Areas / Explore Topics ── */}
        {themeFocusAreas.length > 0 && (
          <section className="py-6">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-1">{t('pathway.focus_areas_title')}</h2>
            <div className="h-0.5 w-12 rounded-full mb-5" style={{ backgroundColor: theme.color }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {themeFocusAreas.map(function (fa) {
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="group relative bg-white rounded-xl border border-brand-border p-4 hover:shadow-md hover:border-transparent transition-all duration-200 overflow-hidden"
                  >
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

        {/* ── Foundations ── */}
        {foundations.length > 0 && (
          <section className="py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.color + '14' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={theme.color}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-brand-text">{t('pathway.foundations_heading')}</h2>
                <span className="text-sm text-brand-muted">{foundations.length} {t('pathway.foundations_subtitle')}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foundations.map(function (f: any) {
                return (
                  <Link key={f.id} href={'/foundations'} className="group bg-white rounded-xl border border-brand-border p-5 hover:shadow-md hover:border-transparent transition-all duration-200 overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 group-hover:w-1.5" style={{ backgroundColor: theme.color }} />
                    <div className="pl-2">
                      <h3 className="font-semibold text-brand-text text-sm leading-snug mb-1">{f.name}</h3>
                      <div className="flex items-center gap-3 mb-2">
                        {f.assets && <span className="text-xs font-bold" style={{ color: theme.color }}>{f.assets}</span>}
                        {f.annual_giving && <span className="text-xs text-brand-muted">{f.annual_giving}/yr</span>}
                      </div>
                      {f.mission && <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">{f.mission}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}
