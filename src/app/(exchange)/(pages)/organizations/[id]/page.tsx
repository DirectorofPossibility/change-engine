import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Globe, MapPin, Clock, ExternalLink, ArrowRight } from 'lucide-react'
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
const RULE = '#e5e7eb'
const DIM = '#6b7280'
const INK = '#1a1a1a'
const BODY = '#374151'
const CARD_BG = '#f9fafb'

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

  /* ── Split content into News vs Resources ── */
  const newsItems = (content || []).filter(function (c: any) { return c.center !== 'resource' && c.center !== 'library' })
  const resourceItems = (content || []).filter(function (c: any) { return c.center === 'resource' || c.center === 'library' })

  /* ── Numeric stats for the stats grid ── */
  const stats: Array<{ label: string; value: string }> = []
  if (org.people_served) stats.push({ label: 'People Served', value: String(org.people_served) })
  if (org.partner_count != null) stats.push({ label: 'Partners', value: String(org.partner_count) })
  if (org.annual_budget != null) stats.push({ label: 'Annual Budget', value: '$' + Number(org.annual_budget).toLocaleString() })

  /* ── Org detail cards ── */
  const orgDetails = [
    org.org_type && org.org_type.length > 1 ? { label: 'Organization Type', value: org.org_type } : null,
    org.year_founded ? { label: 'Founded', value: String(org.year_founded) } : null,
    fullAddress ? { label: 'Location', value: fullAddress } : null,
    org.service_area ? { label: 'Service Area', value: org.service_area } : null,
  ].filter((d): d is { label: string; value: string } => d !== null)

  const hasDetails = hoursList.length > 0 || (org.tags && org.tags.length > 0) || orgDetails.length > 0

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
          HERO
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

        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <nav className="text-sm text-white/70 mb-4 flex items-center gap-2">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span>&rsaquo;</span>
                <Link href="/organizations" className="hover:text-white transition-colors">Organizations</Link>
              </nav>

              {/* Title */}
              <h1
                className="font-display font-black text-white leading-tight tracking-tight mb-5"
                style={{ fontSize: 'clamp(28px, 3.5vw, 42px)' }}
              >
                {displayOrgName}
              </h1>

              {/* Mission / Description */}
              {heroText && (
                <p className="text-lg text-white/90 leading-relaxed mb-6 max-w-[600px]">
                  {heroText.length > 280 ? heroText.slice(0, 280) + '...' : heroText}
                </p>
              )}

              {/* CTA + Bookmark */}
              <div className="flex items-center gap-4 mb-5">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg font-bold text-base shadow-lg transition-transform hover:-translate-y-0.5"
                    style={{ color: themeColor }}
                  >
                    Visit Website <ExternalLink size={16} />
                  </a>
                )}
                <BookmarkButton
                  contentType="organization"
                  contentId={id}
                  title={displayOrgName}
                  imageUrl={org.logo_url}
                />
              </div>

              {/* Contact links — readable size, no email */}
              <div className="flex flex-wrap items-center gap-4">
                {org.phone && (
                  <a href={'tel:' + org.phone} className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                    <Phone size={15} /> {org.phone}
                  </a>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                    <Globe size={15} /> Website
                  </a>
                )}
                {org.map_link && (
                  <a href={org.map_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors">
                    <MapPin size={15} /> Directions
                  </a>
                )}
                {socialLinks.map(function (link) {
                  return (
                    <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="capitalize text-white/70 hover:text-white text-sm transition-colors"
                    >
                      {link.platform}
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Hero image with fallback */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              {org.hero_image_url ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30">
                  <Image
                    src={org.hero_image_url}
                    alt={org.org_name}
                    className="w-full h-auto object-cover"
                    width={380}
                    height={240}
                  />
                </div>
              ) : org.logo_url ? (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30 bg-white/10 flex items-center justify-center p-8">
                  <Image
                    src={org.logo_url}
                    alt={org.org_name}
                    className="max-w-full max-h-[200px] w-auto h-auto object-contain"
                    width={380}
                    height={200}
                  />
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/20 bg-white/10 h-[240px] flex items-center justify-center">
                  <FlowerOfLife color="#ffffff" size={180} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Grid ── */}
      {stats.length > 0 && (
        <section className="bg-white" style={{ borderBottom: `2px solid ${RULE}` }}>
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className={`grid gap-4 ${stats.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : stats.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm'}`}>
              {stats.map(function (s) {
                return (
                  <div key={s.label} className="text-center py-5 px-6 rounded-xl" style={{ background: `${themeColor}08`, border: `2px solid ${themeColor}20` }}>
                    <span className="block text-2xl font-extrabold mb-1" style={{ color: themeColor }}>{s.value}</span>
                    <span className="block text-sm font-medium" style={{ color: DIM }}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* About */}
              {showAbout && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-4" style={{ color: INK }}>{t('detail.about')}</h2>
                  <p className="text-base leading-relaxed" style={{ color: BODY }}>{displayOrgDesc}</p>
                </section>
              )}

              {/* Services */}
              {services && services.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Services</h2>
                    <span className="text-sm font-medium" style={{ color: DIM }}>{services.length} available</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.slice(0, 6).map(function (svc) {
                      const st = serviceTranslations[svc.service_id]
                      const svcName = st?.title || svc.service_name
                      const svcDesc = st?.summary || svc.description_5th_grade
                      return (
                        <Link
                          key={svc.service_id}
                          href={'/services/' + svc.service_id}
                          className="block p-5 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-md"
                          style={{ borderColor: `${themeColor}25`, background: `${themeColor}05` }}
                        >
                          <span className="block font-bold text-base mb-1" style={{ color: INK }}>{svcName}</span>
                          {svcDesc && <span className="block text-sm line-clamp-2" style={{ color: DIM }}>{svcDesc}</span>}
                        </Link>
                      )
                    })}
                  </div>
                  {services.length > 6 && (
                    <details className="mt-4">
                      <summary className="text-sm font-semibold cursor-pointer" style={{ color: themeColor }}>
                        Show {services.length - 6} more services
                      </summary>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {services.slice(6).map(function (svc) {
                          const st = serviceTranslations[svc.service_id]
                          const svcName = st?.title || svc.service_name
                          const svcDesc = st?.summary || svc.description_5th_grade
                          return (
                            <Link
                              key={svc.service_id}
                              href={'/services/' + svc.service_id}
                              className="block p-5 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-md"
                              style={{ borderColor: `${themeColor}25`, background: `${themeColor}05` }}
                            >
                              <span className="block font-bold text-base mb-1" style={{ color: INK }}>{svcName}</span>
                              {svcDesc && <span className="block text-sm line-clamp-2" style={{ color: DIM }}>{svcDesc}</span>}
                            </Link>
                          )
                        })}
                      </div>
                    </details>
                  )}
                </section>
              )}

              {/* News */}
              {newsItems.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-4" style={{ color: INK }}>Latest</h2>
                  <div className="space-y-3">
                    {newsItems.map(function (item: any) {
                      const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
                      const displayTitle = ct?.title || item.title_6th_grade
                      const displaySummary = ct?.summary || item.summary_6th_grade
                      return (
                        <Link
                          key={item.id}
                          href={'/content/' + item.id}
                          className="flex items-start gap-4 group p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                          style={{ borderColor: RULE }}
                        >
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={displayTitle}
                              width={96}
                              height={72}
                              className="w-24 h-[72px] rounded-lg object-cover flex-shrink-0 bg-gray-100"
                            />
                          ) : (
                            <div className="w-24 h-[72px] rounded-lg flex-shrink-0 overflow-hidden">
                              <FolFallback pathway={item.pathway_primary} height="h-full" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block font-bold text-base group-hover:underline mb-1" style={{ color: INK }}>
                              {displayTitle}
                            </span>
                            {displaySummary && (
                              <span className="block text-sm line-clamp-2 mb-1" style={{ color: DIM }}>
                                {displaySummary}
                              </span>
                            )}
                            {item.published_at && (
                              <span className="text-sm" style={{ color: DIM }}>
                                {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Resources */}
              {resourceItems.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-4" style={{ color: INK }}>Resources</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resourceItems.map(function (item: any) {
                      const ct = item.inbox_id ? contentTranslations[item.inbox_id] : undefined
                      const displayTitle = ct?.title || item.title_6th_grade
                      return (
                        <Link
                          key={item.id}
                          href={'/content/' + item.id}
                          className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md group"
                          style={{ borderColor: RULE }}
                        >
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={displayTitle}
                              width={64}
                              height={48}
                              className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded-lg flex-shrink-0 overflow-hidden">
                              <FolFallback pathway={item.pathway_primary} height="h-full" />
                            </div>
                          )}
                          <span className="text-sm font-semibold line-clamp-2 group-hover:underline" style={{ color: INK }}>
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
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-4" style={{ color: INK }}>Opportunities</h2>
                  <div className="space-y-3">
                    {opportunities.map(function (opp: any) {
                      return (
                        <Link
                          key={opp.opportunity_id}
                          href={'/opportunities/' + opp.opportunity_id}
                          className="block p-5 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-md"
                          style={{ borderColor: RULE }}
                        >
                          <span className="block font-bold text-base mb-1" style={{ color: INK }}>{opp.opportunity_name}</span>
                          {opp.description_5th_grade && (
                            <span className="block text-sm line-clamp-2 mb-2" style={{ color: DIM }}>{opp.description_5th_grade}</span>
                          )}
                          <div className="flex items-center gap-3">
                            {opp.time_commitment && (
                              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color: themeColor, background: `${themeColor}10` }}>
                                {opp.time_commitment}
                              </span>
                            )}
                            {opp.is_virtual === 'Yes' && (
                              <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ color: themeColor, border: `1px solid ${themeColor}` }}>
                                Virtual
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Empty state */}
              {childCount === 0 && (
                <div className="text-center py-12 rounded-xl" style={{ border: `2px dashed ${RULE}` }}>
                  <p className="text-base" style={{ color: DIM }}>No services, content, or opportunities have been linked to this organization yet.</p>
                </div>
              )}

              {/* Organization Details */}
              {hasDetails && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-4" style={{ color: INK }}>Organization Details</h2>

                  {orgDetails.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {orgDetails.map(function (d) {
                        return (
                          <div key={d.label} className="p-4 rounded-xl" style={{ background: CARD_BG, border: `1px solid ${RULE}` }}>
                            <span className="block text-sm font-bold mb-1" style={{ color: DIM }}>{d.label}</span>
                            <span className="block text-base font-medium" style={{ color: INK }}>{d.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {hoursList.length > 0 && (
                    <div className="mb-6">
                      <h3 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: DIM }}>
                        <Clock size={16} /> Hours of Operation
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                        {hoursList.map(function (h) {
                          return (
                            <div key={h.day} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${RULE}` }}>
                              <span className="text-sm font-medium" style={{ color: INK }}>{h.day}</span>
                              <span className="text-sm" style={{ color: DIM }}>{h.time}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {org.tags && org.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {org.tags.map(function (tag: string) {
                        return (
                          <span key={tag} className="text-sm px-3 py-1 rounded-full" style={{ color: DIM, background: CARD_BG, border: `1px solid ${RULE}` }}>
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `2px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">

                {/* CTA Box */}
                {org.website && (
                  <div className="rounded-xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
                    <p className="text-white font-bold text-lg mb-4">
                      Connect with {displayOrgName.length > 30 ? 'this organization' : displayOrgName}
                    </p>
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white rounded-lg px-6 py-3 font-bold text-base transition-transform hover:-translate-y-0.5 shadow-lg"
                      style={{ color: themeColor }}
                    >
                      Visit Website <ExternalLink size={14} className="inline ml-1" />
                    </a>
                  </div>
                )}

                {/* Wayfinder */}
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="organization"
                  currentId={id}
                  userRole={userProfile?.role ?? undefined}
                  quote={quote ? { text: quote.quote_text, attribution: quote.attribution } : undefined}
                  accentColor={themeColor}
                />

                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: CARD_BG, borderTop: `2px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-6 py-8 text-center">
          <Link
            href="/organizations"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:text-[#1b5e8a]"
            style={{ color: DIM }}
          >
            <ArrowRight size={16} className="rotate-180" /> Back to Organizations
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
