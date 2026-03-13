import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { User } from 'lucide-react'

export const revalidate = 300


export const metadata: Metadata = {
  title: 'Candidates — Change Engine',
  description: 'Candidates running for office in the Houston area.',
}

export default async function CandidatesPage() {
  const supabase = await createClient()
  const { data: candidates } = await supabase
    .from('candidates')
    .select('candidate_id, candidate_name, office_sought, office_level, district, party, incumbent, photo_url, bio_summary, campaign_website')
    .eq('is_active', 'true')
    .order('office_level, office_sought, candidate_name')

  const allCandidates = candidates || []
  const initialCount = 4
  const hasMore = allCandidates.length > initialCount

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
            Candidates
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Get to know the candidates running for office in Houston and Harris County.
          </p>
          {allCandidates.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontSize: '2rem',  }}>{allCandidates.length}</span>
                <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Candidates</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/elections" className="hover:underline" style={{ color: "#1b5e8a" }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>Candidates</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>Active Candidates</h2>
          <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{allCandidates.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        <div className="space-y-4">
          {allCandidates.slice(0, initialCount).map(function (c) {
            return (
              <Link key={c.candidate_id} href={`/candidates/${c.candidate_id}`} className="block border p-5 transition-colors hover:border-current" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
                <div className="flex items-start gap-4">
                  {c.photo_url ? (
                    <Image src={c.photo_url} alt="" className="w-14 h-14 object-cover flex-shrink-0" width={56} height={56} />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-paper"><User className="w-6 h-6" style={{ color: "#5c6474" }} /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontSize: 16 }}>{c.candidate_name}</h3>
                      {c.incumbent === 'true' && <span style={{ fontSize: 10, color: "#1b5e8a", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Incumbent</span>}
                    </div>
                    <p style={{ color: "#5c6474", fontSize: 12 }}>{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
                    {c.bio_summary && <p style={{ color: "#5c6474", fontSize: 14 }} className="mt-1 line-clamp-2">{c.bio_summary}</p>}
                    <div className="flex items-center gap-3 mt-2" style={{ fontSize: 11, color: "#5c6474" }}>
                      {c.party && <span>{c.party}</span>}
                      {c.office_level && <span>{c.office_level}</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {hasMore && (
          <details className="mt-4">
            <summary style={{ fontStyle: 'italic', color: "#1b5e8a", cursor: 'pointer', fontSize: '0.9rem' }} className="mb-4">
              Show all {allCandidates.length} candidates...
            </summary>
            <div className="space-y-4">
              {allCandidates.slice(initialCount).map(function (c) {
                return (
                  <Link key={c.candidate_id} href={`/candidates/${c.candidate_id}`} className="block border p-5 transition-colors hover:border-current" style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
                    <div className="flex items-start gap-4">
                      {c.photo_url ? (
                        <Image src={c.photo_url} alt="" className="w-14 h-14 object-cover flex-shrink-0" width={56} height={56} />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 bg-paper"><User className="w-6 h-6" style={{ color: "#5c6474" }} /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 style={{ fontSize: 16 }}>{c.candidate_name}</h3>
                          {c.incumbent === 'true' && <span style={{ fontSize: 10, color: "#1b5e8a", letterSpacing: '0.06em', textTransform: 'uppercase' }}>Incumbent</span>}
                        </div>
                        <p style={{ color: "#5c6474", fontSize: 12 }}>{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
                        {c.bio_summary && <p style={{ color: "#5c6474", fontSize: 14 }} className="mt-1 line-clamp-2">{c.bio_summary}</p>}
                        <div className="flex items-center gap-3 mt-2" style={{ fontSize: 11, color: "#5c6474" }}>
                          {c.party && <span>{c.party}</span>}
                          {c.office_level && <span>{c.office_level}</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </details>
        )}
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/elections" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Elections
        </Link>
      </div>
    </div>
  )
}
