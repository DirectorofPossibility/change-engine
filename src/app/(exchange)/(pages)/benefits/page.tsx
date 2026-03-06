import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Heart, ExternalLink } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Benefit Programs — Community Exchange',
  description: 'Government benefit programs available to Houston-area residents.',
}

export default async function BenefitsPage() {
  const supabase = await createClient()
  const { data: benefits } = await supabase
    .from('benefit_programs')
    .select('benefit_id, benefit_name, description_5th_grade, benefit_type, eligibility_summary, benefit_amount, application_url')
    .order('benefit_name')

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="flower" gradientColor="#38a169" title="Benefit Programs" subtitle="Government programs that provide financial assistance, food, healthcare, and other support to eligible Houston-area residents." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Benefits' }]} />
        <div className="space-y-4 mt-4">
          {(benefits || []).map(function (b) {
            return (
              <Link key={b.benefit_id} href={`/benefits/${b.benefit_id}`} className="block bg-white rounded-lg border border-brand-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-theme-health mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-brand-text">{b.benefit_name}</h3>
                    {b.description_5th_grade && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{b.description_5th_grade}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-brand-muted">
                      {b.benefit_type && <span className="bg-brand-bg px-2 py-0.5 rounded">{b.benefit_type}</span>}
                      {b.benefit_amount && <span className="font-medium text-theme-money">{b.benefit_amount}</span>}
                      {b.application_url && <span className="flex items-center gap-1 text-brand-accent"><ExternalLink className="w-3 h-3" />Apply online</span>}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
