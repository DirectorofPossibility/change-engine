import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES, CENTERS } from '@/lib/constants'
import { getDocumentsByTheme, getCenterCountsForTheme } from '@/lib/data/library'
import { CategoryArticleList } from './CategoryArticleList'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ background: PARCHMENT_WARM }}>
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            {theme.name}
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            {theme.description}
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/library" className="hover:underline" style={{ color: CLAY }}>Library</Link>
          <span className="mx-2">/</span>
          <span>{theme.name}</span>
        </nav>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {sections.length > 0 ? (
          <CategoryArticleList sections={sections} />
        ) : (
          <div className="text-center py-16">
            <p style={{ fontFamily: SERIF, color: MUTED }} className="italic">
              No documents in this category yet.
            </p>
          </div>
        )}
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/library" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Library
          </Link>
        </div>
      </div>
    </div>
  )
}
