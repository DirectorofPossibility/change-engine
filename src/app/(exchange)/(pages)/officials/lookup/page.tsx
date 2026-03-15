import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ZipLookupForm } from '@/components/exchange/ZipLookupForm'


export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Who Represents You?',
  description: 'Drop your ZIP code to see who represents you at every level of government.',
}

export default function ZipLookupPage() {
  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            Who Represents You?
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Drop your ZIP code. We will show you everyone -- federal, state, county, and city.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/officials" className="hover:underline" style={{ color: "#1b5e8a" }}>Officials</Link>
          <span className="mx-2">/</span>
          <span>Find Your Reps</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <ZipLookupForm />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/officials" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Officials
        </Link>
      </div>
    </div>
  )
}
