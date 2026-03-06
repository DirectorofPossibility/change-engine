// @ts-nocheck
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
// icons used inline
import { PageHero } from '@/components/exchange/PageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Opportunities',
  description: 'Volunteer, learn, and get involved in your Houston community.',
}

export default async function OpportunitiesPage() {
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, org_id')
    .order('opportunity_name')
    .limit(50)

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="tripod" gradientColor="#38a169" titleKey="opportunities.title" subtitleKey="opportunities.subtitle" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Opportunities' }]} />

        {(!opportunities || opportunities.length === 0) ? (
          <p className="text-brand-muted text-center py-12">
            Opportunities are being gathered. Check back soon for ways to get involved in your community.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {opportunities.map(function (opp) {
              return (
                <Link
                  key={opp.opportunity_id}
                  href={'/opportunities/' + opp.opportunity_id}
                  className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow group"
                >
                  <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors mb-1">
                    {opp.opportunity_name}
                  </h3>
                  {opp.description_5th_grade && (
                    <p className="text-sm text-brand-muted line-clamp-2 mb-2">
                      {opp.description_5th_grade}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
