import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, MapPin, Globe, Video, ExternalLink, Building2, Phone, Navigation, CalendarPlus, Repeat, ArrowRight, Tag } from 'lucide-react'
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
      ? (supabase.from('organizations') as any).select('org_id, org_name, description_5th_grade, website, phone, logo_url, hero_image_url, donate_url, volunteer_url, email, mission_statement').eq('org_id', event.org_id).single()
      : Promise.resolve({ data: null }),
    getWayfinderContext('event', id, userProfile?.role),
  ])
  const org = orgResult.data

  const startDate = event.start_datetime ? new Date(event.start_datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const address = [event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', ')
  const mapUrl = address ? buildMapUrl(event.address || '', event.city || '', event.state || '', event.zip_code || '') : null
  const calendarUrl = buildAddToCalendarUrl(event as any)
  const isMultiDay = startDate && endDate && (endDate.getTime() - startDate.getTime()) > 86400000

  const orgName = orgResult?.data?.org_name || null
  const jsonLd = eventJsonLd(event as any, orgName)

  const heroImage = event.hero_image_url || (org as any)?.hero_image_url || null

  return (
    <div className="bg-paper min-h-screen">
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      {/* Hero — full-bleed image when available, gradient fallback */}
      <div className="relative overflow-hidden" style={{ minHeight: heroImage ? '400px' : undefined }}>
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt={event.event_name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.15) 100%)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1b5e8a 0%, #0d3b5e 100%)' }} />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" fill="none">
              <g opacity="0.08">
                {[0, 1, 2, 3, 4, 5, 6].map(i => {
                  const r = 10; const cx = 100; const cy = 50
                  const offsets = [[0, 0], [r, 0], [-r, 0], [r / 2, -r * 0.866], [-r / 2, -r * 0.866], [r / 2, r * 0.866], [-r / 2, r * 0.866]]
                  const [dx, dy] = offsets[i]
                  return <circle key={i} cx={cx + dx} cy={cy + dy} r={r} stroke="white" strokeWidth="0.4" />
                })}
              </g>
            </svg>
          </>
        )}
        <div className="max-w-[900px] mx-auto px-6 py-20 relative z-10 flex flex-col justify-end" style={{ minHeight: heroImage ? '400px' : undefined }}>
          {/* Breadcrumb on hero */}
          <nav style={{ fontSize: '0.65rem', color: "rgba(255,255,255,0.6)", marginBottom: '1rem' }}>
            <Link href="/" className="hover:underline" style={{ color: "rgba(255,255,255,0.7)" }}>Home</Link>
            <span className="mx-1.5">/</span>
            <Link href="/events" className="hover:underline" style={{ color: "rgba(255,255,255,0.7)" }}>Events</Link>
            <span className="mx-1.5">/</span>
            <span style={{ color: "rgba(255,255,255,0.9)" }}>{event.event_name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            {event.event_type && (
              <span className="px-2 py-0.5" style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fff', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                {event.event_type}
              </span>
            )}
            {(event.is_free === 'true' || event.is_free === 'Yes') && (
              <span className="px-2 py-0.5" style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, color: '#a3d9a3', background: 'rgba(163,217,163,0.12)' }}>Free</span>
            )}
            {event.is_virtual === 'true' && (
              <span className="flex items-center gap-1 px-2 py-0.5" style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: "rgba(255,255,255,0.8)", background: 'rgba(255,255,255,0.1)' }}>
                <Video className="w-3 h-3" /> Virtual
              </span>
            )}
          </div>

          <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', lineHeight: 1.1, color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
            {event.event_name}
          </h1>

          {/* Date bar */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {startDate && (
              <span className="flex items-center gap-2" style={{ fontSize: '0.95rem', color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                <Calendar className="w-4 h-4" />
                {isMultiDay ? (
                  <>
                    {startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    {' \u2013 '}
                    {endDate!.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </>
                ) : (
                  <>
                    {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    {' at '}
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </>
                )}
              </span>
            )}
            {address && event.is_virtual !== 'true' && (
              <span className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: "rgba(255,255,255,0.7)" }}>
                <MapPin className="w-4 h-4" />
                {event.city}{event.state ? `, ${event.state}` : ''}
              </span>
            )}
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap gap-3 mt-5">
            {event.registration_url && (
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#C75B2A', borderRadius: '2px' }}>
                Register Now <ArrowRight className="w-4 h-4" />
              </a>
            )}
            {calendarUrl && (
              <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 transition-colors hover:bg-white/20"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px' }}>
                <CalendarPlus className="w-4 h-4" /> Add to Calendar
              </a>
            )}
            {mapUrl && event.is_virtual !== 'true' && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 transition-colors hover:bg-white/20"
                style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px' }}>
                <Navigation className="w-4 h-4" /> Directions
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* Two-column: description + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: description */}
          <div className="lg:col-span-2">
            {event.description_5th_grade && (
              <section className="mb-10">
                <h2 className="font-serif" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>About This Event</h2>
                <div style={{ height: 2, width: 40, background: '#C75B2A', marginBottom: '1.25rem' }} />
                <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#3a3a3a' }}>{event.description_5th_grade}</p>
              </section>
            )}

            {/* Org card — rich, visual */}
            {org && (
              <section className="mb-10">
                <h2 className="font-serif" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Hosted By</h2>
                <div style={{ height: 2, width: 40, background: '#C75B2A', marginBottom: '1.25rem' }} />
                <div className="overflow-hidden" style={{ border: '1px solid #dde1e8', borderRadius: '4px' }}>
                  {/* Org hero banner */}
                  {(org as any).hero_image_url && (
                    <div className="relative w-full" style={{ height: '120px' }}>
                      <Image
                        src={(org as any).hero_image_url}
                        alt={org.org_name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)' }} />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {(org as any).logo_url ? (
                        <Image
                          src={(org as any).logo_url}
                          alt={org.org_name}
                          className="flex-shrink-0 object-contain"
                          style={{ border: '1px solid #eee', borderRadius: '4px', padding: '4px', background: '#fff' }}
                          width={56}
                          height={56}
                        />
                      ) : (
                        <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center" style={{ border: '1px solid #dde1e8', background: "#f4f5f7", borderRadius: '4px' }}>
                          <Building2 className="w-7 h-7" style={{ color: "#5c6474" }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link href={'/organizations/' + org.org_id} className="hover:underline font-serif" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                          {org.org_name}
                        </Link>
                        {(org as any).mission_statement && (
                          <p className="mt-1 italic" style={{ fontSize: '0.85rem', color: "#5c6474", lineHeight: 1.5 }}>
                            &ldquo;{(org as any).mission_statement}&rdquo;
                          </p>
                        )}
                        {!(org as any).mission_statement && (org as any).description_5th_grade && (
                          <p className="line-clamp-3 mt-1" style={{ fontSize: '0.85rem', color: "#5c6474", lineHeight: 1.5 }}>
                            {(org as any).description_5th_grade}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid #eee' }}>
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:underline" style={{ fontSize: '0.75rem', color: "#1b5e8a", fontWeight: 500 }}>
                          <Globe className="w-3.5 h-3.5" /> Website
                        </a>
                      )}
                      {(org as any).phone && (
                        <a href={'tel:' + (org as any).phone} className="flex items-center gap-1.5 hover:underline" style={{ fontSize: '0.75rem', color: "#1b5e8a", fontWeight: 500 }}>
                          <Phone className="w-3.5 h-3.5" /> {(org as any).phone}
                        </a>
                      )}
                      <Link href={'/organizations/' + org.org_id} className="flex items-center gap-1 hover:underline ml-auto" style={{ fontSize: '0.75rem', color: "#C75B2A", fontWeight: 600 }}>
                        View Organization <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar: details card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-5">
              {/* When card */}
              <div className="p-5" style={{ background: '#f8f7f5', border: '1px solid #e8e5df', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8a7f72', marginBottom: '0.75rem', fontWeight: 600 }}>When</h3>
                <div className="space-y-3">
                  {startDate && (
                    <div className="flex items-start gap-3">
                      <div className="text-center flex-shrink-0 pt-0.5" style={{ minWidth: '44px' }}>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C75B2A', fontWeight: 700 }}>
                          {startDate.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: '#2C2C2C' }}>
                          {startDate.getDate()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                          {isMultiDay ? 'Starts' : startDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#5c6474' }}>
                          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )}
                  {isMultiDay && endDate && (
                    <>
                      <div style={{ borderLeft: '2px dotted #dde1e8', height: '16px', marginLeft: '21px' }} />
                      <div className="flex items-start gap-3">
                        <div className="text-center flex-shrink-0 pt-0.5" style={{ minWidth: '44px' }}>
                          <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C75B2A', fontWeight: 700 }}>
                            {endDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: '#2C2C2C' }}>
                            {endDate.getDate()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Ends</div>
                          <div style={{ fontSize: '0.8rem', color: '#5c6474' }}>
                            {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {event.is_recurring === 'true' && event.recurrence_pattern && (
                    <div className="flex items-center gap-2 pt-1" style={{ color: "#5c6474" }}>
                      <Repeat className="w-3.5 h-3.5" />
                      <span style={{ fontSize: '0.8rem' }}>{event.recurrence_pattern}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Where card */}
              <div className="p-5" style={{ background: '#f8f7f5', border: '1px solid #e8e5df', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8a7f72', marginBottom: '0.75rem', fontWeight: 600 }}>Where</h3>
                {event.is_virtual === 'true' ? (
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" style={{ color: "#5c6474" }} />
                    <span style={{ fontSize: '0.9rem' }}>Virtual / Online</span>
                  </div>
                ) : address ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#C75B2A" }} />
                      <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{address}</span>
                    </div>
                    {mapUrl && (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline ml-6"
                        style={{ fontSize: '0.7rem', color: "#1b5e8a", fontWeight: 500 }}>
                        <Navigation className="w-3 h-3" /> Open in Google Maps
                      </a>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: "#5c6474" }}>Location TBD</span>
                )}
              </div>

              {/* Cost card */}
              <div className="p-5" style={{ background: '#f8f7f5', border: '1px solid #e8e5df', borderRadius: '4px' }}>
                <h3 style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8a7f72', marginBottom: '0.75rem', fontWeight: 600 }}>Cost</h3>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" style={{ color: (event.is_free === 'true' || event.is_free === 'Yes') ? '#2d8a4e' : '#5c6474' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: (event.is_free === 'true' || event.is_free === 'Yes') ? '#2d8a4e' : undefined }}>
                    {(event.is_free === 'true' || event.is_free === 'Yes') ? 'Free to participate' : `$${event.cost || 'TBD'}`}
                  </span>
                </div>
              </div>

              {/* Sticky CTA */}
              {event.registration_url && (
                <a href={event.registration_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 text-white transition-all hover:opacity-90"
                  style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', background: '#C75B2A', borderRadius: '2px' }}>
                  Register Now <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ height: 1, background: '#dde1e8', marginBottom: '1.5rem' }} />
        <Link href="/events" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline flex items-center gap-1">
          &larr; Back to Events
        </Link>
      </div>
    </div>
  )
}
