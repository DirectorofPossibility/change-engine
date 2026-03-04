import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PoliciesPageClient } from './PoliciesPageClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Policies',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Policy' }]} />
      <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">Policies &amp; Legislation</h1>
      <p className="text-brand-muted mb-8">Track bills, executive orders, and policies that affect Houston communities at every level of government.</p>

      <PoliciesPageClient policies={all} translations={translations} />
    </div>
  )
}
