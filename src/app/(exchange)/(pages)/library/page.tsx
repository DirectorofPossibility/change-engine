import type { Metadata } from 'next'
import { getPublishedDocuments } from '@/lib/data/library'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { LibraryClient } from './LibraryClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Community Exchange',
  description: 'Curated research, reports, and policy briefs from Houston organizations and community partners.',
}

export default async function LibraryPage() {
  const { documents } = await getPublishedDocuments(1, 100)

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="seed"
        gradientColor="#d69e2e"
        title="Research Library"
        subtitle="Curated reports, policy briefs, and community research from Houston's leading organizations. Every document is summarized for quick understanding and available for AI-assisted exploration."
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Library' }]} />

        <LibraryClient documents={documents} />
      </div>
    </div>
  )
}
