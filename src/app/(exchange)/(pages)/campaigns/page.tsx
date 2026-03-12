import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Target, Users } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Campaigns — Change Engine',
  description: 'Active campaigns and community initiatives in the Houston area.',
}

export default async function CampaignsPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('campaign_id, campaign_name, description_5th_grade, campaign_type, status, urgency_level, participant_count, goal_description')
    .order('campaign_name')

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="tripod" gradientColor="#1a3460" title="Community Campaigns" subtitle="Organized community efforts making a difference across Houston. Join a campaign and amplify your impact." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[{ label: 'Campaigns' }]} />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mt-4">
          <div>
            <div className="space-y-4">
              {(campaigns || []).map(function (c) {
                return (
                  <Link key={c.campaign_id} href={`/campaigns/${c.campaign_id}`} className="block bg-white border border-brand-border p-5 hover:border-ink transition-shadow">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-theme-bigger mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-brand-text">{c.campaign_name}</h3>
                          {c.status && <span className="text-xs bg-brand-bg text-brand-muted px-2 py-0.5 rounded">{c.status}</span>}
                        </div>
                        {c.description_5th_grade && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{c.description_5th_grade}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-brand-muted">
                          {c.campaign_type && <span>{c.campaign_type}</span>}
                          {c.participant_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.participant_count} participants</span>}
                          {c.urgency_level && <span className="font-medium">{c.urgency_level} priority</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <IndexWayfinder
                currentPage="campaigns"
                color="#1a6b56"
                related={[
                  { label: 'Officials', href: '/officials' },
                  { label: 'Policies', href: '/policies' },
                  { label: 'Elections', href: '/elections' },
                ]}
              />
              <FeaturedPromo variant="card" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
