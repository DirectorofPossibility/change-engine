import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 86400

const OPP_ID_RE = /^OPP_\d+$/i

async function resolveOpportunity(supabase: any, idOrSlug: string) {
  if (OPP_ID_RE.test(idOrSlug)) {
    const { data } = await supabase.from('opportunities').select('*').eq('opportunity_id', idOrSlug).single()
    return data
  }
  const { data } = await supabase.from('opportunities').select('*').eq('slug', idOrSlug).single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const data = await resolveOpportunity(supabase, id)
  if (!data) return { title: 'Not Found' }
  return {
    title: data.opportunity_name,
    description: data.description_5th_grade || 'Opportunity on Change Engine.',
  }
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrSlug } = await params
  const supabase = await createClient()

  const opportunity = await resolveOpportunity(supabase, idOrSlug)
  if (!opportunity) notFound()

  if (OPP_ID_RE.test(idOrSlug) && opportunity.slug) {
    redirect('/opportunities/' + opportunity.slug)
  }

  const id = opportunity.opportunity_id

  let org: { org_id: string; org_name: string; logo_url: string | null; website: string | null } | null = null
  if (opportunity.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url, website')
      .eq('org_id', opportunity.org_id)
      .single()
    org = orgData
  }

  const { data: focusJunctions } = await supabase.from('opportunity_focus_areas').select('focus_id').eq('opportunity_id', id)
  const focusAreaIds = (focusJunctions ?? []).map((j) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusAreaIds.length > 0) {
    const { data: faData } = await supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusAreaIds)
    focusAreas = faData ?? []
  }

  let themeColor = CLAY
  if (focusAreas.length > 0) {
    const { data: faTheme } = await supabase.from('focus_areas').select('theme_id').eq('focus_id', focusAreas[0].focus_id).single()
    if (faTheme?.theme_id) {
      const theme = (THEMES as Record<string, { color: string }>)[faTheme.theme_id]
      if (theme) themeColor = theme.color
    }
  }

  let skills: Array<{ skill_id: string; skill_name: string }> = []
  if (opportunity.skill_ids) {
    const skillIdList = opportunity.skill_ids.split(',').map((s: string) => s.trim()).filter(Boolean)
    if (skillIdList.length > 0) {
      const { data: skillData } = await supabase.from('skills').select('skill_id, skill_name').in('skill_id', skillIdList)
      skills = skillData ?? []
    }
  }

  let timeCommitmentName: string | null = null
  if (opportunity.time_commitment_id) {
    const { data: tcData } = await supabase.from('time_commitments').select('time_name').eq('time_id', opportunity.time_commitment_id).single()
    timeCommitmentName = tcData?.time_name ?? null
  }

  const langId = await getLangId()
  let translation: { title?: string; summary?: string } | undefined
  if (langId) {
    const results = await fetchTranslationsForTable('opportunities', [id], langId)
    translation = results[id]
  }

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('opportunity', id, userProfile?.role),
    getRandomQuote(),
  ])

  const displayName = translation?.title || opportunity.opportunity_name
  const displayDesc = translation?.summary || opportunity.description_5th_grade

  const locationParts = [opportunity.address, opportunity.city, opportunity.state].filter(Boolean)
  const displayLocation = locationParts.length > 0 ? locationParts.join(', ') : null

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <SpiralTracker action="view_opportunity" />

      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.2rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            {displayName}
          </h1>
          {org && (
            <div className="flex items-center gap-3 mt-4">
              {org.logo_url && (
                <Image src={org.logo_url} alt={org.org_name} className="object-contain flex-shrink-0" style={{ border: '1px solid ' + RULE_COLOR }} width={48} height={48} />
              )}
              <Link href={'/organizations/' + org.org_id} className="hover:underline" style={{ fontFamily: SERIF, fontSize: '0.95rem', color: CLAY }}>
                {org.org_name}
              </Link>
            </div>
          )}
          <div className="flex flex-wrap gap-4 mt-4">
            {opportunity.start_date && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED }}>
                <Calendar size={14} /> Starts {new Date(opportunity.start_date).toLocaleDateString()}
              </span>
            )}
            {opportunity.end_date && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED }}>
                <Calendar size={14} /> Ends {new Date(opportunity.end_date).toLocaleDateString()}
              </span>
            )}
            {displayLocation && (
              <span className="flex items-center gap-1.5" style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED }}>
                <MapPin size={14} /> {displayLocation}
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
          <Link href="/opportunities" className="hover:underline" style={{ color: CLAY }}>Opportunities</Link>
          <span className="mx-2">/</span>
          <span>{displayName}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Registration CTA */}
        {opportunity.registration_url && (
          <div className="p-6 flex items-center justify-between gap-4 mb-10" style={{ border: '1px solid ' + CLAY, background: PARCHMENT_WARM }}>
            <div>
              <p style={{ fontFamily: MONO, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, marginBottom: '0.25rem' }}>Get started</p>
              <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                {org ? <>Sign up through <strong>{org.org_name}</strong></> : <>Sign up for this opportunity</>}
              </p>
            </div>
            <a href={opportunity.registration_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90" style={{ fontFamily: MONO, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, background: CLAY }}>
              <ExternalLink size={14} /> Register
            </a>
          </div>
        )}

        {/* Description */}
        {displayDesc && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>About This Opportunity</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.7 }}>{displayDesc}</p>
          </section>
        )}

        {/* Quick details */}
        {(timeCommitmentName || opportunity.spots_available != null) && (
          <div className="p-5 flex flex-wrap gap-4 mb-10" style={{ border: '1px solid ' + RULE_COLOR, background: PARCHMENT_WARM }}>
            {timeCommitmentName && (
              <span className="flex items-center gap-2" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED }}>
                <Clock size={16} style={{ color: CLAY }} /> {timeCommitmentName}
              </span>
            )}
            {opportunity.spots_available != null && (
              <span className="flex items-center gap-2" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED }}>
                <Users size={16} style={{ color: CLAY }} /> {opportunity.spots_available} spots available
              </span>
            )}
          </div>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Focus Areas</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{focusAreas.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {focusAreas.map(function (fa) {
                return (
                  <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="inline-flex items-center gap-2 hover:underline" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                    <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: CLAY }} />
                    {fa.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Skills Involved</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{skills.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {skills.map(function (s) {
                return (
                  <span key={s.skill_id} className="inline-flex items-center gap-2" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED }}>
                    <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: MUTED }} />
                    {s.skill_name}
                  </span>
                )
              })}
            </div>
          </section>
        )}

        {/* Age requirement */}
        {opportunity.min_age != null && opportunity.min_age > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Who Can Participate</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <p style={{ fontFamily: SERIF, fontSize: '0.95rem', color: INK, lineHeight: 1.7 }}>Minimum age: {opportunity.min_age} years</p>
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* Org card */}
        {org && (
          <section className="mb-10">
            <Link href={'/organizations/' + org.org_id} className="block p-5 hover:opacity-80" style={{ border: '1px solid ' + RULE_COLOR }}>
              <p style={{ fontFamily: MONO, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: MUTED, marginBottom: '0.5rem' }}>Organization</p>
              <p style={{ fontFamily: SERIF, fontWeight: 700, color: INK }}>{org.org_name}</p>
              {org.website && (
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, marginTop: '0.25rem', display: 'inline-block' }}>Visit website</span>
              )}
            </Link>
          </section>
        )}

        {/* Quote */}
        {quote && (
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={CLAY} />
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/opportunities" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to Opportunities
        </Link>
      </div>
    </div>
  )
}
