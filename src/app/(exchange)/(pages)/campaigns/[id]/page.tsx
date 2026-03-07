import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Target, Users, Calendar, TrendingUp } from 'lucide-react'

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

  let org: { org_id: string; org_name: string } | null = null
  if (c.org_id) {
    const { data } = await supabase.from('organizations').select('org_id, org_name').eq('org_id', c.org_id).single()
    org = data
  }

  const progress = c.target_value && c.current_value ? Math.min(100, Math.round((Number(c.current_value) / Number(c.target_value)) * 100)) : null

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Campaigns', href: '/campaigns' }, { label: c.campaign_name }]} />
          <div className="flex items-center gap-2 mt-4 mb-2">
            <Target className="w-5 h-5 text-theme-bigger" />
            {c.status && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{c.status}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{c.campaign_name}</h1>
          {c.description_5th_grade && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{c.description_5th_grade}</p>}
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {c.goal_description && (
            <div className="bg-white rounded-lg border border-brand-border p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-muted mb-3"><TrendingUp className="w-4 h-4" />Goal</h2>
              <p className="text-sm text-brand-text leading-relaxed">{c.goal_description}</p>
              {progress !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-brand-muted mb-1"><span>Progress</span><span>{progress}%</span></div>
                  <div className="h-2 bg-brand-bg rounded-full overflow-hidden"><div className="h-full bg-brand-accent rounded-full" style={{ width: progress + '%' }} /></div>
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-lg border border-brand-border p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Details</h2>
            <div className="space-y-2 text-sm">
              {c.campaign_type && <div><span className="text-brand-muted">Type:</span> <span className="text-brand-text">{c.campaign_type}</span></div>}
              {c.participant_count && <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-text">{c.participant_count} participants</span></div>}
              {c.start_date && <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-muted" /><span className="text-brand-text">{c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}</span></div>}
              {org && <div className="pt-2 border-t border-brand-border mt-2"><span className="text-brand-muted">Led by </span><Link href={`/organizations/${org.org_id}`} className="text-brand-accent hover:underline">{org.org_name}</Link></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
