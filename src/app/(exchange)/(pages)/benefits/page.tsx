import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Benefit Programs — Change Engine',
  description: 'Government benefit programs available to Houston-area residents.',
}


const VISIBLE_COUNT = 4

export default async function BenefitsPage() {
  const supabase = await createClient()
  const { data: benefits } = await supabase
    .from('benefit_programs')
    .select('benefit_id, benefit_name, description_5th_grade, benefit_type, eligibility_summary, benefit_amount, application_url')
    .order('benefit_name')

  const allBenefits = benefits || []
  const visible = allBenefits.slice(0, VISIBLE_COUNT)
  const rest = allBenefits.slice(VISIBLE_COUNT)

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
          <h1 style={{ fontSize: '2.5rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            Benefit Programs
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Government programs offering food, healthcare, income support, and other resources to Houston-area residents.
          </p>
          {allBenefits.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontSize: '2rem',  }}>{allBenefits.length}</span>
                <span style={{ fontSize: '0.875rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Programs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Benefits</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontSize: '1.5rem',  }}>All Programs</h2>
          <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{allBenefits.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1.5rem' }} />

        <div className="space-y-4">
          {visible.map(function (b) {
            return (
              <Link key={b.benefit_id} href={`/benefits/${b.benefit_id}`}
                className="block p-5 border hover:border-current transition-colors"
                style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
                <h3 style={{ fontSize: '1rem' }}>{b.benefit_name}</h3>
                {b.description_5th_grade && <p style={{ color: "#5c6474", fontSize: '0.875rem' }} className="mt-1 line-clamp-2">{b.description_5th_grade}</p>}
                <div className="flex flex-wrap gap-3 mt-2" style={{  }}>
                  {b.benefit_type && <span style={{ color: "#5c6474", fontSize: '0.875rem' }}>{b.benefit_type}</span>}
                  {b.benefit_amount && <span style={{ color: "#1b5e8a", fontSize: '0.875rem' }}>{b.benefit_amount}</span>}
                  {b.application_url && <span style={{ color: "#1b5e8a", fontSize: '0.875rem' }}>Get started</span>}
                </div>
              </Link>
            )
          })}
        </div>

        {rest.length > 0 && (
          <details className="mt-4">
            <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
              See {rest.length} more program{rest.length > 1 ? 's' : ''}
            </summary>
            <div className="space-y-4 mt-4">
              {rest.map(function (b) {
                return (
                  <Link key={b.benefit_id} href={`/benefits/${b.benefit_id}`}
                    className="block p-5 border hover:border-current transition-colors"
                    style={{ borderColor: '#dde1e8', background: "#f4f5f7" }}>
                    <h3 style={{ fontSize: '1rem' }}>{b.benefit_name}</h3>
                    {b.description_5th_grade && <p style={{ color: "#5c6474", fontSize: '0.875rem' }} className="mt-1 line-clamp-2">{b.description_5th_grade}</p>}
                    <div className="flex flex-wrap gap-3 mt-2" style={{  }}>
                      {b.benefit_type && <span style={{ color: "#5c6474", fontSize: '0.875rem' }}>{b.benefit_type}</span>}
                      {b.benefit_amount && <span style={{ color: "#1b5e8a", fontSize: '0.875rem' }}>{b.benefit_amount}</span>}
                      {b.application_url && <span style={{ color: "#1b5e8a", fontSize: '0.875rem' }}>Get started</span>}
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
        <Link href="/" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
