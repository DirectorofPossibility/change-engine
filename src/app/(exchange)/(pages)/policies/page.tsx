import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

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
    .order('last_action_date', { ascending: false })

  const all = policies || []

  // Fetch translations for non-English
  const langId = await getLangId()
  const policyIds = all.map(function (p) { return p.policy_id })
  const translations = langId ? await fetchTranslationsForTable('policies', policyIds, langId) : {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'Policy' }]} />
      <h1 className="text-3xl font-bold text-brand-text mb-2">Policies &amp; Legislation</h1>
      <p className="text-brand-muted mb-8">Track bills, executive orders, and policies that affect Houston communities.</p>

      {all.length === 0 && (
        <p className="text-brand-muted">No policies found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {all.map(function (p) {
          const t = translations[p.policy_id]
          return (
            <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
              <PolicyCard
                name={p.title_6th_grade || p.policy_name}
                summary={p.summary_6th_grade || p.summary_5th_grade}
                billNumber={p.bill_number}
                status={p.status}
                level={p.level}
                sourceUrl={p.source_url}
                translatedName={t?.title}
                translatedSummary={t?.summary}
                impactPreview={p.impact_statement}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
