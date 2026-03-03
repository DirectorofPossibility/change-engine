/**
 * @fileoverview Server actions for published content management.
 *
 * Mutations handled:
 * - **updateContent** -- Patches editable fields on a `content_published` row
 *   (title, summary, pathway, center, featured/active flags).
 * - **toggleFeatured** / **toggleActive** -- Convenience wrappers around
 *   `updateContent` for single boolean toggles.
 * - **deleteContent** -- Hard-deletes a published item and cleans up
 *   associated `translations` and `content_review_queue` rows.
 * - **moveToDraft** -- Unpublishes content by deleting its `content_published`
 *   row, resetting the review queue entry to `pending`, and setting the inbox
 *   record back to `needs_review`.
 *
 * Every exported action requires an authenticated session via {@link requireAuth}.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Verify the calling user is authenticated; throws if not. */
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

/**
 * Update editable fields on a published content item.
 *
 * Patches the given fields on the `content_published` row and stamps
 * `last_updated` with the current timestamp.
 *
 * @param id   - UUID of the `content_published` row.
 * @param data - Partial set of editable fields to update.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Updates the `content_published` row.
 * @sideeffect Revalidates `/dashboard/content` and `/dashboard`.
 */
export async function updateContent(id: string, data: {
  title_6th_grade?: string
  summary_6th_grade?: string
  pathway_primary?: string
  center?: string
  is_featured?: boolean
  is_active?: boolean
}) {
  const supabase = await createClient()
  await requireAuth(supabase)

  const { error } = await supabase.from('content_published')
    .update({ ...data, last_updated: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}

/**
 * Toggle the `is_featured` flag on a published content item.
 *
 * Convenience wrapper around {@link updateContent}.
 *
 * @param id    - UUID of the `content_published` row.
 * @param value - New boolean value for `is_featured`.
 *
 * @requires Authentication (delegated to {@link updateContent}).
 * @sideeffect Updates `content_published.is_featured`.
 * @sideeffect Revalidates `/dashboard/content` and `/dashboard`.
 */
export async function toggleFeatured(id: string, value: boolean) {
  return updateContent(id, { is_featured: value })
}

/**
 * Toggle the `is_active` flag on a published content item.
 *
 * Convenience wrapper around {@link updateContent}.
 *
 * @param id    - UUID of the `content_published` row.
 * @param value - New boolean value for `is_active`.
 *
 * @requires Authentication (delegated to {@link updateContent}).
 * @sideeffect Updates `content_published.is_active`.
 * @sideeffect Revalidates `/dashboard/content` and `/dashboard`.
 */
export async function toggleActive(id: string, value: boolean) {
  return updateContent(id, { is_active: value })
}

/**
 * Permanently delete a published content item and its associated records.
 *
 * When an `inboxId` is provided the action first removes related rows from
 * `translations` and `content_review_queue`, then deletes the
 * `content_published` row itself.
 *
 * @param id      - UUID of the `content_published` row to delete.
 * @param inboxId - UUID of the originating `content_inbox` row (nullable).
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Deletes from `translations` (if inboxId supplied).
 * @sideeffect Deletes from `content_review_queue` (if inboxId supplied).
 * @sideeffect Deletes the `content_published` row.
 * @sideeffect Revalidates `/dashboard/content` and `/dashboard`.
 */
export async function deleteContent(id: string, inboxId: string | null) {
  const supabase = await createClient()
  await requireAuth(supabase)

  // Clean up associated records
  if (inboxId) {
    await supabase.from('translations').delete().eq('content_id', inboxId)
    await supabase.from('content_review_queue').delete().eq('inbox_id', inboxId)
  }

  const { error } = await supabase.from('content_published').delete().eq('id', id)

  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard')
  return error ? { error: error.message } : { success: true }
}

/**
 * Move a published content item back to draft / review.
 *
 * This reverses the publish flow: the `content_review_queue` entry is reset
 * to `pending`, the `content_inbox` status is set to `needs_review`, and the
 * `content_published` row is deleted.
 *
 * @param id      - UUID of the `content_published` row to unpublish.
 * @param inboxId - UUID of the originating `content_inbox` row.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Resets `content_review_queue` status to `pending`.
 * @sideeffect Updates `content_inbox.status` to `needs_review`.
 * @sideeffect Deletes the `content_published` row.
 * @sideeffect Revalidates `/dashboard/content`, `/dashboard/review`, and `/dashboard`.
 */
export async function moveToDraft(id: string, inboxId: string) {
  const supabase = await createClient()
  await requireAuth(supabase)

  // Set review queue record back to pending
  const { error: reviewErr } = await supabase
    .from('content_review_queue')
    .update({ review_status: 'pending', reviewed_at: null, reviewed_by: null, reviewer_notes: null })
    .eq('inbox_id', inboxId)

  if (reviewErr) return { error: reviewErr.message }

  // Set inbox record to needs_review
  const { error: inboxErr } = await supabase
    .from('content_inbox')
    .update({ status: 'needs_review' })
    .eq('id', inboxId)

  if (inboxErr) return { error: inboxErr.message }

  // Remove from published
  const { error: deleteErr } = await supabase
    .from('content_published')
    .delete()
    .eq('id', id)

  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/review')
  revalidatePath('/dashboard')
  return deleteErr ? { error: deleteErr.message } : { success: true }
}
