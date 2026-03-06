import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300
export const metadata: Metadata = { title: 'Policies — Community Exchange' }

export default async function PoliciesPage() {
  const supabase = await createClient()
  const { data: policies } = await supabase
    .from('policies')
    .select('policy_id, policy_name, title_6th_grade, summary_6th_grade, bill_number, status, government_level, introduced_date')
    .order('introduced_date', { ascending: false })
    .limit(60)

  function levelColor(level: string | null) {
    switch (level) {
      case 'Federal': return '#3182ce'
      case 'State': return '#d69e2e'
      case 'County': return '#38a169'
      case 'City': return '#805ad5'
      default: return '#6B6560'
    }
  }

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Policies</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            Legislation, ordinances, and policy decisions at every level of government — explained in plain language.
          </p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#38a169' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(policies || []).map(function (p: any) {
            const color = levelColor(p.government_level)
            return (
              <Link
                key={p.policy_id}
                href={'/design2/policies/' + p.policy_id}
                className="bg-white rounded-xl border p-5 transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#D4CCBE' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{p.government_level || 'Policy'}</span>
                  {p.bill_number && (
                    <span className="text-[11px] font-medium" style={{ color: '#9B9590' }}>{p.bill_number}</span>
                  )}
                </div>
                <h3 className="font-serif text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>
                  {p.title_6th_grade || p.policy_name}
                </h3>
                {p.summary_6th_grade && (
                  <p className="text-[13px] mt-2 line-clamp-2" style={{ color: '#6B6560' }}>{p.summary_6th_grade}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {p.status && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{ background: '#F7F2EA', color: '#6B6560' }}>{p.status}</span>
                  )}
                  {p.introduced_date && (
                    <span className="text-[11px]" style={{ color: '#9B9590' }}>
                      {new Date(p.introduced_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {(!policies || policies.length === 0) && (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#D4CCBE' }}>
            <p className="text-[15px]" style={{ color: '#6B6560' }}>Policy listings are being updated. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
