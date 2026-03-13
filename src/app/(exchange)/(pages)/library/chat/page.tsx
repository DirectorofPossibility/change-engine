import type { Metadata } from 'next'
import { LibraryChat } from '@/components/exchange/LibraryChat'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Chat with Chance | Change Engine',
  description: 'Ask Chance, your neighborhood guide, about Houston community resources, services, organizations, elected officials, and more.',
}


export default function LibraryChatPage() {
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
          <h1 style={{  }} className="text-3xl sm:text-4xl leading-[1.15] mb-4">
            Chat with Chance
          </h1>
          <p style={{ color: "#5c6474" }} className="text-lg leading-relaxed max-w-2xl">
            Your neighborhood guide to Houston&apos;s community resources, services, and opportunities. Ask anything!
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ color: "#5c6474" }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/library" className="hover:underline" style={{ color: "#1b5e8a" }}>Library</Link>
          <span className="mx-2">/</span>
          <span>Chat with Chance</span>
        </nav>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <LibraryChat />
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
