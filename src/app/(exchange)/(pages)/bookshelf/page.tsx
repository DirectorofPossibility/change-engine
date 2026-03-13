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

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function BookshelfPage() {
  const books = await getBookshelfItems()

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
            Community Bookshelf
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl mb-6">
            Books that shaped how we think about community, justice, and civic life. Each one chosen because it changes the conversation.
          </p>
          <div className="flex items-center gap-4" style={{ fontFamily: MONO, color: MUTED }} >
            <span className="text-xs"><strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>{books.length}</strong> books</span>
            <span className="text-xs"><strong style={{ color: INK, fontFamily: SERIF, fontSize: '1.25rem' }}>7</strong> pathways</span>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/library" className="hover:underline" style={{ color: CLAY }}>Library</Link>
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
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/library" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Library
          </Link>
        </div>
      </div>
    </div>
  )
}
