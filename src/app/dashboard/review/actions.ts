/**
 * @fileoverview Server actions for the content review queue.
 *
 * Uses the authenticated user's Supabase client (with admin RLS policies)
 * for all mutations. Falls back to service client only if needed.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AiClassification } from '@/lib/types/dashboard'

/** Verify the calling user is authenticated and is an admin; returns user + client. */
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized — not logged in')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'partner')) {
    throw new Error(`Unauthorized — role "${profile?.role}" cannot review content`)
  }

  return { user, supabase, role: profile.role }
}

/**
 * Approve a review queue item and publish it as a newsfeed entry.
 */
export async function approveItem(reviewId: string, inboxId: string, classification: AiClassification) {
  try {
    const { user, supabase } = await requireAdmin()

    // Step 1: Update review status
    const { error: reviewErr, count: reviewCount } = await supabase
      .from('content_review_queue')
      .update({
        review_status: 'approved',
        reviewed_by: user.email || user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select('id')

    if (reviewErr) return { error: `Step 1 (update review): ${reviewErr.message}` }
    if (reviewCount === 0) return { error: `Step 1: Review item ${reviewId} not found or not updated` }

    // Step 2: Get inbox data
    const { data: inbox, error: inboxErr } = await supabase
      .from('content_inbox')
      .select('*')
      .eq('id', inboxId)
      .single()

    if (inboxErr) return { error: `Step 2 (fetch inbox): ${inboxErr.message}` }
    if (!inbox) return { error: 'Step 2: Inbox item not found' }

    // Step 3: Skip if already published
    const { data: existing } = await supabase
      .from('content_published')
      .select('id')
      .eq('inbox_id', inboxId)

    if (existing && existing.length > 0) {
      revalidatePath('/dashboard/review')
      return { success: true, message: 'Already published' }
    }

    // Build extracted text for body field
    let body = ''
    try {
      const extracted = typeof inbox.extracted_text === 'string'
        ? JSON.parse(inbox.extracted_text)
        : inbox.extracted_text || {}
      body = extracted.full_text || inbox.description || ''
    } catch {
      body = inbox.description || ''
    }

    const contentType = inbox.content_type || (inbox as any).source_type || 'article'

    // Step 4: Publish
    const actions = classification.action_items || {}
    const { data: published, error: pubErr } = await supabase.from('content_published').insert({
      inbox_id: inboxId,
      source_url: inbox.source_url || '',
      source_domain: inbox.source_domain || '',
      resource_type: classification.resource_type_id || null,
      pathway_primary: classification.theme_primary,
      pathway_secondary: classification.theme_secondary || [],
      focus_area_ids: classification.focus_area_ids || [],
      center: classification.center || 'Learning',
      engagement_level: classification.center || 'Learning',
      sdg_ids: classification.sdg_ids || [],
      sdoh_domain: classification.sdoh_code || null,
      audience_segments: classification.audience_segment_ids || [],
      life_situations: classification.life_situation_ids || [],
      geographic_scope: classification.geographic_scope || 'Houston',
      title_6th_grade: classification.title_6th_grade || inbox.title || 'Untitled',
      summary_6th_grade: classification.summary_6th_grade || inbox.description || '',
      body: body.substring(0, 50000),
      content_type: contentType,
      keywords: classification.keywords || [],
      action_donate: actions.donate_url || null,
      action_volunteer: actions.volunteer_url || null,
      action_signup: actions.signup_url || null,
      action_register: actions.register_url || null,
      action_apply: actions.apply_url || null,
      action_call: actions.phone || null,
      action_attend: actions.attend_url || null,
      confidence: classification.confidence,
      classification_reasoning: classification.reasoning || '',
      image_url: inbox.image_url || null,
      is_featured: false,
      is_active: true,
    }).select('id').single()

    if (pubErr) return { error: `Step 4 (publish): ${pubErr.message}` }

    // Step 5: Write junction tables
    if (published?.id) {
      const contentId = published.id
      const junctionInserts = [
        ...(classification.focus_area_ids || []).map(fid =>
          supabase.from('content_focus_areas').insert({ content_id: contentId, focus_id: fid }).then(() => {})
        ),
        ...(classification.sdg_ids || []).map(sid =>
          supabase.from('content_sdgs').insert({ content_id: contentId, sdg_id: sid }).then(() => {})
        ),
        ...(classification.life_situation_ids || []).map(lid =>
          supabase.from('content_life_situations').insert({ content_id: contentId, situation_id: lid }).then(() => {})
        ),
        ...(classification.audience_segment_ids || []).map(aid =>
          supabase.from('content_audience_segments').insert({ content_id: contentId, segment_id: aid }).then(() => {})
        ),
      ]

      if (classification.theme_primary) {
        junctionInserts.push(
          supabase.from('content_pathways').insert({ content_id: contentId, theme_id: classification.theme_primary, is_primary: true }).then(() => {})
        )
      }
      for (const themeId of (classification.theme_secondary || [])) {
        junctionInserts.push(
          supabase.from('content_pathways').insert({ content_id: contentId, theme_id: themeId, is_primary: false }).then(() => {})
        )
      }
      for (const scId of (classification.service_cat_ids || [])) {
        junctionInserts.push(
          supabase.from('content_service_categories').insert({ content_id: contentId, service_cat_id: scId }).then(() => {})
        )
      }
      for (const skId of (classification.skill_ids || [])) {
        junctionInserts.push(
          supabase.from('content_skills').insert({ content_id: contentId, skill_id: skId }).then(() => {})
        )
      }

      await Promise.allSettled(junctionInserts)
    }

    revalidatePath('/dashboard/review')
    revalidatePath('/dashboard/content')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error in approveItem' }
  }
}

/**
 * Flag a single review queue item for manual review.
 */
export async function flagItem(reviewId: string) {
  try {
    const { user, supabase } = await requireAdmin()

    const { error } = await supabase.from('content_review_queue')
      .update({ review_status: 'flagged', reviewed_by: user.email || user.id, reviewed_at: new Date().toISOString() })
      .eq('id', reviewId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/review')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error in flagItem' }
  }
}

/**
 * Reject a review queue item.
 */
export async function rejectItem(reviewId: string, notes?: string) {
  try {
    const { user, supabase } = await requireAdmin()

    const { error } = await supabase.from('content_review_queue')
      .update({
        review_status: 'rejected',
        reviewed_by: user.email || user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes || null,
      })
      .eq('id', reviewId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/review')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error in rejectItem' }
  }
}

/**
 * Bulk approve multiple review queue items.
 */
export async function bulkApproveItems(
  items: Array<{ reviewId: string; inboxId: string; classification: AiClassification }>
) {
  const results = []
  for (const item of items) {
    const result = await approveItem(item.reviewId, item.inboxId, item.classification)
    results.push({ reviewId: item.reviewId, ...result })
  }
  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard')
  return results
}

/**
 * Bulk reject multiple review queue items.
 */
export async function bulkRejectItems(reviewIds: string[], notes?: string) {
  try {
    const { user, supabase } = await requireAdmin()

    const { error } = await supabase.from('content_review_queue')
      .update({
        review_status: 'rejected',
        reviewed_by: user.email || user.id,
        reviewed_at: new Date().toISOString(),
        reviewer_notes: notes || null,
      })
      .in('id', reviewIds)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/review')
    revalidatePath('/dashboard')
    return { success: true, count: reviewIds.length }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error in bulkRejectItems' }
  }
}

/**
 * Bulk flag multiple review queue items for manual review.
 */
export async function bulkFlagItems(reviewIds: string[]) {
  try {
    const { user, supabase } = await requireAdmin()

    const { error } = await supabase.from('content_review_queue')
      .update({ review_status: 'flagged', reviewed_by: user.email || user.id, reviewed_at: new Date().toISOString() })
      .in('id', reviewIds)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/review')
    revalidatePath('/dashboard')
    return { success: true, count: reviewIds.length }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error in bulkFlagItems' }
  }
}
