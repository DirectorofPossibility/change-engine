/**
 * @fileoverview "State of My Neighborhood" data story page.
 *
 * Server component that resolves the user's neighborhood from their
 * ZIP cookie (or ?zip= query param), fetches aggregated story data,
 * and renders the NeighborhoodStory client component.
 *
 * If no ZIP is available, shows a prompt to enter one.
 *
 * @route GET /my-neighborhood
 * @caching ISR with `revalidate = 300` (5 minutes)
 */

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { MapPin } from 'lucide-react'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { NeighborhoodStory } from '@/components/exchange/NeighborhoodStory'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { getNeighborhoodStory, getNeighborhoodIdByZip } from '@/lib/data/neighborhood-story'
import { THEMES } from '@/lib/constants'
import { ZipPrompt } from './ZipPrompt'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'State of My Neighborhood — Change Engine',
  description: 'A data-driven portrait of your neighborhood — demographics, representatives, services, policies, and civic engagement opportunities.',
}

export default async function MyNeighborhoodPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()

  // Resolve ZIP from query param or cookie
  const zip = params.zip || cookieStore.get('zip')?.value || null

  // No ZIP — show prompt
  if (!zip) {
    return (
      <>
        <IndexPageHero
          title="State of My Neighborhood"
          subtitle="A data story about where you live"
          intro="Enter your ZIP code to see a personalized portrait of your neighborhood — your representatives, nearby services, upcoming elections, and more."
          color={THEMES.THEME_03.color}
        />
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'My Neighborhood' }]} />
          <ZipPrompt />
        </div>
      </>
    )
  }

  // Resolve neighborhood from ZIP
  const neighborhoodId = await getNeighborhoodIdByZip(zip)

  if (!neighborhoodId) {
    return (
      <>
        <IndexPageHero
          title="State of My Neighborhood"
          subtitle="A data story about where you live"
          color={THEMES.THEME_03.color}
        />
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'My Neighborhood' }]} />
          <div className="bg-white border border-brand-border p-8 text-center max-w-lg mx-auto">
            <MapPin size={32} className="mx-auto text-brand-muted mb-3" />
            <h2 className="text-lg font-display font-bold text-brand-text mb-2">
              Neighborhood Not Found
            </h2>
            <p className="text-sm text-brand-muted mb-4">
              We could not find a neighborhood for ZIP code <span className="font-mono font-bold">{zip}</span>.
              This may be outside our current coverage area.
            </p>
            <ZipPrompt />
          </div>
        </div>
      </>
    )
  }

  // Fetch the full story data
  const storyData = await getNeighborhoodStory(neighborhoodId)

  if (!storyData) {
    return (
      <>
        <IndexPageHero
          title="State of My Neighborhood"
          subtitle="A data story about where you live"
          color={THEMES.THEME_03.color}
        />
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'My Neighborhood' }]} />
          <p className="text-brand-muted text-center py-10">Unable to load neighborhood data. Please try again later.</p>
        </div>
      </>
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
    <>
      <IndexPageHero
        title={storyData.neighborhood.neighborhood_name}
        subtitle="State of My Neighborhood"
        intro="A data-driven portrait of your community — demographics, representatives, services, policies, and civic engagement opportunities."
        color={THEMES.THEME_03.color}
        stats={heroStats}
      />
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: 'Super Neighborhoods', href: '/super-neighborhoods' },
          { label: storyData.neighborhood.neighborhood_name },
        ]} />

        <div className="mt-4">
          <NeighborhoodStory data={storyData} />
        </div>
      </div>
    </>
  )
}
