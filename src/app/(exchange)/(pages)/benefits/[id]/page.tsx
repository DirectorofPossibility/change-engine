import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

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
  const { data } = await supabase.from('benefit_programs').select('benefit_name, description_5th_grade').eq('benefit_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.benefit_name, description: data.description_5th_grade || 'Benefit program details.' }
}

export default async function BenefitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: b } = await supabase.from('benefit_programs').select('*').eq('benefit_id', id).single()
  if (!b) notFound()

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('benefit', id, userProfile?.role)

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
          {b.benefit_type && (
            <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: CLAY, display: 'block', marginTop: '0.75rem' }}>{b.benefit_type}</span>
          )}
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {b.benefit_name}
          </h1>
          {b.description_5th_grade && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {b.description_5th_grade}
            </p>
          )}
          {b.application_url && (
            <a href={b.application_url} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-4 px-5 py-2 text-white transition-opacity hover:opacity-90"
              style={{ background: CLAY, fontFamily: MONO, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Apply Now
            </a>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/benefits" className="hover:underline" style={{ color: CLAY }}>Benefits</Link>
          <span className="mx-2">/</span>
          <span>{b.benefit_name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Eligibility */}
        {b.eligibility_summary && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Who Qualifies</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{b.eligibility_summary}</p>
            {b.income_limit_description && <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, marginTop: '0.5rem' }}>Income limit: {b.income_limit_description}</p>}
            {b.household_types && <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, marginTop: '0.25rem' }}>Household types: {b.household_types}</p>}
          </section>
        )}

        {/* Benefit Details */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Benefit Details</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
          <div className="space-y-3">
            {b.benefit_amount && (
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}><span style={{ color: MUTED }}>Amount: </span><span style={{ color: INK, fontWeight: 500 }}>{b.benefit_amount}</span></div>
            )}
            {b.renewal_frequency && (
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}><span style={{ color: MUTED }}>Renewal: </span><span style={{ color: INK }}>{b.renewal_frequency}</span></div>
            )}
            {b.application_method && (
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}><span style={{ color: MUTED }}>How to apply: </span><span style={{ color: INK }}>{b.application_method}</span></div>
            )}
            {b.processing_days && (
              <div style={{ fontFamily: SERIF, fontSize: '0.9rem' }}><span style={{ color: MUTED }}>Processing: </span><span style={{ color: INK }}>{b.processing_days} days</span></div>
            )}
          </div>
        </section>

        {/* Documentation */}
        {b.documentation_needed && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Documentation Needed</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{b.documentation_needed}</p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/benefits" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Benefits
        </Link>
      </div>
    </div>
  )
}
