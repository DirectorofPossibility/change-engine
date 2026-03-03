'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AiClassification } from '@/lib/types/dashboard'

/** Verify the calling user is authenticated; returns user for audit trail. */
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function approveItem(reviewId: string, inboxId: string, classification: AiClassification) {
  const supabase = await createClient()
  const user = await requireAuth(supabase)

  // Update review status with actual reviewer identity
  const { error: reviewErr } = await supabase.from('content_review_queue')
    .update({ review_status: 'approved', reviewed_by: user.email || user.id, reviewed_at: new Date().toISOString() })
    .eq('id', reviewId)

  if (reviewErr) return { error: reviewErr.message }

  // Get inbox data
  const { data: inbox } = await supabase.from('content_inbox').select('*').eq('id', inboxId).single()
  if (!inbox) return { error: 'Inbox item not found' }

  // Skip if already published
  const { data: existing } = await supabase.from('content_published').select('id').eq('inbox_id', inboxId)
  if (existing && existing.length > 0) return { success: true, message: 'Already published' }

  // Publish
  const actions = classification.action_items || {}
  const { error } = await supabase.from('content_published').insert({
    inbox_id: inboxId,
    source_url: inbox.source_url || '',
    source_domain: inbox.source_domain || '',
    resource_type: classification.resource_type_id || null,
    pathway_primary: classification.theme_primary,
    pathway_secondary: classification.theme_secondary || [],
    focus_area_ids: classification.focus_area_ids || [],
    center: classification.center || 'Resource',
    sdg_ids: classification.sdg_ids || [],
    sdoh_domain: classification.sdoh_code || null,
    audience_segments: classification.audience_segment_ids || [],
    life_situations: classification.life_situation_ids || [],
    geographic_scope: classification.geographic_scope || 'Houston',
    title_6th_grade: classification.title_6th_grade || inbox.title || 'Untitled',
    summary_6th_grade: classification.summary_6th_grade || inbox.description || '',
    action_donate: actions.donate_url || null,
    action_volunteer: actions.volunteer_url || null,
    action_signup: actions.signup_url || null,
    action_register: actions.register_url || null,
    action_apply: actions.apply_url || null,
    action_call: actions.phone || null,
    action_attend: actions.attend_url || null,
    confidence: classification.confidence,
    classification_reasoning: classification.reasoning || '',
    is_featured: false,
    is_active: true,
  })

  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}

export async function rejectItem(reviewId: string, notes?: string) {
  const supabase = await createClient()
  const user = await requireAuth(supabase)

  const { error } = await supabase.from('content_review_queue')
    .update({ review_status: 'rejected', reviewed_by: user.email || user.id, reviewed_at: new Date().toISOString(), reviewer_notes: notes || null })
    .eq('id', reviewId)

  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}
