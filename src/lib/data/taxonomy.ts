import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import type { Database } from '@/lib/supabase/database.types'
import type { FocusArea, SDG, SDOHDomain } from '@/lib/types/exchange'

type MunicipalServiceRow = Database['public']['Tables']['municipal_services']['Row']

export interface CircleGraphData {
  pathways: Array<{
    id: string; name: string; color: string; slug: string
    focusAreas: Array<{ id: string; name: string }>
    entityCounts: { content: number; services: number; officials: number; organizations: number; policies: number }
  }>
  bridges: Array<{ from: string; to: string; count: number }>
  totals: { content: number; services: number; officials: number; organizations: number; policies: number; focusAreas: number }
}
/** All focus areas (specific topics like "Mental Health" under a pathway). */
export async function getFocusAreas(): Promise<FocusArea[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*')
  return data ?? []
}

/** Quick lookup: focus_id → focus_area_name. Used for rendering focus area labels. */

/** Quick lookup: focus_id → focus_area_name. Used for rendering focus area labels. */
export async function getFocusAreaMap(): Promise<Record<string, string>> {
  const areas = await getFocusAreas()
  const map: Record<string, string> = {}
  areas.forEach(function (a) { map[a.focus_id] = a.focus_area_name })
  return map
}


export async function getSDGs(): Promise<SDG[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdgs').select('*').order('sdg_number')
  return data ?? []
}


export async function getSDGMap(): Promise<Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>> {
  const sdgs = await getSDGs()
  const map: Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }> = {}
  sdgs.forEach(function (s) { map[s.sdg_id] = { sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })
  return map
}


export async function getSDOHDomains(): Promise<SDOHDomain[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('sdoh_domains').select('*')
  return data ?? []
}


export async function getSDOHMap(): Promise<Record<string, { sdoh_name: string; sdoh_description: string | null }>> {
  const domains = await getSDOHDomains()
  const map: Record<string, { sdoh_name: string; sdoh_description: string | null }> = {}
  domains.forEach(function (d) { map[d.sdoh_code] = { sdoh_name: d.sdoh_name, sdoh_description: d.sdoh_description } })
  return map
}


export async function getFocusAreasByIds(ids: string[]): Promise<FocusArea[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase.from('focus_areas').select('*').in('focus_id', ids)
  return data ?? []
}

/** Fetch published content linked to a focus area via the content_focus_areas junction. */

/**
 * Get topics (focus area names) for a pathway, used in sidebar topic pills.
 */
export async function getPathwayTopics(themeId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('focus_areas')
    .select('focus_area_name')
    .eq('theme_id', themeId)
    .order('focus_area_name')
  return (data ?? []).map(fa => fa.focus_area_name)
}

/**
 * Get all topic names across all pathways for the home state sidebar.
 * Returns top topics by entity count.
 */

/**
 * Get all topic names across all pathways for the home state sidebar.
 * Returns top topics by entity count.
 */
export async function getAllTopics(limit = 24): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('focus_areas')
    .select('focus_area_name')
    .order('focus_area_name')
    .limit(limit)
  return (data ?? []).map(fa => fa.focus_area_name)
}

/** Related organizations matching focus area IDs. */

/** Get content linked to a specific focus area for the drill-down panel. */

/** Get content linked to a specific focus area for the drill-down panel. */
export async function getFocusAreaDrillDown(focusId: string) {
  const supabase = await createClient()

  // content_published and guides have array-type focus_area_ids → use contains
  // orgs, services, policies, opportunities have text-type → use ilike
  const textMatch = `focus_area_ids.ilike.%${focusId}%`

  const [
    { data: focusArea },
    { data: content },
    { data: orgs },
    { data: services },
    { data: guides },
    { data: opportunities },
  ] = await Promise.all([
    supabase.from('focus_areas').select('*').eq('focus_id', focusId).single(),
    supabase.from('content_published')
      .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, image_url, source_url')
      .contains('focus_area_ids', [focusId])
      .order('published_at', { ascending: false })
      .limit(10),
    supabase.from('organizations')
      .select('org_id, org_name, website, description_5th_grade, org_type, logo_url')
      .or(textMatch)
      .limit(10),
    supabase.from('services_211')
      .select('service_id, service_name, org_id, description_5th_grade')
      .eq('is_active', 'Yes')
      .or(textMatch)
      .limit(10),
    supabase.from('guides')
      .select('guide_id, title, slug, description')
      .eq('is_active', true)
      .contains('focus_area_ids', [focusId]),
    supabase.from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade')
      .eq('is_active', 'Yes')
      .or(textMatch)
      .limit(10),
  ])

  return {
    focusArea,
    content: content || [],
    organizations: orgs || [],
    services: services || [],
    guides: guides || [],
    opportunities: opportunities || [],
  }
}



