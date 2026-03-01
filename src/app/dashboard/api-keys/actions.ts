'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createApiKey(data: {
  label: string
  org_id?: string
  rate_limit_per_day?: number
  expires_at?: string
}): Promise<{ error?: string; rawKey?: string; keyPrefix?: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Generate raw key: ce_live_<32 hex chars>
  const randomBytes = new Uint8Array(16)
  crypto.getRandomValues(randomBytes)
  const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const rawKey = `ce_live_${hex}`
  const keyPrefix = `ce_live_${hex.slice(0, 4)}...${hex.slice(-4)}`

  // SHA-256 hash
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
    created_by: user?.id || null,
  })

  revalidatePath('/dashboard/api-keys')
  if (error) return { error: error.message }
  return { rawKey, keyPrefix }
}

export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('api_keys' as any) as any)
    .update({ is_active: false })
    .eq('id', id)
  revalidatePath('/dashboard/api-keys')
  return error ? { error: error.message } : { success: true }
}

export async function deleteApiKey(id: string) {
  const supabase = await createClient()
  const { error } = await (supabase.from('api_keys' as any) as any)
    .delete()
    .eq('id', id)
  revalidatePath('/dashboard/api-keys')
  return error ? { error: error.message } : { success: true }
}
