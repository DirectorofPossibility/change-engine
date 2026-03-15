import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300


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
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          {b.benefit_type && (
            <span style={{ fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: "#1b5e8a", display: 'block', marginTop: '0.75rem' }}>{b.benefit_type}</span>
          )}
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem' }}>
            {b.benefit_name}
          </h1>
          {b.description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {b.description_5th_grade}
            </p>
          )}
          {b.application_url && (
            <a href={b.application_url} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-4 px-5 py-2 text-white transition-opacity hover:opacity-90"
              style={{ background: '#1b5e8a', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Apply Now
            </a>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/benefits" className="hover:underline" style={{ color: "#1b5e8a" }}>Benefits</Link>
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
              <h2 style={{ fontSize: '1.5rem',  }}>Who Qualifies</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{b.eligibility_summary}</p>
            {b.income_limit_description && <p style={{ fontSize: '0.9rem', color: "#5c6474", marginTop: '0.5rem' }}>Income limit: {b.income_limit_description}</p>}
            {b.household_types && <p style={{ fontSize: '0.9rem', color: "#5c6474", marginTop: '0.25rem' }}>Household types: {b.household_types}</p>}
          </section>
        )}

        {/* Benefit Details */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>Benefit Details</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="space-y-3">
            {b.benefit_amount && (
              <div style={{ fontSize: '0.9rem' }}><span style={{ color: "#5c6474" }}>Amount: </span><span style={{ fontWeight: 500 }}>{b.benefit_amount}</span></div>
            )}
            {b.renewal_frequency && (
              <div style={{ fontSize: '0.9rem' }}><span style={{ color: "#5c6474" }}>Renewal: </span><span style={{  }}>{b.renewal_frequency}</span></div>
            )}
            {b.application_method && (
              <div style={{ fontSize: '0.9rem' }}><span style={{ color: "#5c6474" }}>How to apply: </span><span style={{  }}>{b.application_method}</span></div>
            )}
            {b.processing_days && (
              <div style={{ fontSize: '0.9rem' }}><span style={{ color: "#5c6474" }}>Processing: </span><span style={{  }}>{b.processing_days} days</span></div>
            )}
          </div>
        </section>

        {/* Documentation */}
        {b.documentation_needed && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Documentation Needed</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{b.documentation_needed}</p>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/benefits" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Benefits
        </Link>
      </div>
    </div>
  )
}
