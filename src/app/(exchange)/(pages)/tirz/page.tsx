import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getTirzZones } from '@/lib/data/exchange'
import { TirzMap } from './TirzMap'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'TIRZ Zones — Change Engine',
  description: 'Explore Houston\'s 27 Tax Increment Reinvestment Zones (TIRZ). See how reinvestment dollars are shaping neighborhoods across the city.',
}

// ── Design tokens ─────────────────────────────────────────────────────


export default async function TirzPage() {
  const zones = await getTirzZones()

  const VISIBLE_COUNT = 9

  return (
    <div className="bg-paper min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-paper">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: "#5c6474" }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
            Tax Increment Reinvestment Zones
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", lineHeight: 1.7 }} className="mt-4 max-w-xl">
            Where reinvestment meets neighborhoods. TIRZ zones capture the growth in property tax revenue within a designated area and reinvest it locally -- funding infrastructure, affordable housing, parks, and economic development.
          </p>
          <div className="flex flex-wrap gap-6 mt-6">
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{zones.length}</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Active Zones</span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>City</span>
              <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem' }} className="uppercase">Created by Council</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: "#5c6474" }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>TIRZ Zones</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        {/* ── Interactive map ── */}
        <section className="mb-10">
          <div className="flex items-baseline gap-4 mb-4">
            <h2 style={{ fontSize: '1.5rem',  }}>Zone Map</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
          </div>
          <div style={{ border: '1px solid #dde1e8' }}>
            <TirzMap />
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Zone grid ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>All TIRZ Zones</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
            <span style={{ fontSize: '0.6875rem', color: "#5c6474", letterSpacing: '0.1em' }} className="uppercase">{zones.length} zones</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={{ border: '1px solid #dde1e8' }}>
            {zones.slice(0, VISIBLE_COUNT).map(function (zone: any) {
              return (
                <Link
                  key={zone.tirz_id}
                  href={'/tirz/' + zone.tirz_id}
                  className="group p-4 transition-colors hover:bg-white/50"
                  style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: '#1b5e8a' }}
                    >
                      {zone.site_number}
                    </span>
                    <div className="min-w-0">
                      <h3 style={{ fontSize: '0.9rem',  }} className="truncate group-hover:underline">
                        {zone.name}
                      </h3>
                      <p style={{ fontSize: '0.6875rem', color: "#5c6474" }}>TIRZ-{zone.site_number}</p>
                    </div>
                  </div>
                  {zone.description && (
                    <p style={{ fontSize: '0.8rem', color: "#5c6474", lineHeight: 1.5 }} className="line-clamp-2">
                      {zone.description}
                    </p>
                  )}
                  {zone.status && (
                    <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: "#5c6474", border: '1px solid #dde1e8', padding: '2px 8px' }} className="uppercase inline-block mt-2">
                      {zone.status}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {zones.length > VISIBLE_COUNT && (
            <details className="mt-4">
              <summary style={{ fontSize: '0.65rem', color: "#1b5e8a", letterSpacing: '0.1em', cursor: 'pointer' }} className="uppercase hover:underline py-2">
                Show all {zones.length} zones
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 mt-2" style={{ border: '1px solid #dde1e8' }}>
                {zones.slice(VISIBLE_COUNT).map(function (zone: any) {
                  return (
                    <Link
                      key={zone.tirz_id}
                      href={'/tirz/' + zone.tirz_id}
                      className="group p-4 transition-colors hover:bg-white/50"
                      style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: '#1b5e8a' }}
                        >
                          {zone.site_number}
                        </span>
                        <div className="min-w-0">
                          <h3 style={{ fontSize: '0.9rem',  }} className="truncate group-hover:underline">
                            {zone.name}
                          </h3>
                          <p style={{ fontSize: '0.6875rem', color: "#5c6474" }}>TIRZ-{zone.site_number}</p>
                        </div>
                      </div>
                      {zone.description && (
                        <p style={{ fontSize: '0.8rem', color: "#5c6474", lineHeight: 1.5 }} className="line-clamp-2">
                          {zone.description}
                        </p>
                      )}
                      {zone.status && (
                        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: "#5c6474", border: '1px solid #dde1e8', padding: '2px 8px' }} className="uppercase inline-block mt-2">
                          {zone.status}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </details>
          )}
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── How TIRZ Works ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontSize: '1.5rem',  }}>How TIRZ Zones Work</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: '#dde1e8' }} />
          </div>
          <p style={{ fontSize: '0.95rem', color: "#5c6474", lineHeight: 1.75, maxWidth: '650px' }} className="mb-8">
            When a TIRZ is created, the property tax base is frozen at its current level.
            As property values grow, the increment -- the difference between the frozen base and the new value --
            is captured and reinvested directly in the zone. This funds improvements that might not happen otherwise:
            new sidewalks, drainage, affordable housing, parks, and economic development programs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0" style={{ border: '1px solid #dde1e8' }}>
            <div className="p-5" style={{ borderRight: '1px solid #dde1e8' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700 }} className="mb-2">Created by Council</p>
              <p style={{ fontSize: '0.8rem', color: "#5c6474", lineHeight: 1.6 }}>
                City Council designates TIRZ zones to attract investment in areas that need it most.
              </p>
            </div>
            <div className="p-5" style={{ borderRight: '1px solid #dde1e8' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 700 }} className="mb-2">Tax Increment Captured</p>
              <p style={{ fontSize: '0.8rem', color: "#5c6474", lineHeight: 1.6 }}>
                Growth in property tax revenue stays in the zone instead of going to the general fund.
              </p>
            </div>
            <div className="p-5">
              <p style={{ fontSize: '0.95rem', fontWeight: 700 }} className="mb-2">Reinvested Locally</p>
              <p style={{ fontSize: '0.8rem', color: "#5c6474", lineHeight: 1.6 }}>
                Funds go toward infrastructure, housing, parks, and development within the zone.
              </p>
            </div>
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* ── Footer links ── */}
        <div className="flex flex-wrap gap-6 py-4">
          <Link href="/districts" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Districts
          </Link>
          <Link href="/officials" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Officials
          </Link>
          <Link href="/policies" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Policies
          </Link>
          <Link href="/geography" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Geography
          </Link>
          <Link href="/" style={{ fontSize: '0.7rem', color: "#1b5e8a", letterSpacing: '0.1em' }} className="uppercase hover:underline ml-auto">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
