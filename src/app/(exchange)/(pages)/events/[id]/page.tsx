import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Calendar, Clock, MapPin, Globe, Video, ExternalLink, Users } from 'lucide-react'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('event_name, description_5th_grade').eq('event_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.event_name, description: data.description_5th_grade || 'Community event details.' }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('*').eq('event_id', id).single()
  if (!event) notFound()

  let org: { org_id: string; org_name: string; website: string | null } | null = null
  if (event.org_id) {
    const { data } = await supabase.from('organizations').select('org_id, org_name, website').eq('org_id', event.org_id).single()
    org = data
  }

  const startDate = event.start_datetime ? new Date(event.start_datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const address = [event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', ')

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: event.event_name }]} />
          <div className="flex items-center gap-2 mt-4 mb-2">
            <Calendar className="w-5 h-5 text-brand-accent" />
            {event.event_type && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{event.event_type}</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{event.event_name}</h1>
          {event.description_5th_grade && <p className="text-brand-muted mt-3 max-w-2xl leading-relaxed">{event.description_5th_grade}</p>}
          {event.registration_url && (
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors">
              Register <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-brand-border p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">When</h2>
            <div className="space-y-2 text-sm">
              {startDate && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-muted" /><span className="text-brand-text font-medium">{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>}
              {startDate && <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-muted" /><span className="text-brand-text">{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}{endDate ? ` - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}</span></div>}
              {event.is_recurring === 'true' && event.recurrence_pattern && <div className="text-brand-muted">Recurring: {event.recurrence_pattern}</div>}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-brand-border p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-brand-muted mb-3">Where</h2>
            <div className="space-y-2 text-sm">
              {event.is_virtual === 'true' ? (
                <div className="flex items-center gap-2"><Video className="w-4 h-4 text-brand-muted" /><span className="text-brand-text">Virtual / Online</span></div>
              ) : address ? (
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-muted mt-0.5" /><span className="text-brand-text">{address}</span></div>
              ) : (
                <span className="text-brand-muted">Location TBD</span>
              )}
              {event.is_free === 'true' && <div className="text-theme-money font-medium">Free event</div>}
              {org && <div className="pt-2 border-t border-brand-border mt-2"><span className="text-brand-muted">Hosted by </span><Link href={`/organizations/${org.org_id}`} className="text-brand-accent hover:underline">{org.org_name}</Link></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
