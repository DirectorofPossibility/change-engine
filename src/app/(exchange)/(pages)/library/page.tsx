import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedDocuments } from '@/lib/data/library'
import { PageHero } from '@/components/exchange/PageHero'
import { LibraryBrowse } from './LibraryBrowse'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Research Library',
  description: 'Explore reports, plans, and research documents from Houston organizations. AI-generated summaries help you find what matters.',
}

export default async function LibraryPage() {
  let documents: Awaited<ReturnType<typeof getPublishedDocuments>>['documents'] = []
  let total = 0
  try {
    const result = await getPublishedDocuments(1, 24)
    documents = result.documents
    total = result.total
  } catch (err) {
    console.error('Library page data fetch error:', err)
  }

  return (
    <div>
      <PageHero
        variant="editorial"
        titleKey="library.title"
        subtitleKey="library.subtitle"
        intro="Houston's community partners produce valuable research — city plans, policy briefs, community assessments, and more. Explore them here with AI-powered summaries, or ask questions across the entire collection."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Library' }]} />

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <p className="text-sm text-brand-muted">
            {total} document{total !== 1 ? 's' : ''} in the library
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/library/chat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Chat with Chance
            </Link>
          </div>
        </div>

        <LibraryBrowse initialDocuments={documents} initialTotal={total} />
      </div>
    </div>
  )
}
