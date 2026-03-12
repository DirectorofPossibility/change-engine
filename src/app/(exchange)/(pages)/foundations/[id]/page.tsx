import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Globe, Phone, Mail, MapPin, Calendar, DollarSign, Users } from 'lucide-react'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('foundations').select('name, mission').eq('id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.name, description: data.mission || 'Foundation details.' }
}

export default async function FoundationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: f } = await supabase.from('foundations').select('*').eq('id', id).single()
  if (!f) notFound()

  // Get people associated with this foundation
  const { data: people } = await supabase
    .from('foundation_people')
    .select('person_name, role, title')
    .eq('foundation_id', id)
    .limit(20)

  // Get focus areas
  const userProfile = await getUserProfile()

  const [focusJunctionsResult, wayfinderData] = await Promise.all([
    supabase.from('foundation_focus_areas').select('focus_id').eq('foundation_id', id),
    getWayfinderContext('foundation', id, userProfile?.role),
  ])

  const focusIds = (focusJunctionsResult.data || []).map((j: any) => j.focus_id)
  let focusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (focusIds.length > 0) {
    const { data } = await supabase.from('focus_areas').select('focus_id, focus_area_name').in('focus_id', focusIds)
    focusAreas = data || []
  }

  const address = [f.address, f.city, f.state_code, f.zip_code].filter(Boolean).join(', ')

  const eyebrowParts = [f.type, f.geo_level].filter(Boolean)

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Foundations', href: '/foundations' }, { label: f.name }]}
      eyebrow={eyebrowParts.length > 0 ? { text: eyebrowParts.join(' / ') } : undefined}
      title={f.name}
      subtitle={f.mission}
      themeColor="#C75B2A"
      wayfinderData={wayfinderData}
      wayfinderType="foundation"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      feedbackType="foundation"
      feedbackId={id}
      feedbackName={f.name}
      actions={{
        share: { title: f.name, url: `https://www.changeengine.us/foundations/${id}` },
      }}
      metaRow={
        f.website_url ? (
          <a href={f.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline">
            Visit Website <Globe className="w-4 h-4" />
          </a>
        ) : undefined
      }
      sidebar={
        <>
          {/* No additional sidebar content beyond wayfinder + feedback */}
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financials & Details */}
        <div className="bg-white border border-brand-border p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Details</h2>
          <div className="space-y-2 text-sm">
            {f.assets && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Assets:</span> <span className="font-medium text-brand-text">{f.assets}</span></div>}
            {f.annual_giving && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Annual giving:</span> <span className="font-medium text-brand-text">{f.annual_giving}</span></div>}
            {f.founded_year && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Founded:</span> <span className="text-brand-text">{f.founded_year}</span></div>}
          </div>
        </div>
        {/* Contact */}
        <div className="bg-white border border-brand-border p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Contact</h2>
          <div className="space-y-2 text-sm">
            {f.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${f.phone}`} className="text-brand-accent hover:underline">{f.phone}</a></div>}
            {f.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-muted" /><a href={`mailto:${f.email}`} className="text-brand-accent hover:underline">{f.email}</a></div>}
            {address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{address}</span></div>}
          </div>
        </div>
        {/* Focus Areas */}
        {focusAreas.length > 0 && (
          <div className="bg-white border border-brand-border p-5">
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Focus Areas</h2>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map(function (fa) {
                return <Link key={fa.focus_id} href={`/explore/focus/${fa.focus_id}`} className="text-xs bg-brand-bg text-brand-text px-2.5 py-1 rounded hover:bg-brand-border transition-colors">{fa.focus_area_name}</Link>
              })}
            </div>
          </div>
        )}
        {/* People */}
        {people && people.length > 0 && (
          <div className="bg-white border border-brand-border p-5">
            <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3"><Users className="w-4 h-4" />People</h2>
            <div className="space-y-2">
              {people.map(function (p: any, i: number) {
                return (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-brand-text">{p.person_name}</span>
                    {(p.role || p.title) && <span className="text-brand-muted ml-2">{p.title || p.role}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DetailPageLayout>
  )
}
