import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Globe, Video, ExternalLink, Building2, Phone, Navigation, CalendarPlus, Repeat } from 'lucide-react'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import Image from 'next/image'
import { eventJsonLd } from '@/lib/jsonld'


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
  event_name: string; start_datetime?: string | null; end_datetime?: string | null
  description_5th_grade?: string | null; address?: string | null; city?: string | null
  state?: string | null; is_virtual?: string | null
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

  return (
    <div className="bg-paper min-h-screen">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1b5e8a, #1b5e8a55)' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" fill="none">
          <g opacity="0.1">
            {[0, 1, 2, 3, 4, 5, 6].map(i => {
              const r = 10; const cx = 100; const cy = 50
              const offsets = [[0, 0], [r, 0], [-r, 0], [r / 2, -r * 0.866], [-r / 2, -r * 0.866], [r / 2, r * 0.866], [-r / 2, r * 0.866]]
              const [dx, dy] = offsets[i]
              return <circle key={i} cx={cx + dx} cy={cy + dy} r={r} stroke="white" strokeWidth="0.4" />
            })}
            <circle cx={100} cy={50} r={22} stroke="white" strokeWidth="0.25" />
          </g>
        </svg>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "rgba(255,255,255,0.7)", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {event.event_type && (
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "rgba(255,255,255,0.7)" }}>{event.event_type}</span>
            )}
            {event.is_free === 'true' && (
              <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#a3d9a3' }}>Free</span>
            )}
            {event.is_virtual === 'true' && (
              <span className="flex items-center gap-1" style={{ fontSize: '0.65rem', color: "rgba(255,255,255,0.7)" }}>
                <Video className="w-3 h-3" /> Virtual
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.5rem', color: '#ffffff' }}>
            {event.event_name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {startDate && (
              <span className="flex items-center gap-2" style={{ fontSize: '0.9rem', color: "rgba(255,255,255,0.8)" }}>
                <Clock className="w-4 h-4" />
                {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' at '}
                {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {endDate ? ' - ' + endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 text-white transition-opacity hover:opacity-90" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', background: '#1b5e8a' }}>
                Register <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {calendarUrl && (
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: "#1b5e8a" }}>
                <CalendarPlus className="w-4 h-4" /> Add to Calendar
              </a>
            )}
            {mapUrl && event.is_virtual !== 'true' && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline" style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: "#1b5e8a" }}>
                <Navigation className="w-4 h-4" /> Get Directions
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/events" className="hover:underline" style={{ color: "#1b5e8a" }}>Events</Link>
          <span className="mx-2">/</span>
          <span>{event.event_name}</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Description */}
        {event.description_5th_grade && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>About This Event</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{event.description_5th_grade}</p>
          </section>
        )}

        {/* When & Where */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-5" style={{ border: '1px solid #dde1e8', background: "#f4f5f7" }}>
            <h2 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginBottom: '0.75rem' }}>When</h2>
            <div className="space-y-2">
              {startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: "#5c6474" }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500,  }}>{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {startDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "#5c6474" }} />
                  <span style={{ fontSize: '0.9rem',  }}>
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {endDate ? ' - ' + endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                  </span>
                </div>
              )}
              {event.is_recurring === 'true' && event.recurrence_pattern && (
                <div className="flex items-center gap-2" style={{ color: "#5c6474" }}>
                  <Repeat className="w-4 h-4" />
                  <span style={{ fontSize: '0.9rem' }}>{event.recurrence_pattern}</span>
                </div>
              )}
              {event.cost && event.is_free !== 'true' && (
                <div style={{ fontSize: '0.9rem', color: "#5c6474", marginTop: '0.25rem' }}>Cost: {event.cost}</div>
              )}
            </div>
          </div>

          <div className="p-5" style={{ border: '1px solid #dde1e8', background: "#f4f5f7" }}>
            <h2 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: "#5c6474", marginBottom: '0.75rem' }}>Where</h2>
            <div className="space-y-2">
              {event.is_virtual === 'true' ? (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" style={{ color: "#5c6474" }} />
                  <span style={{ fontSize: '0.9rem',  }}>Virtual / Online</span>
                </div>
              ) : address ? (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" style={{ color: "#5c6474" }} />
                    <span style={{ fontSize: '0.9rem',  }}>{address}</span>
                  </div>
                  {mapUrl && (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-6 hover:underline" style={{ fontSize: '0.65rem', color: "#1b5e8a" }}>
                      <Navigation className="w-3 h-3" /> Open in Google Maps
                    </a>
                  )}
                </>
              ) : (
                <span style={{ fontSize: '0.9rem', color: "#5c6474" }}>Location TBD</span>
              )}
            </div>
          </div>
        </div>

        <div className="my-10" style={{ height: 1, background: '#dde1e8' }} />

        {/* Host Organization */}
        {org && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Hosted By</h2>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div className="flex items-start gap-4">
              {(org as any).logo_url ? (
                <Image src={(org as any).logo_url} alt={org.org_name} className="w-12 h-12 object-contain flex-shrink-0" style={{ border: '1px solid #dde1e8' }} width={48} height={48} />
              ) : (
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center" style={{ border: '1px solid #dde1e8', background: "#f4f5f7" }}>
                  <Building2 className="w-6 h-6" style={{ color: "#5c6474" }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Link href={'/organizations/' + org.org_id} className="hover:underline" style={{ fontSize: '1.1rem', fontWeight: 700,  }}>
                  {org.org_name}
                </Link>
                {(org as any).description_5th_grade && (
                  <p className="line-clamp-2 mt-1" style={{ fontSize: '0.85rem', color: "#5c6474" }}>{(org as any).description_5th_grade}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ fontSize: '0.65rem', color: "#1b5e8a" }}>
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                  {(org as any).phone && (
                    <a href={'tel:' + (org as any).phone} className="flex items-center gap-1 hover:underline" style={{ fontSize: '0.65rem', color: "#1b5e8a" }}>
                      <Phone className="w-3 h-3" /> {(org as any).phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/events" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Events
        </Link>
      </div>
    </div>
  )
}
