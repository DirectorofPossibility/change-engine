import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'
import { createClient } from '@/lib/supabase/server'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { Clock, MapPin, Video } from 'lucide-react'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Community Events — Change Engine',
  description: 'Upcoming events, town halls, workshops, and community gatherings in the Houston area.',
}

export default async function EventsPage() {
  await requirePageEnabled('page_events')
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
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Community Events"
        subtitle="Town halls, workshops, volunteer days, and civic gatherings happening across Houston."
        color="#1e4d7a"
      />
      <Breadcrumb items={[{ label: 'Events' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>Upcoming</h2>
              <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{upcoming.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            {upcoming.slice(0, 4).map(function (e) {
              return <EventItem key={e.event_id} e={e} userZip={userZip} />
            })}
            {upcoming.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
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
              <h2 style={{ fontSize: '1.5rem', color: "#5c6474" }}>Past Events</h2>
              <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{past.length}</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
            <div style={{ opacity: 0.7 }}>
              {past.slice(0, 3).map(function (e) {
                return <EventItem key={e.event_id} e={e} userZip={userZip} />
              })}
              {past.length > 3 && (
                <details className="mt-2">
                  <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
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

      {/* Calendar callout + cross-links */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div className="mt-6 p-4 border border-blue/20 bg-blue/5">
          <p className="font-body text-sm text-ink">
            Want a calendar view? <Link href="/calendar" className="text-blue font-semibold hover:underline">View the full calendar</Link> with filtering by topic.
          </p>
        </div>
        <PageCrossLinks preset="community" />
      </div>
    </div>
  )
}

function EventItem({ e, userZip }: { e: any; userZip: string }) {
  const date = e.start_datetime ? new Date(e.start_datetime) : null
  return (
    <Link href={'/events/' + e.event_id} className="flex items-start gap-4 py-4 hover:opacity-80" style={{ borderBottom: '1px solid #dde1e8' }}>
      {date && (
        <div className="flex-shrink-0 w-14 h-14 flex flex-col items-center justify-center" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
          <span style={{ fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 700, color: "#1b5e8a" }}>{date.toLocaleDateString('en-US', { month: 'short' })}</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1 }}>{date.getDate()}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 style={{ fontWeight: 600,  }}>{e.event_name}</h3>
        {e.description_5th_grade && <p className="line-clamp-2 mt-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>{e.description_5th_grade}</p>}
        <div className="flex flex-wrap gap-3 mt-2">
          {date && (
            <span className="flex items-center gap-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
              <Clock className="w-3 h-3" />{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {e.is_virtual === 'true' ? (
            <span className="flex items-center gap-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
              <Video className="w-3 h-3" />Virtual
            </span>
          ) : e.city && (
            <span className="flex items-center gap-1" style={{ fontSize: '0.875rem', color: "#5c6474" }}>
              <MapPin className="w-3 h-3" />{e.city}
            </span>
          )}
          {userZip && e.zip_code === userZip && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: "#1b5e8a" }}>Near you</span>
          )}
          {e.is_free === 'true' && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#2d5a27' }}>Free</span>
          )}
          {e.event_type && (
            <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{e.event_type}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
