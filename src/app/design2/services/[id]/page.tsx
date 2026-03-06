import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Phone, Globe, MapPin, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('services_211')
    .select('service_name, description_5th_grade')
    .eq('service_id', id)
    .single()

  if (!data) {
    return { title: 'Service Not Found — Community Exchange' }
  }

  return {
    title: `${data.service_name} — Community Exchange`,
    description: data.description_5th_grade || undefined,
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  // Fetch the service
  const { data: service } = await supabase
    .from('services_211')
    .select('*')
    .eq('service_id', id)
    .single()

  if (!service) {
    notFound()
  }

  const svc = service as any

  // Fetch parent organization if org_id exists
  let parentOrg: any = null
  if (svc.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', svc.org_id)
      .single()
    parentOrg = org
  }

  // Fetch related services (same org, active, excluding current)
  let relatedServices: any[] = []
  if (svc.org_id) {
    const { data: related } = await supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade')
      .eq('org_id', svc.org_id)
      .eq('is_active', 'Yes')
      .neq('service_id', id)
      .limit(4)
    relatedServices = related || []
  }

  // Wayfinder context
  const wayfinder = await getWayfinderContext('service', id)

  // User profile for DetailWayfinder role
  const profile = await getUserProfile()
  const userRole = profile?.role || undefined

  // Build full address
  const addressParts = [svc.address_1, svc.address_2, svc.city, svc.state, svc.zip].filter(Boolean)
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null

  // Contact fields
  const contactFields = [
    { icon: Phone, label: 'Phone', value: svc.phone },
    { icon: Globe, label: 'Website', value: svc.website, isLink: true },
    { icon: MapPin, label: 'Address', value: fullAddress },
    { icon: Clock, label: 'Hours', value: svc.hours },
  ].filter((f) => f.value)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0EAE0' }}>
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: '#D4CCBE' }}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/design2/services"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Services
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1
              className="font-serif text-3xl font-bold leading-tight lg:text-4xl"
              style={{ color: '#1A1A1A' }}
            >
              {svc.service_name}
            </h1>

            {/* Parent org link */}
            {parentOrg && (
              <Link
                href={`/design2/organizations/${svc.org_id}`}
                className="mt-2 inline-block text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#C75B2A' }}
              >
                {parentOrg.name || (parentOrg as any).org_name || 'View Organization'}
              </Link>
            )}

            {/* Description */}
            {svc.description_5th_grade && (
              <div className="mt-6 max-w-[720px]">
                <p className="text-lg leading-relaxed" style={{ color: '#6B6560' }}>
                  {svc.description_5th_grade}
                </p>
              </div>
            )}

            {/* Contact card */}
            {contactFields.length > 0 && (
              <div
                className="mt-8 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CCBE' }}
              >
                <h2
                  className="font-serif text-lg font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Contact Information
                </h2>
                <div className="flex flex-col gap-4">
                  {contactFields.map((field) => {
                    const Icon = field.icon
                    return (
                      <div key={field.label} className="flex items-start gap-3">
                        <Icon
                          size={18}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: '#6B6560' }}
                        />
                        <div className="min-w-0">
                          <p
                            className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                            style={{ color: '#6B6560' }}
                          >
                            {field.label}
                          </p>
                          {field.isLink ? (
                            <a
                              href={
                                field.value.startsWith('http')
                                  ? field.value
                                  : `https://${field.value}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium break-all transition-opacity hover:opacity-70"
                              style={{ color: '#C75B2A' }}
                            >
                              {field.value}
                            </a>
                          ) : (
                            <p className="text-sm" style={{ color: '#1A1A1A' }}>
                              {field.value}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Additional details: eligibility, fees, languages */}
            {(svc.eligibility || svc.fees || svc.languages) && (
              <div
                className="mt-6 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CCBE' }}
              >
                <h2
                  className="font-serif text-lg font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Service Details
                </h2>
                <div className="flex flex-col gap-4">
                  {svc.eligibility && (
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: '#6B6560' }}
                      >
                        Eligibility
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                        {svc.eligibility}
                      </p>
                    </div>
                  )}
                  {svc.fees && (
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: '#6B6560' }}
                      >
                        Fees
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                        {svc.fees}
                      </p>
                    </div>
                  )}
                  {svc.languages && (
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: '#6B6560' }}
                      >
                        Languages
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>
                        {svc.languages}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Parent organization card */}
            {parentOrg && (
              <div
                className="mt-6 rounded-xl border p-6"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CCBE' }}
              >
                <h2
                  className="font-serif text-lg font-bold mb-3"
                  style={{ color: '#1A1A1A' }}
                >
                  Organization
                </h2>
                <Link
                  href={`/design2/organizations/${svc.org_id}`}
                  className="group flex items-center gap-4 rounded-lg border p-4 transition-shadow hover:shadow-sm"
                  style={{ borderColor: '#D4CCBE' }}
                >
                  {parentOrg.logo_url ? (
                    <img
                      src={parentOrg.logo_url}
                      alt={parentOrg.name || ''}
                      className="h-12 w-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                      style={{ backgroundColor: '#6B6560' }}
                    >
                      {(parentOrg.name || 'O').charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className="font-serif text-base font-bold group-hover:underline truncate"
                      style={{ color: '#1A1A1A' }}
                    >
                      {parentOrg.name || parentOrg.org_name}
                    </p>
                    {parentOrg.mission && (
                      <p
                        className="text-sm mt-0.5 line-clamp-2"
                        style={{ color: '#6B6560' }}
                      >
                        {parentOrg.mission}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Related services */}
            {relatedServices.length > 0 && (
              <div className="mt-8">
                <h2
                  className="font-serif text-xl font-bold mb-4"
                  style={{ color: '#1A1A1A' }}
                >
                  Related Services
                </h2>
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
                >
                  {relatedServices.map((rs: any) => (
                    <Link
                      key={rs.service_id}
                      href={`/design2/services/${rs.service_id}`}
                      className="group rounded-xl border p-5 transition-shadow hover:shadow-md"
                      style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CCBE' }}
                    >
                      <h3
                        className="font-serif text-base font-bold leading-snug group-hover:underline"
                        style={{ color: '#1A1A1A' }}
                      >
                        {rs.service_name}
                      </h3>
                      {rs.description_5th_grade && (
                        <p
                          className="mt-2 text-sm leading-relaxed line-clamp-3"
                          style={{ color: '#6B6560' }}
                        >
                          {rs.description_5th_grade}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Wayfinder */}
            <div className="mt-10">
              <DetailWayfinder
                data={wayfinder}
                currentType="service"
                currentId={id}
                userRole={userRole}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
