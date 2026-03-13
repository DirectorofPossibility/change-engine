import type { Metadata } from 'next'
import { LibraryChat } from '@/components/exchange/LibraryChat'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Chat with Chance | Change Engine',
  description: 'Ask Chance, your neighborhood guide, about Houston community resources, services, organizations, elected officials, and more.',
}

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default function LibraryChatPage() {
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
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl leading-[1.15] mb-4">
            Chat with Chance
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
            Your neighborhood guide to Houston&apos;s community resources, services, and opportunities. Ask anything!
          </p>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/library" className="hover:underline" style={{ color: CLAY }}>Library</Link>
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
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/library" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Library
          </Link>
        </div>
      </div>
    </div>
  )
}
