import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { PoliciesPageClient } from './PoliciesPageClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Policies & Legislation — Community Exchange',
  description: 'Track legislation and policies affecting Houston and Harris County communities.',
}

export default async function PoliciesPage() {
  const supabase = await createClient()

  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })

  const all = policies || []

  const langId = await getLangId()
  const policyIds = all.map(function (p) { return p.policy_id })
  const translations = langId ? await fetchTranslationsForTable('policies', policyIds, langId) : {}

  // Stats — government_level may not be in generated types yet
  const federalPolicies = all.filter(function (p) { return (p as any).government_level === 'Federal' }).length
  const statePolicies = all.filter(function (p) { return (p as any).government_level === 'State' }).length
  const localPolicies = all.filter(function (p) { return (p as any).government_level === 'County' || (p as any).government_level === 'City' }).length

  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/centers/accountability" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 hover:underline" style={{ color: '#805ad5' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#805ad5' }} />
          Accountability Center
        </Link>
      </div>
      <IndexPageHero
        color="#3182ce"
        pattern="vesica"
        titleKey="policies.title"
        subtitleKey="policies.subtitle"
        intro="Legislation shapes everyday life. Track bills, ordinances, and policy actions at every level of government — from Houston City Council to the U.S. Congress."
        stats={[
          { value: all.length, label: 'Active Policies' },
          { value: federalPolicies, label: 'Federal' },
          { value: statePolicies, label: 'State' },
          { value: localPolicies, label: 'Local' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Policies' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <PoliciesPageClient policies={all} translations={translations} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="policies"
                color="#3182ce"
                related={[
                  { label: 'Officials', href: '/officials', color: '#805ad5' },
                  { label: 'Elections', href: '/elections', color: '#38a169' },
                  { label: 'Call Your Senators', href: '/call-your-senators', color: '#e53e3e' },
                  { label: 'News', href: '/news', color: '#319795' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
