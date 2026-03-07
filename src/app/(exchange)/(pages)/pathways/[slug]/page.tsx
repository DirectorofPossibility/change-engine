import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { THEMES } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway,
  getRelatedOpportunities, getRelatedPolicies, getRelatedServices, getRelatedOfficials,
  getFocusAreas, getBridgesForPathway,
  getPathwayNewsCount,
  getLangId, fetchTranslationsForTable,
  getRandomQuote,
} from '@/lib/data/exchange'
import { ShelfBraid } from '@/components/exchange/ShelfBraid'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
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

  // Phase 1: fetch content + focus areas + bridges + news count
  const [content, centerCounts, allFocusAreas, bridgeData, newsCount] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getFocusAreas(),
    getBridgesForPathway(theme.id),
    getPathwayNewsCount(theme.id),
  ])

  const themeFocusAreas = allFocusAreas.filter(function (fa) { return fa.theme_id === theme.id })
  const themeFocusAreaIds = themeFocusAreas.map(function (fa) { return fa.focus_id })

  // Phase 2: fetch all related entities via focus area junctions
  const [opportunities, policies, relatedServices, relatedOfficials, libraryNuggets, quote] = await Promise.all([
    getRelatedOpportunities(themeFocusAreaIds),
    getRelatedPolicies(themeFocusAreaIds),
    getRelatedServices(themeFocusAreaIds),
    getRelatedOfficials(themeFocusAreaIds),
    getLibraryNuggets([theme.id], themeFocusAreaIds, 3),
    getRandomQuote(theme.id),
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
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Breadcrumb items={[
            { label: t('nav.pathways'), href: '/pathways' },
            { label: theme.name }
          ]} />

          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
              <div className="h-px flex-1 max-w-[60px]" style={{ backgroundColor: theme.color, opacity: 0.4 }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">
              {theme.name}
            </h1>
            <p className="text-base font-serif italic text-brand-muted mt-2 max-w-2xl leading-relaxed">
              {theme.description}
            </p>
          </div>

          {/* Connected pathways */}
          {bridgeData.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-5">
              <span className="text-xs text-brand-muted font-serif italic">Connected to</span>
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
                    <span className="text-brand-muted">({b.sharedCount})</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.color}, transparent 60%)` }} />
      </div>

      {/* ── Quote (above the fold) ── */}
      {quote && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={theme.color} />
        </div>
      )}

      {/* ── Focus Areas / Explore Topics ── */}
      {themeFocusAreas.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-xl font-serif font-bold text-brand-text mb-1">{t('pathway.focus_areas_title')}</h2>
          <div className="h-0.5 w-12 rounded-full mb-5" style={{ backgroundColor: theme.color }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {themeFocusAreas.map(function (fa) {
              return (
                <Link
                  key={fa.focus_id}
                  href={'/explore/focus/' + fa.focus_id}
                  className="group relative bg-white rounded-lg border-2 border-brand-border p-3 hover:border-brand-text hover:-translate-y-px transition-all duration-150 overflow-hidden"
                  style={{ boxShadow: '2px 2px 0 #D5D0C8' }}
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

      {/* ── News Feed Link ── */}
      {newsCount > 0 && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={'/news?pathway=' + theme.id}
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
            style={{ color: theme.color }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            {newsCount} news {newsCount === 1 ? 'article' : 'articles'} in {theme.name}
          </Link>
        </div>
      )}

      {/* ── Shelf Braid: 4 centers with mixed entity types ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  )
}
