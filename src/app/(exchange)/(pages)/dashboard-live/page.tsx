import type { Metadata } from 'next'
import { getHoustonAirQuality, getWeatherAlerts, getBayouLevels } from '@/lib/data/civic-dashboard'
import { getServicesWithCoords } from '@/lib/data/exchange'
import { CivicDashboardClient } from './CivicDashboardClient'
import { DashboardCoverageMap } from './DashboardCoverageMap'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 900 // 15 minutes

export const metadata: Metadata = {
  title: 'Houston Live Dashboard — The Change Engine',
  description: 'Real-time air quality, weather alerts, and bayou water levels for Houston, TX.',
}

export default async function LiveDashboardPage() {
  const [airQuality, alerts, bayouLevels, servicesWithCoords] = await Promise.all([
    getHoustonAirQuality(),
    getWeatherAlerts(),
    getBayouLevels(),
    getServicesWithCoords(),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-brand-muted">Live data</span>
        </div>
        <h1 className="text-3xl font-bold text-brand-text">Houston Civic Dashboard</h1>
        <p className="text-brand-muted mt-1">Real-time conditions for Harris County</p>
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
