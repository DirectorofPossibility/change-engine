// @ts-nocheck
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { GoodThingsWidget } from '@/components/exchange/GoodThingsWidget'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Opportunities — Community Exchange',
  description: 'Volunteer, learn, and get involved in your Houston community.',
}

export default async function OpportunitiesPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, org_id, zip_code, is_virtual')
    .order('opportunity_name')
    .limit(50)

  // Sort local opportunities to top when ZIP is set
  let all = opportunities || []
  if (userZip) {
    all = all.slice().sort((a: any, b: any) => {
      const aLocal = a.zip_code === userZip ? -1 : 0
      const bLocal = b.zip_code === userZip ? -1 : 0
      return aLocal - bLocal
    })
  }

  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/centers/action" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 hover:underline" style={{ color: '#38a169' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#38a169' }} />
          Action Center
        </Link>
      </div>
      <IndexPageHero
        color="#38a169"
        pattern="tripod"
        titleKey="opportunities.title"
        subtitleKey="opportunities.subtitle"
        intro="Your community needs your talents, time, and energy. Browse volunteer positions, learning opportunities, and ways to get involved in Houston."
        stats={all.length > 0 ? [
          { value: all.length, label: 'Opportunities' },
        ] : undefined}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Opportunities' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text">
                All Opportunities ({all.length})
              </h2>
              <span className="relative text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                Time Commitment
                <WayfinderTooltipPos tipKey="time_commitment" position="bottom" />
              </span>
              <span className="relative text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                Virtual
                <WayfinderTooltipPos tipKey="virtual_badge" position="bottom" />
              </span>
              <span className="relative text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                Spots Available
                <WayfinderTooltipPos tipKey="spots_available" position="bottom" />
              </span>
            </div>

            {all.length === 0 ? (
              <div className="relative text-center py-16 bg-white rounded-xl border-2 border-brand-border overflow-hidden">
                <div className="absolute right-4 top-4 opacity-[0.06]">
                  <FOLWatermark variant="tripod" size="md" color="#38a169" />
                </div>
                <p className="text-brand-muted text-lg font-serif">
                  Opportunities are being gathered.
                </p>
                <p className="text-brand-muted text-sm mt-2">
                  Check back soon for ways to get involved in your community.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {all.map(function (opp) {
                  return (
                    <Link
                      key={opp.opportunity_id}
                      href={'/opportunities/' + opp.opportunity_id}
                      className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                      {/* Color bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-voice group-hover:w-1.5 transition-all" />
                      <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors mb-1 pl-3">
                        {opp.opportunity_name}
                      </h3>
                      {opp.description_5th_grade && (
                        <p className="text-sm text-brand-muted line-clamp-2 pl-3">
                          {opp.description_5th_grade}
                        </p>
                      )}
                      {userZip && (opp as any).zip_code === userZip && (
                        <span className="text-[10px] text-brand-accent font-medium pl-3">Near you</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="opportunities"
                color="#38a169"
                related={[
                  { label: 'Services', href: '/services', color: '#38a169' },
                  { label: 'Organizations', href: '/organizations', color: '#dd6b20' },
                  { label: 'Events', href: '/calendar', color: '#3182ce' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
              <div className="mt-4"><GoodThingsWidget variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
