import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { User } from 'lucide-react'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden border-b">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-12 relative">
          <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: '0.12em' }} className="uppercase mb-3">
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl mb-3">
            Candidates
          </h1>
          <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 17 }} className="max-w-[600px] leading-relaxed">
            Get to know the candidates running for office in Houston and Harris County.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: '0.06em' }} className="uppercase">
          <Link href="/elections" className="hover:underline" style={{ color: CLAY }}>Elections</Link>
          <span className="mx-2">/</span>
          <span>Candidates</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, color: INK, fontSize: 24 }}>Active Candidates</h2>
        </div>
        <div style={{ height: 1, background: RULE_COLOR }} className="mb-1" />
        <p style={{ fontFamily: MONO, color: MUTED, fontSize: 11 }} className="mb-6">
          {allCandidates.length} candidate{allCandidates.length !== 1 ? 's' : ''}
        </p>

        <div className="space-y-4">
          {allCandidates.slice(0, initialCount).map(function (c) {
            return (
              <Link key={c.candidate_id} href={`/candidates/${c.candidate_id}`} className="block border p-5 transition-colors hover:border-current" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                <div className="flex items-start gap-4">
                  {c.photo_url ? (
                    <Image src={c.photo_url} alt="" className="w-14 h-14 object-cover flex-shrink-0" width={56} height={56} />
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT }}><User className="w-6 h-6" style={{ color: MUTED }} /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 16 }}>{c.candidate_name}</h3>
                      {c.incumbent === 'true' && <span style={{ fontFamily: MONO, fontSize: 10, color: CLAY, letterSpacing: '0.06em' }} className="uppercase">Incumbent</span>}
                    </div>
                    <p style={{ fontFamily: MONO, color: MUTED, fontSize: 12 }}>{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
                    {c.bio_summary && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="mt-1 line-clamp-2">{c.bio_summary}</p>}
                    <div className="flex items-center gap-3 mt-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
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
            <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, cursor: 'pointer', fontSize: 15 }} className="mb-4">
              Show all {allCandidates.length} candidates...
            </summary>
            <div className="space-y-4">
              {allCandidates.slice(initialCount).map(function (c) {
                return (
                  <Link key={c.candidate_id} href={`/candidates/${c.candidate_id}`} className="block border p-5 transition-colors hover:border-current" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
                    <div className="flex items-start gap-4">
                      {c.photo_url ? (
                        <Image src={c.photo_url} alt="" className="w-14 h-14 object-cover flex-shrink-0" width={56} height={56} />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT }}><User className="w-6 h-6" style={{ color: MUTED }} /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 16 }}>{c.candidate_name}</h3>
                          {c.incumbent === 'true' && <span style={{ fontFamily: MONO, fontSize: 10, color: CLAY, letterSpacing: '0.06em' }} className="uppercase">Incumbent</span>}
                        </div>
                        <p style={{ fontFamily: MONO, color: MUTED, fontSize: 12 }}>{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
                        {c.bio_summary && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="mt-1 line-clamp-2">{c.bio_summary}</p>}
                        <div className="flex items-center gap-3 mt-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
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

        {/* Footer link */}
        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
        <div className="text-center pb-12">
          <Link href="/elections" style={{ fontFamily: MONO, color: CLAY, fontSize: 12, letterSpacing: '0.06em' }} className="uppercase hover:underline">
            Back to Elections
          </Link>
        </div>
      </div>
    </div>
  )
}
