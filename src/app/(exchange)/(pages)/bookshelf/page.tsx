import type { Metadata } from 'next'
import { getBookshelfItems } from '@/lib/data/library'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { BookshelfClient } from './BookshelfClient'
import Link from 'next/link'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Bookshelf — Change Engine',
  description: 'Curated reading list for civic-minded Houstonians. Books on community, justice, environment, and building a better city.',
}

export default async function BookshelfPage() {
  await requirePageEnabled('page_bookshelf')

  const books = await getBookshelfItems()

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Community Bookshelf"
        subtitle="Books that shaped how we think about community, justice, and civic life. Each one chosen because it changes the conversation."
        color="#8b5e3c"
        stats={[
          { value: books.length, label: 'Books' },
          { value: 7, label: 'Pathways' },
        ]}
      />

      <Breadcrumb items={[{ label: 'Library', href: '/library' }, { label: 'Bookshelf' }]} />

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <BookshelfClient books={books} />
      </div>

      <div className="my-10 max-w-[1080px] mx-auto px-6 h-px bg-rule" />
      <div className="max-w-[1080px] mx-auto px-6 pb-12">
        <Link href="/library" className="font-body text-[0.95rem] italic text-blue hover:underline">
          Back to Library
        </Link>
      </div>
    </div>
  )
}
