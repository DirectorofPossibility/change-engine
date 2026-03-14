/**
 * Unified entity graph queries.
 *
 * Fetches across ALL entity tables (content, services, orgs, policies,
 * officials, opportunities) filtered by pathway/theme.
 *
 * Used by journey pages, pathway pages, homepage centers, and anywhere
 * that needs the full picture of what exists on a pathway.
 */

import { createClient } from '@/lib/supabase/server'

export interface PathwayEntities {
  content: any[]
  services: any[]
  organizations: any[]
  policies: any[]
  officials: any[]
  opportunities: any[]
  counts: {
    content: number
    services: number
    organizations: number
    policies: number
    officials: number
    opportunities: number
    total: number
  }
}

/**
 * Fetch all entity types for a set of pathway theme IDs.
 * Returns entities filtered by pathway with counts.
 */
export async function getEntitiesByPathways(
  themeIds: string[],
  limits: { content?: number; services?: number; orgs?: number; policies?: number; officials?: number; opportunities?: number } = {},
): Promise<PathwayEntities> {
  const supabase = await createClient()
  const themeFilter = themeIds.map(t => `"${t}"`).join(',')

  const contentLimit = limits.content ?? 8
  const serviceLimit = limits.services ?? 8
  const orgLimit = limits.orgs ?? 8
  const policyLimit = limits.policies ?? 6
  const officialLimit = limits.officials ?? 12
  const oppLimit = limits.opportunities ?? 6

  const [
    contentResult,
    contentCountResult,
    serviceResult,
    serviceCountResult,
    orgResult,
    orgCountResult,
    policyResult,
    policyCountResult,
    officialResult,
    officialCountResult,
    oppResult,
    oppCountResult,
  ] = await Promise.all([
    // Content — use pathway_primary
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, source_domain, pathway_primary, content_type, org_id, slug, video_url, center')
      .eq('is_active', true)
      .in('pathway_primary', themeIds)
      .order('published_at', { ascending: false })
      .limit(contentLimit),
    supabase
      .from('content_published')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('pathway_primary', themeIds),

    // Services — use classification_v2->>'theme_primary'
    supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, city, org_id, website')
      .eq('is_active', 'Yes')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(serviceLimit),
    supabase
      .from('services_211')
      .select('service_id', { count: 'exact', head: true })
      .eq('is_active', 'Yes')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),

    // Organizations — use theme_id column
    supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, city, website, theme_id')
      .in('theme_id', themeIds)
      .order('org_name')
      .limit(orgLimit),
    supabase
      .from('organizations')
      .select('org_id', { count: 'exact', head: true })
      .in('theme_id', themeIds),

    // Policies — use classification_v2->>'theme_primary'
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, summary_6th_grade, level, status, bill_number, authoring_body, source_url')
      .eq('is_published', true)
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .order('last_action_date', { ascending: false })
      .limit(policyLimit),
    supabase
      .from('policies')
      .select('policy_id', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),

    // Officials — use classification_v2->>'theme_primary'
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(officialLimit),
    supabase
      .from('elected_officials')
      .select('official_id', { count: 'exact', head: true })
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),

    // Opportunities — use classification_v2->>'theme_primary'
    (supabase as any)
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, city, is_virtual, org_id, registration_url')
      .eq('is_active', 'Yes')
      .gte('end_date', new Date().toISOString())
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .order('start_date', { ascending: true })
      .limit(oppLimit),
    (supabase as any)
      .from('opportunities')
      .select('opportunity_id', { count: 'exact', head: true })
      .eq('is_active', 'Yes')
      .gte('end_date', new Date().toISOString())
      .or(themeIds.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),
  ])

  return {
    content: contentResult.data || [],
    services: serviceResult.data || [],
    organizations: orgResult.data || [],
    policies: policyResult.data || [],
    officials: officialResult.data || [],
    opportunities: oppResult.data || [],
    counts: {
      content: contentCountResult.count ?? 0,
      services: serviceCountResult.count ?? 0,
      organizations: orgCountResult.count ?? 0,
      policies: policyCountResult.count ?? 0,
      officials: officialCountResult.count ?? 0,
      opportunities: oppCountResult.count ?? 0,
      total: (contentCountResult.count ?? 0) + (serviceCountResult.count ?? 0) +
        (orgCountResult.count ?? 0) + (policyCountResult.count ?? 0) +
        (officialCountResult.count ?? 0) + (oppCountResult.count ?? 0),
    },
  }
}

