import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 600
export const metadata: Metadata = { title: 'Foundations — Community Exchange' }

export default async function FoundationsPage() {
  const supabase = await createClient()
  const { data: foundations } = await supabase
    .from('foundations')
    .select('foundation_id, foundation_name, description, website, ein, total_giving, total_assets, city, state')
    .order('foundation_name')

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Foundations</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            Philanthropic organizations investing in Houston communities — their priorities, funding, and impact.
          </p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#805ad5' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(foundations || []).map(function (f: any) {
            const initial = (f.foundation_name || '?').charAt(0).toUpperCase()
            return (
              <div
                key={f.foundation_id}
                className="bg-white rounded-xl border p-5 transition-all hover:shadow-md"
                style={{ borderColor: '#D4CCBE' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center font-serif text-lg font-bold text-white" style={{ background: '#805ad5' }}>
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[15px] font-semibold leading-snug" style={{ color: '#1a1a1a' }}>{f.foundation_name}</h3>
                    {f.city && (
                      <span className="text-[11px] font-medium" style={{ color: '#9B9590' }}>{f.city}{f.state ? ', ' + f.state : ''}</span>
                    )}
                  </div>
                </div>
                {f.description && (
                  <p className="text-[13px] mt-3 line-clamp-3" style={{ color: '#6B6560' }}>{f.description}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {f.total_giving && (
                    <span className="text-[11px] font-bold" style={{ color: '#38a169' }}>
                      ${(Number(f.total_giving) / 1000000).toFixed(1)}M giving
                    </span>
                  )}
                  {f.website && (
                    <a href={f.website} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium" style={{ color: '#C75B2A' }}>
                      Website
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {(!foundations || foundations.length === 0) && (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#D4CCBE' }}>
            <p className="text-[15px]" style={{ color: '#6B6560' }}>Foundation data is being compiled. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
