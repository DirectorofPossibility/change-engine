import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300
export const metadata: Metadata = { title: 'Opportunities — Community Exchange' }

export default async function OpportunitiesPage() {
  const supabase = await createClient()
  const { data: opportunities } = await (supabase as any)
    .from('opportunities')
    .select('opportunity_id, title, description_5th_grade, opportunity_type, org_id, is_virtual, city')
    .order('created_at', { ascending: false })
    .limit(40)

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Opportunities</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            Volunteer, attend, participate — find ways to get involved in your community.
          </p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#38a169' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(opportunities || []).map(function (opp: any) {
            return (
              <div
                key={opp.opportunity_id}
                className="bg-white rounded-xl border p-5 transition-all hover:shadow-md"
                style={{ borderColor: '#D4CCBE' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {opp.opportunity_type && (
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#38a169' }}>{opp.opportunity_type}</span>
                  )}
                  {opp.is_virtual && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ background: '#EBF4FF', color: '#3182ce' }}>Virtual</span>
                  )}
                </div>
                <h3 className="font-serif text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>{opp.title}</h3>
                {opp.description_5th_grade && (
                  <p className="text-[13px] mt-2 line-clamp-3" style={{ color: '#6B6560' }}>{opp.description_5th_grade}</p>
                )}
                {opp.city && (
                  <span className="text-[11px] mt-2 inline-block font-medium" style={{ color: '#9B9590' }}>{opp.city}</span>
                )}
              </div>
            )
          })}
        </div>

        {(!opportunities || opportunities.length === 0) && (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#D4CCBE' }}>
            <p className="text-[15px]" style={{ color: '#6B6560' }}>Opportunity listings are being compiled. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
