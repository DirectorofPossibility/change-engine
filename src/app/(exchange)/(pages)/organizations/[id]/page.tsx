import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Mail, Globe, MapPin, Clock, ExternalLink, ArrowRight } from 'lucide-react'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getUIStrings } from '@/lib/i18n'
import { cookies } from 'next/headers'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { FolFallback } from '@/components/ui/FolFallback'
import Image from 'next/image'
import { organizationJsonLd } from '@/lib/jsonld'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('org_name, description_5th_grade').eq('org_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.org_name,
    description: data.description_5th_grade || 'Details on the Change Engine.',
  }
}

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('*').eq('org_id', id).single()
  if (!org) notFound()

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

  let hoursList: Array<{ day: string; time: string }> = []
  if (org.hours_of_operation) {
    try {
      const hours = typeof org.hours_of_operation === 'string' ? JSON.parse(org.hours_of_operation) : org.hours_of_operation
      if (hours && typeof hours === 'object') {
        hoursList = Object.entries(hours).map(function ([day, time]) { return { day, time: String(time) } })
      }
    } catch { /* ignore */ }
  }

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
  const heroText = org.mission_statement || displayOrgDesc || ''
  // Only show About section if description differs from hero text
  const showAbout = displayOrgDesc && org.mission_statement && displayOrgDesc !== org.mission_statement

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('organization', id, userProfile?.role),
    getRandomQuote(),
  ])

  const jsonLd = organizationJsonLd(org as any)

  const { data: orgThemes } = await supabase.from('organization_pathways').select('theme_id').eq('org_id', id)
  const orgThemeId = orgThemes && orgThemes.length > 0 ? orgThemes[0].theme_id : null
  const themeEntry = orgThemeId ? (THEMES as Record<string, { color: string; name: string; slug: string }>)[orgThemeId] : null
  const themeColor = themeEntry?.color || '#1b5e8a'

  const childCount = (services?.length || 0) + (content?.length || 0) + (opportunities?.length || 0)

  // Stats for At a Glance bar
  const stats: Array<{ label: string; value: string }> = []
  if (org.people_served) stats.push({ label: 'People Served', value: String(org.people_served) })
  if (org.partner_count != null) stats.push({ label: 'Partners', value: String(org.partner_count) })
  if (org.annual_budget != null) stats.push({ label: 'Annual Budget', value: '$' + org.annual_budget.toLocaleString() })

  const hasDetails = hoursList.length > 0 || (org.tags && org.tags.length > 0)

  return (
    <>
      <SpiralTracker action="view_organization" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

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
                <Link href="/organizations" className="hover:text-white transition-colors">Organizations</Link>
                {org.org_type && org.org_type !== 'Organization' && (
                  <>
                    <span>&rsaquo;</span>
                    <span className="text-white/40">{org.org_type}</span>
                  </>
                )}
              </nav>

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
              >
                {displayOrgName}
              </h1>

              {/* Mission / Description */}
              {heroText && (
                <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.1rem' }}>
                  {heroText.length > 200 ? heroText.slice(0, 200) + '...' : heroText}
                </p>
              )}

              {/* Bookmark + meta inline */}
              <div className="flex items-center gap-4">
                <BookmarkButton
                  contentType="organization"
                  contentId={id}
                  title={displayOrgName}
                  imageUrl={org.logo_url}
                />
                <span className="text-xs text-white/40">
                  {[fullAddress, org.year_founded ? `Est. ${org.year_founded}` : null].filter(Boolean).join(' \u00b7 ')}
                </span>
              </div>

              {/* Contact links row — absorbed from Contact section */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {org.phone && (
                  <a href={'tel:' + org.phone} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Phone size={12} /> {org.phone}
                  </a>
                )}
                {org.email && (
                  <a href={'mailto:' + org.email} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Mail size={12} /> {org.email}
                  </a>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <Globe size={12} /> Website <ExternalLink size={9} className="opacity-60" />
                  </a>
                )}
                {org.map_link && (
                  <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors">
                    <MapPin size={12} /> Directions <ExternalLink size={9} className="opacity-60" />
                  </a>
                )}
                {socialLinks.map(function (link) {
                  return (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="capitalize text-white/60 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
                    >
                      {link.platform}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Hero image — logo or hero_image_url */}
            {(org.hero_image_url || org.logo_url) && (
              <div className="w-full lg:w-[380px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30 bg-white/10 flex items-center justify-center p-6">
                <Image
                  src={(org.hero_image_url || org.logo_url) as string}
                  alt={org.org_name}
                  className="max-w-full max-h-[240px] w-auto h-auto object-contain"
                  width={380}
                  height={240}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar — At a Glance ── */}
      {stats.length > 0 && (
        <div style={{ background: SIDEBAR_BG, borderBottom: `3px solid ${RULE}` }}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-wrap divide-x" style={{ borderColor: RULE }}>
              {stats.map(function (s) {
                return (
                  <div key={s.label} className="flex-1 min-w-[120px] py-4 px-5">
                    <span className="block text-lg font-bold" style={{ color: INK }}>{s.value}</span>
                    <span className="block font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Content + Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About — only if description differs from hero mission text */}
              {showAbout && (
                <section className="mb-8">
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>{t('detail.about')}</h2>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{displayOrgDesc}</p>
                </section>
              )}

              {/* Services */}
              {services && services.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Services</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{services.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  {services.slice(0, 4).map(function (svc) {
                    const st = serviceTranslations[svc.service_id]
                    const svcName = st?.title || svc.service_name
                    const svcDesc = st?.summary || svc.description_5th_grade
                    return (
                      <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                        <div className="min-w-0">
                          <span className="block font-semibold text-[0.9rem]" style={{ color: INK }}>{svcName}</span>
                          {svcDesc && <span className="block line-clamp-1 mt-0.5 text-sm" style={{ color: DIM }}>{svcDesc}</span>}
                        </div>
                      </Link>
                    )
                  })}
                  {services.length > 4 && (
                    <details className="mt-2">
                      <summary className="italic text-sm cursor-pointer" style={{ color: themeColor }}>
                        {services.length - 4} more services
                      </summary>
                      {services.slice(4).map(function (svc) {
                        const st = serviceTranslations[svc.service_id]
                        const svcName = st?.title || svc.service_name
                        return (
                          <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `3px solid ${RULE}` }}>
                            <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                            <span className="font-semibold text-[0.9rem]" style={{ color: INK }}>{svcName}</span>
                          </Link>
                        )
                      })}
                    </details>
                  )}
                </section>
              )}

              {/* News & Resources — compact thumbnail + title */}
              {content && content.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>News & Resources</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{content.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {content.map(function (item: any) {
                      const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
                      const displayTitle = ct?.title || item.title_6th_grade
                      return (
                        <Link key={item.id} href={'/content/' + item.id} className="flex items-center gap-3 group">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={displayTitle}
                              width={64}
                              height={48}
                              className="w-16 h-12 rounded object-cover flex-shrink-0 bg-gray-100"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded flex-shrink-0 overflow-hidden">
                              <FolFallback pathway={item.pathway_primary} height="h-full" />
                            </div>
                          )}
                          <span className="text-sm font-medium line-clamp-2 group-hover:underline" style={{ color: INK }}>
                            {displayTitle}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Opportunities */}
              {opportunities && opportunities.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>Opportunities</h2>
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{opportunities.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  {opportunities.map(function (opp: any) {
                    return (
                      <Link key={opp.opportunity_id} href={'/opportunities/' + opp.opportunity_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                        <div className="min-w-0">
                          <span className="block font-semibold text-[0.9rem]" style={{ color: INK }}>{opp.opportunity_name}</span>
                          {opp.description_5th_grade && <span className="block line-clamp-1 mt-0.5 text-sm" style={{ color: DIM }}>{opp.description_5th_grade}</span>}
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {opp.time_commitment && (
                              <span className="font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: DIM }}>{opp.time_commitment}</span>
                            )}
                            {opp.is_virtual === 'Yes' && (
                              <span className="font-mono text-[0.6rem] uppercase tracking-wider px-1.5 py-px" style={{ color: themeColor, border: `1px solid ${themeColor}` }}>Virtual</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </section>
              )}

              {/* Empty state */}
              {childCount === 0 && (
                <div className="text-center py-12" style={{ border: `1px dashed ${RULE}` }}>
                  <p style={{ color: DIM }}>No services, content, or opportunities have been linked to this organization yet.</p>
                </div>
              )}

              {/* Details accordion — Hours + Tags */}
              {hasDetails && (
                <details className="mb-8 group">
                  <summary className="flex items-center justify-between cursor-pointer py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em]" style={{ color: DIM }}>Details</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-open:rotate-180">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="pt-4 space-y-6">
                    {hoursList.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: DIM }}>
                          <Clock size={13} /> Hours of Operation
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0.5">
                          {hoursList.map(function (h) {
                            return (
                              <div key={h.day} className="flex justify-between py-1" style={{ borderBottom: `3px solid ${RULE}` }}>
                                <span className="text-sm font-medium" style={{ color: INK }}>{h.day}</span>
                                <span className="text-sm" style={{ color: DIM }}>{h.time}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {org.tags && org.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {org.tags.map(function (tag: string) {
                          return <span key={tag} className="font-mono text-xs uppercase tracking-wider px-2 py-0.5" style={{ color: DIM, border: `1px solid ${RULE}` }}>{tag}</span>
                        })}
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `3px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
                {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: WAYFINDER SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <div>
                  <DetailWayfinder
                    data={wayfinderData}
                    currentType="organization"
                    currentId={id}
                    userRole={userProfile?.role ?? undefined}
                  />

                  {/* Org-specific wayfinder extras — inside the wayfinder border */}
                  <div className="bg-white border border-t-0 border-brand-border">
                    {org.service_area && (
                      <div className="px-4 py-3 border-t-[3px] border-brand-border">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DIM }}>Service Area</span>
                        <p className="text-xs mt-1 font-medium" style={{ color: INK }}>{org.service_area}</p>
                      </div>
                    )}
                    {org.org_type && (
                      <div className="px-4 py-3 border-t-[3px] border-brand-border">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DIM }}>Organization Type</span>
                        <p className="text-xs mt-1 font-medium" style={{ color: INK }}>{org.org_type}</p>
                      </div>
                    )}
                    {fullAddress && (
                      <div className="px-4 py-3 border-t-[3px] border-brand-border">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DIM }}>Location</span>
                        <p className="text-xs mt-1 font-medium" style={{ color: INK }}>{fullAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

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
      <section style={{ background: SIDEBAR_BG, borderTop: `3px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/organizations"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Organizations
          </Link>
        </div>
      </section>

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
    </>
  )
}
