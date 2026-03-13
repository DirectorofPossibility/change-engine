import type { Metadata } from 'next'
import { getBookshelfItems } from '@/lib/data/library'
import { BookshelfClient } from './BookshelfClient'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Bookshelf — Change Engine',
  description: 'Curated reading list for civic-minded Houstonians. Books on community, justice, environment, and building a better city.',
}


export default async function BookshelfPage() {
  const books = await getBookshelfItems()

  return (
    <div className="bg-paper min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20 bg-paper">
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ color: "#5c6474" }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{  }} className="text-4xl sm:text-5xl leading-[1.15] mb-4">
            Community Bookshelf
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg leading-relaxed max-w-2xl mb-6">
            Books that shaped how we think about community, justice, and civic life. Each one chosen because it changes the conversation.
          </p>
          <div className="flex items-center gap-4" style={{ color: "#5c6474" }} >
            <span className="text-xs"><strong style={{ fontSize: '1.25rem' }}>{books.length}</strong> books</span>
            <span className="text-xs"><strong style={{ fontSize: '1.25rem' }}>7</strong> pathways</span>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ color: "#5c6474" }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/library" className="hover:underline" style={{ color: "#1b5e8a" }}>Library</Link>
          <span className="mx-2">/</span>
          <span>Bookshelf</span>
        </nav>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <BookshelfClient books={books} />
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + '#dde1e8', paddingTop: '1.5rem' }}>
          <Link href="/library" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">
            &larr; Back to Library
          </Link>
        </div>
      </div>
    </div>
  )
}
