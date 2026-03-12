import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Landmark, Globe, Phone, MapPin } from 'lucide-react'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('municipal_services').select('*').eq('service_id', id).single()
  if (!service) return { title: 'Service Not Found' }
  const s = service as any
  return {
    title: s.service_name || 'City Service',
    description: s.description || `${s.service_name} — a City of Houston municipal service${s.department ? ' from ' + s.department : ''}.`,
  }
}

export default async function MunicipalServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('municipal_services').select('*').eq('service_id', id).single()
  if (!service) notFound()

  const s = service as any

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('municipal_service' as any, s.service_id, userProfile?.role)

  const eyebrowMeta = s.department ? (
    <span className="flex items-center gap-1.5">
      <Landmark className="w-4 h-4 text-theme-voice" />
      <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{s.department}</span>
    </span>
  ) : undefined

  const sidebarContent = (
    <div className="bg-white border border-brand-border p-5 max-w-md">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Contact</h2>
      <div className="space-y-2 text-sm">
        {s.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${s.phone}`} className="text-brand-accent hover:underline">{s.phone}</a></div>}
        {s.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={s.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">{s.website.replace(/^https?:\/\//, '')}</a></div>}
        {s.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{s.address}</span></div>}
        {s.agency_id && <div className="pt-2 border-t border-brand-border mt-2"><Link href={`/agencies/${s.agency_id}`} className="text-brand-accent hover:underline text-sm">View parent agency</Link></div>}
      </div>
    </div>
  )

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'City Services', href: '/municipal-services' }, { label: s.service_name }]}
      eyebrow={{ text: 'City Service' }}
      eyebrowMeta={eyebrowMeta}
      title={s.service_name}
      subtitle={s.description_5th_grade || null}
      themeColor="#1b5e8a"
      wayfinderData={wayfinderData}
      wayfinderType={'municipal_service' as any}
      wayfinderEntityId={s.service_id}
      userRole={userProfile?.role}
      sidebar={sidebarContent}
      feedbackType="municipal_service"
      feedbackId={s.service_id}
      feedbackName={s.service_name}
      actions={{
        share: { title: s.service_name, url: `https://www.changeengine.us/municipal-services/${id}` },
      }}
    >
      {/* Main content area — service description */}
      {s.description && (
        <div className="bg-white border border-brand-border p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">About This Service</h2>
          <p className="text-brand-text leading-relaxed text-[15px]">{s.description}</p>
        </div>
      )}
    </DetailPageLayout>
  )
}
