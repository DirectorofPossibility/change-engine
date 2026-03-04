/**
 * @fileoverview Server actions for ingestion pipeline management.
 *
 * Mutations handled:
 * - **pollRssFeedsAction** -- Triggers a batch poll of all active RSS feeds
 *   via the `rss-proxy` Supabase Edge Function.
 * - **addFeed** -- Registers a new RSS feed in `rss_feeds`.
 * - **updateFeed** -- Patches editable fields on an existing RSS feed
 *   (name, URL, domain, active flag, poll interval).
 * - **deleteFeed** -- Removes an RSS feed row from `rss_feeds`.
 * - **addTrustDomain** -- Inserts a new source domain trust score into
 *   `source_trust`.
 * - **updateTrust** -- Updates trust level or notes on an existing
 *   `source_trust` row.
 *
 * RSS feed operations use the Supabase REST API with the service-role key
 * (bypassing RLS) via {@link feedsRest}. Trust-score operations use the
 * standard Supabase client.
 *
 * Every exported action requires an authenticated session via {@link requireAuth}.
 */
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!

/**
 * Low-level REST helper for `rss_feeds` table operations.
 *
 * Uses the Supabase service-role key to bypass Row-Level Security, since the
 * `rss_feeds` table is not exposed through the standard client policies.
 *
 * @param method - HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).
 * @param path   - PostgREST path (e.g. `rss_feeds?id=eq.<uuid>`).
 * @param body   - Optional JSON-serializable request body.
 * @returns Parsed JSON response or `null` for empty bodies.
 * @throws On non-2xx responses.
 */
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

/**
 * Trigger a batch poll of all active RSS feeds.
 *
 * Invokes the `rss-proxy` Supabase Edge Function in `poll_all` mode using the
 * service-role key. This fetches new items from every active feed and ingests
 * them into the content pipeline.
 *
 * @returns The Edge Function's JSON response on success, or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Triggers remote RSS polling (may insert into `content_inbox`).
 * @sideeffect Revalidates `/dashboard/ingestion`.
 */
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

/**
 * Register a new RSS feed for ingestion.
 *
 * Inserts a row into `rss_feeds` with `is_active` defaulting to `true`.
 * Uses the service-role REST helper to bypass RLS.
 *
 * @param data - Feed metadata (name, URL, source domain, poll interval).
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Inserts into `rss_feeds`.
 * @sideeffect Revalidates `/dashboard/ingestion`.
 */
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

/**
 * Update an existing RSS feed's configuration.
 *
 * Patches the specified fields on the matching `rss_feeds` row via the
 * service-role REST helper.
 *
 * @param id   - UUID of the `rss_feeds` row.
 * @param data - Partial set of editable feed fields.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Updates the `rss_feeds` row.
 * @sideeffect Revalidates `/dashboard/ingestion`.
 */
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

/**
 * Delete an RSS feed.
 *
 * Removes the matching row from `rss_feeds` via the service-role REST helper.
 *
 * @param id - UUID of the `rss_feeds` row to delete.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Deletes the `rss_feeds` row.
 * @sideeffect Revalidates `/dashboard/ingestion`.
 */
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
  auto_publish?: boolean
}) {
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase.from('source_trust').insert({
    domain: data.domain,
    trust_level: data.trust_level,
    notes: data.notes || null,
    auto_publish: data.auto_publish ?? false,
  })
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}

export async function updateTrust(id: string, data: {
  trust_level?: string
  notes?: string
  auto_publish?: boolean
}) {
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase.from('source_trust')
    .update(data)
    .eq('id', id)
  revalidatePath('/dashboard/ingestion')
  return error ? { error: error.message } : { success: true }
}
