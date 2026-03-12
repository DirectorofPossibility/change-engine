import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Users, ExternalLink } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ShareButtons } from '@/components/exchange/ShareButtons'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('opportunities').select('opportunity_name, description_5th_grade').eq('opportunity_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.opportunity_name,
    description: data.description_5th_grade || 'Opportunity on the Community Exchange.',
  }
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('*')
    .eq('opportunity_id', id)
    .single()

  if (!opportunity) notFound()

  // Get parent org if linked
  let org: { org_id: string; org_name: string; logo_url: string | null; website: string | null } | null = null
  if (opportunity.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url, website')
      .eq('org_id', opportunity.org_id)
      .single()
    org = orgData
  }

  // Focus areas via junction table
  const { data: focusJunctions } = await supabase
    .from('opportunity_focus_areas')
    .select('focus_id')
    .eq('opportunity_id', id)
  const focusAreaIds = (focusJunctions ?? []).map((j) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusAreaIds.length > 0) {
    const { data: faData } = await supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name')
      .in('focus_id', focusAreaIds)
    focusAreas = faData ?? []
  }

  // Resolve theme from focus areas
  let themeColor = '#38a169'
  if (focusAreas.length > 0) {
    const { data: faTheme } = await supabase
      .from('focus_areas')
      .select('theme_id')
      .eq('focus_id', focusAreas[0].focus_id)
      .single()
    if (faTheme?.theme_id) {
      const theme = (THEMES as Record<string, { color: string }>)[faTheme.theme_id]
      if (theme) themeColor = theme.color
    }
  }

  // Skills from comma-separated skill_ids on the opportunity row
  let skills: Array<{ skill_id: string; skill_name: string }> = []
  if (opportunity.skill_ids) {
    const skillIdList = opportunity.skill_ids.split(',').map((s) => s.trim()).filter(Boolean)
    if (skillIdList.length > 0) {
      const { data: skillData } = await supabase
        .from('skills')
        .select('skill_id, skill_name')
        .in('skill_id', skillIdList)
      skills = skillData ?? []
    }
  }

  // Look up time commitment name if linked
  let timeCommitmentName: string | null = null
  if (opportunity.time_commitment_id) {
    const { data: tcData } = await supabase
      .from('time_commitments')
      .select('time_name')
      .eq('time_id', opportunity.time_commitment_id)
      .single()
    timeCommitmentName = tcData?.time_name ?? null
  }

  // Translations
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

  // Build a display location string from address/city/state
  const locationParts = [opportunity.address, opportunity.city, opportunity.state].filter(Boolean)
  const displayLocation = locationParts.length > 0 ? locationParts.join(', ') : null

  return (
    <div>
      <SpiralTracker action="view_opportunity" />

      {/* ── HERO ── */}
      <header style={{ background: '#ffffff', borderBottom: '2px solid #0d1117' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
          <Breadcrumb items={[
            { label: 'Opportunities', href: '/opportunities' },
            { label: displayName }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 mt-6">
            {/* Left: Hero content (2/3) */}
            <div className="pr-0 lg:pr-8">
              <div className="flex items-start gap-5">
                {org?.logo_url && (
                  <Image src={org.logo_url} alt={org.org_name} className="w-16 h-16 object-contain bg-white border border-brand-border flex-shrink-0"  width={48} height={64} />
                )}
                <div className="min-w-0">
                  <h1 className="font-display text-[clamp(1.8rem,4vw,2.5rem)] leading-tight text-brand-text mb-2">{displayName}</h1>
                  {org && (
                    <Link href={'/organizations/' + org.org_id} className="text-brand-accent hover:underline text-sm inline-block mb-2">
                      {org.org_name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-brand-muted mt-4">
                {opportunity.start_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> Starts {new Date(opportunity.start_date).toLocaleDateString()}
                  </span>
                )}
                {opportunity.end_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> Ends {new Date(opportunity.end_date).toLocaleDateString()}
                  </span>
                )}
                {displayLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {displayLocation}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <TranslatePageButton isTranslated={!!translation?.title} contentType="opportunities" contentId={id} />
                <ShareButtons compact />
              </div>
            </div>

            {/* Right: Wayfinder (1/3) */}
            <div className="hidden lg:flex lg:items-start lg:justify-end lg:pl-8" style={{ borderLeft: '1px solid #dde1e8' }}>
              <DetailWayfinder data={wayfinderData} currentType="opportunity" currentId={id} userRole={userProfile?.role} />
            </div>
          </div>
        </div>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, ' + themeColor + ', transparent 60%)' }} />
      </header>

      {/* ── MAIN + SIDEBAR ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

          {/* ── Main column ── */}
          <div className="space-y-5">
            {/* Quick details card */}
            <div className="bg-white border border-brand-border p-5 flex flex-wrap gap-4">
              {timeCommitmentName && (
                <span className="flex items-center gap-2 text-sm text-brand-muted">
                  <Clock size={16} style={{ color: themeColor }} /> {timeCommitmentName}
                </span>
              )}
              {opportunity.spots_available != null && (
                <span className="flex items-center gap-2 text-sm text-brand-muted">
                  <Users size={16} style={{ color: themeColor }} /> {opportunity.spots_available} spots available
                </span>
              )}
              {opportunity.registration_url && (
                <a href={opportunity.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-3.5 py-1.5 rounded transition-colors" style={{ backgroundColor: themeColor }}>
                  <ExternalLink size={14} /> Register
                </a>
              )}
            </div>

            {/* Description */}
            {displayDesc && (
              <section>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">About This Opportunity</p>
                <p className="text-brand-text leading-relaxed">{displayDesc}</p>
              </section>
            )}

            {/* Focus Areas — dot+text links */}
            {focusAreas.length > 0 && (
              <section>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Focus Areas</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {focusAreas.map(function (fa) {
                    return (
                      <Link
                        key={fa.focus_id}
                        href={'/explore/focus/' + fa.focus_id}
                        className="inline-flex items-center gap-2 text-sm text-brand-text hover:text-brand-accent transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: themeColor }} />
                        {fa.focus_area_name}
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <section>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Skills Involved</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {skills.map(function (s) {
                    return (
                      <span key={s.skill_id} className="inline-flex items-center gap-2 text-sm text-brand-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-muted-light flex-shrink-0" />
                        {s.skill_name}
                      </span>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Age requirement */}
            {opportunity.min_age != null && opportunity.min_age > 0 && (
              <section>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Who Can Participate</p>
                <p className="text-brand-text leading-relaxed">Minimum age: {opportunity.min_age} years</p>
              </section>
            )}

            {/* Quote */}
            {quote && (
              <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />
            )}

            {/* Feedback */}
            <div className="max-w-sm">
              <FeedbackLoop entityType="opportunities" entityId={id} entityName={opportunity.opportunity_name || ''} />
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">
            <div className="lg:hidden">
              <DetailWayfinder data={wayfinderData} currentType="opportunity" currentId={id} userRole={userProfile?.role} />
            </div>

            {/* Org card in sidebar */}
            {org && (
              <Link
                href={'/organizations/' + org.org_id}
                className="block border border-brand-border overflow-hidden hover:shadow-lg transition-all"
                             >
                <div className="flex">
                  <div className="w-2 flex-shrink-0" style={{ backgroundColor: themeColor }} />
                  <div className="p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Organization</p>
                    <p className="font-display font-bold text-brand-text">{org.org_name}</p>
                    {org.website && (
                      <span className="text-xs text-brand-accent mt-1 inline-block">Visit website</span>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
