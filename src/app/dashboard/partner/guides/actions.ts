/**
 * @fileoverview Server actions for partner guide management.
 *
 * All actions verify the current user is a partner and owns the guide
 * via org_id before performing mutations.
 *
 * - createGuide: Inserts a new guide with review_status='pending', is_active=false.
 * - updateGuide: Updates an existing guide and resets review_status to 'pending'.
 * - deleteGuide: Deletes a guide after verifying org ownership.
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Helpers ──

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateId(): string {
  return 'guide-' + crypto.randomUUID().slice(0, 12)
}

async function getPartnerProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { supabase, profile: null }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, org_id')
    .eq('auth_id', user.id)
    .single()

  if (!profile || profile.role !== 'partner' || !profile.org_id) {
    return { supabase, profile: null }
  }

  return { supabase, profile }
}

// ── Actions ──

export async function createGuide(formData: FormData) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to create guides.' }
  }

  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string) || generateSlug(title)
  const description = formData.get('description') as string || null
  const contentHtml = formData.get('content_html') as string || null
  const heroImageUrl = formData.get('hero_image_url') as string || null
  const themeId = formData.get('theme_id') as string || null
  const engagementLevel = formData.get('engagement_level') as string || null

  let focusAreaIds: string[] | null = null
  try {
    const raw = formData.get('focus_area_ids') as string
    if (raw) focusAreaIds = JSON.parse(raw)
  } catch { /* ignore */ }

  let sections = null
  try {
    const raw = formData.get('sections') as string
    if (raw) sections = JSON.parse(raw)
  } catch { /* ignore */ }

  if (!title?.trim()) {
    return { error: 'Title is required.' }
  }

  const guideId = generateId()

  const { error } = await supabase.from('guides').insert({
    guide_id: guideId,
    title: title.trim(),
    slug,
    description,
    content_html: contentHtml,
    hero_image_url: heroImageUrl,
    theme_id: themeId,
    engagement_level: engagementLevel,
    focus_area_ids: focusAreaIds,
    sections,
    org_id: profile.org_id,
    review_status: 'pending',
    is_active: false,
  } as any)

  if (error) {
    console.error('createGuide error:', error)
    return { error: 'Failed to create guide. Please try again.' }
  }

  revalidatePath('/dashboard/partner/guides')
  revalidatePath('/dashboard/partner')
  return { success: true, guideId }
}

export async function updateGuide(guideId: string, formData: FormData) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to update guides.' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('guides')
    .select('guide_id, org_id')
    .eq('guide_id', guideId)
    .single()

  if (!existing || (existing as any).org_id !== profile.org_id) {
    return { error: 'Guide not found or you do not have permission to edit it.' }
  }

  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string) || generateSlug(title)
  const description = formData.get('description') as string || null
  const contentHtml = formData.get('content_html') as string || null
  const heroImageUrl = formData.get('hero_image_url') as string || null
  const themeId = formData.get('theme_id') as string || null
  const engagementLevel = formData.get('engagement_level') as string || null

  let focusAreaIds: string[] | null = null
  try {
    const raw = formData.get('focus_area_ids') as string
    if (raw) focusAreaIds = JSON.parse(raw)
  } catch { /* ignore */ }

  let sections = null
  try {
    const raw = formData.get('sections') as string
    if (raw) sections = JSON.parse(raw)
  } catch { /* ignore */ }

  if (!title?.trim()) {
    return { error: 'Title is required.' }
  }

  const { error } = await supabase
    .from('guides')
    .update({
      title: title.trim(),
      slug,
      description,
      content_html: contentHtml,
      hero_image_url: heroImageUrl,
      theme_id: themeId,
      engagement_level: engagementLevel,
      focus_area_ids: focusAreaIds,
      sections,
      review_status: 'pending',
      updated_at: new Date().toISOString(),
    } as any)
    .eq('guide_id', guideId)

  if (error) {
    console.error('updateGuide error:', error)
    return { error: 'Failed to update guide. Please try again.' }
  }

  revalidatePath('/dashboard/partner/guides')
  revalidatePath(`/dashboard/partner/guides/${guideId}`)
  revalidatePath('/dashboard/partner')
  return { success: true }
}

export async function deleteGuide(guideId: string) {
  const { supabase, profile } = await getPartnerProfile()

  if (!profile) {
    return { error: 'Unauthorized. You must be a partner to delete guides.' }
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from('guides')
    .select('guide_id, org_id')
    .eq('guide_id', guideId)
    .single()

  if (!existing || (existing as any).org_id !== profile.org_id) {
    return { error: 'Guide not found or you do not have permission to delete it.' }
  }

  const { error } = await supabase
    .from('guides')
    .delete()
    .eq('guide_id', guideId)

  if (error) {
    console.error('deleteGuide error:', error)
    return { error: 'Failed to delete guide. Please try again.' }
  }

  revalidatePath('/dashboard/partner/guides')
  revalidatePath('/dashboard/partner')
  return { success: true }
}
