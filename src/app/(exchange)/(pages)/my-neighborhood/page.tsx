import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { NeighborhoodStory } from '@/components/exchange/NeighborhoodStory'
import { getNeighborhoodStory, getNeighborhoodIdByZip } from '@/lib/data/neighborhood-story'
import { THEMES } from '@/lib/constants'
import { ZipPrompt } from './ZipPrompt'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'State of My Neighborhood — Change Engine',
  description: 'A data-driven portrait of your neighborhood — demographics, representatives, services, policies, and civic engagement opportunities.',
}

// ── Design tokens ─────────────────────────────────────────────────────


export default async function MyNeighborhoodPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()

  const zip = params.zip || cookieStore.get('zip')?.value || null

  // No ZIP -- show prompt
  if (!zip) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="relative overflow-hidden bg-paper">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
            <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
              Enter your ZIP code to see a personalized portrait of your neighborhood -- your representatives, nearby services, upcoming elections, and more.
            </p>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
          <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
            <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
            <span className="mx-2">/</span>
            <span>My Neighborhood</span>
          </nav>
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <ZipPrompt />
        </div>
      </div>
    )
  }

  // Resolve neighborhood from ZIP
  const neighborhoodId = await getNeighborhoodIdByZip(zip)

  if (!neighborhoodId) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="relative overflow-hidden bg-paper">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
          <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
            <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
            <span className="mx-2">/</span>
            <span>My Neighborhood</span>
          </nav>
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <div className="p-8 text-center max-w-lg mx-auto" style={{ border: '1px solid #dde1e8' }}>
            <h2 style={{ fontSize: '1.25rem',  }} className="mb-2">
              Neighborhood Not Found
            </h2>
            <p style={{ fontSize: '0.9rem', color: "#5c6474", lineHeight: 1.6 }} className="mb-4">
              We could not find a neighborhood for ZIP code <span style={{ fontWeight: 700 }}>{zip}</span>.
              This may be outside our current coverage area.
            </p>
            <ZipPrompt />
          </div>
        </div>
      </div>
    )
  }

  // Fetch the full story data
  const storyData = await getNeighborhoodStory(neighborhoodId)

  if (!storyData) {
    return (
      <div className="bg-paper min-h-screen">
        <div className="relative overflow-hidden bg-paper">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontSize: '1rem', color: "#5c6474" }} className="text-center py-10">
            Unable to load neighborhood data. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const heroStats = [
    storyData.neighborhood.population != null
      ? { value: storyData.neighborhood.population.toLocaleString(), label: 'Population' }
      : null,
    storyData.stats.serviceCount > 0
      ? { value: storyData.stats.serviceCount, label: 'Services' }
      : null,
    storyData.stats.officialCount > 0
      ? { value: storyData.stats.officialCount, label: 'Representatives' }
      : null,
    storyData.upcomingElections.length > 0
      ? { value: storyData.upcomingElections.length, label: 'Upcoming Elections' }
      : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine -- State of My Neighborhood
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
            {storyData.neighborhood.neighborhood_name}
          </h1>
          <p style={{ fontSize: '1.05rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-3 max-w-xl">
            A data-driven portrait of your community -- demographics, representatives, services, policies, and civic engagement opportunities.
          </p>
          {heroStats.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-6">
              {heroStats.map(function (stat) {
                return (
                  <div key={stat.label}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</span>
                    <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">{stat.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/super-neighborhoods" className="hover:underline" style={{ color: "#1b5e8a" }}>Super Neighborhoods</Link>
          <span className="mx-2">/</span>
          <span>{storyData.neighborhood.neighborhood_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        <NeighborhoodStory data={storyData} />

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
