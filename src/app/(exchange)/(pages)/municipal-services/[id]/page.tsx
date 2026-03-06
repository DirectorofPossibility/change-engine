import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Landmark, Globe, Phone, MapPin } from 'lucide-react'

export const revalidate = 300

export default async function MunicipalServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('municipal_services').select('*').eq('service_id', id).single()
  if (!service) notFound()

  const s = service as any

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'City Services', href: '/municipal-services' }, { label: s.service_name }]} />
          <div className="flex items-center gap-2 mt-4 mb-2">
            <Landmark className="w-5 h-5 text-theme-voice" />
            {s.department && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{s.department}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{s.service_name}</h1>
          {s.description_5th_grade && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{s.description_5th_grade}</p>}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-lg border border-brand-border p-5 max-w-md">
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Contact</h2>
          <div className="space-y-2 text-sm">
            {s.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${s.phone}`} className="text-brand-accent hover:underline">{s.phone}</a></div>}
            {s.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-brand-muted" /><a href={s.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">{s.website.replace(/^https?:\/\//, '')}</a></div>}
            {s.address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{s.address}</span></div>}
            {s.agency_id && <div className="pt-2 border-t border-brand-border mt-2"><Link href={`/agencies/${s.agency_id}`} className="text-brand-accent hover:underline text-sm">View parent agency</Link></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
