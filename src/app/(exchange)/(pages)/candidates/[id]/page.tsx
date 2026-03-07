import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { User, Globe, Mail, Phone, ExternalLink } from 'lucide-react'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('candidates').select('candidate_name, office_sought').eq('candidate_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: `${data.candidate_name} — ${data.office_sought}`, description: `Candidate for ${data.office_sought}.` }
}

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: c } = await supabase.from('candidates').select('*').eq('candidate_id', id).single()
  if (!c) notFound()

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Candidates', href: '/candidates' }, { label: c.candidate_name }]} />
          <div className="flex items-start gap-6 mt-4">
            {c.photo_url ? (
              <img src={c.photo_url} alt="" className="w-24 h-24 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-border flex items-center justify-center flex-shrink-0"><User className="w-10 h-10 text-brand-muted" /></div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{c.candidate_name}</h1>
              <p className="text-brand-muted mt-1">{c.office_sought}{c.district ? ` - ${c.district}` : ''}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-brand-muted">
                {c.party && <span>{c.party}</span>}
                {c.incumbent === 'true' && <span className="text-brand-accent font-medium">Incumbent</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {c.bio_summary && (
            <div className="bg-white rounded-lg border border-brand-border p-5 md:col-span-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">About</h2>
              <p className="text-sm text-brand-text leading-relaxed">{c.bio_summary}</p>
            </div>
          )}
          <div className="bg-white rounded-lg border border-brand-border p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Campaign</h2>
            <div className="space-y-2 text-sm">
              {c.campaign_website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={c.campaign_website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Campaign website</a></div>}
              {c.campaign_email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-muted" /><a href={`mailto:${c.campaign_email}`} className="text-brand-accent hover:underline">{c.campaign_email}</a></div>}
              {c.campaign_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><span className="text-brand-text">{c.campaign_phone}</span></div>}
              {c.fundraising_total && <div><span className="text-brand-muted">Fundraising:</span> <span className="font-medium text-brand-text">{c.fundraising_total}</span></div>}
            </div>
          </div>
          {(c.policy_positions || c.endorsements) && (
            <div className="bg-white rounded-lg border border-brand-border p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Positions & Endorsements</h2>
              {c.policy_positions && <p className="text-sm text-brand-text leading-relaxed">{c.policy_positions}</p>}
              {c.endorsements && <p className="text-sm text-brand-muted mt-2">{c.endorsements}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
