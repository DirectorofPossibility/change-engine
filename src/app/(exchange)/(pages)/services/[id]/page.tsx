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
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { serviceJsonLd } from '@/lib/jsonld'
import { THEMES } from '@/lib/constants'


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

  const subtitle = org
    ? <>Provided by{' '}<Link href={'/organizations/' + org.org_id} className="text-blue hover:underline">{org.org_name}</Link></>
    : undefined

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('detail.all_services'), href: '/services' },
    { label: displayName },
  ]

  const footerContent = (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="h-px bg-rule mb-10" />
      <Link href="/services" className="italic text-blue text-[0.95rem] hover:underline">
        Back to Services
      </Link>
    </div>
  )

  return (
    <>
      <DetailPageLayout
        title={displayName}
        subtitle={subtitle as any}
        eyebrow={themeName ? { text: themeName } : undefined}
        breadcrumbs={breadcrumbs}
        themeColor={themeColor}
        wayfinderData={wayfinderData}
        wayfinderType="service"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        jsonLd={jsonLd || undefined}
        feedbackType="service"
        feedbackId={service.service_id}
        feedbackName={displayName}
        footer={footerContent}
        sidebar={
          <>
            <FeaturedPromo variant="card" />
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />}
          </>
        }
      >
        <SpiralTracker action="view_service" />

        {/* Concierge CTA */}
        {(service.phone || service.website) && (
          <div className="mb-10 p-6 border border-blue bg-faint">
            <p className="font-mono text-micro uppercase tracking-wider text-muted mb-3">
              Here is how to reach them
            </p>
            <div className="flex flex-wrap gap-3">
              {service.phone && (
                <a href={'tel:' + service.phone} className="inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90 font-mono text-micro uppercase tracking-wider font-semibold bg-blue">
                  <Phone size={14} /> Call {service.phone}
                </a>
              )}
              {service.website && (
                <a href={service.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 transition-colors font-mono text-micro uppercase tracking-wider font-semibold border border-blue text-blue">
                  <Globe size={14} /> Visit their website
                </a>
              )}
            </div>
            {fullAddress && (
              <p className="mt-3 flex items-center gap-1.5 text-[0.9rem] text-muted">
                <MapPin size={13} /> {fullAddress}
              </p>
            )}
          </div>
        )}

        {/* About */}
        {displayDesc && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.about_service')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <p className="text-[0.95rem] leading-relaxed">{displayDesc}</p>
          </section>
        )}

        {/* Detail fields */}
        {(service.eligibility || service.fees || service.languages) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.details')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {service.eligibility && (
              <div className="py-3 border-b border-rule">
                <p className="text-[0.9rem] font-semibold mb-1">{t('detail.eligibility')}</p>
                <p className="italic text-sm text-muted">{service.eligibility}</p>
              </div>
            )}
            {service.fees && (
              <div className="py-3 border-b border-rule">
                <p className="text-[0.9rem] font-semibold mb-1">{t('detail.fees')}</p>
                <p className="italic text-sm text-muted">{service.fees}</p>
              </div>
            )}
            {service.languages && (
              <div className="py-3">
                <p className="text-[0.9rem] font-semibold mb-1">{t('detail.languages')}</p>
                <p className="italic text-sm text-muted">{service.languages}</p>
              </div>
            )}
          </section>
        )}

        {/* Contact & Location */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-2xl">{t('detail.contact')}</h2>
          </div>
          <div className="h-px border-b border-dotted border-rule mb-4" />
          <div className="space-y-3">
            {service.phone && (
              <a href={'tel:' + service.phone} className="flex items-center gap-2 hover:underline text-[0.9rem] text-blue">
                <Phone size={15} /> {service.phone}
              </a>
            )}
            {service.website && (
              <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-[0.9rem] text-blue">
                <Globe size={15} /> {t('detail.website')}
              </a>
            )}
            {fullAddress && (
              <p className="flex items-center gap-2 text-[0.9rem] text-muted">
                <MapPin size={15} className="shrink-0" /> {fullAddress}
              </p>
            )}
            {service.hours && (
              <p className="flex items-center gap-2 text-[0.9rem] text-muted">
                <Clock size={15} /> {service.hours}
              </p>
            )}
          </div>
        </section>

        {/* Location Map */}
        {(service as any).latitude != null && (service as any).longitude != null && (
          <div className="mb-10 border border-rule">
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

        <div className="my-10 h-px bg-rule" />

        {/* Parent Organization */}
        {org && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.organization')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <Link href={'/organizations/' + org.org_id} className="block p-5 transition-colors hover:opacity-80 border border-rule">
              <h3 className="text-base font-bold">{org.org_name}</h3>
              {org.description_5th_grade && (
                <p className="line-clamp-2 mt-1 text-sm text-muted">{org.description_5th_grade}</p>
              )}
            </Link>
          </section>
        )}

        {/* Library nuggets */}
        {libraryNuggets.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.go_deeper')}</h2>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} labels={{ goDeeper: t('detail.go_deeper') }} />
          </section>
        )}

        {/* Related Services */}
        {displayRelated.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('detail.other_resources')}</h2>
              <Link href="/services" className="inline-flex items-center gap-1 hover:underline font-mono text-[0.65rem] uppercase tracking-wider text-blue">
                {t('detail.all_services')} <ArrowRight size={12} />
              </Link>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {displayRelated.slice(0, 3).map(function (svc) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80 border-b border-rule">
                  <h4 className="line-clamp-2 text-[0.9rem] font-semibold">{svc.service_name}</h4>
                  {svc.description_5th_grade && (
                    <p className="line-clamp-2 mt-0.5 italic text-sm text-muted">{svc.description_5th_grade}</p>
                  )}
                </Link>
              )
            })}
            {displayRelated.length > 3 && (
              <details className="mt-2">
                <summary className="italic text-blue text-[0.9rem] cursor-pointer">
                  See {displayRelated.length - 3} more services
                </summary>
                {displayRelated.slice(3).map(function (svc) {
                  return (
                    <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80 border-b border-rule">
                      <h4 className="line-clamp-2 text-[0.9rem] font-semibold">{svc.service_name}</h4>
                      {svc.description_5th_grade && (
                        <p className="line-clamp-2 mt-0.5 italic text-sm text-muted">{svc.description_5th_grade}</p>
                      )}
                    </Link>
                  )
                })}
              </details>
            )}
          </section>
        )}

      </DetailPageLayout>

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
