import type { Metadata } from 'next'
import { getPublishedDocuments } from '@/lib/data/library'
import { LibraryClient } from './LibraryClient'
import Image from 'next/image'
import Link from 'next/link'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Change Engine',
  description: 'Curated research, reports, and policy briefs from Houston organizations and community partners.',
}


export default async function LibraryPage() {
  const { documents } = await getPublishedDocuments(1, 100)

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
            Research Library
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg leading-relaxed max-w-2xl">
            Curated reports, policy briefs, and community research from Houston&apos;s leading organizations. Every document summarized for quick understanding.
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ color: "#5c6474" }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Library</span>
        </nav>
      </div>

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

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + '#dde1e8', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
