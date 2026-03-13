import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdventureEngine } from '@/components/exchange/AdventureEngine'
import { getAdventure, ALL_ADVENTURES } from '@/lib/data/adventures'


export function generateStaticParams() {
  return ALL_ADVENTURES.map(a => ({ slug: a.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const adventure = getAdventure(params.slug)
  if (!adventure) return {}
  return {
    title: `${adventure.title} — Community Adventures`,
    description: adventure.description,
  }
}

export default function AdventurePage({ params }: { params: { slug: string } }) {
  const adventure = getAdventure(params.slug)
  if (!adventure) notFound()

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
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {adventure.title}
          </h1>
          <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            {adventure.description}
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/adventures" className="hover:underline" style={{ color: "#1b5e8a" }}>Adventures</Link>
          <span className="mx-2">/</span>
          <span>{adventure.title}</span>
        </nav>
      </div>

      {/* Adventure engine */}
      <div className="max-w-[700px] mx-auto px-6 py-8">
        <AdventureEngine adventure={adventure} />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/adventures" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Adventures
        </Link>
      </div>
    </div>
  )
}
