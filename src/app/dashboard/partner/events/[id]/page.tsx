/**
 * @fileoverview Edit event page for partners.
 *
 * Fetches the existing opportunity (verifying org ownership) and available
 * focus areas, then renders EventFormClient in edit mode.
 *
 * @route GET /dashboard/partner/events/[id]
 */

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventFormClient from '../EventFormClient'

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard/partner/events/' + id)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    redirect('/dashboard')
  }

  const orgId = profile.org_id as string

  // Fetch the event, verifying org ownership
  const { data: event } = await supabase
    .from('opportunities')
    .select('*')
    .eq('opportunity_id', id)
    .eq('org_id', orgId)
    .single()

  if (!event) {
    notFound()
  }

  // Fetch focus areas for the multi-select
  const { data: focusAreas } = await supabase
    .from('focus_areas')
    .select('focus_id, focus_area_name, theme_id')
    .order('focus_area_name')

  // Normalize event data for the form
  const eventData = {
    opportunity_id: (event as any).opportunity_id,
    opportunity_name: (event as any).opportunity_name,
    description_5th_grade: (event as any).description_5th_grade,
    start_date: (event as any).start_date,
    end_date: (event as any).end_date,
    address: (event as any).address,
    city: (event as any).city,
    state: (event as any).state,
    zip_code: (event as any).zip_code,
    is_virtual: (event as any).is_virtual,
    registration_url: (event as any).registration_url,
    spots_available: (event as any).spots_available,
    focus_area_ids: (event as any).focus_area_ids,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-text font-serif">Edit Event</h1>
        <p className="text-brand-muted mt-1">
          Update your event details.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-brand-border p-6">
        <EventFormClient event={eventData} focusAreas={focusAreas || []} />
      </div>
    </div>
  )
}
