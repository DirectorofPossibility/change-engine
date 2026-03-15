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
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { FlowerOfLife } from '@/components/geo/sacred'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

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

  return (
    <>
      <SpiralTracker action="view_opportunity" />

      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 40%, ${themeColor}55 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 6L6 0M-1 1L1-1M5 7L7 5\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '6px 6px' }} />
        <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent" />

        <div className="max-w-[1080px] mx-auto px-6 py-6 sm:py-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb + type in one line */}
              <nav className="text-xs uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>&rsaquo;</span>
                <Link href="/opportunities" className="hover:text-white transition-colors">Opportunities</Link>
                <span>&rsaquo;</span>
                <span className="text-white/40">{themeName || 'Opportunity'}</span>
              </nav>

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
              >
                {displayName}
              </h1>

              {/* Hosted by org */}
              {org && (
                <p className="text-white/80 mb-4 text-sm">
                  Hosted by{' '}
                  <Link href={'/organizations/' + org.org_id} className="text-white underline underline-offset-2 hover:text-white/90">
                    {org.org_name}
                  </Link>
                </p>
              )}

              {/* Description preview */}
              {displayDesc && (
                <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.05rem' }}>
                  {displayDesc.length > 200 ? displayDesc.slice(0, 200) + '...' : displayDesc}
                </p>
              )}

              {/* Bookmark + meta inline */}
              <div className="flex items-center gap-4">
                <BookmarkButton
                  contentType="opportunity"
                  contentId={id}
                  title={displayName}
                />
                <span className="text-xs text-white/40">
                  {[opportunity.start_date ? `Starts ${new Date(opportunity.start_date).toLocaleDateString()}` : null, displayLocation, opportunity.is_virtual ? 'Virtual' : null].filter(Boolean).join(' \u00b7 ')}
                </span>
              </div>

              {/* Registration CTA in hero */}
              {opportunity.registration_url && (
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <a
                    href={opportunity.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors hover:bg-white/20 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    <ExternalLink size={13} /> Register
                  </a>
                </div>
              )}

            </div>

            {/* Org logo */}
            {org?.logo_url && (
              <div className="w-full lg:w-[280px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30 bg-white/10 flex items-center justify-center p-6">
                <Image
                  src={org.logo_url}
                  alt={org.org_name}
                  className="max-w-full max-h-[180px] w-auto h-auto object-contain"
                  width={280}
                  height={180}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About — full description if hero was truncated */}
              {displayDesc && displayDesc.length > 200 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>About This Opportunity</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{displayDesc}</p>
                </section>
              )}

              {/* Quick details */}
              {(timeCommitmentName || opportunity.spots_available != null) && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Details</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="space-y-3">
                    {timeCommitmentName && (
                      <p className="flex items-center gap-2 text-[0.9rem]" style={{ color: DIM }}>
                        <Clock size={15} style={{ color: themeColor }} /> {timeCommitmentName}
                      </p>
                    )}
                    {opportunity.spots_available != null && (
                      <p className="flex items-center gap-2 text-[0.9rem]" style={{ color: DIM }}>
                        <Users size={15} style={{ color: themeColor }} /> {opportunity.spots_available} spots available
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Focus Areas */}
              {focusAreas.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Focus Areas</h2>
                    <span className="font-mono text-[0.65rem]" style={{ color: DIM }}>{focusAreas.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {focusAreas.map(function (fa) {
                      return (
                        <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id} className="inline-flex items-center gap-2 hover:underline text-[0.9rem]" style={{ color: INK }}>
                          <span className="w-2 h-2 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                          {fa.focus_area_name}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Skills Involved</h2>
                    <span className="font-mono text-[0.65rem]" style={{ color: DIM }}>{skills.length}</span>
                  </div>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {skills.map(function (s) {
                      return (
                        <span key={s.skill_id} className="inline-flex items-center gap-2 text-[0.9rem]" style={{ color: DIM }}>
                          <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full" style={{ background: DIM }} />
                          {s.skill_name}
                        </span>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Age requirement */}
              {opportunity.min_age != null && opportunity.min_age > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Who Can Participate</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>Minimum age: {opportunity.min_age} years</p>
                </section>
              )}

              <div className="my-8 h-px" style={{ background: RULE }} />

              {/* Organization card */}
              {org && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>Organization</h2>
                  <div className="h-px mb-3" style={{ background: `${themeColor}30` }} />
                  <Link href={'/organizations/' + org.org_id} className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50 rounded" style={{ border: `1px solid ${RULE}` }}>
                    {org.logo_url && (
                      <Image src={org.logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded object-contain flex-shrink-0 bg-gray-50" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[0.9rem] font-bold" style={{ color: INK }}>{org.org_name}</h3>
                      {org.website && (
                        <span className="font-mono text-[0.65rem] mt-0.5 inline-block" style={{ color: themeColor }}>Visit website</span>
                      )}
                    </div>
                  </Link>
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `1px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
                {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
              </div>
            </div>

            {/* ── RIGHT: WAYFINDER SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="opportunity"
                  currentId={id}
                  userRole={userProfile?.role ?? undefined}
                />

                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                  {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Opportunities
          </Link>
        </div>
      </section>
    </>
  )
}
