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
      {/* ── 1. Theme Masthead ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(158deg, #0d1117 0%, ${theme.color}88 50%, ${theme.color} 100%)`,
        }}
      >
        <div className="max-w-[1080px] mx-auto px-6 relative z-10" style={{ padding: '3.5rem 1.5rem 3rem' }}>
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: t('nav.pathways'), href: '/pathways' },
            { label: theme.name }
          ]} />

          {/* Dateline */}
          <div className="flex items-center gap-2.5 mt-6 mb-2.5">
            <span className="block w-6 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
            <span className="font-mono text-[.6rem] tracking-[0.24em] uppercase" style={{ color: 'rgba(255,255,255,.4)' }}>
              Houston, TX &middot; {theme.name} &middot; 2026 Edition
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black leading-[.95] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', letterSpacing: '-.025em' }}
          >
            The State of {theme.name} in Houston
            <em className="block italic font-black" style={{ color: 'rgba(255,255,255,.55)' }}>
              {theme.description.split('.')[0]}.
            </em>
          </h1>

          {/* Rule */}
          <div className="my-5" style={{ width: '50px', height: '2px', background: 'rgba(255,255,255,.3)' }} />

          {/* Deck */}
          <p
            className="font-body italic leading-[1.7]"
            style={{ fontSize: '1rem', color: 'rgba(255,255,255,.65)', maxWidth: '560px' }}
          >
            {theme.description}
          </p>
        </div>
      </div>

      {/* ── 2. Quote ── */}
      {quote && (
        <div className="max-w-[1080px] mx-auto px-6 pt-8">
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={theme.color} />
        </div>
      )}

      {/* ── 3. Focus Areas Grid ── */}
      {themeFocusAreas.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-8" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <div className="mb-6">
            <span className="font-mono text-[.6rem] tracking-[0.2em] uppercase text-[#5c6474] block mb-1.5">
              Destinations &middot; Choose where to go
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0d1117]" style={{ letterSpacing: '-.015em' }}>
              Explore {theme.name}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0">
            {themeFocusAreas.map(function (fa) {
              return (
                <Link
                  key={fa.focus_id}
                  href={'/explore/focus/' + fa.focus_id}
                  className="group relative bg-white p-3 transition-colors duration-150 overflow-hidden"
                  style={{ border: '1px solid #dde1e8' }}
                  onMouseOver={undefined}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-all duration-200"
                    style={{ width: '3px', backgroundColor: theme.color }}
                  />
                  <span className="block font-body text-[.88rem] font-bold text-[#0d1117] leading-snug pl-3">{fa.focus_area_name}</span>
                  {fa.description && (
                    <span className="block font-body text-[.78rem] italic text-[#5c6474] mt-1 line-clamp-2 pl-3">{fa.description}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 4. Connected Pathways ── */}
      {bridgeData.length > 0 && (
        <div className="max-w-[1080px] mx-auto px-6 py-6" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <span className="font-mono text-[.6rem] tracking-[0.2em] uppercase text-[#5c6474] block mb-3">
            Connected pathways
          </span>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {bridgeData.map(function (b) {
              return (
                <Link
                  key={b.targetThemeId}
                  href={'/pathways/' + b.targetSlug}
                  className="inline-flex items-center gap-2 font-mono text-[.68rem] uppercase tracking-[0.08em] transition-colors hover:underline"
                  style={{ color: b.targetColor }}
                >
                  <span
                    className="block flex-shrink-0"
                    style={{ width: '8px', height: '8px', backgroundColor: b.targetColor }}
                  />
                  {b.targetName}
                  <span className="text-[#5c6474]">({b.sharedCount})</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 5. Content Feed (ShelfBraid) ── */}
      <div className="max-w-[1080px] mx-auto px-6 py-8" style={{ borderBottom: '1.5px solid #dde1e8' }}>
        <div className="mb-6">
          <span className="font-mono text-[.6rem] tracking-[0.2em] uppercase text-[#5c6474] block mb-1.5">
            Content &middot; 4 centers
          </span>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0d1117]" style={{ letterSpacing: '-.015em' }}>
            From the <em className="italic">Community</em>
          </h2>
        </div>
        <ShelfBraid
          content={content}
          contentTranslations={contentTranslations}
          services={relatedServices}
          officials={relatedOfficials}
          policies={policies}
          opportunities={opportunities}
          themeColor={theme.color}
        />
      </div>

      {/* ── 6. News Link ── */}
      {newsCount > 0 && (
        <div className="max-w-[1080px] mx-auto px-6 py-5" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <Link
            href={'/news?pathway=' + theme.id}
            className="inline-flex items-center gap-2 font-mono text-[.68rem] uppercase tracking-[0.08em] transition-colors hover:underline"
            style={{ color: '#1b5e8a' }}
          >
            {newsCount} news {newsCount === 1 ? 'article' : 'articles'} in {theme.name} &rarr;
          </Link>
        </div>
      )}

      {/* ── 7. Library Nuggets ── */}
      <div className="max-w-[1080px] mx-auto px-6 py-8">
        <LibraryNugget
          nuggets={libraryNuggets}
          variant="sidebar"
          color={theme.color}
          labels={{ fromThe: t('library.from_the'), readMore: t('library.read_more') }}
        />
      </div>
    </div>
  )
}
