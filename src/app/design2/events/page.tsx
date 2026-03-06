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
    <div style={{ backgroundColor: '#F0EAE0' }} className="min-h-screen">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <Link
          href="/design2"
          className="text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors"
        >
          &larr; Back to Design2
        </Link>
      </div>

      {/* Page Header */}
      <header className="max-w-4xl mx-auto px-6 pt-8 pb-10">
        <div
          className="w-16 h-1 rounded-full mb-6"
          style={{ backgroundColor: '#805ad5' }}
        />
        <h1 className="font-serif text-4xl font-bold text-[#1A1A1A] mb-3">
          Events &amp; Calendar
        </h1>
        <p className="text-lg text-[#6B6560] max-w-2xl leading-relaxed">
          Discover community events, workshops, and gatherings happening across
          Houston. Find opportunities to connect, learn, and get involved.
        </p>
      </header>

      {/* Timeline List */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        {!events || events.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2DDD5] p-12 text-center">
            <p className="text-[#6B6560] text-lg">
              No upcoming events at this time. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const { month, day } = formatDate(event.start_datetime)
              const startTime = formatTime(event.start_datetime)
              const endTime = event.end_datetime
                ? formatTime(event.end_datetime)
                : null

              const location =
                event.address && event.city
                  ? `${event.address}, ${event.city}`
                  : event.city || event.address || null

              return (
                <Link
                  key={event.event_id}
                  href={`/design2/events/${event.event_id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-xl border border-[#E2DDD5] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex overflow-hidden">
                    {/* Date Column */}
                    <div
                      className="flex-shrink-0 w-24 flex flex-col items-center justify-center py-5"
                      style={{ borderRight: '3px solid #805ad5' }}
                    >
                      <span className="text-xs font-bold tracking-wider text-[#805ad5]">
                        {month}
                      </span>
                      {day && (
                        <span className="text-3xl font-bold text-[#1A1A1A] leading-tight">
                          {day}
                        </span>
                      )}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-serif text-lg font-bold text-[#1A1A1A] group-hover:text-[#805ad5] transition-colors truncate">
                          {event.event_name || 'Untitled Event'}
                        </h2>

                        {event.event_type && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#805ad5]/10 text-[#805ad5]">
                            {event.event_type}
                          </span>
                        )}

                        {event.is_virtual && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            Virtual
                          </span>
                        )}

                        {event.is_free && (
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-green-50 text-green-700">
                            Free
                          </span>
                        )}
                      </div>

                      {/* Time */}
                      <p className="text-sm text-[#6B6560] mb-1">
                        {startTime}
                        {endTime ? ` — ${endTime}` : ''}
                      </p>

                      {/* Location */}
                      {location && (
                        <p className="text-sm text-[#6B6560] truncate">
                          {location}
                        </p>
                      )}

                      {/* Description */}
                      {event.description_5th_grade && (
                        <p className="text-sm text-[#6B6560] mt-2 line-clamp-2">
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
      </section>
    </div>
  )
}
