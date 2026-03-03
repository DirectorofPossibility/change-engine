/**
 * @fileoverview Server actions for API key CRUD operations.
 *
 * Mutations handled:
 * - **createApiKey** -- Generates a `ce_live_*` key, stores its SHA-256 hash
 *   in the `api_keys` table, and returns the raw key exactly once.
 * - **revokeApiKey** -- Soft-disables an existing key by setting `is_active`
 *   to `false` (the row is preserved for audit purposes).
 * - **deleteApiKey** -- Hard-deletes an API key row from `api_keys`.
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
 * Create a new API key.
 *
 * Generates a cryptographically random `ce_live_<32 hex>` key, hashes it with
 * SHA-256 for storage, and inserts a row into the `api_keys` table. The raw
 * key is returned **only once** in the response -- it is never persisted.
 *
 * @param data - Key metadata (label, optional org_id, rate limit, expiry).
 * @returns The raw key and its display prefix on success, or an error message.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Inserts a row into `api_keys`.
 * @sideeffect Revalidates `/dashboard/api-keys`.
 */
export async function createApiKey(data: {
  label: string
  org_id?: string
  rate_limit_per_day?: number
  expires_at?: string
}): Promise<{ error?: string; rawKey?: string; keyPrefix?: string }> {
  const supabase = await createClient()
  const user = await requireAuth(supabase)

  // Generate raw key: ce_live_<32 hex chars>
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const rawKey = `ce_live_${hex}`
  const keyPrefix = `ce_live_${hex.slice(0, 4)}...${hex.slice(-4)}`

  // SHA-256 hash for storage (raw key is only shown once)
  const encoded = new TextEncoder().encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  const { error } = await (supabase.from('api_keys' as any) as any).insert({
    key_hash: keyHash,
    key_prefix: keyPrefix,
    org_id: data.org_id || null,
    label: data.label,
    rate_limit_per_day: data.rate_limit_per_day || 500,
    expires_at: data.expires_at || null,
    created_by: user.id,
  })

  revalidatePath('/dashboard/api-keys')
  if (error) return { error: error.message }
  return { rawKey, keyPrefix }
}

/**
 * Revoke (soft-disable) an API key.
 *
 * Sets `is_active` to `false` on the matching `api_keys` row. The row itself
 * is retained so historical usage data remains intact.
 *
 * @param id - UUID of the API key row to revoke.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Updates `api_keys.is_active` to `false`.
 * @sideeffect Revalidates `/dashboard/api-keys`.
 */
export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  await requireAuth(supabase)

  const { error } = await (supabase.from('api_keys' as any) as any)
    .update({ is_active: false })
    .eq('id', id)
  revalidatePath('/dashboard/api-keys')
  return error ? { error: error.message } : { success: true }
}

/**
 * Permanently delete an API key.
 *
 * Removes the matching row from `api_keys`. This is irreversible -- prefer
 * {@link revokeApiKey} when an audit trail is needed.
 *
 * @param id - UUID of the API key row to delete.
 * @returns `{ success: true }` or `{ error: string }`.
 *
 * @requires Authentication via {@link requireAuth}.
 * @sideeffect Deletes the row from `api_keys`.
 * @sideeffect Revalidates `/dashboard/api-keys`.
 */
export async function deleteApiKey(id: string) {
  const supabase = await createClient()
  await requireAuth(supabase)

  const { error } = await (supabase.from('api_keys' as any) as any)
    .delete()
    .eq('id', id)
  revalidatePath('/dashboard/api-keys')
  return error ? { error: error.message } : { success: true }
}
