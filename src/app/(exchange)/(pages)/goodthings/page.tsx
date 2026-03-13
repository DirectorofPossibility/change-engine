import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GoodThingsClient } from './GoodThingsClient'

export const revalidate = 600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'Three Good Things — The Change Engine',
  description: 'Three good things. Every day. Real stories from Houston, updated daily. Because the news isn\'t only bad.',
}

export default function GoodThingsPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-20">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 className="mt-4" style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.1, color: INK }}>
            Three Good Things
          </h1>
          <p className="mt-4 max-w-[560px]" style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, color: MUTED }}>
            Every day. Real stories from Houston. Because the news isn't only bad.
          </p>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} />
      </div>
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Three Good Things</span>
        </nav>
      </div>
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <GoodThingsClient />
      </div>
      <div className="max-w-[900px] mx-auto px-6">
        <div style={{ height: 1, background: RULE_COLOR }} />
        <div className="py-8">
          <Link href="/" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
