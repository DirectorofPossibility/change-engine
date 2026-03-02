'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function pollRssFeedsAction() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { error: 'Server configuration missing (SUPABASE_URL or SERVICE_ROLE_KEY)' }
  }
  const res = await fetch(`${SUPABASE_URL}/functions/v1/rss-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ mode: 'poll_all' }),
  })
  if (!res.ok) {
    const text = await res.text()
    return { error: `RSS poll failed (${res.status}): ${text}` }
  }
  revalidatePath('/dashboard/ingestion')
  return res.json()
}

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
