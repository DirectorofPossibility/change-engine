import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Calendar, Clock, MapPin, Video, ExternalLink,
  ArrowLeft, Tag, RefreshCw, DollarSign
} from 'lucide-react'

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

  let org: { org_id: string; org_name: string; logo_url: string | null; website: string | null } | null = null
  if (event.org_id) {
    const { data } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url, website')
      .eq('org_id', event.org_id)
      .single()
    org = data
  }

  const startDate = event.start_datetime ? new Date(event.start_datetime) : null
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null
  const address = [event.address, event.city, event.state, event.zip_code].filter(Boolean).join(', ')

  const isVirtual = String(event.is_virtual) === 'true'
  const isFree = String(event.is_free) === 'true'
  const isRecurring = String(event.is_recurring) === 'true'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          href="/design2/events"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: '#C75B2A' }}
        >
          <ArrowLeft size={16} />
          Back to Events
        </Link>
      </div>

      {/* Hero card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="rounded-xl p-6 sm:p-8" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD5' }}>
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {event.event_type && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#FAF8F5', color: '#C75B2A' }}
              >
                <Tag size={12} />
                {event.event_type}
              </span>
            )}
            {isVirtual && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
              >
                <Video size={12} />
                Virtual
              </span>
            )}
            {isFree && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <DollarSign size={12} />
                Free
              </span>
            )}
            {isRecurring && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-lg"
                style={{ backgroundColor: '#FFF7ED', color: '#C2410C' }}
              >
                <RefreshCw size={12} />
                Recurring
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold" style={{ color: '#1a1a1a' }}>
            {event.event_name}
          </h1>

          {event.description_5th_grade && (
            <p className="mt-4 text-base leading-relaxed max-w-2xl" style={{ color: '#6B6560' }}>
              {event.description_5th_grade}
            </p>
          )}

          {/* Registration CTA */}
          {event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#C75B2A' }}
            >
              Register Now
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* When card */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD5' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#6B6560' }}>
              When
            </h2>
            <div className="space-y-3 text-sm">
              {startDate && (
                <div className="flex items-center gap-3">
                  <Calendar size={18} style={{ color: '#C75B2A' }} />
                  <span className="font-medium" style={{ color: '#1a1a1a' }}>
                    {startDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {startDate && (
                <div className="flex items-center gap-3">
                  <Clock size={18} style={{ color: '#C75B2A' }} />
                  <span style={{ color: '#1a1a1a' }}>
                    {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {endDate ? (' - ' + endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })) : ''}
                  </span>
                </div>
              )}
              {isRecurring && event.recurrence_pattern && (
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} style={{ color: '#C75B2A' }} />
                  <span style={{ color: '#6B6560' }}>{event.recurrence_pattern}</span>
                </div>
              )}
            </div>
          </div>

          {/* Where card */}
          <div className="rounded-xl p-5" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD5' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#6B6560' }}>
              Where
            </h2>
            <div className="space-y-3 text-sm">
              {isVirtual ? (
                <div className="flex items-center gap-3">
                  <Video size={18} style={{ color: '#C75B2A' }} />
                  <span style={{ color: '#1a1a1a' }}>Virtual / Online</span>
                </div>
              ) : address ? (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0" style={{ color: '#C75B2A' }} />
                  <span style={{ color: '#1a1a1a' }}>{address}</span>
                </div>
              ) : (
                <span style={{ color: '#6B6560' }}>Location TBD</span>
              )}
            </div>
          </div>
        </div>

        {/* Org card */}
        {org && (
          <div className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: '#6B6560' }}>
              Hosted By
            </h2>
            <Link
              href={'/design2/organizations/' + org.org_id}
              className="flex items-center gap-4 rounded-xl p-5 transition-shadow hover:shadow-md"
              style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD5' }}
            >
              {org.logo_url && (
                <img
                  src={org.logo_url}
                  alt={org.org_name}
                  className="w-12 h-12 rounded-lg object-contain flex-shrink-0"
                  style={{ backgroundColor: '#FAF8F5', borderWidth: 1, borderColor: '#E2DDD5' }}
                />
              )}
              <div className="min-w-0">
                <div className="font-serif font-bold truncate" style={{ color: '#1a1a1a' }}>
                  {org.org_name}
                </div>
                <div className="text-sm" style={{ color: '#C75B2A' }}>
                  View organization details
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
