import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { getTirzZones } from '@/lib/data/exchange'
import { TirzMap } from './TirzMap'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'TIRZ Zones — Community Exchange',
  description: 'Explore Houston\'s 27 Tax Increment Reinvestment Zones (TIRZ). See how reinvestment dollars are shaping neighborhoods across the city.',
}

export default async function TirzPage() {
  const zones = await getTirzZones()

  return (
    <div>
      <IndexPageHero
        color="#C75B2A"
        pattern="vesica"
        title="Tax Increment Reinvestment Zones"
        subtitle="Where reinvestment meets neighborhoods."
        intro="TIRZ zones capture the growth in property tax revenue within a designated area and reinvest it locally — funding infrastructure, affordable housing, parks, and economic development. Houston has 27 active zones shaping communities across the city."
        stats={[
          { value: String(zones.length), label: 'Active Zones' },
          { value: '27', label: 'Neighborhoods' },
          { value: 'City', label: 'Created by Council' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'TIRZ Zones' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Interactive map */}
            <TirzMap />

            {/* Zone grid */}
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-4">
                All TIRZ Zones ({zones.length})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map(function (zone: any) {
                return (
                  <Link
                    key={zone.tirz_id}
                    href={'/tirz/' + zone.tirz_id}
                    className="group border border-brand-border rounded-[0.75rem] overflow-hidden bg-white hover:translate-y-[-2px] transition-all duration-200"
                   
                  >
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: '#C75B2A' }} />
                      <div className="p-4 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className="w-9 h-9 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: '#C75B2A' }}
                          >
                            {zone.site_number}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors truncate">
                              {zone.name}
                            </h3>
                            <p className="text-[11px] font-mono text-brand-muted">
                              TIRZ-{zone.site_number}
                            </p>
                          </div>
                        </div>
                        {zone.description && (
                          <p className="text-xs leading-relaxed text-brand-muted line-clamp-2">
                            {zone.description}
                          </p>
                        )}
                        {zone.status && (
                          <span className="inline-block mt-2 text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-brand-bg-alt text-brand-muted">
                            {zone.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* How TIRZ Works */}
            <div className="mt-10 border-t-2 border-brand-border pt-8">
              <h2 className="font-display text-2xl font-bold text-brand-text mb-4">
                How TIRZ Zones Work
              </h2>
              <p className="text-sm leading-relaxed text-brand-muted max-w-2xl mb-6">
                When a TIRZ is created, the property tax base is frozen at its current level.
                As property values grow, the increment — the difference between the frozen base and the new value —
                is captured and reinvested directly in the zone. This funds improvements that might not happen otherwise:
                new sidewalks, drainage, affordable housing, parks, and economic development programs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-display font-bold text-brand-text text-sm mb-1">Created by Council</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    City Council designates TIRZ zones to attract investment in areas that need it most.
                  </p>
                </div>
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-display font-bold text-brand-text text-sm mb-1">Tax Increment Captured</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Growth in property tax revenue stays in the zone instead of going to the general fund.
                  </p>
                </div>
                <div className="border border-brand-border rounded-[0.75rem] p-4 bg-brand-bg">
                  <p className="font-display font-bold text-brand-text text-sm mb-1">Reinvested Locally</p>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Funds go toward infrastructure, housing, parks, and development within the zone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Wayfinder sidebar */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="tirz"
                color="#C75B2A"
                related={[
                  { label: 'Districts', href: '/districts', color: '#805ad5' },
                  { label: 'Officials Directory', href: '/officials', color: '#3182ce' },
                  { label: 'Policies', href: '/policies', color: '#38a169' },
                  { label: 'Geography', href: '/geography', color: '#319795' },
                  { label: 'Neighborhoods', href: '/neighborhoods', color: '#d69e2e' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
