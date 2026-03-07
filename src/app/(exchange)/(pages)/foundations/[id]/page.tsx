import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
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

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Foundations', href: '/foundations' }, { label: f.name }]} />
          <div className="flex items-center gap-2 mt-4 mb-2">
            {f.type && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{f.type}</span>}
            {f.geo_level && <span className="text-xs text-brand-muted">/ {f.geo_level}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{f.name}</h1>
          {f.mission && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{f.mission}</p>}
          {f.website_url && (
            <a href={f.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors">
              Visit Website <Globe className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financials & Details */}
              <div className="bg-white rounded-lg border border-brand-border p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Details</h2>
                <div className="space-y-2 text-sm">
                  {f.assets && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Assets:</span> <span className="font-medium text-brand-text">{f.assets}</span></div>}
                  {f.annual_giving && <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Annual giving:</span> <span className="font-medium text-brand-text">{f.annual_giving}</span></div>}
                  {f.founded_year && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-muted" /><span className="text-brand-muted">Founded:</span> <span className="text-brand-text">{f.founded_year}</span></div>}
                </div>
              </div>
              {/* Contact */}
              <div className="bg-white rounded-lg border border-brand-border p-5">
                <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Contact</h2>
                <div className="space-y-2 text-sm">
                  {f.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-muted" /><a href={`tel:${f.phone}`} className="text-brand-accent hover:underline">{f.phone}</a></div>}
                  {f.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-muted" /><a href={`mailto:${f.email}`} className="text-brand-accent hover:underline">{f.email}</a></div>}
                  {address && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{address}</span></div>}
                </div>
              </div>
              {/* Focus Areas */}
              {focusAreas.length > 0 && (
                <div className="bg-white rounded-lg border border-brand-border p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Focus Areas</h2>
                  <div className="flex flex-wrap gap-2">
                    {focusAreas.map(function (fa) {
                      return <Link key={fa.focus_id} href={`/explore/focus/${fa.focus_id}`} className="text-xs bg-brand-bg text-brand-text px-2.5 py-1 rounded hover:bg-brand-border transition-colors">{fa.focus_area_name}</Link>
                    })}
                  </div>
                </div>
              )}
              {/* People */}
              {people && people.length > 0 && (
                <div className="bg-white rounded-lg border border-brand-border p-5">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-muted mb-3"><Users className="w-4 h-4" />People</h2>
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
          </div>

          {/* Wayfinder sidebar */}
          <aside className="lg:w-80 shrink-0">
            <DetailWayfinder data={wayfinderData} currentType="foundation" currentId={id} userRole={userProfile?.role} />
          </aside>
        </div>
      </div>
    </div>
  )
}
