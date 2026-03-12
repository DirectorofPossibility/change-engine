import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { PoliciesPageClient } from './PoliciesPageClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Policies & Legislation — Change Engine',
  description: 'Track legislation and policies affecting Houston and Harris County communities.',
}

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level: urlLevel } = await searchParams
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''
  const supabase = await createClient()

  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })

  const rawPolicies = policies || []

  // When user has a ZIP, prioritize local policies (city > county > state > federal)
  const govLevelPriority: Record<string, number> = { City: 0, County: 1, State: 2, Federal: 3 }
  const all = userZip
    ? [...rawPolicies].sort(function (a: any, b: any) {
        const aPri = govLevelPriority[a.government_level] ?? 4
        const bPri = govLevelPriority[b.government_level] ?? 4
        if (aPri !== bPri) return aPri - bPri
        // Within same level, preserve original order (last_action_date desc)
        return 0
      })
    : rawPolicies

  const langId = await getLangId()
  const policyIds = all.map(function (p) { return p.policy_id })
  const translations = langId ? await fetchTranslationsForTable('policies', policyIds, langId) : {}

  // Stats — government_level may not be in generated types yet
  const federalPolicies = all.filter(function (p) { return (p as any).government_level === 'Federal' }).length
  const statePolicies = all.filter(function (p) { return (p as any).government_level === 'State' }).length
  const localPolicies = all.filter(function (p) { return (p as any).government_level === 'County' || (p as any).government_level === 'City' }).length

  return (
    <div>
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Link href="/centers/accountability" className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider mb-2 hover:underline" style={{ color: '#4a2870' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4a2870' }} />
          Accountability Center
        </Link>
      </div>
      <IndexPageHero
        color="#1b5e8a"
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

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Policies' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <PoliciesPageClient policies={all} translations={translations} initialLevel={urlLevel} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="policies"
                color="#1b5e8a"
                related={[
                  { label: 'Governance Overview', href: '/governance', color: '#4a2870' },
                  { label: 'Officials', href: '/officials', color: '#4a2870' },
                  { label: 'Elections', href: '/elections', color: '#1a6b56' },
                  { label: 'News', href: '/news', color: '#1a5030' },
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
