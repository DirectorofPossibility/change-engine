import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Building2, Globe, Phone, MapPin } from 'lucide-react'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
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

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Breadcrumb items={[{ label: 'Agencies', href: '/agencies' }, { label: agency.agency_name }]} />
          <div className="flex items-center gap-3 mt-4 mb-2">
            <Building2 className="w-6 h-6 text-brand-accent" />
            {agency.jurisdiction && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{agency.jurisdiction}</span>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-brand-text">
            {agency.agency_name}
            {agency.agency_acronym && <span className="ml-3 text-xl text-brand-muted font-normal">({agency.agency_acronym})</span>}
          </h1>
          {agency.description_5th_grade && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{agency.description_5th_grade}</p>}
        </div>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #C75B2A, transparent 60%)' }} />
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact card */}
              <div className="bg-white rounded-lg border border-brand-border p-5">
                <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Contact</h2>
                <div className="space-y-3 text-sm">
                  {agency.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${agency.phone}`} className="text-brand-accent hover:underline">{agency.phone}</a></div>}
                  {agency.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">{agency.website.replace(/^https?:\/\//, '')}</a></div>}
                  {address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{address}</span></div>}
                </div>
              </div>
              {/* Services */}
              {services && services.length > 0 && (
                <div className="bg-white rounded-lg border border-brand-border p-5">
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
          </div>
          <div className="space-y-4">
            <DetailWayfinder data={wayfinderData} currentType="agency" currentId={id} userRole={userProfile?.role} />
          </div>
        </div>
      </div>
    </div>
  )
}