/**
 * Fetch entities for a center page.
 * Content is filtered by center column; other entity types are fetched
 * for the pathways most represented in that center's content.
 */
export async function getEntitiesByCenter(
  centerName: string,
  limits: { content?: number; services?: number; orgs?: number; policies?: number; officials?: number; opportunities?: number } = {},
): Promise<PathwayEntities & { contentByType: Record<string, any[]>; topPathways: string[] }> {
  const supabase = await createClient()

  const contentLimit = limits.content ?? 30
  const serviceLimit = limits.services ?? 8
  const orgLimit = limits.orgs ?? 12
  const policyLimit = limits.policies ?? 6
  const officialLimit = limits.officials ?? 8
  const oppLimit = limits.opportunities ?? 6

  // Step 1: Get content for this center
  const [contentResult, contentCountResult] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, image_url, source_url, source_domain, pathway_primary, content_type, org_id, slug, video_url, center, inbox_id, published_at')
      .eq('is_active', true)
      .eq('center', centerName)
      .order('published_at', { ascending: false })
      .limit(contentLimit),
    supabase
      .from('content_published')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('center', centerName),
  ])

  const content = contentResult.data || []

  // Group content by type for display
  const contentByType: Record<string, any[]> = {}
  for (const item of content) {
    const ct = item.content_type || 'article'
    if (!contentByType[ct]) contentByType[ct] = []
    contentByType[ct].push(item)
  }

  // Find top pathways in this center's content
  const pathwayCounts: Record<string, number> = {}
  for (const item of content) {
    if (item.pathway_primary) {
      pathwayCounts[item.pathway_primary] = (pathwayCounts[item.pathway_primary] || 0) + 1
    }
  }
  const topPathways = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Step 2: Fetch other entities for those top pathways
  if (topPathways.length === 0) {
    return {
      content,
      services: [],
      organizations: [],
      policies: [],
      officials: [],
      opportunities: [],
      counts: {
        content: contentCountResult.count ?? 0,
        services: 0, organizations: 0, policies: 0, officials: 0, opportunities: 0,
        total: contentCountResult.count ?? 0,
      },
      contentByType,
      topPathways,
    }
  }

  const [
    serviceResult, serviceCountResult,
    orgResult, orgCountResult,
    policyResult, policyCountResult,
    officialResult, officialCountResult,
    oppResult, oppCountResult,
  ] = await Promise.all([
    supabase.from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, city, org_id, website')
      .eq('is_active', 'Yes')
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(serviceLimit),
    supabase.from('services_211')
      .select('service_id', { count: 'exact', head: true })
      .eq('is_active', 'Yes')
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),
    supabase.from('organizations')
      .select('org_id, org_name, description_5th_grade, logo_url, city, website, theme_id')
      .in('theme_id', topPathways)
      .order('org_name')
      .limit(orgLimit),
    supabase.from('organizations')
      .select('org_id', { count: 'exact', head: true })
      .in('theme_id', topPathways),
    supabase.from('policies')
      .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number')
      .eq('is_published', true)
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .order('last_action_date', { ascending: false })
      .limit(policyLimit),
    supabase.from('policies')
      .select('policy_id', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),
    supabase.from('elected_officials')
      .select('official_id, official_name, title, party, level, photo_url')
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .limit(officialLimit),
    supabase.from('elected_officials')
      .select('official_id', { count: 'exact', head: true })
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),
    (supabase as any).from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, city, is_virtual, org_id, registration_url')
      .eq('is_active', 'Yes')
      .gte('end_date', new Date().toISOString())
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(','))
      .order('start_date', { ascending: true })
      .limit(oppLimit),
    (supabase as any).from('opportunities')
      .select('opportunity_id', { count: 'exact', head: true })
      .eq('is_active', 'Yes')
      .gte('end_date', new Date().toISOString())
      .or(topPathways.map(t => `classification_v2->theme_primary.eq.${t}`).join(',')),
  ])

  return {
    content,
    services: serviceResult.data || [],
    organizations: orgResult.data || [],
    policies: policyResult.data || [],
    officials: officialResult.data || [],
    opportunities: oppResult.data || [],
    counts: {
      content: contentCountResult.count ?? 0,
      services: serviceCountResult.count ?? 0,
      organizations: orgCountResult.count ?? 0,
      policies: policyCountResult.count ?? 0,
      officials: officialCountResult.count ?? 0,
      opportunities: oppCountResult.count ?? 0,
      total: (contentCountResult.count ?? 0) + (serviceCountResult.count ?? 0) +
        (orgCountResult.count ?? 0) + (policyCountResult.count ?? 0) +
        (officialCountResult.count ?? 0) + (oppCountResult.count ?? 0),
    },
    contentByType,
    topPathways,
  }
}

