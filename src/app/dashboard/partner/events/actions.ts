/**
 * @fileoverview Server actions for partner event/opportunity management.
 *
 * All actions verify the current user is a partner and owns the event
 * via org_id before performing mutations.
 *
 * - createEvent:  Inserts into opportunities with org_id, review_status='pending'.
 * - updateEvent:  Updates an existing opportunity after verifying org ownership.
 * - deleteEvent:  Deletes an opportunity after verifying org ownership.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Helpers ──

function generateId(): string {
  return 'opp-' + crypto.randomUUID().slice(0, 12)
}

async function getPartnerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { supabase, profile: null }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id, account_status')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    return { supabase, profile: null }
  }

  if ((profile as any).account_status !== 'active') {
    return { supabase, profile: null }
  }

  return { supabase, profile }
}

// ── Actions ──

export async function createEvent(formData: FormData) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to create events.' }
  }

  const opportunityName = formData.get('opportunity_name') as string
  const description = formData.get('description_5th_grade') as string || null
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const address = formData.get('address') as string || null
  const city = formData.get('city') as string || null
  const state = formData.get('state') as string || null
  const zipCode = formData.get('zip_code') as string || null
  const isVirtual = formData.get('is_virtual') as string || 'false'
  const registrationUrl = formData.get('registration_url') as string || null
  const spotsRaw = formData.get('spots_available') as string
  const spotsAvailable = spotsRaw ? parseInt(spotsRaw, 10) : null
  const focusAreaIds = formData.get('focus_area_ids') as string || null

  if (!opportunityName?.trim()) {
    return { error: 'Event name is required.' }
  }

  const opportunityId = generateId()

  const { error } = await supabase.from('opportunities').insert({
    opportunity_id: opportunityId,
    opportunity_name: opportunityName.trim(),
    description_5th_grade: description,
    start_date: startDate || null,
    end_date: endDate || null,
    address,
    city,
    state,
    zip_code: zipCode,
    is_virtual: isVirtual,
    registration_url: registrationUrl,
    spots_available: spotsAvailable,
    focus_area_ids: focusAreaIds,
    org_id: profile.org_id,
    review_status: 'pending',
    is_active: 'true',
    data_source: 'partner_portal',
    last_updated: new Date().toISOString(),
  } as any)

  if (error) {
    console.error('createEvent error:', error)
    return { error: 'Failed to create event. Please try again.' }
  }

  revalidatePath('/dashboard/partner/events')
  revalidatePath('/dashboard/partner')
  return { success: true, opportunityId }
}

export async function updateEvent(opportunityId: string, formData: FormData) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to update events.' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('opportunities')
    .select('opportunity_id, org_id')
    .eq('opportunity_id', opportunityId)
    .single()

  if (!existing || (existing as any).org_id !== profile.org_id) {
    return { error: 'Event not found or you do not have permission to edit it.' }
  }

  const opportunityName = formData.get('opportunity_name') as string
  const description = formData.get('description_5th_grade') as string || null
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const address = formData.get('address') as string || null
  const city = formData.get('city') as string || null
  const state = formData.get('state') as string || null
  const zipCode = formData.get('zip_code') as string || null
  const isVirtual = formData.get('is_virtual') as string || 'false'
  const registrationUrl = formData.get('registration_url') as string || null
  const spotsRaw = formData.get('spots_available') as string
  const spotsAvailable = spotsRaw ? parseInt(spotsRaw, 10) : null
  const focusAreaIds = formData.get('focus_area_ids') as string || null

  if (!opportunityName?.trim()) {
    return { error: 'Event name is required.' }
  }

  const { error } = await supabase
    .from('opportunities')
    .update({
      opportunity_name: opportunityName.trim(),
      description_5th_grade: description,
      start_date: startDate || null,
      end_date: endDate || null,
      address,
      city,
      state,
      zip_code: zipCode,
      is_virtual: isVirtual,
      registration_url: registrationUrl,
      spots_available: spotsAvailable,
      focus_area_ids: focusAreaIds,
      last_updated: new Date().toISOString(),
    } as any)
    .eq('opportunity_id', opportunityId)

  if (error) {
    console.error('updateEvent error:', error)
    return { error: 'Failed to update event. Please try again.' }
  }

  revalidatePath('/dashboard/partner/events')
  revalidatePath(`/dashboard/partner/events/${opportunityId}`)
  revalidatePath('/dashboard/partner')
  return { success: true }
}

export async function deleteEvent(opportunityId: string) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to delete events.' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('opportunities')
    .select('opportunity_id, org_id')
    .eq('opportunity_id', opportunityId)
    .single()

  if (!existing || (existing as any).org_id !== profile.org_id) {
    return { error: 'Event not found or you do not have permission to delete it.' }
  }

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('opportunity_id', opportunityId)

  if (error) {
    console.error('deleteEvent error:', error)
    return { error: 'Failed to delete event. Please try again.' }
  }

  revalidatePath('/dashboard/partner/events')
  revalidatePath('/dashboard/partner')
  return { success: true }
}
