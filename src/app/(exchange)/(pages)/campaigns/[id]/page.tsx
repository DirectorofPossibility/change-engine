import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, TrendingUp } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
          <div className="flex items-center gap-3 mt-3">
            <span style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: CLAY }}>
              {c.status || 'Campaign'}
            </span>
            {c.campaign_type && (
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED }}>{c.campaign_type}</span>
            )}
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.5rem' }}>
            {c.campaign_name}
          </h1>
          {c.description_5th_grade && (
            <p style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {c.description_5th_grade}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4" style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
            {c.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}
              </span>
            )}
            {c.participant_count && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {c.participant_count} participants
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/campaigns" className="hover:underline" style={{ color: CLAY }}>Campaigns</Link>
          <span className="mx-2">/</span>
          <span>{c.campaign_name}</span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Goal */}
        {c.goal_description && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="flex items-center gap-2" style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>
                <TrendingUp className="w-5 h-5" style={{ color: MUTED }} /> Goal
              </h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.85 }}>{c.goal_description}</p>
            {progress !== null && (
              <div className="mt-4">
                <div className="flex justify-between mb-1" style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden" style={{ background: PARCHMENT }}>
                  <div className="h-full" style={{ width: progress + '%', background: CLAY }} />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Details */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Details</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
          <div className="space-y-2" style={{ fontFamily: SERIF, fontSize: '0.9rem' }}>
            {c.campaign_type && (
              <div><span style={{ color: MUTED }}>Type:</span> <span style={{ color: INK }}>{c.campaign_type}</span></div>
            )}
            {c.participant_count && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" style={{ color: MUTED }} />
                <span style={{ color: INK }}>{c.participant_count} participants</span>
              </div>
            )}
            {c.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: MUTED }} />
                <span style={{ color: INK }}>{c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}</span>
              </div>
            )}
            {org && (
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid ' + RULE_COLOR }}>
                <span style={{ color: MUTED }}>Led by </span>
                <Link href={`/organizations/${org.org_id}`} style={{ color: CLAY }} className="hover:underline">{org.org_name}</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/campaigns" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Campaigns
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Campaign',
            name: c.campaign_name,
            url: canonicalUrl,
          }),
        }}
      />
    </div>
  )
}
