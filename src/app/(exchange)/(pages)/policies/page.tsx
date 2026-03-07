import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { PoliciesPageClient } from './PoliciesPageClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Policies & Legislation',
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

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="vesica"
        gradientColor="#3182ce"
        titleKey="policies.title"
        subtitleKey="policies.subtitle"
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Policies' }]} />
        <PoliciesPageClient policies={all} translations={translations} />
      </div>
    </div>
  )
}
