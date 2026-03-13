import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { OpportunitiesClient } from './OpportunitiesClient'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Opportunities — Change Engine',
  description: 'Volunteer, learn, and get involved in your Houston community.',
}

export default async function OpportunitiesPage() {
  await requirePageEnabled('page_opportunities')
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('opportunity_id, opportunity_name, description_5th_grade, org_id, zip_code, is_virtual')
    .eq('is_active' as any, 'Yes')
    .order('opportunity_name')

  let all = opportunities || []
  if (userZip) {
    all = all.slice().sort(function (a, b) {
      const aLocal = a.zip_code === userZip ? -1 : 0
      const bLocal = b.zip_code === userZip ? -1 : 0
      return aLocal - bLocal
    })
  }

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Opportunities"
        subtitle="Your community needs your talents, time, and energy. Browse volunteer positions, learning opportunities, and ways to get involved in Houston."
        color="#1e4d7a"
        stats={all.length > 0 ? [{ value: all.length, label: 'Opportunities' }] : undefined}
      />

      <Breadcrumb items={[{ label: 'Opportunities' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <OpportunitiesClient opportunities={all as any} userZip={userZip} />

        {/* Cross-links */}
        <div className="mt-10 pt-8 border-t border-rule">
          <p className="font-mono text-micro uppercase tracking-wider text-faint mb-4">Related</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/services" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Services</p>
              <p className="font-body text-sm text-muted">Find services in your area</p>
            </Link>
            <Link href="/calendar" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Events Calendar</p>
              <p className="font-body text-sm text-muted">Community events near you</p>
            </Link>
            <Link href="/organizations" className="block p-4 border border-rule hover:border-ink transition-colors">
              <p className="font-body font-semibold text-ink mb-1">Organizations</p>
              <p className="font-body text-sm text-muted">Community groups doing the work</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
