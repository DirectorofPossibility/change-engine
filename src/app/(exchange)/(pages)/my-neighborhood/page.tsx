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

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
      <div style={{ background: PARCHMENT }} className="min-h-screen">
        <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
            <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, lineHeight: 1.7 }} className="mt-4 max-w-xl">
              Enter your ZIP code to see a personalized portrait of your neighborhood -- your representatives, nearby services, upcoming elections, and more.
            </p>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
          <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
            <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
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
      <div style={{ background: PARCHMENT }} className="min-h-screen">
        <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
          <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
            <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
            <span className="mx-2">/</span>
            <span>My Neighborhood</span>
          </nav>
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <div className="p-8 text-center max-w-lg mx-auto" style={{ border: '1px solid ' + RULE_COLOR }}>
            <h2 style={{ fontFamily: SERIF, fontSize: '1.25rem', color: INK }} className="mb-2">
              Neighborhood Not Found
            </h2>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, lineHeight: 1.6 }} className="mb-4">
              We could not find a neighborhood for ZIP code <span style={{ fontFamily: MONO, fontWeight: 700 }}>{zip}</span>.
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
      <div style={{ background: PARCHMENT }} className="min-h-screen">
        <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
          </div>
          <div className="relative max-w-[900px] mx-auto px-6 py-16">
            <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
              Change Engine
            </p>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
              State of My Neighborhood
            </h1>
          </div>
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-10">
          <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED }} className="text-center py-10">
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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine -- State of My Neighborhood
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
            {storyData.neighborhood.neighborhood_name}
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: MUTED, lineHeight: 1.7 }} className="mt-3 max-w-xl">
            A data-driven portrait of your community -- demographics, representatives, services, policies, and civic engagement opportunities.
          </p>
          {heroStats.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-6">
              {heroStats.map(function (stat) {
                return (
                  <div key={stat.label}>
                    <span style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK, fontWeight: 700 }}>{stat.value}</span>
                    <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">{stat.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/super-neighborhoods" className="hover:underline" style={{ color: CLAY }}>Super Neighborhoods</Link>
          <span className="mx-2">/</span>
          <span>{storyData.neighborhood.neighborhood_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        <NeighborhoodStory data={storyData} />

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        <div className="text-center py-4">
          <Link href="/" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
