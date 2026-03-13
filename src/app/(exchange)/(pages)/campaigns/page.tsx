import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Target, Users } from 'lucide-react'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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

  const allCampaigns = campaigns || []
  const initialCount = 4
  const hasMore = allCampaigns.length > initialCount

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Community Campaigns
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Organized community efforts making a difference across Houston. Join a campaign and amplify your impact.
          </p>
          {allCampaigns.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{allCampaigns.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Campaigns</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Campaigns</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-1">
          <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>All Campaigns</h2>
          <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{allCampaigns.length}</span>
        </div>
        <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1.5rem' }} />

        {renderCampaignList(allCampaigns.slice(0, initialCount))}

        {hasMore && (
          <details className="mt-4">
            <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, cursor: 'pointer', fontSize: '0.9rem' }} className="mb-4">
              Show all {allCampaigns.length} campaigns...
            </summary>
            {renderCampaignList(allCampaigns.slice(initialCount))}
          </details>
        )}
      </div>

      {/* Footer rule + link */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}

function renderCampaignList(campaigns: any[]) {
  return (
    <div className="space-y-4">
      {campaigns.map(function (c) {
        return (
          <Link key={c.campaign_id} href={`/campaigns/${c.campaign_id}`} className="block border p-5 transition-colors hover:border-current" style={{ borderColor: RULE_COLOR, background: PARCHMENT_WARM }}>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: CLAY }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 style={{ fontFamily: SERIF, color: INK, fontSize: 16 }}>{c.campaign_name}</h3>
                  {c.status && <span style={{ fontFamily: MONO, fontSize: 10, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.status}</span>}
                </div>
                {c.description_5th_grade && <p style={{ fontFamily: SERIF, color: MUTED, fontSize: 14 }} className="mt-1 line-clamp-2">{c.description_5th_grade}</p>}
                <div className="flex flex-wrap gap-3 mt-2" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
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
  )
}
