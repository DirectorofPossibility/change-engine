'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper for rss_feeds table operations using service role (bypasses RLS)
async function feedsRest(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path}: ${res.status} ${text}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/** Verify the calling user is authenticated. */
async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function pollRssFeedsAction() {
  await requireAuth()
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
  await requireAuth()
  try {
    await feedsRest('POST', 'rss_feeds', {
      ...data,
      is_active: true,
    })
    revalidatePath('/dashboard/ingestion')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateFeed(id: string, data: {
  feed_name?: string
  feed_url?: string
  source_domain?: string
  is_active?: boolean
  poll_interval_hours?: number
}) {
  await requireAuth()
  try {
    await feedsRest('PATCH', `rss_feeds?id=eq.${id}`, data)
    revalidatePath('/dashboard/ingestion')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteFeed(id: string) {
  await requireAuth()
  try {
    await feedsRest('DELETE', `rss_feeds?id=eq.${id}`)
    revalidatePath('/dashboard/ingestion')
    return { success: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addTrustDomain(data: {
  domain: string
  trust_level: string
  notes?: string
}) {
  await requireAuth()
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
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase.from('source_trust')
    .update(data)
    .eq('id', id)
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}
