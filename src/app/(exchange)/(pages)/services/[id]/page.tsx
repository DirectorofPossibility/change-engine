import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { Phone, Globe, MapPin, Clock, ArrowRight } from 'lucide-react'
import { SingleLocationMap } from '@/components/maps/dynamic'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getRelatedServices } from '@/lib/data/services'
import { getUserProfile } from '@/lib/auth/roles'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
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

  const { data: themeJunctions } = await (supabase as any).from('service_themes').select('theme_id').eq('service_id', id)
  const themeIds = ((themeJunctions ?? []) as Array<{ theme_id: string }>).map(j => j.theme_id)
  const primaryTheme = themeIds.length > 0
    ? Object.entries(THEMES).find(([k]) => themeIds.includes(k))
    : undefined
  const themeName = primaryTheme ? primaryTheme[1].name : undefined

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

  return (
    <div className="bg-paper min-h-screen">
      <SpiralTracker action="view_service" />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine {themeName ? ' / ' + themeName : ''}
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {displayName}
          </h1>
          {org && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.5rem' }}>
              Provided by{' '}
              <Link href={'/organizations/' + org.org_id} className="hover:underline" style={{ color: "#1b5e8a" }}>
                {org.org_name}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/services" className="hover:underline" style={{ color: "#1b5e8a" }}>{t('detail.all_services')}</Link>
          <span className="mx-2">/</span>
          <span>{displayName}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Concierge CTA */}
        {(service.phone || service.website) && (
          <div className="mb-10 p-6" style={{ border: '1px solid ' + '#1b5e8a', background: "#f4f5f7" }}>
            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: "#5c6474", marginBottom: '0.75rem' }}>
              Here is how to reach them
            </p>
            <div className="flex flex-wrap gap-3">
              {service.phone && (
                <a href={'tel:' + service.phone} className="inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, background: '#1b5e8a' }}>
                  <Phone size={14} /> Call {service.phone}
                </a>
              )}
              {service.website && (
                <a href={service.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 transition-colors" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, border: '1px solid ' + '#1b5e8a', color: "#1b5e8a" }}>
                  <Globe size={14} /> Visit their website
                </a>
              )}
            </div>
            {fullAddress && (
              <p className="mt-3 flex items-center gap-1.5" style={{ fontSize: '0.9rem', color: "#5c6474" }}>
                <MapPin size={13} /> {fullAddress}
              </p>
            )}
          </div>
        )}

        {/* About */}
        {displayDesc && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.about_service')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85 }}>{displayDesc}</p>
          </section>
        )}

        {/* Detail fields */}
        {(service.eligibility || service.fees || service.languages) && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.details')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {service.eligibility && (
              <div className="py-3" style={{ borderBottom: '1px solid #dde1e8' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{t('detail.eligibility')}</p>
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: "#5c6474" }}>{service.eligibility}</p>
              </div>
            )}
            {service.fees && (
              <div className="py-3" style={{ borderBottom: '1px solid #dde1e8' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{t('detail.fees')}</p>
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: "#5c6474" }}>{service.fees}</p>
              </div>
            )}
            {service.languages && (
              <div className="py-3">
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>{t('detail.languages')}</p>
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: "#5c6474" }}>{service.languages}</p>
              </div>
            )}
          </section>
        )}

        {/* Contact & Location */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.contact')}</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div className="space-y-3">
            {service.phone && (
              <a href={'tel:' + service.phone} className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Phone size={15} /> {service.phone}
              </a>
            )}
            {service.website && (
              <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline" style={{ fontSize: '0.9rem', color: "#1b5e8a" }}>
                <Globe size={15} /> {t('detail.website')}
              </a>
            )}
            {fullAddress && (
              <p className="flex items-center gap-2" style={{ fontSize: '0.9rem', color: "#5c6474" }}>
                <MapPin size={15} className="shrink-0" /> {fullAddress}
              </p>
            )}
            {service.hours && (
              <p className="flex items-center gap-2" style={{ fontSize: '0.9rem', color: "#5c6474" }}>
                <Clock size={15} /> {service.hours}
              </p>
            )}
          </div>
        </section>

        {/* Location Map */}
        {(service as any).latitude != null && (service as any).longitude != null && (
          <div className="mb-10" style={{ border: '1px solid #dde1e8' }}>
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

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Parent Organization */}
        {org && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.organization')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <Link href={'/organizations/' + org.org_id} className="block p-5 transition-colors hover:opacity-80" style={{ border: '1px solid #dde1e8' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700,  }}>{org.org_name}</h3>
              {org.description_5th_grade && (
                <p className="line-clamp-2 mt-1" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{org.description_5th_grade}</p>
              )}
            </Link>
          </section>
        )}

        {/* Library nuggets */}
        {libraryNuggets.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.go_deeper')}</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <LibraryNugget nuggets={libraryNuggets} variant="section" color={'#1b5e8a'} labels={{ goDeeper: t('detail.go_deeper') }} />
          </section>
        )}

        {/* Related Services */}
        {displayRelated.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('detail.other_resources')}</h2>
              <Link href="/services" className="inline-flex items-center gap-1 hover:underline" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: "#1b5e8a" }}>
                {t('detail.all_services')} <ArrowRight size={12} />
              </Link>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {displayRelated.slice(0, 3).map(function (svc) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80" style={{ borderBottom: '1px solid #dde1e8' }}>
                  <h4 className="line-clamp-2" style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{svc.service_name}</h4>
                  {svc.description_5th_grade && (
                    <p className="line-clamp-2 mt-0.5" style={{ fontStyle: 'italic', fontSize: '0.8rem', color: "#5c6474" }}>{svc.description_5th_grade}</p>
                  )}
                </Link>
              )
            })}
            {displayRelated.length > 3 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {displayRelated.length - 3} more services
                </summary>
                {displayRelated.slice(3).map(function (svc) {
                  return (
                    <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80" style={{ borderBottom: '1px solid #dde1e8' }}>
                      <h4 className="line-clamp-2" style={{ fontSize: '0.9rem', fontWeight: 600,  }}>{svc.service_name}</h4>
                      {svc.description_5th_grade && (
                        <p className="line-clamp-2 mt-0.5" style={{ fontStyle: 'italic', fontSize: '0.8rem', color: "#5c6474" }}>{svc.description_5th_grade}</p>
                      )}
                    </Link>
                  )
                })}
              </details>
            )}
          </section>
        )}

        {/* Quote */}
        {quote && (
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={'#1b5e8a'} />
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/services" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Services
        </Link>
      </div>

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
    </div>
  )
}
