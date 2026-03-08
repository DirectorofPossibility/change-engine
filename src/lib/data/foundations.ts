import { createClient } from '@/lib/supabase/server'
import type { FocusArea } from '@/lib/types/exchange'
/** Fetch all foundations for the index page, with spotlight ones first. */
export async function getFoundationsIndex() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('foundations')
    .select('id, name, slug, mission, type, geo_level, assets, annual_giving, website_url, website_display, city, state_code, founded_year, is_spotlight, org_id')
    .order('is_spotlight', { ascending: false })
    .order('name')
  if (error) { console.error('getFoundationsIndex error', error); return [] as any[] }
  return (data ?? []) as Array<{
    id: string; name: string; slug: string; mission: string | null; type: string | null
    geo_level: string; assets: string | null; annual_giving: string | null
    website_url: string | null; website_display: string | null
    city: string | null; state_code: string | null; founded_year: number | null
    is_spotlight: boolean; org_id: string | null
  }>
}

/** Fetch pathway associations for a set of foundation IDs. */

/** Fetch pathway associations for a set of foundation IDs. */
export async function getFoundationPathways(foundationIds: string[]) {
  if (foundationIds.length === 0) return [] as Array<{ foundation_id: string; pathway_id: string }>
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('foundation_pathways')
    .select('foundation_id, pathway_id')
    .in('foundation_id', foundationIds)
  return (data ?? []) as Array<{ foundation_id: string; pathway_id: string }>
}

/** Fetch focus area associations for a set of foundation IDs. */

/** Fetch focus area associations for a set of foundation IDs. */
export async function getFoundationFocusAreas(foundationIds: string[]) {
  if (foundationIds.length === 0) return [] as Array<{ foundation_id: string; focus_area: string; focus_id: string }>
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('foundation_focus_areas')
    .select('foundation_id, focus_area, focus_id')
    .in('foundation_id', foundationIds)
  return (data ?? []) as Array<{ foundation_id: string; focus_area: string; focus_id: string }>
}

/** Fetch foundations linked to a pathway (theme) via foundation_pathways junction. */

/** Fetch foundations linked to a pathway (theme) via foundation_pathways junction. */
export async function getFoundationsByPathway(pathwayId: string) {
  const themeToPathway: Record<string, string> = {
    THEME_01: 'health', THEME_02: 'families', THEME_03: 'neighborhood',
    THEME_04: 'voice', THEME_05: 'money', THEME_06: 'planet', THEME_07: 'bigger_we',
  }
  const pwId = themeToPathway[pathwayId] || pathwayId
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const hd = { apikey: key, Authorization: `Bearer ${key}` }
  const jRes = await fetch(`${url}/rest/v1/foundation_pathways?pathway_id=eq.${encodeURIComponent(pwId)}&select=foundation_id`, { headers: hd })
  const junctions: any[] = jRes.ok ? await jRes.json() : []
  const ids = Array.from(new Set(junctions.map(j => j.foundation_id)))
  if (ids.length === 0) return []
  const fRes = await fetch(`${url}/rest/v1/foundations?id=in.(${ids.join(',')})&select=id,name,mission,assets,annual_giving,website_url,website_display,geo_level,org_id&order=name`, { headers: hd })
  return fRes.ok ? fRes.json() : []
}

/** Fetch foundations linked to a focus area name via foundation_focus_areas junction. */

/** Fetch foundations linked to a focus area name via foundation_focus_areas junction. */
export async function getFoundationsByFocusArea(focusAreaName: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const hd = { apikey: key, Authorization: `Bearer ${key}` }
  const jRes = await fetch(`${url}/rest/v1/foundation_focus_areas?focus_area=eq.${encodeURIComponent(focusAreaName)}&select=foundation_id`, { headers: hd })
  const junctions: any[] = jRes.ok ? await jRes.json() : []
  const ids = Array.from(new Set(junctions.map(j => j.foundation_id)))
  if (ids.length === 0) return []
  const fRes = await fetch(`${url}/rest/v1/foundations?id=in.(${ids.join(',')})&select=id,name,mission,assets,annual_giving,website_url,website_display,geo_level,org_id&order=name`, { headers: hd })
  return fRes.ok ? fRes.json() : []
}

/**
 * Fetch translations for any table type.
 * Returns a map keyed by content_id with translated title/summary.
 * Handles both 'title'/'summary' and 'title_6th_grade'/'summary_6th_grade' field_name formats.
 */
