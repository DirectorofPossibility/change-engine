import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { Heart, ExternalLink, FileText, DollarSign, Users, Clock } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('benefit_programs').select('benefit_name, description_5th_grade').eq('benefit_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.benefit_name, description: data.description_5th_grade || 'Benefit program details.' }
}

export default async function BenefitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: b } = await supabase.from('benefit_programs').select('*').eq('benefit_id', id).single()
  if (!b) notFound()

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('benefit', id, userProfile?.role)

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Benefits', href: '/benefits' }, { label: b.benefit_name }]}
      eyebrow={b.benefit_type ? { text: b.benefit_type } : undefined}
      eyebrowMeta={
        <Heart className="w-5 h-5" style={{ color: '#1a6b56' }} />
      }
      title={b.benefit_name}
      subtitle={b.description_5th_grade}
      themeColor="#1a6b56"
      wayfinderData={wayfinderData}
      wayfinderType="benefit"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      feedbackType="benefit"
      feedbackId={id}
      feedbackName={b.benefit_name}
      actions={{
        share: { title: b.benefit_name, url: `https://www.changeengine.us/benefits/${id}` },
      }}
      metaRow={
        b.application_url ? (
          <a href={b.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors">
            Apply Now <ExternalLink className="w-4 h-4" />
          </a>
        ) : undefined
      }
      sidebar={
        <>
          {/* No additional sidebar content beyond wayfinder + feedback */}
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Eligibility */}
        {b.eligibility_summary && (
          <div className="bg-white border border-brand-border p-5">
            <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3"><Users className="w-4 h-4" />Who Qualifies</h2>
            <p className="text-sm text-brand-text leading-relaxed">{b.eligibility_summary}</p>
            {b.income_limit_description && <p className="text-sm text-brand-muted mt-2">Income limit: {b.income_limit_description}</p>}
            {b.household_types && <p className="text-sm text-brand-muted mt-1">Household types: {b.household_types}</p>}
          </div>
        )}
        {/* Benefit details */}
        <div className="bg-white border border-brand-border p-5">
          <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3"><DollarSign className="w-4 h-4" />Benefit Details</h2>
          <div className="space-y-2 text-sm">
            {b.benefit_amount && <div><span className="text-brand-muted">Amount:</span> <span className="font-medium text-brand-text">{b.benefit_amount}</span></div>}
            {b.renewal_frequency && <div><span className="text-brand-muted">Renewal:</span> <span className="text-brand-text">{b.renewal_frequency}</span></div>}
            {b.application_method && <div><span className="text-brand-muted">How to apply:</span> <span className="text-brand-text">{b.application_method}</span></div>}
            {b.processing_days && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-muted">Processing:</span> <span className="text-brand-text">{b.processing_days} days</span></div>}
          </div>
        </div>
        {/* Documentation */}
        {b.documentation_needed && (
          <div className="bg-white border border-brand-border p-5 md:col-span-2">
            <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3"><FileText className="w-4 h-4" />Documentation Needed</h2>
            <p className="text-sm text-brand-text leading-relaxed">{b.documentation_needed}</p>
          </div>
        )}
      </div>
    </DetailPageLayout>
  )
}
