import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { THEMES, CENTERS } from '@/lib/constants'
import { getDocumentsByTheme, getCenterCountsForTheme } from '@/lib/data/library'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { CategoryArticleList } from './CategoryArticleList'

export const revalidate = 300

type ThemeEntry = (typeof THEMES)[keyof typeof THEMES]

function findThemeBySlug(slug: string): { id: string; theme: ThemeEntry } | null {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, theme }
  }
  return null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const match = findThemeBySlug(slug)
  if (!match) return { title: 'Category Not Found' }
  return {
    title: match.theme.name + ' | Community Research Library',
    description: match.theme.description,
  }
}

export function generateStaticParams() {
  return Object.values(THEMES).map(function (theme) {
    return { slug: theme.slug }
  })
}

export default async function CategoryPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const match = findThemeBySlug(slug)
  if (!match) notFound()

  const { id: themeId, theme } = match

  const [allDocs, centerCounts] = await Promise.all([
    getDocumentsByTheme(themeId),
    getCenterCountsForTheme(themeId),
  ])

  // Group documents by center
  const centerEntries = Object.entries(CENTERS)
  const sections = centerEntries
    .map(function ([centerName, centerInfo]) {
      const docs = allDocs.filter(function (d) { return d.center_id === centerName })
      return {
        centerName,
        centerQuestion: centerInfo.question,
        articles: docs.slice(0, 5).map(function (d) {
          return { id: d.id, title: d.title, summary: d.summary, page_count: d.page_count }
        }),
        totalCount: centerCounts[centerName] || 0,
        themeSlug: slug,
      }
    })
    .filter(function (s) { return s.articles.length > 0 })

  // "Other resources" — no center_id
  const otherDocs = allDocs.filter(function (d) { return !d.center_id })
  if (otherDocs.length > 0) {
    sections.push({
      centerName: 'Other resources',
      centerQuestion: 'Additional research and documents',
      articles: otherDocs.slice(0, 5).map(function (d) {
        return { id: d.id, title: d.title, summary: d.summary, page_count: d.page_count }
      }),
      totalCount: otherDocs.length,
      themeSlug: slug,
    })
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[
        { label: 'Library', href: '/library' },
        { label: theme.name },
      ]} />

      {/* Compact hero */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: theme.color }}
          />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text">
            {theme.name}
          </h1>
        </div>
        <p className="text-brand-muted italic leading-relaxed max-w-3xl">
          {theme.description}
        </p>
        <div
          className="h-0.5 w-16 rounded-full mt-4"
          style={{ backgroundColor: theme.color }}
        />
      </div>

      {/* Articles grouped by center */}
      {sections.length > 0 ? (
        <CategoryArticleList sections={sections} />
      ) : (
        <div className="text-center py-16">
          <p className="text-brand-muted font-serif italic">
            No documents in this category yet.
          </p>
        </div>
      )}
    </div>
  )
}
