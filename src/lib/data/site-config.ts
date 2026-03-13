import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface SiteConfigItem {
  key: string
  enabled: boolean
  category: string
  label: string
  description: string | null
  updated_at: string
}

export type SiteConfigMap = Record<string, boolean>

/** Fetch all site config toggles, cached per request. */
export const getSiteConfig = cache(async function getSiteConfig(): Promise<SiteConfigMap> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('site_config')
    .select('key, enabled')

  const map: SiteConfigMap = {}
  for (const row of data ?? []) {
    map[row.key] = row.enabled
  }
  return map
})

/** Fetch full config rows for the admin dashboard. */
export async function getSiteConfigRows(): Promise<SiteConfigItem[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('site_config')
    .select('key, enabled, category, label, description, updated_at')
    .order('category')
    .order('label')

  return (data ?? []) as SiteConfigItem[]
}

/** Check if a specific feature is enabled. Defaults to true if key not found. */
export async function isEnabled(key: string): Promise<boolean> {
  const config = await getSiteConfig()
  return config[key] ?? true
}
