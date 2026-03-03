/**
 * @fileoverview Partner events/opportunities listing page.
 *
 * Lists all opportunities belonging to the partner's organization with
 * status, dates, and registration info. Links to create and edit.
 *
 * @route GET /dashboard/partner/events
 */

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/events')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  const { data: events } = await supabase
    .from('opportunities')
    .select('*')
    .eq('org_id', orgId)
    .order('start_date', { ascending: false })

  const allEvents = (events || []) as any[]
  const now = new Date().toISOString()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text font-serif">My Events</h1>
          <p className="text-brand-muted mt-1">Create and manage community events and opportunities</p>
        </div>
        <Link
          href="/dashboard/partner/events/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium"
        >
          + New Event
        </Link>
      </div>

      {/* Events List */}
      {allEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-border p-12 text-center">
          <p className="text-brand-muted mb-4">You have not created any events yet.</p>
          <Link
            href="/dashboard/partner/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors text-sm font-medium"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
                <th className="px-4 py-3 font-medium">Event Name</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Spots</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.map((event: any) => {
                const isPast = event.end_date && event.end_date < now
                const isUpcoming = event.start_date && event.start_date >= now
                return (
                  <tr key={event.opportunity_id} className="border-b border-brand-border/50 hover:bg-brand-bg/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-brand-text">{event.opportunity_name}</p>
                        {event.is_virtual === 'true' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Virtual
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      <div>
                        {event.start_date ? (
                          <span>{new Date(event.start_date).toLocaleDateString()}</span>
                        ) : (
                          <span>-</span>
                        )}
                        {event.end_date && (
                          <>
                            <span className="mx-1">to</span>
                            <span>{new Date(event.end_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {event.city && event.state
                        ? `${event.city}, ${event.state}`
                        : event.city || event.state || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {isPast ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          Past
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">
                          Upcoming
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-brand-muted">
                      {event.spots_available != null ? event.spots_available : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/partner/events/${event.opportunity_id}`}
                        className="text-brand-accent hover:underline text-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
