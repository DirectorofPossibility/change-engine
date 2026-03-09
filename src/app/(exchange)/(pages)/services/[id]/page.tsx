import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Globe, MapPin, Clock } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { SingleLocationMap } from '@/components/maps/dynamic'
import { getLangId, fetchTranslationsForTable, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { FeedbackLoop } from '@/components/exchange/FeedbackLoop'
import { serviceJsonLd } from '@/lib/jsonld'

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

  // Resolve focus areas for library nuggets
  const { data: focusJunctions } = await (supabase as any)
    .from('service_focus_areas')
    .select('focus_id')
    .eq('service_id', id)
  const focusIds = ((focusJunctions ?? []) as Array<{ focus_id: string }>).map(j => j.focus_id)
  const libraryNuggets = await getLibraryNuggets([], focusIds, 3)

  const fullAddress = [service.address, service.city, service.state, service.zip_code].filter(Boolean).join(', ')

  // Fetch translations for non-English
  const langId = await getLangId()
  let translatedName: string | undefined
  let translatedDesc: string | undefined
  if (langId) {
    const t = await fetchTranslationsForTable('services_211', [service.service_id], langId)
    translatedName = t[service.service_id]?.title
    translatedDesc = t[service.service_id]?.summary
  }

  const displayName = translatedName || service.service_name
  const displayDesc = translatedDesc || service.description_5th_grade

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('service', id, userProfile?.role),
    getRandomQuote(),
  ])

  const jsonLd = serviceJsonLd(service as any, org?.org_name)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SpiralTracker action="view_service" />

      {/* Hero */}
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[
            { label: 'Services', href: '/services' },
            { label: displayName }
          ]} />

          <h1 className="font-serif text-3xl lg:text-4xl text-brand-text mt-4 mb-3">{displayName}</h1>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <TranslatePageButton isTranslated={!!translatedName} contentType="services_211" contentId={service.service_id} />
            {service.airs_code && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-white border-2 border-brand-border text-brand-muted">AIRS: {service.airs_code}</span>
            )}
          </div>

          {org && (
            <p className="text-brand-muted">
              Provided by{' '}
              <Link href={'/organizations/' + org.org_id} className="text-brand-accent hover:underline">
                {org.org_name}
              </Link>
            </p>
          )}
        </div>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #C75B2A, transparent 60%)' }} />
      </div>

      {/* Two-column grid */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* Main column */}
          <div className="min-w-0">
            {/* Description */}
            {displayDesc && (
              <div className="mb-8">
                <p className="text-brand-text leading-relaxed text-lg">{displayDesc}</p>
              </div>
            )}

            {/* Contact & Access */}
            <div className="bg-white rounded-card border-2 border-brand-border p-5 mb-8 space-y-3" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Contact &amp; Access</p>
              {service.phone && (
                <a href={'tel:' + service.phone} className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
                  <Phone size={16} /> {service.phone}
                </a>
              )}
              {service.website && (
                <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand-accent hover:underline">
                  <Globe size={16} /> {service.website}
                </a>
              )}
              {fullAddress && (
                <p className="flex items-center gap-2 text-sm text-brand-muted">
                  <MapPin size={16} className="shrink-0" /> {fullAddress}
                </p>
              )}
              {service.hours && (
                <p className="flex items-center gap-2 text-sm text-brand-muted">
                  <Clock size={16} /> {service.hours}
                </p>
              )}
            </div>

            {/* Location Map */}
            {(service as any).latitude != null && (service as any).longitude != null && (
              <div className="mb-8">
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

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {service.eligibility && (
                <div className="bg-white rounded-card border-2 border-brand-border p-4" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Eligibility</p>
                  <p className="text-sm text-brand-text">{service.eligibility}</p>
                </div>
              )}
              {service.fees && (
                <div className="bg-white rounded-card border-2 border-brand-border p-4" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Fees</p>
                  <p className="text-sm text-brand-text">{service.fees}</p>
                </div>
              )}
              {service.languages && (
                <div className="bg-white rounded-card border-2 border-brand-border p-4" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1">Languages</p>
                  <p className="text-sm text-brand-text">{service.languages}</p>
                </div>
              )}
            </div>

            {/* Parent Organization */}
            {org && (
              <section className="mb-10">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Organization</p>
                <Link href={'/organizations/' + org.org_id} className="block bg-white rounded-card border-2 border-brand-border p-5 hover:shadow-md transition-shadow" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
                  <h3 className="font-semibold text-brand-text mb-1">{org.org_name}</h3>
                  {org.description_5th_grade && <p className="text-sm text-brand-muted line-clamp-2">{org.description_5th_grade}</p>}
                </Link>
              </section>
            )}

            {/* Related services */}
            {relatedServices.length > 0 && (
              <section className="mb-10">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Related Services</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedServices.map(function (svc) {
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
                        />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Library nuggets */}
            {libraryNuggets.length > 0 && (
              <section className="mb-10">
                <LibraryNugget
                  nuggets={libraryNuggets}
                  variant="section"
                  color="#d69e2e"
                  labels={{ goDeeper: 'Understanding this resource' }}
                />
              </section>
            )}

            {/* Quote */}
            {quote && (
              <section className="mb-10">
                <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
              </section>
            )}
          </div>

          {/* Sidebar column */}
          <aside className="space-y-6">
            <DetailWayfinder data={wayfinderData} currentType="service" currentId={id} userRole={userProfile?.role} />
            <div className="max-w-sm">
              <FeedbackLoop entityType="services_211" entityId={service.service_id} entityName={service.service_name || ''} />
            </div>
          </aside>

        </div>
      </div>

      {/* Admin panel outside grid */}
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
