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
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
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
import { FlowerOfLife } from '@/components/geo/sacred'
import { THEMES } from '@/lib/constants'

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
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)
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

  // Resolve theme color from org's pathway junctions
  const { data: orgThemes } = await supabase.from('organization_pathways').select('theme_id').eq('org_id', id)
  const orgThemeId = orgThemes && orgThemes.length > 0 ? orgThemes[0].theme_id : null
  const themeEntry = orgThemeId ? (THEMES as Record<string, { color: string; name: string }>)[orgThemeId] : null
  const accentColor = themeEntry?.color || '#1b5e8a'

  const childCount = (services?.length || 0) + (content?.length || 0) + (opportunities?.length || 0)

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpiralTracker action="view_organization" />

      {/* ─── Masthead ─── */}
      <header style={{ background: '#ffffff', borderBottom: '2px solid #0d1117' }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
          <Breadcrumb items={[
            { label: 'Organizations', href: '/organizations' },
            { label: displayOrgName }
          ]} />

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 mt-6">
            {/* Left: Hero content (2/3) */}
            <div className="pr-0 lg:pr-8">
              {/* Eyebrow pill */}
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.2em] text-[0.58rem] px-3 py-1" style={{ background: '#0d1117', color: '#ffffff' }}>
                  {t('detail.organization')}
                </span>
                {org.org_type && org.org_type !== 'Organization' && (
                  <span className="font-mono uppercase tracking-[0.2em] text-[0.58rem]" style={{ color: '#5c6474' }}>
                    {org.org_type}
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                {org.logo_url && (
                  <Image src={org.logo_url} alt={org.org_name} className="object-contain flex-shrink-0 hidden sm:block" style={{ border: '1px solid #dde1e8' }} width={72} height={72} />
                )}
                <div className="min-w-0">
                  <h1 className="font-display" style={{ fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: 1.1, color: '#0d1117' }}>
                    {displayOrgName}
                    {(org as any).is_verified === 'Yes' && (
                      <svg className="w-6 h-6 inline-block ml-2 -mt-1" viewBox="0 0 20 20" fill="none" aria-label="Verified">
                        <path d="M10 1l2.39 1.68L15.2 2.1l.58 2.82 2.32 1.58-.92 2.72 1.14 2.6-2.14 1.86.18 2.88-2.8.76L12.39 19 10 17.5 7.61 19l-1.17-2.68-2.8-.76.18-2.88L1.68 10.82l1.14-2.6-.92-2.72L4.22 3.92l.58-2.82 2.81.58L10 1z" fill="#1b5e8a" />
                        <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </h1>
                </div>
              </div>

              {org.mission_statement && (
                <p className="font-body italic mt-3" style={{ color: '#5c6474', fontSize: '1.05rem', lineHeight: 1.6 }}>{org.mission_statement}</p>
              )}
              {!org.mission_statement && displayOrgDesc && (
                <p className="font-body italic mt-3" style={{ color: '#5c6474', fontSize: '1.05rem', lineHeight: 1.6 }}>{displayOrgDesc}</p>
              )}

              {/* Quick facts */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {org.phone && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, background: '#7ec8e3' }} /> {org.phone}
                  </span>
                )}
                {fullAddress && (
                  <span className="inline-flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} /> {fullAddress}
                  </span>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.2em] hover:underline" style={{ color: '#1b5e8a' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} /> {t('detail.website')}
                  </a>
                )}
                {org.year_founded && (
                  <span className="relative inline-flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#5c6474' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, background: '#8a929e' }} /> Est. {org.year_founded}
                    <WayfinderTooltipPos tipKey="year_founded" position="bottom" />
                  </span>
                )}
                {org.ntee_code && (
                  <span className="relative font-mono text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#8a929e' }}>
                    NTEE {org.ntee_code}
                    <WayfinderTooltipPos tipKey="ntee_code" position="bottom" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <TranslatePageButton isTranslated={!!orgTranslation?.title} contentType="organizations" contentId={org.org_id} />
                <ShareButtons compact />
              </div>
            </div>

            {/* Right: Wayfinder (1/3) */}
            <div className="hidden lg:flex lg:items-start lg:justify-end lg:pl-8" style={{ borderLeft: '1px solid #dde1e8' }}>
              <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
            </div>
          </div>
        </div>
      </header>

      {/* ─── Body: 2-column grid ─── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0" style={{ border: '1px solid #dde1e8' }}>

          {/* ── Main column ── */}
          <div className="min-w-0 p-6 lg:p-8" style={{ borderRight: '1px solid #dde1e8' }}>

            {/* About section */}
            {((org.mission_statement && displayOrgDesc) || (!org.mission_statement && displayOrgDesc)) && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>{t('detail.about')}</h2>
                <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
                  <p className="font-body leading-relaxed" style={{ color: '#5c6474' }}>{displayOrgDesc}</p>
                </div>
              </section>
            )}

            {/* Contact section */}
            {(org.phone || org.email || org.website || fullAddress || org.map_link || socialLinks.length > 0) && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>{t('detail.contact')}</h2>
                <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
                  <WayfinderTooltipPos tipKey="org_action_buttons" position="bottom" />
                  <ul className="space-y-2">
                    {org.phone && (
                      <li className="flex items-center gap-2">
                        <Phone size={14} style={{ color: '#8a929e' }} />
                        <a href={'tel:' + org.phone} className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>{org.phone}</a>
                      </li>
                    )}
                    {org.email && (
                      <li className="flex items-center gap-2">
                        <Mail size={14} style={{ color: '#8a929e' }} />
                        <a href={'mailto:' + org.email} className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>{org.email}</a>
                      </li>
                    )}
                    {org.website && (
                      <li className="flex items-center gap-2">
                        <Globe size={14} style={{ color: '#8a929e' }} />
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>
                          {t('detail.website')} <ExternalLink size={10} className="inline opacity-50" />
                        </a>
                      </li>
                    )}
                    {fullAddress && (
                      <li className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#8a929e' }} />
                        <span className="font-body text-sm" style={{ color: '#5c6474' }}>{fullAddress}</span>
                      </li>
                    )}
                    {org.map_link && (
                      <li className="flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#8a929e' }} />
                        <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:underline" style={{ color: '#1b5e8a' }}>
                          View on Map <ExternalLink size={10} className="inline opacity-50" />
                        </a>
                      </li>
                    )}
                  </ul>

                  {/* Social links */}
                  {socialLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #dde1e8' }}>
                      {socialLinks.map(function (link) {
                        return (
                          <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.58rem] uppercase tracking-[0.2em] px-2 py-1 capitalize hover:underline" style={{ color: '#1b5e8a', border: '1px solid #dde1e8' }}>
                            {link.platform}
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Hours of operation */}
            {hoursList.length > 0 && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3 flex items-center gap-2" style={{ color: '#5c6474' }}>
                  <Clock size={14} /> Hours of Operation
                </h2>
                <div style={{ borderTop: '1px solid #dde1e8', paddingTop: '0.75rem' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                    {hoursList.map(function (h) {
                      return (
                        <div key={h.day} className="flex justify-between text-sm py-1" style={{ borderBottom: '1px solid #dde1e8' }}>
                          <span className="font-body font-medium" style={{ color: '#0d1117' }}>{h.day}</span>
                          <span className="font-body" style={{ color: '#5c6474' }}>{h.time}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* Stats row */}
            {(org.people_served || org.service_area || org.partner_count || org.annual_budget) && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>At a Glance</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0" style={{ borderTop: '2px solid #0d1117' }}>
                  {org.people_served && (
                    <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                      <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.people_served}</span>
                      <span className="block font-mono text-[0.58rem] uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>People Served</span>
                    </div>
                  )}
                  {org.service_area && (
                    <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                      <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.service_area}</span>
                      <span className="block font-mono text-[0.58rem] uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Service Area</span>
                    </div>
                  )}
                  {org.partner_count != null && (
                    <div className="p-4" style={{ borderRight: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
                      <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{org.partner_count}</span>
                      <span className="block font-mono text-[0.58rem] uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Partners</span>
                    </div>
                  )}
                  {org.annual_budget != null && (
                    <div className="p-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <span className="block font-display text-xl font-bold" style={{ color: '#0d1117' }}>{'$' + org.annual_budget.toLocaleString()}</span>
                      <span className="block font-mono text-[0.58rem] uppercase tracking-[0.2em] mt-1" style={{ color: '#5c6474' }}>Annual Budget</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Tags */}
            {org.tags && org.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8">
                {org.tags.map(function (tag) {
                  return <span key={tag} className="font-mono text-[0.58rem] uppercase tracking-[0.2em] px-2 py-1" style={{ color: '#5c6474', border: '1px solid #dde1e8' }}>{tag}</span>
                })}
              </div>
            )}

            {/* ─── Services ─── */}
            {services && services.length > 0 && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-4" style={{ color: '#5c6474' }}>
                  Services ({services.length})
                </h2>
                <div style={{ borderTop: '1.5px solid #dde1e8' }}>
                  {services.map(function (svc) {
                    const st = serviceTranslations[svc.service_id]
                    const svcName = st?.title || svc.service_name
                    const svcDesc = st?.summary || svc.description_5th_grade
                    return (
                      <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-3 group hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                        <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#7ec8e3' }} />
                        <div className="min-w-0">
                          <span className="font-body font-semibold block" style={{ color: '#0d1117' }}>{svcName}</span>
                          {svcDesc && <span className="font-body text-sm block line-clamp-2 mt-0.5" style={{ color: '#5c6474' }}>{svcDesc}</span>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Content / News ─── */}
            {content && content.length > 0 && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-4" style={{ color: '#5c6474' }}>
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

            {/* ─── Opportunities ─── */}
            {opportunities && opportunities.length > 0 && (
              <section className="mb-8">
                <h2 className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-4" style={{ color: '#5c6474' }}>
                  Opportunities ({opportunities.length})
                </h2>
                <div style={{ borderTop: '1.5px solid #dde1e8' }}>
                  {opportunities.map(function (opp: any) {
                    return (
                      <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="flex items-start gap-3 py-3 group hover:underline" style={{ borderBottom: '1px solid #dde1e8' }}>
                        <span className="mt-2 flex-shrink-0" style={{ display: 'inline-block', width: 6, height: 6, background: '#1b5e8a' }} />
                        <div className="min-w-0">
                          <span className="font-body font-semibold block" style={{ color: '#0d1117' }}>{opp.opportunity_name}</span>
                          {opp.description_5th_grade && <span className="font-body text-sm block line-clamp-2 mt-0.5" style={{ color: '#5c6474' }}>{opp.description_5th_grade}</span>}
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            {opp.time_commitment && (
                              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#8a929e' }}>{opp.time_commitment}</span>
                            )}
                            {opp.is_virtual === 'Yes' && (
                              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] px-1.5 py-0.5" style={{ color: '#1b5e8a', border: '1px solid #1b5e8a' }}>Virtual</span>
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
              <div className="text-center py-12" style={{ border: '1px dashed #dde1e8' }}>
                <p className="font-body" style={{ color: '#5c6474' }}>No services, content, or opportunities have been linked to this organization yet.</p>
              </div>
            )}

            {/* Quote */}
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} />}
          </div>

          {/* ── Sidebar ── */}
          <div className="p-6 lg:p-8">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Wayfinder (mobile only — desktop version is in masthead) */}
              <div className="lg:hidden">
                <DetailWayfinder data={wayfinderData} currentType="organization" currentId={id} userRole={userProfile?.role} />
              </div>
              <FeedbackLoop entityType="organizations" entityId={id} entityName={org.org_name || ''} />
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
