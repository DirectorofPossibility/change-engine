import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { Calendar, MapPin, Clock, Video } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Community Events — Community Exchange',
  description: 'Upcoming events, town halls, workshops, and community gatherings in the Houston area.',
}

export default async function EventsPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('event_id, event_name, description_5th_grade, event_type, start_datetime, end_datetime, address, city, zip_code, is_virtual, is_free, registration_url')
    .order('start_datetime', { ascending: true })

  const now = new Date().toISOString()

  // Sort local events to top when ZIP is set
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

  function EventCard({ e }: { e: any }) {
    const date = e.start_datetime ? new Date(e.start_datetime) : null
    return (
      <Link href={`/events/${e.event_id}`} className="block bg-white rounded-lg border border-brand-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          {date && (
            <div className="flex-shrink-0 w-14 h-14 bg-brand-accent/10 rounded-lg flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-brand-accent uppercase">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
              <span className="text-lg font-bold text-brand-text leading-none">{date.getDate()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-brand-text">{e.event_name}</h3>
            {e.description_5th_grade && <p className="text-sm text-brand-muted mt-1 line-clamp-2">{e.description_5th_grade}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-brand-muted">
              {date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>}
              {e.is_virtual === 'true' ? <span className="flex items-center gap-1"><Video className="w-3 h-3" />Virtual</span> : e.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.city}</span>}
              {userZip && (e as any).zip_code === userZip && <span className="text-brand-accent font-medium">Near you</span>}
              {e.is_free === 'true' && <span className="bg-theme-money/10 text-theme-money px-2 py-0.5 rounded font-medium">Free</span>}
              {e.event_type && <span className="bg-brand-bg px-2 py-0.5 rounded">{e.event_type}</span>}
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="tripod" gradientColor="#d69e2e" title="Community Events" subtitle="Town halls, workshops, volunteer days, and civic gatherings happening across Houston." />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Events' }]} />
        {upcoming.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-serif font-bold text-brand-text mb-4">Upcoming</h2>
            <div className="space-y-3">{upcoming.map(function (e) { return <EventCard key={e.event_id} e={e} /> })}</div>
          </div>
        )}
        {past.length > 0 && (
          <div>
            <h2 className="text-lg font-serif font-bold text-brand-muted mb-4">Past Events</h2>
            <div className="space-y-3 opacity-70">{past.map(function (e) { return <EventCard key={e.event_id} e={e} /> })}</div>
          </div>
        )}
      </div>
    </div>
  )
}