/**
 * Get cross-entity counts per center (for centers index page).
 */
export async function getCenterEntityCounts(): Promise<Record<string, { content: number; services: number; orgs: number; total: number }>> {
  const supabase = await createClient()

  const [contentResult, serviceResult, orgResult] = await Promise.all([
    supabase.from('content_published').select('center').eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
  ])

  const contentByCenter: Record<string, number> = {}
  for (const item of (contentResult.data || [])) {
    const c = (item.center as string) || 'Learning'
    contentByCenter[c] = (contentByCenter[c] || 0) + 1
  }

  const serviceCount = serviceResult.count ?? 0
  const orgCount = orgResult.count ?? 0

  return {
    Learning: { content: contentByCenter['Learning'] || 0, services: 0, orgs: 0, total: contentByCenter['Learning'] || 0 },
    Resource: { content: contentByCenter['Resource'] || 0, services: serviceCount, orgs: orgCount, total: (contentByCenter['Resource'] || 0) + serviceCount + orgCount },
    Action: { content: contentByCenter['Action'] || 0, services: 0, orgs: 0, total: contentByCenter['Action'] || 0 },
    Accountability: { content: contentByCenter['Accountability'] || 0, services: 0, orgs: 0, total: contentByCenter['Accountability'] || 0 },
  }
}

/**
 * Get entity counts for ALL pathways at once (for overview pages).
 */
export async function getPathwayCounts(): Promise<Record<string, { content: number; services: number; orgs: number; policies: number; total: number }>> {
  const supabase = await createClient()
  const themes = ['THEME_01', 'THEME_02', 'THEME_03', 'THEME_04', 'THEME_05', 'THEME_06', 'THEME_07']

  const results: Record<string, { content: number; services: number; orgs: number; policies: number; total: number }> = {}

  // Batch: get content counts by pathway
  const [contentCounts, orgCounts] = await Promise.all([
    supabase
      .from('content_published')
      .select('pathway_primary')
      .eq('is_active', true)
      .in('pathway_primary', themes),
    supabase
      .from('organizations')
      .select('theme_id')
      .in('theme_id', themes),
  ])

  // Count by theme
  const contentByTheme: Record<string, number> = {}
  const orgByTheme: Record<string, number> = {}
  for (const item of (contentCounts.data || [])) {
    const key = item.pathway_primary as string
    if (key) contentByTheme[key] = (contentByTheme[key] || 0) + 1
  }
  for (const item of (orgCounts.data || [])) {
    const key = item.theme_id as string
    if (key) orgByTheme[key] = (orgByTheme[key] || 0) + 1
  }

  for (const t of themes) {
    const c = contentByTheme[t] || 0
    const o = orgByTheme[t] || 0
    results[t] = { content: c, services: 0, orgs: o, policies: 0, total: c + o }
  }

  return results
}
