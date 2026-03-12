import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Globe, Video, ExternalLink, Users, Building2, Phone, Mail, Navigation, CalendarPlus, Repeat } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import Image from 'next/image'
import { eventJsonLd } from '@/lib/jsonld'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('event_name, description_5th_grade').eq('event_id', id).single()
  if (!data) return { title: 'Not Found' }
  return { title: data.event_name, description: data.description_5th_grade || 'Community event details.' }
}

function buildMapUrl(address: string, city?: string, state?: string, zip?: string): string {
  const parts = [address, city, state, zip].filter(Boolean).join(', ')
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(parts)
}

function buildAddToCalendarUrl(event: {
  event_name: string
  start_datetime?: string | null
  end_datetime?: string | null
  description_5th_grade?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  is_virtual?: string | null
}): string {
  const start = event.start_datetime ? new Date(event.start_datetime) : null
  const end = event.end_datetime ? new Date(event.end_datetime) : start
  if (!start) return ''

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const location = event.is_virtual === 'true' ? 'Virtual' : [event.address, event.city, event.state].filter(Boolean).join(', ')
  const desc = (event.description_5th_grade || '').substring(0, 500)

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.event_name)}&dates=${fmt(start)}/${end ? fmt(end) : fmt(start)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('*').eq('event_id', id).single()
  if (!event) notFound()

  const userProfile = await getUserProfile()

  const [orgResult, wayfinderData] = await Promise.all([
    event.org_id
      ? (supabase.from('organizations') as any).select('org_id, org_name, description_5th_grade, website, phone, logo_url, donate_url, volunteer_url').eq('org_id', event.org_id).single()
      : Promise.resolve({ data: null }),
    getWayfinderContext('event', id, userProfile?.role),
  ])
  const org = orgResult.data

  const startDate = event.start_datetime ? new Date(event.start_datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const address = [event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', ')
  const mapUrl = address ? buildMapUrl(event.address || '', event.city || '', event.state || '', event.zip_code || '') : null
  const calendarUrl = buildAddToCalendarUrl(event as any)

  const orgName = orgResult?.data?.org_name || null
  const jsonLd = eventJsonLd(event as any, orgName)

  const eyebrowMeta = (
    <>
      {event.event_type && <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{event.event_type}</span>}
      {event.is_free === 'true' && <span className="text-xs font-medium text-theme-money bg-theme-money/10 px-2 py-0.5 rounded">Free</span>}
      {event.is_virtual === 'true' && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"><Video className="w-3 h-3" /> Virtual</span>}
    </>
  )

  const metaRow = (
    <>
      {startDate && (
        <span className="text-brand-muted flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          {' at '}
          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          {endDate ? ` - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
        </span>
      )}
      {event.registration_url && (
        <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-sm font-medium text-white bg-brand-accent hover:bg-brand-accent-hover transition-colors">
          Register <ExternalLink className="w-4 h-4" />
        </a>
      )}
      {calendarUrl && (
        <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline">
          <CalendarPlus className="w-4 h-4" /> Add to Calendar
        </a>
      )}
      {mapUrl && event.is_virtual !== 'true' && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline">
          <Navigation className="w-4 h-4" /> Get Directions
        </a>
      )}
    </>
  )

  const sidebarContent = (
    <>
      {/* iCal subscription */}
      <div className="bg-brand-bg-alt p-4 text-sm text-brand-muted flex items-center gap-3">
        <CalendarPlus className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-medium text-brand-text">Subscribe to our calendar</span>
          {' — '}
          <a href="/api/calendar.ics" className="text-brand-accent hover:underline">Download .ics file</a>
          {' or add '}
          <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-brand-border">https://www.changeengine.us/api/calendar.ics</code>
          {' to your calendar app.'}
        </div>
      </div>
    </>
  )

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Events', href: '/events' }, { label: event.event_name }]}
      eyebrow={{ text: 'Event', bgColor: '#0d1117' }}
      eyebrowMeta={eyebrowMeta}
      title={event.event_name}
      subtitle={null}
      metaRow={metaRow}
      themeColor="#38a169"
      wayfinderData={wayfinderData}
      wayfinderType="event"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      actions={{
        translate: { isTranslated: false, contentType: 'event', contentId: id },
        share: { title: event.event_name, url: `https://www.changeengine.us/events/${id}` },
      }}
      sidebar={sidebarContent}
      feedbackType="event"
      feedbackId={id}
      feedbackName={event.event_name}
      jsonLd={jsonLd}
    >
      {/* Description */}
      {event.description_5th_grade && (
        <div className="bg-white border border-brand-border p-6 mb-6">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">About This Event</h2>
          <p className="text-brand-text leading-relaxed">{event.description_5th_grade}</p>
        </div>
      )}

      {/* When & Where cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-brand-border p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">When</h2>
          <div className="space-y-2 text-sm">
            {startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-muted" />
                <span className="text-brand-text font-medium">{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
            {startDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-muted" />
                <span className="text-brand-text">
                  {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {endDate ? ` - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                </span>
              </div>
            )}
            {event.is_recurring === 'true' && event.recurrence_pattern && (
              <div className="flex items-center gap-2 text-brand-muted">
                <Repeat className="w-4 h-4" />
                <span>{event.recurrence_pattern}</span>
              </div>
            )}
            {event.cost && event.is_free !== 'true' && (
              <div className="text-brand-muted mt-1">Cost: {event.cost}</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-brand-border p-5">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Where</h2>
          <div className="space-y-2 text-sm">
            {event.is_virtual === 'true' ? (
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                <span className="text-brand-text">Virtual / Online</span>
              </div>
            ) : address ? (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-muted mt-0.5" />
                  <span className="text-brand-text">{address}</span>
                </div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-accent hover:underline text-xs ml-6"
                  >
                    <Navigation className="w-3 h-3" /> Open in Google Maps
                  </a>
                )}
              </>
            ) : (
              <span className="text-brand-muted">Location TBD</span>
            )}
          </div>
        </div>
      </div>

      {/* Host Organization */}
      {org && (
        <div className="bg-white border border-brand-border p-5 mb-6">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-3">Hosted By</h2>
          <div className="flex items-start gap-4">
            {(org as any).logo_url ? (
              <Image src={(org as any).logo_url} alt={org.org_name} className="w-12 h-12 object-contain bg-brand-bg border border-brand-border"  width={48} height={48} />
            ) : (
              <div className="w-12 h-12 bg-brand-bg-alt border border-brand-border flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-muted" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/organizations/${org.org_id}`} className="text-lg font-display font-bold text-brand-text hover:text-brand-accent transition-colors">
                {org.org_name}
              </Link>
              {(org as any).description_5th_grade && (
                <p className="text-sm text-brand-muted mt-1 line-clamp-2">{(org as any).description_5th_grade}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
                {(org as any).phone && (
                  <a href={`tel:${(org as any).phone}`} className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {(org as any).phone}
                  </a>
                )}
                {(org as any).donate_url && (
                  <a href={(org as any).donate_url} target="_blank" rel="noopener noreferrer" className="text-xs text-theme-money hover:underline">
                    Donate
                  </a>
                )}
                {(org as any).volunteer_url && (
                  <a href={(org as any).volunteer_url} target="_blank" rel="noopener noreferrer" className="text-xs text-theme-health hover:underline">
                    Volunteer
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DetailPageLayout>
  )
}
