'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addFeed(data: {
  feed_name: string
  feed_url: string
  source_domain: string
  poll_interval_hours: number
}) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rss_feeds' as any) as any).insert({
    ...data,
    is_active: true,
  })
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}

export async function updateFeed(id: string, data: {
  feed_name?: string
  feed_url?: string
  source_domain?: string
  is_active?: boolean
  poll_interval_hours?: number
}) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rss_feeds' as any) as any)
    .update(data)
    .eq('id', id)
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}

export async function deleteFeed(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('rss_feeds' as any) as any)
    .delete()
    .eq('id', id)
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}

export async function addTrustDomain(data: {
  domain: string
  trust_level: string
  notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('source_trust').insert({
    domain: data.domain,
    trust_level: data.trust_level,
    notes: data.notes || null,
  })
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}

export async function updateTrust(id: string, data: {
  trust_level?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('source_trust')
    .update(data)
    .eq('id', id)
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}
