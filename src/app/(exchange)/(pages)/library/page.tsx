import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedDocuments, getBookshelfItems } from '@/lib/data/library'
import { LibraryClient } from './LibraryClient'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { BookOpen } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Change Engine',
  description: 'Curated research, reports, and policy briefs from Houston organizations and community partners.',
}


export default async function LibraryPage() {
  await requirePageEnabled('page_library')
  const [{ documents }, books] = await Promise.all([
    getPublishedDocuments(1, 100),
    getBookshelfItems(),
  ])

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Research Library"
        subtitle="Curated reports, policy briefs, and community research from Houston's leading organizations. Every document summarized for quick understanding."
        color="#1a3460"
      />
      <Breadcrumb items={[{ label: 'Library' }]} />

      {/* ── STATS ── */}
      <div className="max-w-[900px] mx-auto px-6 py-4">
        <div className="flex items-center gap-6" style={{ borderBottom: '1px dotted #dde1e8', paddingBottom: '1rem' }}>
          <span style={{ color: '#5c6474' }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{documents.length}</strong> documents
          </span>
          <span style={{ color: '#5c6474' }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{books.length}</strong> books
          </span>
          <span style={{ color: '#5c6474' }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>7</strong> pathways
          </span>
        </div>
      </div>

      {/* ── BOOKSHELF PROMO ── */}
      <div className="max-w-[900px] mx-auto px-6 py-4">
        <Link
          href="/bookshelf"
          className="flex items-center gap-4 p-5 border border-rule bg-white transition-all hover:border-blue hover:-translate-y-0.5 group"
        >
          <BookOpen size={28} className="text-muted group-hover:text-blue transition-colors flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[1rem] font-bold">Community Bookshelf</h3>
            <p className="text-[0.85rem] text-muted mt-0.5">
              {books.length} books that shaped how we think about community, justice, and civic life
            </p>
          </div>
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-blue flex-shrink-0">
            Browse &rarr;
          </span>
        </Link>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-16">
        <LibraryClient documents={documents} />
      </div>

      {/* ── CROSS LINKS ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <PageCrossLinks preset="explore" />
      </div>
    </div>
  )
}
