import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, TrendingUp } from 'lucide-react'
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

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: "#1b5e8a" }}>
              {c.status || 'Campaign'}
            </span>
            {c.campaign_type && (
              <span style={{ fontSize: '0.65rem', color: "#5c6474" }}>{c.campaign_type}</span>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem' }}>
            {c.campaign_name}
          </h1>
          {c.description_5th_grade && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {c.description_5th_grade}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4" style={{ fontSize: '0.7rem', color: "#5c6474" }}>
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
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/campaigns" className="hover:underline" style={{ color: "#1b5e8a" }}>Campaigns</Link>
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
              <h2 className="flex items-center gap-2" style={{ fontSize: '1.5rem',  }}>
                <TrendingUp className="w-5 h-5" style={{ color: "#5c6474" }} /> Goal
              </h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{c.goal_description}</p>
            {progress !== null && (
              <div className="mt-4">
                <div className="flex justify-between mb-1" style={{ fontSize: '0.7rem', color: "#5c6474" }}>
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden bg-paper">
                  <div className="h-full" style={{ width: progress + '%', background: '#1b5e8a' }} />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Details */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>Details</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="space-y-2" style={{ fontSize: '0.9rem' }}>
            {c.campaign_type && (
              <div><span style={{ color: "#5c6474" }}>Type:</span> <span style={{  }}>{c.campaign_type}</span></div>
            )}
            {c.participant_count && (
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" style={{ color: "#5c6474" }} />
                <span style={{  }}>{c.participant_count} participants</span>
              </div>
            )}
            {c.start_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" style={{ color: "#5c6474" }} />
                <span style={{  }}>{c.start_date}{c.end_date ? ` to ${c.end_date}` : ''}</span>
              </div>
            )}
            {org && (
              <div className="pt-2 mt-2" style={{ borderTop: '1px solid #dde1e8' }}>
                <span style={{ color: "#5c6474" }}>Led by </span>
                <Link href={`/organizations/${org.org_id}`} style={{ color: "#1b5e8a" }} className="hover:underline">{org.org_name}</Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/campaigns" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
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
