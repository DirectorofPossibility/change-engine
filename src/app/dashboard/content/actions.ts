'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContent(id: string, data: {
  title_6th_grade?: string
  summary_6th_grade?: string
  pathway_primary?: string
  center?: string
  is_featured?: boolean
  is_active?: boolean
}) {
  const supabase = await createClient()
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
