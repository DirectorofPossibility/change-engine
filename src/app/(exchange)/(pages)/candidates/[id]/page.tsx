import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { User, Globe, Mail, Phone } from 'lucide-react'
import Image from 'next/image'

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
  const [{ data: c }, userProfile] = await Promise.all([
    supabase.from('candidates').select('*').eq('candidate_id', id).single(),
    getUserProfile(),
  ])
  if (!c) notFound()
  const wayfinderData = await getWayfinderContext('candidate' as any, id, userProfile?.role)

  const canonicalUrl = `https://www.changeengine.us/candidates/${id}`

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Candidates', href: '/candidates' }, { label: c.candidate_name }]}
      eyebrow={{
        text: c.party || 'Candidate',
        bgColor: '#0d1117',
      }}
      eyebrowMeta={
        c.incumbent === 'true' ? (
          <span className="text-xs font-medium text-brand-accent">Incumbent</span>
        ) : undefined
      }
      title={c.candidate_name}
      subtitle={`${c.office_sought}${c.district ? ` - ${c.district}` : ''}`}
      heroImage={
        c.photo_url ? (
          <Image src={c.photo_url} alt="" className="w-24 h-24 object-cover" width={96} height={96} />
        ) : (
          <div className="w-24 h-24 bg-brand-border flex items-center justify-center">
            <User className="w-10 h-10 text-brand-muted" />
          </div>
        )
      }
      actions={{
        share: { title: `${c.candidate_name} — ${c.office_sought}`, url: canonicalUrl },
      }}
      themeColor="#1b5e8a"
      wayfinderData={wayfinderData}
      wayfinderType={'candidate' as any}
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      feedbackType="candidate"
      feedbackId={id}
      feedbackName={c.candidate_name}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: c.candidate_name,
        url: canonicalUrl,
      }}
    >
      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {c.bio_summary && (
          <div className="bg-white border border-brand-border p-5 md:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">About</h2>
            <p className="text-sm text-brand-text leading-relaxed">{c.bio_summary}</p>
          </div>
        )}
        <div className="bg-white border border-brand-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Campaign</h2>
          <div className="space-y-2 text-sm">
            {c.campaign_website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={c.campaign_website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">Campaign website</a></div>}
            {c.campaign_email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-muted" /><a href={`mailto:${c.campaign_email}`} className="text-brand-accent hover:underline">{c.campaign_email}</a></div>}
            {c.campaign_phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><span className="text-brand-text">{c.campaign_phone}</span></div>}
            {c.fundraising_total && <div><span className="text-brand-muted">Fundraising:</span> <span className="font-medium text-brand-text">{c.fundraising_total}</span></div>}
          </div>
        </div>
        {(c.policy_positions || c.endorsements) && (
          <div className="bg-white border border-brand-border p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Positions & Endorsements</h2>
            {c.policy_positions && <p className="text-sm text-brand-text leading-relaxed">{c.policy_positions}</p>}
            {c.endorsements && <p className="text-sm text-brand-muted mt-2">{c.endorsements}</p>}
          </div>
        )}
      </div>
    </DetailPageLayout>
  )
}
