import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Users, ExternalLink, ArrowRight } from 'lucide-react'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'


export const revalidate = 86400

async function resolveOpportunity(supabase: any, idOrSlug: string) {
  const { data } = await supabase.from('opportunities').select('*').eq('opportunity_id', idOrSlug).single()
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
  const focusAreaIds = (focusJunctions ?? []).map((j: any) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusAreaIds.length > 0) {
    const { data: faData } = await supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusAreaIds)
    focusAreas = faData ?? []
  }

  let themeColor = '#1b5e8a'
  let themeName: string | undefined
  if (focusAreas.length > 0) {
    const { data: faTheme } = await supabase.from('focus_areas').select('theme_id').eq('focus_id', focusAreas[0].focus_id).single()
    if (faTheme?.theme_id) {
      const theme = (THEMES as Record<string, { color: string; name: string }>)[faTheme.theme_id]
      if (theme) {
        themeColor = theme.color
        themeName = theme.name
      }
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

  const subtitle = org
    ? <>Hosted by{' '}<Link href={'/organizations/' + org.org_id} className="text-blue hover:underline">{org.org_name}</Link></>
    : undefined

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Opportunities', href: '/opportunities' },
    { label: displayName },
  ]

  const metaRow = (
    <div className="flex flex-wrap items-center gap-4 text-muted text-[0.8rem]">
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
      {opportunity.is_virtual && (
        <span className="font-mono text-[0.65rem] uppercase tracking-wider px-2 py-0.5 border border-rule">Virtual</span>
      )}
    </div>
  )

  const footerContent = (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="h-px bg-rule mb-10" />
      <Link href="/opportunities" className="italic text-blue text-[0.95rem] hover:underline">
        Back to Opportunities
      </Link>
    </div>
  )

  return (
    <>
      <DetailPageLayout
        title={displayName}
        subtitle={subtitle as any}
        eyebrow={themeName ? { text: themeName } : { text: 'Opportunity' }}
        breadcrumbs={breadcrumbs}
        themeColor={themeColor}
        metaRow={metaRow}
        wayfinderData={wayfinderData}
        wayfinderType="opportunity"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="opportunity"
        feedbackId={id}
        feedbackName={displayName}
        footer={footerContent}
        sidebar={
          <>
            <FeaturedPromo variant="card" />
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
          </>
        }
      >
        <SpiralTracker action="view_opportunity" />

        {/* Registration CTA */}
        {opportunity.registration_url && (
          <div className="mb-10 p-6 border border-blue bg-faint">
            <p className="font-mono text-micro uppercase tracking-wider text-muted mb-3">
              Here is how to get involved
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={opportunity.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90 font-mono text-micro uppercase tracking-wider font-semibold bg-blue"
              >
                <ExternalLink size={14} /> Register
              </a>
            </div>
          </div>
        )}

        {/* Description */}
        {displayDesc && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">About This Opportunity</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <p className="text-[0.95rem] leading-relaxed">{displayDesc}</p>
          </section>
        )}

        {/* Quick details */}
        {(timeCommitmentName || opportunity.spots_available != null) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Details</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="space-y-3">
              {timeCommitmentName && (
                <p className="flex items-center gap-2 text-[0.9rem] text-muted">
                  <Clock size={15} className="text-blue" /> {timeCommitmentName}
                </p>
              )}
              {opportunity.spots_available != null && (
                <p className="flex items-center gap-2 text-[0.9rem] text-muted">
                  <Users size={15} className="text-blue" /> {opportunity.spots_available} spots available
                </p>
              )}
            </div>
          </section>
        )}

        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Focus Areas</h2>
              <span className="font-mono text-[0.65rem] text-muted">{focusAreas.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {focusAreas.map(function (fa) {
                return (
                  <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="inline-flex items-center gap-2 hover:underline text-[0.9rem]">
                    <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: themeColor }} />
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
              <h2 className="text-2xl">Skills Involved</h2>
              <span className="font-mono text-[0.65rem] text-muted">{skills.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {skills.map(function (s) {
                return (
                  <span key={s.skill_id} className="inline-flex items-center gap-2 text-[0.9rem] text-muted">
                    <span className="w-1.5 h-1.5 flex-shrink-0 bg-muted" />
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
              <h2 className="text-2xl">Who Can Participate</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <p className="text-[0.95rem] leading-relaxed">Minimum age: {opportunity.min_age} years</p>
          </section>
        )}

        <div className="my-10 h-px bg-rule" />

        {/* Organization card */}
        {org && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Organization</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <Link href={'/organizations/' + org.org_id} className="block p-5 transition-colors hover:opacity-80 border border-rule">
              <div className="flex items-center gap-3">
                {org.logo_url && (
                  <Image src={org.logo_url} alt={org.org_name} className="object-contain flex-shrink-0 border border-rule" width={48} height={48} />
                )}
                <div>
                  <h3 className="text-base font-bold">{org.org_name}</h3>
                  {org.website && (
                    <span className="font-mono text-[0.65rem] text-blue mt-0.5 inline-block">Visit website</span>
                  )}
                </div>
              </div>
            </Link>
          </section>
        )}
      </DetailPageLayout>
    </>
  )
}
