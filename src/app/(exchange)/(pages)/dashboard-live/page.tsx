import type { Metadata } from 'next'
import { getHoustonAirQuality, getWeatherAlerts, getBayouLevels } from '@/lib/data/civic-dashboard'
import { getServicesWithCoords } from '@/lib/data/exchange'
import { CivicDashboardClient } from './CivicDashboardClient'
import { DashboardCoverageMap } from './DashboardCoverageMap'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 900 // 15 minutes

export const metadata: Metadata = {
  title: 'Houston Live Dashboard — Change Engine',
  description: 'Houston civic life — right now. Real data. Updated every morning. No spin.',
}

export default async function LiveDashboardPage() {
  const [airQuality, alerts, bayouLevels, servicesWithCoords] = await Promise.all([
    getHoustonAirQuality(),
    getWeatherAlerts(),
    getBayouLevels(),
    getServicesWithCoords(),
  ])

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-brand-muted">You can&apos;t shape what you can&apos;t see.</span>
        </div>
        <h1 className="text-3xl font-bold text-brand-text">Houston civic life — right now.</h1>
        <p className="text-brand-muted mt-1">Real data. Updated every morning. No spin.</p>
      </div>

      {/* Intro */}
      <div className="mb-10 space-y-4 text-sm text-brand-muted leading-relaxed max-w-3xl">
        <p>
          Not a snapshot from last year. Not a press release. Live data from the sources that matter — city, county, state, and federal — updated before you wake up.
        </p>
        <p>
          City Council votes. County decisions. State bills moving through committees. Federal dollars coming into Houston.
        </p>
        <p>
          All of it. Plain language. One place.
        </p>
      </div>

      {/* What You're Looking At */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-brand-text mb-3">What you&apos;re looking at</h2>
        <ul className="space-y-2 text-sm text-brand-muted">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-brand-text">Legislative activity</span> — What&apos;s moving, what passed, what failed.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-brand-text">Civic organizations</span> — Who&apos;s active and what they&apos;re working on.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-brand-text">Community resources</span> — Services available right now, by neighborhood.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-1.5 flex-shrink-0" />
            <span><span className="font-medium text-brand-text">Ways to show up</span> — Meetings, hearings, volunteer shifts, events.</span>
          </li>
        </ul>
      </div>

      {/* Data sync note */}
      <div className="mb-8 text-xs text-brand-muted-light bg-brand-bg px-4 py-3 border border-brand-border max-w-2xl">
        Data syncs every morning between 7 and 10 AM Central. Check back after 10 if something looks off.
      </div>

      <CivicDashboardClient
        airQuality={airQuality}
        alerts={alerts}
        bayouLevels={bayouLevels}
      />

      {/* Service Coverage Map */}
      <DashboardCoverageMap services={servicesWithCoords} />
    </div>
  )
}