export async function getCircleGraphData(): Promise<CircleGraphData> {
  const supabase = await createClient()

  const [
    { data: focusAreas },
    { data: contentFocus },
    { data: serviceFocus },
    { data: officialFocus },
    { data: orgFocus },
    { data: policyFocus },
    { data: contentAll },
    { data: servicesAll },
    { data: officialsAll },
    { data: orgsAll },
    { data: policiesAll },
  ] = await Promise.all([
    supabase.from('focus_areas').select('focus_id, focus_area_name, theme_id'),
    supabase.from('content_focus_areas').select('content_id, focus_id').limit(5000),
    supabase.from('service_focus_areas').select('service_id, focus_id').limit(5000),
    supabase.from('official_focus_areas').select('official_id, focus_id').limit(5000),
    supabase.from('organization_focus_areas').select('org_id, focus_id').limit(5000),
    supabase.from('policy_focus_areas').select('policy_id, focus_id').limit(5000),
    supabase.from('content_published').select('id, pathway_primary').eq('is_active', true),
    supabase.from('services_211').select('service_id'),
    supabase.from('elected_officials').select('official_id'),
    supabase.from('organizations').select('org_id'),
    supabase.from('policies').select('policy_id'),
  ])

  // Group focus areas by theme
  const faByTheme: Record<string, Array<{ id: string; name: string }>> = {}
  for (const fa of focusAreas ?? []) {
    if (!fa.theme_id) continue
    if (!faByTheme[fa.theme_id]) faByTheme[fa.theme_id] = []
    faByTheme[fa.theme_id].push({ id: fa.focus_id, name: fa.focus_area_name || '' })
  }

  // Count entities per focus area
  const faEntityCount: Record<string, { content: number; services: number; officials: number; organizations: number; policies: number }> = {}
  function ensureFa(fid: string) {
    if (!faEntityCount[fid]) faEntityCount[fid] = { content: 0, services: 0, officials: 0, organizations: 0, policies: 0 }
  }
  for (const r of contentFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].content++ }
  for (const r of serviceFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].services++ }
  for (const r of officialFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].officials++ }
  for (const r of orgFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].organizations++ }
  for (const r of policyFocus ?? []) { ensureFa(r.focus_id); faEntityCount[r.focus_id].policies++ }

  // Aggregate counts per theme
  const themeIds = Object.keys(THEMES)
  const pathways = themeIds.map(function (tid) {
    const t = THEMES[tid as keyof typeof THEMES]
    const fas = faByTheme[tid] || []
    const counts = { content: 0, services: 0, officials: 0, organizations: 0, policies: 0 }
    for (const fa of fas) {
      const fc = faEntityCount[fa.id]
      if (fc) {
        counts.content += fc.content
        counts.services += fc.services
        counts.officials += fc.officials
        counts.organizations += fc.organizations
        counts.policies += fc.policies
      }
    }
    return { id: tid, name: t.name, color: t.color, slug: t.slug, focusAreas: fas, entityCounts: counts }
  })

  // Bridge connections: themes that share focus areas connected to the same entities
  const bridges: Array<{ from: string; to: string; count: number }> = []
  // Build focus_id -> theme_id map
  const faToTheme: Record<string, string> = {}
  for (const fa of focusAreas ?? []) { if (fa.theme_id) faToTheme[fa.focus_id] = fa.theme_id }

  // For each entity's focus areas, find which themes are connected
  function addBridges(rows: Array<{ focus_id: string }>, idKey: string) {
    const entityThemes: Record<string, Set<string>> = {}
    for (const r of rows) {
      const eid = (r as any)[idKey]
      const theme = faToTheme[r.focus_id]
      if (!eid || !theme) continue
      if (!entityThemes[eid]) entityThemes[eid] = new Set()
      entityThemes[eid].add(theme)
    }
    const bridgeCount: Record<string, number> = {}
    for (const themes of Object.values(entityThemes)) {
      const arr = Array.from(themes).sort()
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const key = arr[i] + '|' + arr[j]
          bridgeCount[key] = (bridgeCount[key] || 0) + 1
        }
      }
    }
    return bridgeCount
  }

  const allBridgeCounts: Record<string, number> = {}
  for (const src of [
    { rows: contentFocus ?? [], key: 'content_id' },
    { rows: orgFocus ?? [], key: 'org_id' },
    { rows: officialFocus ?? [], key: 'official_id' },
  ]) {
    const bc = addBridges(src.rows, src.key)
    for (const [k, v] of Object.entries(bc)) {
      allBridgeCounts[k] = (allBridgeCounts[k] || 0) + v
    }
  }
  for (const [key, count] of Object.entries(allBridgeCounts)) {
    if (count < 2) continue
    const [from, to] = key.split('|')
    bridges.push({ from, to, count })
  }
  bridges.sort(function (a, b) { return b.count - a.count })

  // Content counts by pathway_primary
  const contentByPw: Record<string, number> = {}
  for (const c of contentAll ?? []) {
    if (c.pathway_primary) contentByPw[c.pathway_primary] = (contentByPw[c.pathway_primary] || 0) + 1
  }

  return {
    pathways,
    bridges: bridges.slice(0, 21),
    totals: {
      content: (contentAll ?? []).length,
      services: (servicesAll ?? []).length,
      officials: (officialsAll ?? []).length,
      organizations: (orgsAll ?? []).length,
      policies: (policiesAll ?? []).length,
      focusAreas: (focusAreas ?? []).length,
    },
  }
}

// ── TIRZ Zones ─────────────────────────────────────────────────────────

