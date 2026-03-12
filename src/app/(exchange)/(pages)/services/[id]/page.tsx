import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Phone, Globe, MapPin, Clock, ArrowRight } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { SingleLocationMap } from '@/components/maps/dynamic'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getActivePromotions } from '@/lib/data/homepage'
import { getRelatedServices } from '@/lib/data/services'
import { getUserProfile } from '@/lib/auth/roles'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { ShareButtons } from '@/components/exchange/ShareButtons'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'
import { serviceJsonLd } from '@/lib/jsonld'
import { Geo } from '@/components/geo/sacred'
import { THEMES } from '@/lib/constants'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('services_211').select('service_name, description_5th_grade').eq('service_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.service_name,
    description: data.description_5th_grade || 'Details on the Community Exchange.',
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: service } = await supabase
    .from('services_211')
    .select('*')
    .eq('service_id', id)
    .single()

  if (!service) notFound()

  // Get parent org
  let org: { org_id: string; org_name: string; description_5th_grade: string | null; phone: string | null; email: string | null; website: string | null; address: string | null; city: string | null; state: string | null; logo_url: string | null } | null = null
  if (service.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, phone, email, website, address, city, state, logo_url')
      .eq('org_id', service.org_id)
      .single()
    org = orgData
  }

  // Related services (same org)
  let relatedServices: Array<{ service_id: string; service_name: string; description_5th_grade: string | null; phone: string | null; address: string | null; city: string | null; state: string | null; zip_code: string | null; website: string | null }> = []
  if (service.org_id) {
    const { data: related } = await supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, address, city, state, zip_code, website')
      .eq('org_id', service.org_id)
      .neq('service_id', id)
      .eq('is_active', 'Yes')
      .limit(4)
    relatedServices = related || []
  }

  // Resolve focus areas for library nuggets + related services (GAP 3)
  const { data: focusJunctions } = await (supabase as any)
    .from('service_focus_areas')
    .select('focus_id')
    .eq('service_id', id)
  const focusIds = ((focusJunctions ?? []) as Array<{ focus_id: string }>).map(j => j.focus_id)

  // Resolve pathway for contextual color
  const { data: themeJunctions } = await (supabase as any)
    .from('service_themes')
    .select('theme_id')
    .eq('service_id', id)
  const themeIds = ((themeJunctions ?? []) as Array<{ theme_id: string }>).map(j => j.theme_id)
  const primaryTheme = themeIds.length > 0
    ? Object.entries(THEMES).find(([k]) => themeIds.includes(k))
    : undefined
  const themeColor = primaryTheme ? primaryTheme[1].color : '#1b5e8a'
  const themeName = primaryTheme ? primaryTheme[1].name : undefined

  const fullAddress = [service.address, service.city, service.state, service.zip_code].filter(Boolean).join(', ')

  // Fetch translations for non-English
  const langId = await getLangId()
  let translatedName: string | undefined
  let translatedDesc: string | undefined
  if (langId) {
    const tr = await fetchTranslationsForTable('services_211', [service.service_id], langId)
    translatedName = tr[service.service_id]?.title
    translatedDesc = tr[service.service_id]?.summary
  }

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const displayName = translatedName || service.service_name
  const displayDesc = translatedDesc || service.description_5th_grade

  const userProfile = await getUserProfile()
  const [wayfinderData, quote, libraryNuggets, focusRelatedServices, promotions] = await Promise.all([
    getWayfinderContext('service', id, userProfile?.role),
    getRandomQuote(primaryTheme ? primaryTheme[0] : undefined),
    getLibraryNuggets([], focusIds, 3),
    getRelatedServices(focusIds),
    getActivePromotions(primaryTheme ? primaryTheme[0] : undefined, 1),
  ])

  // Merge org-related + focus-related services, dedupe, exclude self
  const allRelated = [...relatedServices]
  for (const s of focusRelatedServices) {
    if (s.service_id !== id && !allRelated.some(r => r.service_id === s.service_id)) {
      allRelated.push(s)
    }
  }
  const displayRelated = allRelated.slice(0, 6)

  const jsonLd = serviceJsonLd(service as any, org?.org_name)
  const promo = promotions && promotions.length > 0 ? promotions[0] : null

  // Geo type from service or fallback
  const geoType = (service as any).geo_type || 'vesica_piscis'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpiralTracker action="view_service" />

      <div className="max-w-[1080px] mx-auto px-6 pt-4">
        <Breadcrumb items={[
          { label: t('detail.all_services'), href: '/services' },
          { label: displayName || t('detail.service') },
        ]} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RESOURCE MASTHEAD
         ═══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative"
        style={{ borderBottom: '2px solid #0d1117' }}
      >
        <div className="max-w-[1080px] mx-auto px-6 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
            {/* Left column — eyebrow, title, org, buttons */}
            <div>
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-mono uppercase tracking-[0.12em] px-2 py-0.5"
                  style={{ fontSize: '0.52rem', background: '#0d1117', color: '#ffffff' }}
                >
                  {t('detail.service')}
                </span>
                <span
                  className="font-mono uppercase tracking-[0.12em]"
                  style={{ fontSize: '0.58rem', color: '#5c6474', letterSpacing: '0.2em' }}
                >
                  {themeName && <>{themeName} &middot; </>}{t('detail.community_resource')}
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-display leading-[1] tracking-tight mb-3"
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                  fontWeight: 900,
                  color: '#0d1117',
                }}
              >
                {displayName}
              </h1>

              {/* Org attribution */}
              {org && (
                <Link
                  href={'/organizations/' + org.org_id}
                  className="font-body text-sm hover:underline mb-4 inline-block"
                  style={{ color: '#5c6474' }}
                >
                  {org.org_name}
                </Link>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <TranslatePageButton isTranslated={!!translatedName} contentType="services_211" contentId={service.service_id} />
                <ShareButtons compact />
              </div>
            </div>

            {/* Right column — wayfinder + FOL (desktop only) */}
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-6 lg:pl-8" style={{ borderLeft: '1px solid #dde1e8' }}>
              <Geo type={geoType} color={themeColor} size={192} opacity={0.15} />
              <DetailWayfinder data={wayfinderData} currentType="service" currentId={id} userRole={userProfile?.role} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PROMOTION (GAP 1)
         ═══════════════════════════════════════════════════════════════════ */}
      {promo && (
        <section style={{ borderBottom: '2px solid #0d1117' }}>
          <div className="max-w-[1080px] mx-auto px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2
                  className="font-display mb-0.5"
                  style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0d1117' }}
                >
                  {promo.title}
                </h2>
                {promo.subtitle && (
                  <p className="font-body" style={{ fontSize: '0.85rem', color: '#5c6474' }}>
                    {promo.subtitle}
                  </p>
                )}
              </div>
              {promo.cta_href && (
                <Link
                  href={promo.cta_href}
                  className="font-mono uppercase tracking-[0.08em] inline-flex items-center gap-2 flex-shrink-0"
                  style={{ fontSize: '0.65rem', color: '#1b5e8a', fontWeight: 600 }}
                >
                  {promo.cta_text || t('detail.learn_more')} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RESOURCE BODY — 2-column grid
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] items-start"
          style={{ borderBottom: '1.5px solid #dde1e8' }}
        >
          {/* ── Main column ── */}
          <div
            className="py-10 lg:pr-10 lg:border-r min-w-0"
            style={{ borderColor: '#dde1e8' }}
          >
            {/* About */}
            {displayDesc && (
              <>
                <span
                  className="font-mono uppercase tracking-[0.2em] block mb-3"
                  style={{ fontSize: '0.58rem', color: '#5c6474' }}
                >
                  {t('detail.about_service')}
                </span>
                <p
                  className="font-body leading-[1.85] mb-8"
                  style={{ fontSize: '0.88rem', color: '#0d1117' }}
                >
                  {displayDesc}
                </p>
              </>
            )}

            {/* Detail fields */}
            {(service.eligibility || service.fees || service.languages) && (
              <div className="mb-8">
                <span
                  className="font-mono uppercase tracking-[0.2em] block mb-3"
                  style={{ fontSize: '0.58rem', color: '#5c6474' }}
                >
                  {t('detail.details')}
                </span>
                <div className="space-y-0">
                  {service.eligibility && (
                    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: themeColor }} />
                      <div>
                        <p className="font-display text-sm font-bold mb-0.5" style={{ color: '#0d1117' }}>{t('detail.eligibility')}</p>
                        <p className="font-body italic text-sm" style={{ color: '#5c6474' }}>{service.eligibility}</p>
                      </div>
                    </div>
                  )}
                  {service.fees && (
                    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: themeColor }} />
                      <div>
                        <p className="font-display text-sm font-bold mb-0.5" style={{ color: '#0d1117' }}>{t('detail.fees')}</p>
                        <p className="font-body italic text-sm" style={{ color: '#5c6474' }}>{service.fees}</p>
                      </div>
                    </div>
                  )}
                  {service.languages && (
                    <div className="flex items-start gap-3 py-3">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: themeColor }} />
                      <div>
                        <p className="font-display text-sm font-bold mb-0.5" style={{ color: '#0d1117' }}>{t('detail.languages')}</p>
                        <p className="font-body italic text-sm" style={{ color: '#5c6474' }}>{service.languages}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact & Location */}
            <div className="mb-8">
              <span
                className="font-mono uppercase tracking-[0.2em] block mb-3"
                style={{ fontSize: '0.58rem', color: '#5c6474' }}
              >
                {t('detail.contact')}
              </span>
              <div className="space-y-3">
                {service.phone && (
                  <a
                    href={'tel:' + service.phone}
                    className="flex items-center gap-2 hover:underline"
                    style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
                  >
                    <Phone size={15} /> {service.phone}
                  </a>
                )}
                {service.website && (
                  <a
                    href={service.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline"
                    style={{ fontSize: '0.88rem', color: '#1b5e8a' }}
                  >
                    <Globe size={15} /> {t('detail.website')}
                  </a>
                )}
                {fullAddress && (
                  <p className="flex items-center gap-2" style={{ fontSize: '0.88rem', color: '#5c6474' }}>
                    <MapPin size={15} className="shrink-0" /> {fullAddress}
                  </p>
                )}
                {service.hours && (
                  <p className="flex items-center gap-2" style={{ fontSize: '0.88rem', color: '#5c6474' }}>
                    <Clock size={15} /> {service.hours}
                  </p>
                )}
              </div>
            </div>

            {/* Location Map */}
            {(service as any).latitude != null && (service as any).longitude != null && (
              <div className="mb-8" style={{ border: '1px solid #dde1e8' }}>
                <SingleLocationMap
                  marker={{
                    id: service.service_id,
                    lat: (service as any).latitude as number,
                    lng: (service as any).longitude as number,
                    title: service.service_name,
                    type: 'service',
                    address: fullAddress || null,
                    phone: service.phone,
                  }}
                />
              </div>
            )}

            {/* Parent Organization */}
            {org && (
              <div className="mb-8">
                <span
                  className="font-mono uppercase tracking-[0.2em] block mb-3"
                  style={{ fontSize: '0.58rem', color: '#5c6474' }}
                >
                  {t('detail.organization')}
                </span>
                <Link
                  href={'/organizations/' + org.org_id}
                  className="block p-5 transition-colors hover:bg-[#f4f5f7]"
                  style={{ border: '1px solid #dde1e8' }}
                >
                  <h3
                    className="font-display mb-1"
                    style={{ fontSize: '1rem', fontWeight: 700, color: '#0d1117' }}
                  >
                    {org.org_name}
                  </h3>
                  {org.description_5th_grade && (
                    <p className="font-body text-sm line-clamp-2" style={{ color: '#5c6474' }}>
                      {org.description_5th_grade}
                    </p>
                  )}
                </Link>
              </div>
            )}

            {/* Quote (GAP 2) */}
            {quote && (
              <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="py-10 lg:pl-10 flex flex-col gap-7">
            {/* Wayfinder — mobile only (desktop version is in masthead) */}
            <div className="lg:hidden">
              <DetailWayfinder data={wayfinderData} currentType="service" currentId={id} userRole={userProfile?.role} />
            </div>

            {/* Library nuggets */}
            {libraryNuggets.length > 0 && (
              <div>
                <span
                  className="font-mono uppercase tracking-[0.2em] block mb-3 pb-2"
                  style={{ fontSize: '0.58rem', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
                >
                  {t('detail.go_deeper')}
                </span>
                <LibraryNugget
                  nuggets={libraryNuggets}
                  variant="section"
                  color={themeColor}
                  labels={{ goDeeper: t('detail.go_deeper') }}
                />
              </div>
            )}

            {/* Feedback */}
            <div>
              <span
                className="font-mono uppercase tracking-[0.2em] block mb-3 pb-2"
                style={{ fontSize: '0.58rem', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
              >
                {t('detail.was_helpful')}
              </span>
              <FeedbackLoop entityType="services_211" entityId={service.service_id} entityName={service.service_name || ''} />
            </div>
          </aside>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            RELATED SERVICES (GAP 3)
           ═══════════════════════════════════════════════════════════════════ */}
        {displayRelated.length > 0 && (
          <section className="py-10" style={{ borderTop: '1.5px solid #dde1e8' }}>
            <div className="flex items-end justify-between mb-4">
              <div>
                <span
                  className="font-mono uppercase tracking-[0.2em] block mb-2"
                  style={{ fontSize: '0.58rem', color: '#5c6474' }}
                >
                  Related &middot; {themeName || t('detail.community_resource')}
                </span>
                <h3
                  className="font-display"
                  style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0d1117' }}
                >
                  {t('detail.other_resources')}
                </h3>
              </div>
              <Link
                href="/services"
                className="font-mono uppercase tracking-[0.08em] inline-flex items-center gap-1"
                style={{ fontSize: '0.62rem', color: '#1b5e8a', fontWeight: 600 }}
              >
                {t('detail.all_services')} <ArrowRight size={12} />
              </Link>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0"
              style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}
            >
              {displayRelated.map(function (svc) {
                return (
                  <Link
                    key={svc.service_id}
                    href={'/services/' + svc.service_id}
                    className="block p-5 bg-white transition-colors hover:bg-[#f4f5f7]"
                    style={{ borderRight: '1.5px solid #dde1e8', borderBottom: '1.5px solid #dde1e8' }}
                  >
                    <span
                      className="font-mono uppercase tracking-[0.08em] block mb-2"
                      style={{ fontSize: '0.52rem', color: '#5c6474' }}
                    >
                      {t('detail.service')}
                    </span>
                    <h4
                      className="font-display line-clamp-2 mb-2"
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0d1117' }}
                    >
                      {svc.service_name}
                    </h4>
                    {svc.description_5th_grade && (
                      <p
                        className="font-body italic line-clamp-2"
                        style={{ fontSize: '0.75rem', color: '#5c6474' }}
                      >
                        {svc.description_5th_grade}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {/* Admin panel */}
      <AdminEditPanel
        entityType="services_211"
        entityId={service.service_id}
        userRole={userProfile?.role}
        fields={[
          { key: 'service_name', label: 'Service Name', type: 'text', value: service.service_name },
          { key: 'description_5th_grade', label: 'Description', type: 'textarea', value: service.description_5th_grade },
          { key: 'phone', label: 'Phone', type: 'text', value: service.phone },
          { key: 'website', label: 'Website', type: 'url', value: service.website },
          { key: 'address', label: 'Address', type: 'text', value: service.address },
          { key: 'city', label: 'City', type: 'text', value: service.city },
          { key: 'state', label: 'State', type: 'text', value: service.state },
          { key: 'zip_code', label: 'ZIP Code', type: 'text', value: service.zip_code },
          { key: 'eligibility', label: 'Eligibility', type: 'textarea', value: (service as any).eligibility },
          { key: 'fee_structure', label: 'Fee Structure', type: 'text', value: (service as any).fee_structure },
          { key: 'hours_of_operation', label: 'Hours of Operation', type: 'text', value: (service as any).hours_of_operation },
          { key: 'service_area', label: 'Service Area', type: 'text', value: (service as any).service_area },
        ] as EditField[]}
      />
    </>
  )
}
