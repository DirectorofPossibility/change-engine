import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin, Clock, Users, DollarSign, Calendar, ExternalLink, BookOpen, Heart } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { ContentCard } from '@/components/exchange/ContentCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ShareButtons } from '@/components/exchange/ShareButtons'
import Image from 'next/image'
import { organizationJsonLd } from '@/lib/jsonld'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('org_name, description_5th_grade').eq('org_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.org_name,
    description: data.description_5th_grade || 'Details on the Community Exchange.',
  }
}

/** Sacred geometry SVG pattern for hero headers — Flower of Life derivative */
function FOLHeroPattern({ color = '#805ad5' }: { color?: string }) {
  const r = 32
  const cx = 200, cy = 120
  const angles = [0, 60, 120, 180, 240, 300]
  return (
    <svg className="absolute right-0 top-0 w-full h-full opacity-[0.06] pointer-events-none" viewBox="0 0 600 300" fill="none" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      {/* Center seed */}
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth="1" />
      {angles.map(function (deg) {
        const rad = (deg * Math.PI) / 180
        return <circle key={'i' + deg} cx={cx + r * Math.cos(rad)} cy={cy + r * Math.sin(rad)} r={r} stroke={color} strokeWidth="0.8" />
      })}
      {/* Outer ring */}
      {[30, 90, 150, 210, 270, 330].map(function (deg) {
        const rad = (deg * Math.PI) / 180
        const outerR = r * 1.732
        return <circle key={'o' + deg} cx={cx + outerR * Math.cos(rad)} cy={cy + outerR * Math.sin(rad)} r={r} stroke={color} strokeWidth="0.5" />
      })}
      <circle cx={cx} cy={cy} r={r * 2.2} stroke={color} strokeWidth="0.4" />
      <circle cx={cx} cy={cy} r={r * 3} stroke={color} strokeWidth="0.3" opacity="0.5" />
      {/* Right bloom */}
      <circle cx={450} cy={150} r={50} stroke={color} strokeWidth="0.4" opacity="0.3" />
      {angles.map(function (deg) {
        const rad = (deg * Math.PI) / 180
        return <circle key={'r' + deg} cx={450 + 50 * Math.cos(rad)} cy={150 + 50 * Math.sin(rad)} r={50} stroke={color} strokeWidth="0.3" opacity="0.2" />
      })}
    </svg>
  )
}

/** Tiny FOL seed icon for decorative inline use */
function FOLSeed({ color = '#C75B2A', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="2 2 16 16" fill="none" className="inline-block" aria-hidden="true">
      <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.2" opacity="0.8" />
      {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
        const rad = (deg * Math.PI) / 180
        return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={color} strokeWidth="0.7" opacity="0.35" />
      })}
    </svg>
  )
}

