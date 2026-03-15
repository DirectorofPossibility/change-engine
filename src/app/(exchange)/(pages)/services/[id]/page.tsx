import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Phone, Globe, MapPin, Clock, ArrowRight } from 'lucide-react'
import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getRelatedServices } from '@/lib/data/services'
import { getUserProfile } from '@/lib/auth/roles'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { serviceJsonLd } from '@/lib/jsonld'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import Image from 'next/image'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('services_211').select('service_name, description_5th_grade').eq('service_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.service_name,
    description: data.description_5th_grade || 'Details on the Change Engine.',
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: service } = await supabase.from('services_211').select('*').eq('service_id', id).single()
  if (!service) notFound()

  let org: { org_id: string; org_name: string; description_5th_grade: string | null; phone: string | null; email: string | null; website: string | null; address: string | null; city: string | null; state: string | null; logo_url: string | null } | null = null
  if (service.org_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, phone, email, website, address, city, state, logo_url')
      .eq('org_id', service.org_id)
      .single()
    org = orgData
  }

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

  const { data: focusJunctions } = await (supabase as any).from('service_focus_areas').select('focus_id').eq('service_id', id)
  const focusIds = ((focusJunctions ?? []) as Array<{ focus_id: string }>).map(j => j.focus_id)

  const { data: themeJunctions } = await (supabase as any).from('service_pathways').select('theme_id').eq('service_id', id)
  const themeIds = ((themeJunctions ?? []) as Array<{ theme_id: string }>).map(j => j.theme_id)
  const primaryTheme = themeIds.length > 0
    ? Object.entries(THEMES).find(([k]) => themeIds.includes(k))
    : undefined
  const themeName = primaryTheme ? primaryTheme[1].name : undefined
  const themeColor = primaryTheme ? (primaryTheme[1] as any).color || '#1b5e8a' : '#1b5e8a'

  const fullAddress = [service.address, service.city, service.state, service.zip_code].filter(Boolean).join(', ')

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
  const [wayfinderData, quote, libraryNuggets, focusRelatedServices] = await Promise.all([
    getWayfinderContext('service', id, userProfile?.role),
    getRandomQuote(primaryTheme ? primaryTheme[0] : undefined),
    getLibraryNuggets([], focusIds, 3),
    getRelatedServices(focusIds),
  ])

  const allRelated = [...relatedServices]
  for (const s of focusRelatedServices) {
    if (s.service_id !== id && !allRelated.some(r => r.service_id === s.service_id)) {
      allRelated.push(s)
    }
  }
  const displayRelated = allRelated.slice(0, 6)

  const jsonLd = serviceJsonLd(service as any, org?.org_name)

  const hasDetails = !!(service.eligibility || (service as any).fees || (service as any).languages || service.hours)

  return (
    <>
      <SpiralTracker action="view_service" />

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
                <Link href="/services" className="hover:text-white transition-colors">{t('detail.all_services')}</Link>
                {themeName && (
                  <>
                    <span>&rsaquo;</span>
                    <span className="text-white/40">{themeName}</span>
                  </>
                )}
              </nav>

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
              >
                {displayName}
              </h1>

              {/* Provided by org */}
              {org && (
                <p className="text-white/80 mb-4 text-sm">
                  Provided by{' '}
                  <Link href={'/organizations/' + org.org_id} className="text-white underline underline-offset-2 hover:text-white/90">
                    {org.org_name}
                  </Link>
                </p>
              )}

              {/* Summary */}
              {displayDesc && (
                <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.05rem' }}>
                  {displayDesc.length > 200 ? displayDesc.slice(0, 200) + '...' : displayDesc}
                </p>
              )}

              {/* Bookmark + meta inline */}
              <div className="flex items-center gap-4">
                <BookmarkButton
                  contentType="service"
                  contentId={service.service_id}
                  title={displayName}
                />
                <span className="text-xs text-white/40">
                  {[fullAddress, service.hours].filter(Boolean).join(' \u00b7 ')}
                </span>
              </div>

              {/* Contact links in hero */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {service.phone && (
                  <a href={'tel:' + service.phone} className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors hover:bg-white/20 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Phone size={13} /> {service.phone}
                  </a>
                )}
                {service.website && (
                  <a href={service.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors hover:bg-white/20 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>

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
                  <h2 className="font-display text-xl font-bold mb-2" style={{ color: INK }}>{t('detail.about_service')}</h2>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <p className="text-[0.95rem] leading-relaxed" style={{ color: DIM }}>{displayDesc}</p>
                </section>
              )}

              {/* Details accordion — eligibility, fees, languages, hours */}
              {hasDetails && (
                <details className="mb-8 group" open>
                  <summary className="flex items-center justify-between cursor-pointer py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <span className="font-display text-xl font-bold" style={{ color: INK }}>{t('detail.details')}</span>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="transition-transform group-open:rotate-180">
                      <path d="M5 7.5L10 12.5L15 7.5" stroke={DIM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </summary>
                  <div className="pt-3 space-y-0">
                    {service.eligibility && (
                      <div className="py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <p className="text-[0.85rem] font-semibold mb-0.5" style={{ color: INK }}>{t('detail.eligibility')}</p>
                        <p className="text-sm" style={{ color: DIM }}>{service.eligibility}</p>
                      </div>
                    )}
                    {(service as any).fees && (
                      <div className="py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <p className="text-[0.85rem] font-semibold mb-0.5" style={{ color: INK }}>{t('detail.fees')}</p>
                        <p className="text-sm" style={{ color: DIM }}>{(service as any).fees}</p>
                      </div>
                    )}
                    {(service as any).languages && (
                      <div className="py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <p className="text-[0.85rem] font-semibold mb-0.5" style={{ color: INK }}>{t('detail.languages')}</p>
                        <p className="text-sm" style={{ color: DIM }}>{(service as any).languages}</p>
                      </div>
                    )}
                    {service.hours && (
                      <div className="py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <p className="text-[0.85rem] font-semibold mb-0.5" style={{ color: INK }}>Hours</p>
                        <p className="text-sm" style={{ color: DIM }}>{service.hours}</p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Location Map */}
              {(service as any).latitude != null && (service as any).longitude != null && (
                <div className="mb-8 rounded overflow-hidden" style={{ border: `1px solid ${RULE}` }}>
                  <InteractiveMap
                    markers={[{
                      id: service.service_id,
                      lat: (service as any).latitude as number,
                      lng: (service as any).longitude as number,
                      title: service.service_name,
                      type: 'service' as const,
                      address: fullAddress || null,
                      phone: service.phone,
                    }]}
                    layers={[GEO_LAYERS.superNeighborhoods, GEO_LAYERS.councilDistricts]}
                    defaultVisibleLayers={[]}
                    zoom={14}
                    center={{ lat: (service as any).latitude as number, lng: (service as any).longitude as number }}
                    showLegend={false}
                    className="w-full h-[250px]"
                  />
                </div>
              )}

              {/* Parent Organization */}
              {org && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('detail.organization')}</h2>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <Link href={'/organizations/' + org.org_id} className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50 rounded" style={{ border: `1px solid ${RULE}` }}>
                    {org.logo_url && (
                      <Image src={org.logo_url} alt="" width={48} height={48} className="w-12 h-12 rounded object-contain flex-shrink-0 bg-gray-50" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-[0.9rem] font-bold" style={{ color: INK }}>{org.org_name}</h3>
                      {org.description_5th_grade && (
                        <p className="line-clamp-2 mt-0.5 text-sm" style={{ color: DIM }}>{org.description_5th_grade}</p>
                      )}
                    </div>
                  </Link>
                </section>
              )}

              {/* Library nuggets */}
              {libraryNuggets.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('detail.go_deeper')}</h2>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} labels={{ goDeeper: t('detail.go_deeper') }} />
                </section>
              )}

              {/* Related Services */}
              {displayRelated.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-xl font-bold" style={{ color: INK }}>{t('detail.other_resources')}</h2>
                    <Link href="/services" className="inline-flex items-center gap-1 hover:underline font-mono text-[0.6rem] uppercase tracking-wider" style={{ color: themeColor }}>
                      {t('detail.all_services')} <ArrowRight size={11} />
                    </Link>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${themeColor}30` }} />
                  {displayRelated.slice(0, 3).map(function (svc) {
                    return (
                      <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `3px solid ${RULE}` }}>
                        <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                        <div className="min-w-0">
                          <span className="block font-semibold text-[0.9rem]" style={{ color: INK }}>{svc.service_name}</span>
                          {svc.description_5th_grade && (
                            <span className="block line-clamp-1 mt-0.5 text-sm" style={{ color: DIM }}>{svc.description_5th_grade}</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                  {displayRelated.length > 3 && (
                    <details className="mt-2">
                      <summary className="italic text-sm cursor-pointer" style={{ color: themeColor }}>
                        {displayRelated.length - 3} more services
                      </summary>
                      {displayRelated.slice(3).map(function (svc) {
                        return (
                          <Link key={svc.service_id} href={'/services/' + svc.service_id} className="flex items-start gap-3 py-2.5 hover:underline" style={{ borderBottom: `3px solid ${RULE}` }}>
                            <span className="mt-2 flex-shrink-0 inline-block w-1.5 h-1.5 rounded-full" style={{ background: themeColor }} />
                            <span className="font-semibold text-[0.9rem]" style={{ color: INK }}>{svc.service_name}</span>
                          </Link>
                        )
                      })}
                    </details>
                  )}
                </section>
              )}

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `3px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
                {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
              </div>
            </div>

            {/* ── RIGHT: WAYFINDER SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="service"
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
      <section style={{ background: SIDEBAR_BG, borderTop: `3px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Services
          </Link>
        </div>
      </section>

      <AdminEditPanel
        entityType="services_211"
        entityId={service.service_id}
        userRole={userProfile?.role}
        fields={[
          { key: 'service_name', label: 'Service Name', type: 'text', value: service.service_name },
          { key: 'description_5th_grade', label: 'Description', type: 'textarea', value: service.description_5th_grade },
          { key: 'org_id', label: 'Parent Organization', type: 'search', value: service.org_id, displayValue: org?.org_name || null, searchEndpoint: '/api/admin/search-orgs' },
          { key: 'is_active', label: 'Active', type: 'select', options: ['Yes', 'No'], value: (service as any).is_active },
          { key: 'phone', label: 'Phone', type: 'text', value: service.phone },
          { key: 'website', label: 'Website', type: 'url', value: service.website },
          { key: 'address', label: 'Address', type: 'text', value: service.address },
          { key: 'city', label: 'City', type: 'text', value: service.city },
          { key: 'state', label: 'State', type: 'text', value: service.state },
          { key: 'zip_code', label: 'ZIP Code', type: 'text', value: service.zip_code },
          { key: 'hours', label: 'Hours', type: 'text', value: service.hours },
          { key: 'eligibility', label: 'Eligibility', type: 'textarea', value: (service as any).eligibility },
          { key: 'fees', label: 'Fees', type: 'text', value: (service as any).fees },
          { key: 'languages', label: 'Languages', type: 'text', value: (service as any).languages },
          { key: 'engagement_level', label: 'Engagement Level', type: 'select', options: ['Get Curious', 'Find Your People', 'Show Up', 'Go Deeper', 'Make Your Move'], value: (service as any).engagement_level },
        ] as EditField[]}
      />
    </>
  )
}
