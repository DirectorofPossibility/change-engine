import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Opportunities — Change Engine',
  description: 'Volunteer, learn, and get involved in your Houston community.',
}

export default async function OpportunitiesPage() {
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
    all = all.slice().sort((a, b) => {
      const aLocal = a.zip_code === userZip ? -1 : 0
      const bLocal = b.zip_code === userZip ? -1 : 0
      return aLocal - bLocal
    })
  }

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Your community needs your talents, time, and energy. Browse volunteer positions, learning opportunities, and ways to get involved in Houston.
          </p>
          {all.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontSize: '2rem',  }}>{all.length}</span>
                <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Opportunities</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Opportunities</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>All Opportunities</h2>
          <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{all.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        {all.length === 0 ? (
          <div className="text-center py-16" style={{ border: '1px dashed ' + '#dde1e8' }}>
            <p style={{ fontSize: '1.1rem', color: "#5c6474" }}>Opportunities are being gathered.</p>
            <p style={{ fontSize: '0.9rem', color: "#5c6474", marginTop: '0.5rem' }}>Check back soon for ways to get involved in your community.</p>
          </div>
        ) : (
          <>
            {all.slice(0, 4).map(function (opp) {
              return (
                <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="block py-4 hover:opacity-80" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600,  }}>{opp.opportunity_name}</h3>
                  {opp.description_5th_grade && (
                    <p className="line-clamp-2 mt-1" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{opp.description_5th_grade}</p>
                  )}
                  {userZip && opp.zip_code === userZip && (
                    <span style={{ fontSize: '0.65rem', color: "#1b5e8a", marginTop: '0.25rem', display: 'inline-block' }}>Near you</span>
                  )}
                </Link>
              )
            })}
            {all.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {all.length - 4} more opportunities
                </summary>
                {all.slice(4).map(function (opp) {
                  return (
                    <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="block py-4 hover:opacity-80" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600,  }}>{opp.opportunity_name}</h3>
                      {opp.description_5th_grade && (
                        <p className="line-clamp-2 mt-1" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{opp.description_5th_grade}</p>
                      )}
                      {userZip && opp.zip_code === userZip && (
                        <span style={{ fontSize: '0.65rem', color: "#1b5e8a", marginTop: '0.25rem', display: 'inline-block' }}>Near you</span>
                      )}
                    </Link>
                  )
                })}
              </details>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
