import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { User, Globe, Mail, Phone } from 'lucide-react'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('candidates').select('candidate_name, office_sought').eq('candidate_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: `${data.candidate_name} — ${data.office_sought}`, description: `Candidate for ${data.office_sought}.` }
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: c }, userProfile] = await Promise.all([
    supabase.from('candidates').select('*').eq('candidate_id', id).single(),
    getUserProfile(),
  ])
  if (!c) notFound()

  const canonicalUrl = `https://www.changeengine.us/candidates/${id}`

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex items-start gap-6 mt-4">
            {c.photo_url ? (
              <Image src={c.photo_url} alt="" className="object-cover flex-shrink-0" style={{ border: '1px solid ' + RULE_COLOR }} width={96} height={96} />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center flex-shrink-0" style={{ background: PARCHMENT, border: '1px solid ' + RULE_COLOR }}>
                <User className="w-10 h-10" style={{ color: MUTED }} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}>
                  {c.party || 'Candidate'}
                </span>
                {c.incumbent === 'true' && (
                  <span style={{ fontFamily: MONO, fontSize: '0.6875rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: CLAY }}>Incumbent</span>
                )}
              </div>
              <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15 }}>
                {c.candidate_name}
              </h1>
              <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.5rem' }}>
                {c.office_sought}{c.district ? ` - ${c.district}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/candidates" className="hover:underline" style={{ color: CLAY }}>Candidates</Link>
          <span className="mx-2">/</span>
          <span>{c.candidate_name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* About */}
        {c.bio_summary && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>About</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{c.bio_summary}</p>
          </section>
        )}

        {/* Campaign */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Campaign</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
          <div className="space-y-3">
            {c.campaign_website && (
              <a href={c.campaign_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: CLAY }}>
                <Globe size={15} /> Campaign website
              </a>
            )}
            {c.campaign_email && (
              <a href={`mailto:${c.campaign_email}`} className="flex items-center gap-2 hover:underline" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: CLAY }}>
                <Mail size={15} /> {c.campaign_email}
              </a>
            )}
            {c.campaign_phone && (
              <div className="flex items-center gap-2" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED }}>
                <Phone size={15} /> {c.campaign_phone}
              </div>
            )}
            {c.fundraising_total && (
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
                <span style={{ color: MUTED }}>Fundraising:</span>{' '}
                <span style={{ color: INK, fontWeight: 500 }}>{c.fundraising_total}</span>
              </div>
            )}
          </div>
        </section>

        {/* Positions & Endorsements */}
        {(c.policy_positions || c.endorsements) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Positions & Endorsements</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            {c.policy_positions && <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{c.policy_positions}</p>}
            {c.endorsements && <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: MUTED, lineHeight: 1.85, marginTop: '0.75rem' }}>{c.endorsements}</p>}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/candidates" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Candidates
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: c.candidate_name,
            url: canonicalUrl,
          }),
        }}
      />
    </div>
  )
}
