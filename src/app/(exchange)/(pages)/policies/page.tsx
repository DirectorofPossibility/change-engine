import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getPoliciesByZip } from '@/lib/data/policies'
import { PoliciesPageClient } from './PoliciesPageClient'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Policies & Legislation — Change Engine',
  description: 'Track legislation and policies affecting Houston and Harris County communities.',
}

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level: urlLevel } = await searchParams
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''
  const supabase = await createClient()

  // Fetch all policies + ZIP-filtered policies in parallel
  const [{ data: allPolicies }, zipPolicies] = await Promise.all([
    supabase
      .from('policies')
      .select('*')
      .eq('is_published', true)
      .order('last_action_date', { ascending: false }),
    userZip ? getPoliciesByZip(userZip) : Promise.resolve(null),
  ])

  const rawPolicies = allPolicies || []

  // If ZIP available, put user's geo-matched policies first, then the rest
  let all: any[]
  if (zipPolicies) {
    const zipMatched = [...zipPolicies.federal, ...zipPolicies.state, ...zipPolicies.city]
    const zipMatchedIds = new Set(zipMatched.map((p: any) => p.policy_id))
    const rest = rawPolicies.filter((p: any) => !zipMatchedIds.has(p.policy_id))
    all = [...zipMatched, ...rest]
  } else {
    all = rawPolicies
  }

  const langId = await getLangId()
  const policyIds = all.map(function (p) { return p.policy_id })
  const translations = langId ? await fetchTranslationsForTable('policies', policyIds, langId) : {}

  const federalPolicies = all.filter(function (p) { return (p as any).government_level === 'Federal' }).length
  const statePolicies = all.filter(function (p) { return (p as any).government_level === 'State' }).length
  const localPolicies = all.filter(function (p) { return (p as any).government_level === 'County' || (p as any).government_level === 'City' }).length

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
            Policies & Legislation
          </h1>
          <p style={{ fontSize: '1.1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Legislation shapes everyday life. Track bills, ordinances, and policy actions at every level of government -- from Houston City Council to the U.S. Congress.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <span style={{ fontSize: '2rem',  }}>{all.length}</span>
              <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Active Policies</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem',  }}>{federalPolicies}</span>
              <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Federal</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem',  }}>{statePolicies}</span>
              <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>State</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem',  }}>{localPolicies}</span>
              <span style={{ fontSize: '0.65rem', color: "#5c6474", textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Local</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Policies</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <PoliciesPageClient policies={all} translations={translations} initialLevel={urlLevel} />
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
