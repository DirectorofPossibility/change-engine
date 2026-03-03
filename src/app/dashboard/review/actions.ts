/**
 * @fileoverview Server actions for the content review queue.
 *
 * ## Object Type Model
 * Content flowing through this pipeline is NEWSFEED content (articles, videos,
 * research, reports, DIY activities, courses) — NOT community resources.
 * Resources are separate entity types (services_211, organizations, benefits).
 *
 * Mutations handled:
 * - **approveItem** -- Marks a review queue entry as `approved`, records the
 *   reviewer's email for audit, and publishes the newsfeed item to
 *   `content_published` (idempotent -- skips if already published).
 *   Populates `engagement_level` from the classified center.
 * - **rejectItem** -- Marks a review queue entry as `rejected` with optional
 *   reviewer notes and records the reviewer's email for audit.
 *
 * Every exported action requires an authenticated session via {@link requireAuth}.
 * The authenticated user's email is persisted in `reviewed_by` for audit trail
 * purposes.
 */
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

/**
 * Approve a review queue item and publish it as a newsfeed entry.
 *
 * Workflow:
 * 1. Sets the `content_review_queue` row to `approved` with the reviewer's
 *    identity and timestamp.
 * 2. Fetches the full `content_inbox` row to build the published payload.
 * 3. Checks for an existing `content_published` row (idempotent guard).
 * 4. Inserts a new row into `content_published` using the AI classification
 *    metadata — every dimension: pathway, focus areas, engagement level,
 *    time commitment, action types, government level, organizations, locations.
 * 5. Writes to all relevant junction tables for the knowledge mesh.
 *
 * @param reviewId       - UUID of the `content_review_queue` row.
 * @param inboxId        - UUID of the originating `content_inbox` row.
 * @param classification - AI-generated classification metadata with all
 *                         identified dimensions.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Updates `content_review_queue` (status, reviewed_by, reviewed_at).
 * @sideeffect Inserts into `content_published` (unless already present).
 * @sideeffect Writes to junction tables (content_focus_areas, content_sdgs, etc.).
 * @sideeffect Revalidates `/dashboard/review`, `/dashboard/content`, and `/dashboard`.
 */
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

  // Publish as newsfeed item with all identified dimensions
  const actions = classification.action_items || {}
  const { data: published, error } = await supabase.from('content_published').insert({
    inbox_id: inboxId,
    source_url: inbox.source_url || '',
    source_domain: inbox.source_domain || '',
    resource_type: classification.resource_type_id || null,
    pathway_primary: classification.theme_primary,
    pathway_secondary: classification.theme_secondary || [],
    focus_area_ids: classification.focus_area_ids || [],
    center: classification.center || 'Learning',
    // engagement_level is intentionally set to the same value as center.
    // Both columns exist in content_published: `center` is the canonical
    // classification field; `engagement_level` is consumed by downstream
    // views (e.g. guides) that expect a separate column name.
    engagement_level: classification.center || 'Learning',
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
    image_url: inbox.image_url || null,
    is_featured: false,
    is_active: true,
  }).select('id').single()

  // Write to junction tables for the knowledge mesh
  if (published?.id) {
    const contentId = published.id
    const focusAreaIds: string[] = classification.focus_area_ids || []
    const sdgIds: string[] = classification.sdg_ids || []
    const lifeSituationIds: string[] = classification.life_situation_ids || []
    const audienceSegmentIds: string[] = classification.audience_segment_ids || []

    const junctionInserts = [
      ...focusAreaIds.map(fid => supabase.from('content_focus_areas').insert({ content_id: contentId, focus_id: fid }).then(() => {})),
      ...sdgIds.map(sid => supabase.from('content_sdgs').insert({ content_id: contentId, sdg_id: sid }).then(() => {})),
      ...lifeSituationIds.map(lid => supabase.from('content_life_situations').insert({ content_id: contentId, situation_id: lid }).then(() => {})),
      ...audienceSegmentIds.map(aid => supabase.from('content_audience_segments').insert({ content_id: contentId, segment_id: aid }).then(() => {})),
    ]

    // Primary pathway
    if (classification.theme_primary) {
      junctionInserts.push(
        supabase.from('content_pathways').insert({ content_id: contentId, theme_id: classification.theme_primary, is_primary: true }).then(() => {})
      )
    }
    // Secondary pathways
    const secondaryPathways: string[] = classification.theme_secondary || []
    for (const themeId of secondaryPathways) {
      junctionInserts.push(
        supabase.from('content_pathways').insert({ content_id: contentId, theme_id: themeId, is_primary: false }).then(() => {})
      )
    }

    // Service categories
    const serviceCatIds: string[] = classification.service_cat_ids || []
    for (const scId of serviceCatIds) {
      junctionInserts.push(
        supabase.from('content_service_categories').insert({ content_id: contentId, service_cat_id: scId }).then(() => {})
      )
    }

    // Skills
    const skillIds: string[] = classification.skill_ids || []
    for (const skId of skillIds) {
      junctionInserts.push(
        supabase.from('content_skills').insert({ content_id: contentId, skill_id: skId }).then(() => {})
      )
    }

    // Fire all junction inserts in parallel, ignoring duplicates
    await Promise.allSettled(junctionInserts)
  }

  if (error) return { error: error.message }

  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reject a review queue item.
 *
 * Sets the `content_review_queue` row to `rejected`, records the reviewer's
 * identity and timestamp, and optionally stores reviewer notes explaining the
 * rejection.
 *
 * @param reviewId - UUID of the `content_review_queue` row.
 * @param notes    - Optional free-text explanation for the rejection.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Updates `content_review_queue` (status, reviewed_by, reviewed_at,
 *             reviewer_notes).
 * @sideeffect Revalidates `/dashboard/review` and `/dashboard`.
 */
export async function rejectItem(reviewId: string, notes?: string) {
  const supabase = await createClient()
  const user = await requireAuth(supabase)

  const { error } = await supabase.from('content_review_queue')
    .update({ review_status: 'rejected', reviewed_by: user.email || user.id, reviewed_at: new Date().toISOString(), reviewer_notes: notes || null })
    .eq('id', reviewId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard')
  return { success: true }
}
