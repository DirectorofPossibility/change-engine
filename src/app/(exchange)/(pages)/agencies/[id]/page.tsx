import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { Building2, Globe, Phone, MapPin } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('agencies').select('agency_name, description_5th_grade').eq('agency_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.agency_name, description: data.description_5th_grade || 'Government agency details.' }
}

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: agency } = await supabase.from('agencies').select('*').eq('agency_id', id).single()
  if (!agency) notFound()

  const userProfile = await getUserProfile()

  // Related services and wayfinder data in parallel
  const [servicesResult, wayfinderData] = await Promise.all([
    supabase.from('municipal_services').select('service_id, service_name, description_5th_grade').eq('agency_id', id).limit(10),
    getWayfinderContext('agency', id, userProfile?.role),
  ])
  const services = servicesResult.data

  const address = [agency.address, agency.city, agency.state, agency.zip_code].filter(Boolean).join(', ')

  const titleDisplay = agency.agency_acronym
    ? `${agency.agency_name} (${agency.agency_acronym})`
    : agency.agency_name

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Agencies', href: '/agencies' }, { label: agency.agency_name }]}
      eyebrow={agency.jurisdiction ? { text: agency.jurisdiction } : undefined}
      eyebrowMeta={
        <Building2 className="w-5 h-5" style={{ color: '#C75B2A' }} />
      }
      title={titleDisplay}
      subtitle={agency.description_5th_grade}
      themeColor="#C75B2A"
      wayfinderData={wayfinderData}
      wayfinderType="agency"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      feedbackType="agency"
      feedbackId={id}
      feedbackName={agency.agency_name}
      actions={{
        share: { title: agency.agency_name, url: `https://www.changeengine.us/agencies/${id}` },
      }}
      sidebar={
        <>
          {/* No additional sidebar content beyond wayfinder + feedback */}
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact card */}
        <div className="bg-white border border-brand-border p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Contact</h2>
          <div className="space-y-3 text-sm">
            {agency.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${agency.phone}`} className="text-brand-accent hover:underline">{agency.phone}</a></div>}
            {agency.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">{agency.website.replace(/^https?:\/\//, '')}</a></div>}
            {address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{address}</span></div>}
          </div>
        </div>
        {/* Services */}
        {services && services.length > 0 && (
          <div className="bg-white border border-brand-border p-5">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Services Provided</h2>
            <div className="space-y-2">
              {services.map(function (s: any) {
                return (
                  <Link key={s.service_id} href={`/municipal-services/${s.service_id}`} className="block text-sm text-brand-accent hover:underline">
                    {s.service_name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DetailPageLayout>
  )
}
