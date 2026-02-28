import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PolicyCard } from '@/components/exchange/PolicyCard'

export default async function PoliciesPage() {
  const supabase = await createClient()

  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .order('last_action_date', { ascending: false })

  var all = policies || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Policies &amp; Legislation</h1>
      <p className="text-brand-muted mb-8">Track bills, executive orders, and policies that affect Houston communities.</p>

      {all.length === 0 && (
        <p className="text-brand-muted">No policies found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {all.map(function (p) {
          return (
            <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
              <PolicyCard
                name={p.policy_name}
                summary={p.summary_5th_grade}
                billNumber={p.bill_number}
                status={p.status}
                level={p.level}
                sourceUrl={null}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
