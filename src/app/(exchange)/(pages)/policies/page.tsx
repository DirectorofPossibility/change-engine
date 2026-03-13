import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getPoliciesByZip } from '@/lib/data/policies'
import { PoliciesPageClient } from './PoliciesPageClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'


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

  const federalPolicies = all.filter(function (p) { return p.level === 'Federal' }).length
  const statePolicies = all.filter(function (p) { return p.level === 'State' }).length
  const localPolicies = all.filter(function (p) { return p.level === 'County' || p.level === 'City' }).length

  return (
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Policies & Legislation"
        subtitle="Legislation shapes everyday life. Track bills, ordinances, and policy actions at every level of government -- from Houston City Council to the U.S. Congress."
        color="#4a2870"
        stats={[
          { value: all.length, label: 'Active Policies' },
          { value: federalPolicies, label: 'Federal' },
          { value: statePolicies, label: 'State' },
          { value: localPolicies, label: 'Local' },
        ]}
      />

      <Breadcrumb items={[{ label: 'Policies' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <PoliciesPageClient policies={all} translations={translations} initialLevel={urlLevel} />
        <PageCrossLinks preset="civic" />
      </div>
    </div>
  )
}
