import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getHoustonAirQuality, getWeatherAlerts, getBayouLevels } from '@/lib/data/civic-dashboard'
import { getServicesWithCoords } from '@/lib/data/exchange'
import { CivicDashboardClient } from './CivicDashboardClient'
import { DashboardCoverageMap } from './DashboardCoverageMap'

export const revalidate = 900 // 15 minutes


export const metadata: Metadata = {
  title: 'Houston Live Dashboard -- Change Engine',
  description: 'Houston civic life -- right now. Real data. Updated every morning. No spin.',
}

export default async function LiveDashboardPage() {
  const [airQuality, alerts, bayouLevels, servicesWithCoords] = await Promise.all([
    getHoustonAirQuality(),
    getWeatherAlerts(),
    getBayouLevels(),
    getServicesWithCoords(),
  ])

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-paper">
        <div className="absolute right-[-60px] top-[-20px]">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-10">
          <p style={{ color: "#5c6474" }} className="text-[11px] uppercase tracking-[0.15em] mb-1">changeengine.us</p>
          <div className="flex items-center gap-2 mt-2 mb-2">
            <span className="inline-block w-2 h-2 bg-green-600 animate-pulse" />
            <span style={{ color: "#5c6474" }} className="text-sm">You can&apos;t shape what you can&apos;t see.</span>
          </div>
          <h1 style={{  }} className="text-2xl sm:text-3xl">Houston civic life -- right now.</h1>
          <p style={{ color: "#5c6474" }} className="text-base mt-2">Real data. Updated every morning. No spin.</p>
        </div>
        <div style={{ height: 1, background: '#dde1e8' }} />
      </section>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4">
        <nav style={{ color: "#5c6474" }} className="text-[11px] tracking-wide">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <span style={{  }}>Dashboard</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Intro */}
        <div className="mb-10 space-y-4 text-sm leading-relaxed max-w-3xl" style={{ color: "#5c6474" }}>
          <p>
            Not a snapshot from last year. Not a press release. Live data from the sources that matter -- city, county, state, and federal -- updated before you wake up.
          </p>
          <p>
            City Council votes. County decisions. State bills moving through committees. Federal dollars coming into Houston.
          </p>
          <p>
            All of it. Plain language. One place.
          </p>
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-8" />

        {/* What You're Looking At */}
        <div className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{  }} className="text-xl">What you&apos;re looking at</h2>
            <span style={{ color: "#5c6474" }} className="text-[11px]">4 categories</span>
          </div>
          <div style={{ borderBottom: '2px dotted ' + '#dde1e8' }} className="mb-4" />
          <ul className="space-y-2 text-sm" style={{ color: "#5c6474" }}>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span><strong style={{  }}>Legislative activity</strong> -- What&apos;s moving, what passed, what failed.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span><strong style={{  }}>Civic organizations</strong> -- Who&apos;s active and what they&apos;re working on.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span><strong style={{  }}>Community resources</strong> -- Services available right now, by neighborhood.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 flex-shrink-0 mt-1.5" style={{ background: '#1b5e8a' }} />
              <span><strong style={{  }}>Ways to show up</strong> -- Meetings, hearings, volunteer shifts, events.</span>
            </li>
          </ul>
        </div>

        {/* Data sync note */}
        <div className="mb-8 text-xs px-4 py-3 max-w-2xl" style={{ color: "#5c6474", background: "#f4f5f7", border: '1px solid #dde1e8' }}>
          Data syncs every morning between 7 and 10 AM Central. Check back after 10 if something looks off.
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #dde1e8' }} className="my-8" />

        <CivicDashboardClient
          airQuality={airQuality}
          alerts={alerts}
          bayouLevels={bayouLevels}
        />

        {/* Service Coverage Map */}
        <DashboardCoverageMap services={servicesWithCoords} />
      </div>

      {/* ── Footer link ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-10">
        <div style={{ borderTop: '1px solid #dde1e8' }} className="pt-4">
          <Link href="/" style={{ color: "#1b5e8a" }} className="text-sm hover:underline">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
