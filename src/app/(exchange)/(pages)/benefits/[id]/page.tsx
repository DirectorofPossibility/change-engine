import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Heart, ExternalLink, FileText, DollarSign, Users, Clock, CheckCircle } from 'lucide-react'

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

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Benefits', href: '/benefits' }, { label: b.benefit_name }]} />
          <div className="flex items-center gap-2 mt-4 mb-2">
            <Heart className="w-5 h-5 text-theme-health" />
            {b.benefit_type && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{b.benefit_type}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{b.benefit_name}</h1>
          {b.description_5th_grade && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{b.description_5th_grade}</p>}
          {b.application_url && (
            <a href={b.application_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors">
              Apply Now <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Eligibility */}
          {b.eligibility_summary && (
            <div className="bg-white rounded-lg border border-brand-border p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-muted mb-3"><Users className="w-4 h-4" />Who Qualifies</h2>
              <p className="text-sm text-brand-text leading-relaxed">{b.eligibility_summary}</p>
              {b.income_limit_description && <p className="text-sm text-brand-muted mt-2">Income limit: {b.income_limit_description}</p>}
              {b.household_types && <p className="text-sm text-brand-muted mt-1">Household types: {b.household_types}</p>}
            </div>
          )}
          {/* Benefit details */}
          <div className="bg-white rounded-lg border border-brand-border p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-muted mb-3"><DollarSign className="w-4 h-4" />Benefit Details</h2>
            <div className="space-y-2 text-sm">
              {b.benefit_amount && <div><span className="text-brand-muted">Amount:</span> <span className="font-medium text-brand-text">{b.benefit_amount}</span></div>}
              {b.renewal_frequency && <div><span className="text-brand-muted">Renewal:</span> <span className="text-brand-text">{b.renewal_frequency}</span></div>}
              {b.application_method && <div><span className="text-brand-muted">How to apply:</span> <span className="text-brand-text">{b.application_method}</span></div>}
              {b.processing_days && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-muted">Processing:</span> <span className="text-brand-text">{b.processing_days} days</span></div>}
            </div>
          </div>
          {/* Documentation */}
          {b.documentation_needed && (
            <div className="bg-white rounded-lg border border-brand-border p-5 md:col-span-2">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-muted mb-3"><FileText className="w-4 h-4" />Documentation Needed</h2>
              <p className="text-sm text-brand-text leading-relaxed">{b.documentation_needed}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
