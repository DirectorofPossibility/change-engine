import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getSuperNeighborhoodsList } from '@/lib/data/exchange'
import { GeographyClient } from './GeographyClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore Your Community — Map View',
  description: 'Explore Houston through its neighborhoods, districts, and civic boundaries. Find services, officials, and organizations in your area.',
}

// ── Design tokens ─────────────────────────────────────────────────────


export default async function GeographyPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string; superNeighborhood?: string }>
}) {
  const params = await searchParams
  const superNeighborhoods = await getSuperNeighborhoodsList()

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-12">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', lineHeight: 1.1 }}>
            Explore Your Community
          </h1>
          <p style={{ fontSize: '1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-3 max-w-lg">
            Houston through its neighborhoods, districts, and civic boundaries.
          </p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[1400px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Map View</span>
        </nav>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <Suspense fallback={<div className="w-full h-[650px] animate-pulse bg-paper" />}>
          <GeographyClient
            superNeighborhoods={superNeighborhoods}
            initialZip={params.zip}
            initialSuperNeighborhood={params.superNeighborhood}
          />
        </Suspense>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        <div className="text-center py-4">
          <Link href="/" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
