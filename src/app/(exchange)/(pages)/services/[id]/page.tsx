import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Phone, Globe, MapPin, Clock } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { EntityMesh } from '@/components/exchange/EntityMesh'
import { SingleLocationMap } from '@/components/maps'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('services_211').select('service_name, description_5th_grade').eq('service_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.service_name,
    description: data.description_5th_grade || 'Details on The Change Engine.',
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <div className="text-sm text-brand-muted mb-6">
        <Link href="/services" className="hover:text-brand-accent">Services</Link>
        <span className="mx-2">/</span>
        <span>{service.service_name}</span>
      </div>

      <h1 className="text-3xl font-bold text-brand-text mb-2">{displayName}</h1>
      {org && (
        <p className="text-brand-muted mb-2">
          Provided by <Link href={'/organizations/' + org.org_id} className="text-brand-accent hover:underline">{org.org_name}</Link>
        </p>
      )}
      {service.airs_code && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">AIRS: {service.airs_code}</span>
      )}

      {/* Description */}
      {displayDesc && (
        <div className="mt-6 mb-8">
          <p className="text-brand-text leading-relaxed">{displayDesc}</p>
        </div>
      )}

      {/* Contact & Access */}
      <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 space-y-3">
        <h2 className="font-semibold text-brand-text mb-2">Contact &amp; Access</h2>
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
          <div className="bg-white rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-semibold text-brand-muted mb-1">Eligibility</h3>
            <p className="text-sm text-brand-text">{service.eligibility}</p>
          </div>
        )}
        {service.fees && (
          <div className="bg-white rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-semibold text-brand-muted mb-1">Fees</h3>
            <p className="text-sm text-brand-text">{service.fees}</p>
          </div>
        )}
        {service.languages && (
          <div className="bg-white rounded-xl border border-brand-border p-4">
            <h3 className="text-sm font-semibold text-brand-muted mb-1">Languages</h3>
            <p className="text-sm text-brand-text">{service.languages}</p>
          </div>
        )}
      </div>

      {/* Parent Organization */}
      {org && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-brand-text mb-4">Organization</h2>
          <Link href={'/organizations/' + org.org_id} className="block bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-brand-text mb-1">{org.org_name}</h3>
            {org.description_5th_grade && <p className="text-sm text-brand-muted line-clamp-2">{org.description_5th_grade}</p>}
          </Link>
        </section>
      )}

      {/* Related services */}
      {relatedServices.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Related Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    website={null}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <EntityMesh entityType="service" entityId={id} />
    </div>
  )
}
