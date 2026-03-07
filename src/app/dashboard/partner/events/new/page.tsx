/**
 * @fileoverview Create new event page for partners.
 *
 * Fetches available focus areas and renders the EventFormClient
 * in create mode (no existing event data).
 *
 * @route GET /dashboard/partner/events/new
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventFormClient from '../EventFormClient'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/events/new')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  // Fetch focus areas and event types
  const [{ data: focusAreas }, { data: eventTypes }] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, focus_area_name, theme_id').order('focus_area_name'),
    supabase.from('event_types' as any).select('name, category').eq('is_active', true).order('category').order('name'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text font-serif">Create New Event</h1>
        <p className="text-brand-muted mt-1">
          Add a community event or volunteer opportunity. Events go through review before publishing.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-border p-6">
        <EventFormClient focusAreas={focusAreas || []} eventTypes={(eventTypes as any) || []} />
      </div>
    </div>
  )
}
