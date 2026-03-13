import type { Metadata } from 'next'
import { getPublishedDocuments } from '@/lib/data/library'
import { LibraryClient } from './LibraryClient'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { requirePageEnabled } from '@/lib/data/page-gate'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Change Engine',
  description: 'Curated research, reports, and policy briefs from Houston organizations and community partners.',
}


export default async function LibraryPage() {
  await requirePageEnabled('page_library')
  const { documents } = await getPublishedDocuments(1, 100)

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
        <div className="flex items-center gap-6" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '1rem' }}>
          <span style={{ color: "#5c6474" }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>{documents.length}</strong> documents
          </span>
          <span style={{ color: "#5c6474" }} className="text-xs">
            <strong style={{ fontSize: '1.25rem' }}>7</strong> pathways
          </span>
        </div>
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
