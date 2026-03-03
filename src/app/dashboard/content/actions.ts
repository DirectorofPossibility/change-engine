'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** Verify the calling user is authenticated; throws if not. */
async function requireAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

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

export async function toggleFeatured(id: string, value: boolean) {
  return updateContent(id, { is_featured: value })
}

export async function toggleActive(id: string, value: boolean) {
  return updateContent(id, { is_active: value })
}

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
