import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Clock, MapPin, Video } from 'lucide-react'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Events — Change Engine',
  description: 'Upcoming events, town halls, workshops, and community gatherings in the Houston area.',
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('event_id, event_name, description_5th_grade, event_type, start_datetime, end_datetime, address, city, zip_code, is_virtual, is_free, registration_url')
    .eq('is_active' as any, 'Yes')
    .order('start_datetime', { ascending: true })

  const now = new Date().toISOString()

  function geoSort(list: typeof events) {
    if (!userZip || !list) return list || []
    return list.slice().sort((a, b) => {
      const aLocal = (a as any).zip_code === userZip ? -1 : 0
      const bLocal = (b as any).zip_code === userZip ? -1 : 0
      return aLocal - bLocal
    })
  }

  const upcoming = geoSort((events || []).filter(function (e) { return !e.start_datetime || e.start_datetime >= now }))
  const past = (events || []).filter(function (e) { return e.start_datetime && e.start_datetime < now })

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Community Events
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Town halls, workshops, volunteer days, and civic gatherings happening across Houston.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Events</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Upcoming</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{upcoming.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            {upcoming.slice(0, 4).map(function (e) {
              return <EventItem key={e.event_id} e={e} userZip={userZip} />
            })}
            {upcoming.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                  See {upcoming.length - 4} more upcoming events
                </summary>
                {upcoming.slice(4).map(function (e) {
                  return <EventItem key={e.event_id} e={e} userZip={userZip} />
                })}
              </details>
            )}
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: MUTED }}>Past Events</h2>
              <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{past.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />
            <div style={{ opacity: 0.7 }}>
              {past.slice(0, 3).map(function (e) {
                return <EventItem key={e.event_id} e={e} userZip={userZip} />
              })}
              {past.length > 3 && (
                <details className="mt-2">
                  <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                    See {past.length - 3} more past events
                  </summary>
                  {past.slice(3).map(function (e) {
                    return <EventItem key={e.event_id} e={e} userZip={userZip} />
                  })}
                </details>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}

function EventItem({ e, userZip }: { e: any; userZip: string }) {
  const date = e.start_datetime ? new Date(e.start_datetime) : null
  return (
    <Link href={'/events/' + e.event_id} className="flex items-start gap-4 py-4 hover:opacity-80" style={{ borderBottom: '1px solid ' + RULE_COLOR }}>
      {date && (
        <div className="flex-shrink-0 w-14 h-14 flex flex-col items-center justify-center" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
          <span style={{ fontFamily: MONO, fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700, color: CLAY }}>{date.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span style={{ fontFamily: SERIF, fontSize: '1.2rem', fontWeight: 700, color: INK, lineHeight: 1 }}>{date.getDate()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 style={{ fontFamily: SERIF, fontWeight: 600, color: INK }}>{e.event_name}</h3>
        {e.description_5th_grade && <p className="line-clamp-2 mt-1" style={{ fontFamily: SERIF, fontSize: '0.85rem', color: MUTED }}>{e.description_5th_grade}</p>}
        <div className="flex flex-wrap gap-3 mt-2">
          {date && (
            <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
              <Clock className="w-3 h-3" />{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {e.is_virtual === 'true' ? (
            <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
              <Video className="w-3 h-3" />Virtual
            </span>
          ) : e.city && (
            <span className="flex items-center gap-1" style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
              <MapPin className="w-3 h-3" />{e.city}
            </span>
          )}
          {userZip && e.zip_code === userZip && (
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', fontWeight: 500, color: CLAY }}>Near you</span>
          )}
          {e.is_free === 'true' && (
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', fontWeight: 500, color: '#2d5a27' }}>Free</span>
          )}
          {e.event_type && (
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>{e.event_type}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
