// @ts-nocheck
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { FOLWatermark } from '@/components/exchange/FOLWatermark'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Opportunities — Community Exchange',
  description: 'Volunteer, learn, and get involved in your Houston community.',
}

export default async function OpportunitiesPage() {
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, org_id')
    .order('opportunity_name')
    .limit(50)

  const all = opportunities || []

  return (
    <div>
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
                      className="bg-white rounded-xl border-2 border-brand-border p-5 hover:border-brand-text transition-all group relative overflow-hidden"
                      style={{ boxShadow: '3px 3px 0 #D1D5E0' }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
