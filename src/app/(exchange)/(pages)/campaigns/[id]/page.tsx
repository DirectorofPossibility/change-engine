import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { Target, Users, Calendar, TrendingUp } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('campaigns').select('campaign_name, description_5th_grade').eq('campaign_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.campaign_name, description: data.description_5th_grade || 'Campaign details.' }
}

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: c } = await supabase.from('campaigns').select('*').eq('campaign_id', id).single()
  if (!c) notFound()

  const userProfile = await getUserProfile()

  const [orgResult, wayfinderData] = await Promise.all([
    c.org_id
      ? supabase.from('organizations').select('org_id, org_name').eq('org_id', c.org_id).single()
      : Promise.resolve({ data: null }),
    getWayfinderContext('campaign', id, userProfile?.role),
  ])
  const org = orgResult.data

  const progress = c.target_value && c.current_value ? Math.min(100, Math.round((Number(c.current_value) / Number(c.target_value)) * 100)) : null
  const canonicalUrl = `https://www.changeengine.us/campaigns/${id}`

  // Build meta row with dates and participant count
  const metaRow = (
    <>
      {c.start_date && (
        <span className="flex items-center gap-1 text-sm text-brand-muted">
          <Calendar className="w-3.5 h-3.5" />
          {c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}
        </span>
      )}
      {c.participant_count && (
        <span className="flex items-center gap-1 text-sm text-brand-muted">
          <Users className="w-3.5 h-3.5" />
          {c.participant_count} participants
        </span>
      )}
    </>
  )

  // Build sidebar content
  const sidebarContent = (
    <div className="bg-white border border-brand-border p-5">
      <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Details</h2>
      <div className="space-y-2 text-sm">
        {c.campaign_type && <div><span className="text-brand-muted">Type:</span> <span className="text-brand-text">{c.campaign_type}</span></div>}
        {c.participant_count && <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-text">{c.participant_count} participants</span></div>}
        {c.start_date && <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-text">{c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}</span></div>}
        {org && <div className="pt-2 border-t border-brand-border mt-2"><span className="text-brand-muted">Led by </span><Link href={`/organizations/${org.org_id}`} className="text-brand-accent hover:underline">{org.org_name}</Link></div>}
      </div>
    </div>
  )

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Campaigns', href: '/campaigns' }, { label: c.campaign_name }]}
      eyebrow={{
        text: c.status || 'Campaign',
        bgColor: '#1a3460',
      }}
      eyebrowMeta={
        c.campaign_type ? (
          <span className="text-xs text-brand-muted">{c.campaign_type}</span>
        ) : undefined
      }
      title={c.campaign_name}
      subtitle={c.description_5th_grade || null}
      metaRow={metaRow}
      mastheadBorderTop="3px solid #1a3460"
      actions={{
        share: { title: c.campaign_name, url: canonicalUrl },
      }}
      themeColor="#1a3460"
      wayfinderData={wayfinderData}
      wayfinderType="campaign"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      sidebar={sidebarContent}
      feedbackType="campaign"
      feedbackId={id}
      feedbackName={c.campaign_name}
      jsonLd={{
        '@context': 'https://schema.org',
        '@type': 'Campaign',
        name: c.campaign_name,
        url: canonicalUrl,
      }}
    >
      {/* Main content — Goal card */}
      {c.goal_description && (
        <div className="bg-white border border-brand-border p-5 mb-6">
          <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">
            <TrendingUp className="w-4 h-4" />Goal
          </h2>
          <p className="text-sm text-brand-text leading-relaxed">{c.goal_description}</p>
          {progress !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-brand-muted mb-1"><span>Progress</span><span>{progress}%</span></div>
              <div className="h-2 bg-brand-bg rounded-full overflow-hidden"><div className="h-full bg-brand-accent rounded-full" style={{ width: progress + '%' }} /></div>
            </div>
          )}
        </div>
      )}
    </DetailPageLayout>
  )
}
