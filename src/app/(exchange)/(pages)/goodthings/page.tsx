import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GoodThingsClient } from './GoodThingsClient'

export const revalidate = 600


export const metadata: Metadata = {
  title: 'Three Good Things — The Change Engine',
  description: 'Three good things. Every day. Real stories from Houston, updated daily. Because the news isn\'t only bad.',
}

export default function GoodThingsPage() {
  return (
    <div className="bg-paper min-h-screen">
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-20">
          <p className="text-blue uppercase" style={{ fontSize: 11, letterSpacing: '0.12em' }}>
            The Change Engine
          </p>
          <h1 className="mt-4" style={{ fontSize: 40, lineHeight: 1.1,  }}>
            Three Good Things
          </h1>
          <p className="mt-4 max-w-[560px] text-muted" style={{ fontSize: 17, lineHeight: 1.7 }}>
            Every day. Real stories from Houston. Because the news isn't only bad.
          </p>
        </div>
        <div className="h-px bg-rule" />
      </div>
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav className="text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
          <Link href="/" className="hover:underline text-blue">Home</Link>
          <span className="mx-2">/</span>
          <span>Three Good Things</span>
        </nav>
      </div>
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <GoodThingsClient />
      </div>
      <div className="max-w-[900px] mx-auto px-6">
        <div className="h-px bg-rule" />
        <div className="py-8">
          <Link href="/" className="hover:underline italic text-muted" style={{ fontSize: 13 }}>
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
