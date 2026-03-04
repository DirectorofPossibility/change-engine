import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedDocuments } from '@/lib/data/library'
import { PageHero } from '@/components/exchange/PageHero'
import { LibraryBrowse } from './LibraryBrowse'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Research Library',
  description: 'Explore reports, plans, and research documents from Houston organizations. AI-generated summaries help you find what matters.',
}

export default async function LibraryPage() {
  const { documents, total } = await getPublishedDocuments(1, 24)

  return (
    <div>
      <PageHero
        variant="editorial"
        titleKey="library.title"
        subtitleKey="library.subtitle"
        intro="Houston's community partners produce valuable research — city plans, policy briefs, community assessments, and more. Explore them here with AI-powered summaries, or ask questions across the entire collection."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              Ask the Library
            </Link>
          </div>
        </div>

        <LibraryBrowse initialDocuments={documents} initialTotal={total} />
      </div>
    </div>
  )
}