/** FOL-backed stat block */
function OrgStat({ value, label, color = '#C75B2A' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="relative text-center p-5 rounded-2xl bg-white border border-brand-border overflow-hidden group hover:shadow-md transition-shadow">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        <svg width="80" height="80" viewBox="2 2 16 16" fill="none" style={{ animation: 'fol-spin 40s linear infinite' }}>
          <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" />
          {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
            const rad = (deg * Math.PI) / 180
            return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={color} strokeWidth="1" />
          })}
        </svg>
      </div>
      <span className="relative block text-2xl font-black leading-none" style={{ color }}>{value}</span>
      <span className="relative block font-mono text-[9px] font-bold uppercase tracking-wider text-brand-muted mt-1.5">{label}</span>
    </div>
  )
}

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('org_id', id)
    .single()

  if (!org) notFound()

  // Fetch children: services, content, opportunities
  const [
    { data: services },
    { data: content },
    { data: opportunities },
  ] = await Promise.all([
    supabase.from('services_211').select('*').eq('org_id', id).eq('is_active', 'Yes'),
    supabase.from('content_published').select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at, image_url, inbox_id, focus_area_ids').eq('org_id', id).eq('is_active', true).order('published_at', { ascending: false }).limit(6),
    supabase.from('opportunities').select('opportunity_id, opportunity_name, description_5th_grade, time_commitment, is_virtual, website, org_id').eq('org_id', id).eq('is_active', 'Yes').limit(6),
  ])

  const fullAddress = [org.address, org.city, org.state, org.zip_code].filter(Boolean).join(', ')

  // Parse social media
  const socialLinks: Array<{ platform: string; url: string }> = []
  if (org.social_media) {
    try {
      const sm = typeof org.social_media === 'string' ? JSON.parse(org.social_media) : org.social_media
      if (sm && typeof sm === 'object') {
        Object.entries(sm).forEach(function ([platform, url]) {
          if (typeof url === 'string' && url) socialLinks.push({ platform, url })
        })
      }
    } catch { /* ignore */ }
  }

  // Parse hours
  let hoursList: Array<{ day: string; time: string }> = []
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursList = Object.entries(hours).map(function ([day, time]) { return { day, time: String(time) } })
      }
    } catch { /* ignore */ }
  }

  // Translations
  const langId = await getLangId()
  let orgTranslation: { title?: string; summary?: string } | undefined
  let serviceTranslations: Record<string, { title?: string; summary?: string }> = {}
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const sIds = (services || []).map(function (s) { return s.service_id })
    const cIds = (content || []).map(function (c) { return c.inbox_id }).filter(Boolean) as string[]
    const results = await Promise.all([
      fetchTranslationsForTable('organizations', [org.org_id], langId),
      sIds.length > 0 ? fetchTranslationsForTable('services_211', sIds, langId) : {},
      cIds.length > 0 ? fetchTranslationsForTable('content_published', cIds, langId) : {},
    ])
    orgTranslation = results[0][org.org_id]
    serviceTranslations = results[1]
    contentTranslations = results[2]
  }

  const displayOrgName = orgTranslation?.title || org.org_name
  const displayOrgDesc = orgTranslation?.summary || org.description_5th_grade

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('organization', id, userProfile?.role),
    getRandomQuote(),
  ])

  const jsonLd = organizationJsonLd(org as any)

  // Determine accent color based on org type
  const accentColor = org.org_type === 'Community Partner' ? '#805ad5'
    : org.org_type === 'Foundation/Grantmaker' ? '#3182ce'
    : org.org_type === 'Government Agency' ? '#38a169'
    : org.org_type === 'Educational Institution' ? '#d69e2e'
    : '#C75B2A'

  const childCount = (services?.length || 0) + (content?.length || 0) + (opportunities?.length || 0)

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpiralTracker action="view_organization" />

      {/* ─── Hero ─── */}
      <div className="relative overflow-hidden bg-brand-bg border-b border-brand-border">
        {/* FOL sacred geometry background — always present, hero image overlays if available */}
        <FOLHeroPattern color={accentColor} />

        {/* Optional hero image as background */}
        {org.hero_image_url && (
          <div className="absolute inset-0">
            <Image src={org.hero_image_url} alt="" fill className="object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-bg via-brand-bg/90 to-brand-bg/60" />
          </div>
        )}

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
          <Breadcrumb items={[
            { label: 'Organizations', href: '/organizations' },
            { label: displayOrgName }
          ]} />

          <div className="flex items-start gap-5 mt-5">
            {/* Logo with FOL ring accent */}
            <div className="relative flex-shrink-0">
              {org.logo_url ? (
                <div className="relative">
                  <div className="absolute -inset-2 opacity-[0.12] pointer-events-none" style={{ animation: 'fol-spin 60s linear infinite' }}>
                    <svg width="84" height="84" viewBox="2 2 16 16" fill="none">
                      <circle cx="10" cy="10" r="4" stroke={accentColor} strokeWidth="1.2" />
                      {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
                        const rad = (deg * Math.PI) / 180
                        return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={accentColor} strokeWidth="0.8" />
                      })}
                    </svg>
                  </div>
                  <Image src={org.logo_url} alt={org.org_name} className="w-16 h-16 rounded-xl object-contain bg-white border border-brand-border relative z-10" width={64} height={64} />
                </div>
              ) : (
                /* FOL seed as logo placeholder */
                <div className="w-16 h-16 rounded-xl border border-brand-border bg-white flex items-center justify-center" style={{ borderColor: accentColor + '30' }}>
                  <FOLSeed color={accentColor} size={36} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-text">{displayOrgName}</h1>
                {(org as any).is_verified === 'Yes' && (
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 20 20" fill="none" aria-label="Verified">
                    <path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" fill="#805ad5" />
                    <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {org.mission_statement && (
                <p className="text-brand-muted mt-1.5 font-serif italic max-w-2xl">{org.mission_statement}</p>
              )}
              {!org.mission_statement && displayOrgDesc && (
                <p className="text-brand-muted mt-1.5 max-w-2xl">{displayOrgDesc}</p>
              )}

              {/* Badges row */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {org.org_type === 'Community Partner' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: accentColor + '10', color: accentColor, border: '1px solid ' + accentColor + '30' }}>
                    <FOLSeed color={accentColor} size={14} />
                    Community Partner
                  </span>
                ) : org.org_type ? (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: accentColor + '10', color: accentColor, border: '1px solid ' + accentColor + '30' }}>{org.org_type}</span>
                ) : null}

                {org.year_founded && (
                  <span className="relative inline-flex items-center gap-1.5 text-xs text-brand-muted px-2 py-0.5 rounded-full bg-brand-bg-alt border border-brand-border">
                    <Calendar size={12} /> Founded {org.year_founded}
                    <WayfinderTooltipPos tipKey="year_founded" position="bottom" />
                  </span>
                )}

                {org.ntee_code && (
                  <span className="relative text-xs px-2 py-0.5 rounded-full bg-brand-bg-alt border border-brand-border text-brand-muted">
                    NTEE: {org.ntee_code}
                    <WayfinderTooltipPos tipKey="ntee_code" position="bottom" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-3">
                <TranslatePageButton isTranslated={!!orgTranslation?.title} contentType="organizations" contentId={org.org_id} />
                <ShareButtons compact />
              </div>
            </div>
          </div>
        </div>

        {/* Accent color bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, ' + accentColor + ', transparent 60%)' }} />
      </div>

      {/* ─── Main content ─── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* ── Left column ── */}
          <div className="min-w-0 space-y-6">

            {/* Contact strip */}
            <div className="relative bg-white rounded-2xl border border-brand-border p-5 overflow-hidden">
              {/* Subtle FOL watermark */}
              <div className="absolute -top-6 -right-6 opacity-[0.04] pointer-events-none" style={{ animation: 'fol-spin 60s linear infinite' }}>
                <svg width="120" height="120" viewBox="2 2 16 16" fill="none">
                  <circle cx="10" cy="10" r="4" stroke={accentColor} strokeWidth="1.5" />
                  {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
                    const rad = (deg * Math.PI) / 180
                    return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={accentColor} strokeWidth="1" />
                  })}
                </svg>
              </div>

              <div className="relative flex flex-wrap gap-3">
                <WayfinderTooltipPos tipKey="org_action_buttons" position="bottom" />
                {org.phone && (
                  <a href={'tel:' + org.phone} className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-bg-alt text-brand-accent hover:underline transition-colors border border-brand-border">
                    <Phone size={16} /> {org.phone}
                  </a>
                )}
                {org.email && (
                  <a href={'mailto:' + org.email} className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-bg-alt text-brand-accent hover:underline transition-colors border border-brand-border">
                    <Mail size={16} /> Email
                  </a>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-bg-alt text-brand-accent hover:underline transition-colors border border-brand-border">
                    <Globe size={16} /> Website <ExternalLink size={12} className="opacity-50" />
                  </a>
                )}
                {fullAddress && (
                  <span className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-bg text-brand-muted border border-brand-border">
                    <MapPin size={16} className="flex-shrink-0" /> {fullAddress}
                  </span>
                )}
                {org.map_link && (
                  <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-bg-alt text-brand-accent hover:underline transition-colors border border-brand-border">
                    <MapPin size={16} /> Map <ExternalLink size={12} className="opacity-50" />
                  </a>
                )}
              </div>

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-brand-border">
                  {socialLinks.map(function (link) {
                    return (
                      <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-brand-border text-brand-accent hover:bg-brand-bg-alt transition-colors capitalize">
                        {link.platform}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stats row */}
            {(org.people_served || org.service_area || org.partner_count || org.annual_budget) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {org.people_served && <OrgStat value={org.people_served} label="People Served" color={accentColor} />}
                {org.service_area && <OrgStat value={org.service_area} label="Service Area" color={accentColor} />}
                {org.partner_count != null && <OrgStat value={org.partner_count} label="Partners" color={accentColor} />}
                {org.annual_budget != null && <OrgStat value={'$' + org.annual_budget.toLocaleString()} label="Annual Budget" color={accentColor} />}
              </div>
            )}

            {/* Hours of operation */}
            {hoursList.length > 0 && (
              <div className="bg-white rounded-2xl border border-brand-border p-5">
                <h3 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">
                  <Clock size={14} /> Hours of Operation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                  {hoursList.map(function (h) {
                    return (
                      <div key={h.day} className="flex justify-between text-sm py-1 border-b border-brand-border/50 last:border-0">
                        <span className="font-medium text-brand-text">{h.day}</span>
                        <span className="text-brand-muted">{h.time}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* About section */}
            {org.mission_statement && displayOrgDesc && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-serif font-bold text-brand-text mb-3">
                  <FOLSeed color={accentColor} size={22} /> About
                </h2>
                <p className="text-brand-muted leading-relaxed">{displayOrgDesc}</p>
              </section>
            )}

            {/* Tags */}
            {org.tags && org.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {org.tags.map(function (tag) {
                  return <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-brand-bg border border-brand-border text-brand-muted">{tag}</span>
                })}
              </div>
            )}

            {/* ─── Children: Services ─── */}
            {services && services.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-4">
                  <Heart size={14} style={{ color: accentColor }} />
                  Services ({services.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map(function (svc) {
                    const st = serviceTranslations[svc.service_id]
                    return (
                      <Link key={svc.service_id} href={'/services/' + svc.service_id}>
                        <ServiceCard
                          name={svc.service_name}
                          description={svc.description_5th_grade}
                          phone={svc.phone}
                          address={svc.address}
                          city={svc.city}
                          state={svc.state}
                          zipCode={svc.zip_code}
                          website={svc.website}
                          translatedName={st?.title}
                          translatedDescription={st?.summary}
                        />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Children: Content / News ─── */}
            {content && content.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-4">
                  <BookOpen size={14} style={{ color: accentColor }} />
                  News & Resources ({content.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {content.map(function (item: any) {
                    const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
                    return (
                      <ContentCard
                        key={item.id}
                        id={item.id}
                        title={item.title_6th_grade}
                        summary={item.summary_6th_grade}
                        pathway={item.pathway_primary}
                        center={item.center}
                        sourceUrl={item.source_url}
                        publishedAt={item.published_at}
                        imageUrl={item.image_url}
                        translatedTitle={ct?.title}
                        translatedSummary={ct?.summary}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Children: Opportunities ─── */}
            {opportunities && opportunities.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-4">
                  <Users size={14} style={{ color: accentColor }} />
                  Opportunities ({opportunities.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {opportunities.map(function (opp: any) {
                    return (
                      <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="block">
                        <div className="relative bg-white rounded-xl border border-brand-border p-5 hover:shadow-lg transition-shadow h-full overflow-hidden group">
                          {/* FOL watermark */}
                          <div className="absolute -top-3 -right-3 w-16 h-16 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none" style={{ animation: 'fol-spin 60s linear infinite' }}>
                            <svg viewBox="2 2 16 16" fill="none">
                              <circle cx="10" cy="10" r="4" stroke={accentColor} strokeWidth="1.5" />
                              {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
                                const rad = (deg * Math.PI) / 180
                                return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={accentColor} strokeWidth="0.8" />
                              })}
                            </svg>
                          </div>
                          <h3 className="font-semibold text-brand-text mb-1 line-clamp-2">{opp.opportunity_name}</h3>
                          {opp.description_5th_grade && <p className="text-sm text-brand-muted mb-2 line-clamp-2">{opp.description_5th_grade}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            {opp.time_commitment && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-brand-muted">{opp.time_commitment}</span>
                            )}
                            {opp.is_virtual === 'Yes' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600">Virtual</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Empty state when no children */}
            {childCount === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-brand-border bg-brand-bg/50">
                <FOLSeed color={accentColor} size={48} />
                <p className="text-brand-muted mt-3">No services, content, or opportunities have been linked to this organization yet.</p>
              </div>
            )}

            {/* Quote */}
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} />}
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24">
              <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
              <div className="mt-6">
                <FeedbackLoop entityType="organizations" entityId={id} entityName={org.org_name || ''} />
              </div>
            </div>
          </div>

        </div>
      </div>

      <AdminEditPanel
        entityType="organizations"
        entityId={id}
        userRole={userProfile?.role}
        fields={[
          { key: 'org_name', label: 'Organization Name', type: 'text', value: org.org_name },
          { key: 'org_type', label: 'Organization Type', type: 'select', value: org.org_type, options: ['Community Partner', 'Foundation/Grantmaker', 'Government Agency', 'Educational Institution', 'Media & News', 'Healthcare Provider', 'Human Services', 'Advocacy/Policy', 'Arts, Culture & Humanities', 'Environmental', 'Faith-Based'] },
          { key: 'mission_statement', label: 'Mission Statement', type: 'textarea', value: org.mission_statement },
          { key: 'description_5th_grade', label: 'Description (simplified)', type: 'textarea', value: org.description_5th_grade },
          { key: 'website', label: 'Website', type: 'url', value: org.website },
          { key: 'phone', label: 'Phone', type: 'text', value: org.phone },
          { key: 'email', label: 'Email', type: 'text', value: org.email },
          { key: 'address', label: 'Address', type: 'text', value: org.address },
          { key: 'city', label: 'City', type: 'text', value: org.city },
          { key: 'state', label: 'State', type: 'text', value: org.state },
          { key: 'zip_code', label: 'ZIP Code', type: 'text', value: org.zip_code },
          { key: 'logo_url', label: 'Logo URL', type: 'url', value: org.logo_url },
          { key: 'hero_image_url', label: 'Hero Image URL', type: 'url', value: org.hero_image_url },
          { key: 'map_link', label: 'Map Link', type: 'url', value: org.map_link },
          { key: 'service_area', label: 'Service Area', type: 'text', value: org.service_area },
          { key: 'people_served', label: 'People Served', type: 'text', value: org.people_served },
          { key: 'year_founded', label: 'Year Founded', type: 'number', value: org.year_founded },
          { key: 'annual_budget', label: 'Annual Budget', type: 'number', value: org.annual_budget },
          { key: 'ntee_code', label: 'NTEE Code', type: 'text', value: org.ntee_code },
          { key: 'engagement_level', label: 'Engagement Level', type: 'select', value: (org as any).engagement_level, options: ['anchor', 'active', 'emerging', 'listed'] },
        ] as EditField[]}
      />
    </div>
  )
}
