import type { Metadata } from 'next'
import Link from 'next/link'
import { getDocumentCountsByTheme, getPublishedDocuments } from '@/lib/data/library'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { LibraryCard } from '@/components/exchange/LibraryCard'
import { LibraryHeroSearch } from './LibraryHeroSearch'
import { CategoryGrid } from './CategoryGrid'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Research Library',
  description: 'Explore reports, plans, and research documents from Houston organizations. AI-generated summaries help you find what matters.',
}

export default async function LibraryPage() {
  let counts: Record<string, number> = {}
  let recentDocs: Awaited<ReturnType<typeof getPublishedDocuments>>['documents'] = []

  try {
    const [countResult, docsResult] = await Promise.all([
      getDocumentCountsByTheme(),
      getPublishedDocuments(1, 6),
    ])
    counts = countResult
    recentDocs = docsResult.documents
  } catch (err) {
    console.error('Library page data fetch error:', err)
  }

  return (
    <div>
      {/* Hero section */}
      <div className="bg-gradient-to-br from-brand-accent/10 via-brand-bg to-brand-bg py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-text mb-4">
            Community Research Library
          </h1>
          <p className="text-brand-muted text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Houston&apos;s community partners produce valuable research — city plans, policy briefs,
            community assessments, and more. Explore them with AI-powered summaries.
          </p>
          <LibraryHeroSearch />
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/library/chat"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
            >
              Chat with Chance about the library
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Library' }]} />

        {/* Category cards */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
            Browse by Pathway
          </h2>
          <p className="text-sm text-brand-muted mb-6">
            Explore research organized across seven community pathways.
          </p>
          <CategoryGrid counts={counts} />
        </section>

        {/* Popular / recent articles */}
        {recentDocs.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
              Recently Published
            </h2>
            <p className="text-sm text-brand-muted mb-6">
              The latest research added to the library.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recentDocs.map(function (doc) {
                return (
                  <LibraryCard
                    key={doc.id}
                    id={doc.id}
                    title={doc.title}
                    summary={doc.summary}
                    tags={doc.tags}
                    theme_ids={doc.theme_ids}
                    page_count={doc.page_count}
                    published_at={doc.published_at}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
