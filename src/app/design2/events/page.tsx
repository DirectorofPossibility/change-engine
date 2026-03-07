import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Events — Community Exchange',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return { month: 'TBD', day: '' }
  const d = new Date(dateStr)
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = d.getDate().toString()
  return { month, day }
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return 'TBD'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select(
      'event_id, event_name, description_5th_grade, event_type, start_datetime, end_datetime, address, city, is_virtual, is_free, org_id'
    )
    .order('start_datetime', { ascending: true })
    .limit(30)

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Dark Editorial Hero */}
      <section style={{ background: '#1a1a2e', padding: '40px 32px 48px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ marginBottom: '24px', fontSize: '13px' }}>
            <Link href="/design2" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
              Home
            </Link>
            <span style={{ color: '#C75B2A', margin: '0 8px' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.8)' }}>Events</span>
          </nav>

          {/* Accent bar */}
          <div style={{ width: '40px', height: '2px', background: '#C75B2A', marginBottom: '20px' }} />

          {/* Title */}
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: '#FFFFFF',
              marginBottom: '12px',
              lineHeight: 1.2,
            }}
          >
            Events
          </h1>

          {/* Subtitle */}
          <p
            className="font-serif"
            style={{
              fontSize: '18px',
              fontStyle: 'italic',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '16px',
            }}
          >
            Gatherings, workshops, and happenings across Houston
          </p>

          {/* Intro text */}
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '720px', lineHeight: 1.6 }}>
            Discover community events, workshops, and gatherings happening across Houston.
            Find opportunities to connect, learn, and get involved.
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ background: '#FAF8F5', padding: '40px 32px 64px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {!events || events.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2DDD5',
              borderRadius: '0.75rem',
              padding: '48px',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6B6560', fontSize: '16px' }}>
                No upcoming events at this time. Check back soon.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.map((event) => {
                const { month, day } = formatDate(event.start_datetime)
                const startTime = formatTime(event.start_datetime)
                const endTime = event.end_datetime ? formatTime(event.end_datetime) : null
                const location =
                  event.address && event.city
                    ? `${event.address}, ${event.city}`
                    : event.city || event.address || null

                return (
                  <Link
                    key={event.event_id}
                    href={`/design2/events/${event.event_id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="evt-card" style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2DDD5',
                      borderRadius: '0.75rem',
                      display: 'flex',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}>
                      {/* Date Column */}
                      <div style={{
                        flexShrink: 0,
                        width: '96px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px 0',
                        borderRight: '3px solid #C75B2A',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#C75B2A' }}>
                          {month}
                        </span>
                        {day && (
                          <span style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.1 }}>
                            {day}
                          </span>
                        )}
                      </div>

                      {/* Content Column */}
                      <div style={{ flex: 1, padding: '20px', minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h2
                            className="font-serif"
                            style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#1A1A1A',
                              lineHeight: 1.3,
                            }}
                          >
                            {event.event_name || 'Untitled Event'}
                          </h2>

                          {event.event_type && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(199,91,42,0.1)',
                              color: '#C75B2A',
                            }}>
                              {event.event_type}
                            </span>
                          )}

                          {event.is_virtual && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#DBEAFE',
                              color: '#1D4ED8',
                            }}>
                              Virtual
                            </span>
                          )}

                          {event.is_free && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '9px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: '#D1FAE5',
                              color: '#065F46',
                            }}>
                              Free
                            </span>
                          )}
                        </div>

                        {/* Time */}
                        <p style={{ fontSize: '13px', color: '#6B6560', marginBottom: '4px' }}>
                          {startTime}{endTime ? ` — ${endTime}` : ''}
                        </p>

                        {/* Location */}
                        {location && (
                          <p style={{
                            fontSize: '13px',
                            color: '#6B6560',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {location}
                          </p>
                        )}

                        {/* Description */}
                        {event.description_5th_grade && (
                          <p style={{
                            fontSize: '13px',
                            color: '#6B6560',
                            marginTop: '8px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}>
                            {event.description_5th_grade}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Hover styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .evt-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
      `}} />
    </div>
  )
}
