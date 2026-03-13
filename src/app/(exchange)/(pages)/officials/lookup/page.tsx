import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ZipLookupForm } from '@/components/exchange/ZipLookupForm'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Who Represents You?',
  description: 'Drop your ZIP code to see who represents you in Houston and Harris County.',
}

export default function ZipLookupPage() {
  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Who Represents You?
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Drop your ZIP code. We will show you everyone -- federal, state, county, and city.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/officials" className="hover:underline" style={{ color: CLAY }}>Officials</Link>
          <span className="mx-2">/</span>
          <span>Find Your Reps</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <ZipLookupForm />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/officials" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Officials
        </Link>
      </div>
    </div>
  )
}
