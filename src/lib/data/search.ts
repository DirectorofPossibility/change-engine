/**
 * @fileoverview Full-text search across all entity tables.
 *
 * Uses PostgreSQL full-text search (tsvector/tsquery) via Supabase's `.textSearch()`.
 * Each table has an `fts` generated column that indexes relevant text fields.
 * Queries all 8 entity types in parallel, then enriches services with org names.
 *
 * Search result types are defined in `@/lib/types/exchange` as narrow column subsets
 * to keep responses lightweight.
 */

import { createClient } from '@/lib/supabase/server'
import type { SearchResults, SearchResultService } from '@/lib/types/exchange'

/**
 * Search across all content types using PostgreSQL full-text search.
 * Multi-word queries use OR so any matching word returns results.
 * Services are enriched with their parent organization name via a follow-up query.
 */
/**
 * Taxonomy filter parameters — used when wayfinder taxonomy links are clicked.
 * Each filter queries the relevant junction tables to find content classified
 * under that taxonomy value.
 */
export interface TaxonomyFilter {
  sdg?: string      // sdg_id
  sdoh?: string     // sdoh_code
  gov_level?: string // gov_level_id
  action_type?: string // action_type_id
  time?: string     // time_id
}

/**
 * Search by taxonomy classification — finds content linked through junction tables.
 * Used when users click taxonomy links in the wayfinder (SDGs, SDOH domains, etc.).
 */
export async function searchByTaxonomy(filter: TaxonomyFilter): Promise<SearchResults> {
  const empty: SearchResults = { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  const supabase = await createClient()

  // Build parallel queries based on which filter is active
  const contentIds = new Set<string>()
  const officialIds = new Set<string>()
  const serviceIds = new Set<string>()
  const orgIds = new Set<string>()
  const policyIds = new Set<string>()

  if (filter.sdg) {
    const [c, o, s, org, p] = await Promise.all([
      supabase.from('content_sdgs').select('content_id').eq('sdg_id', filter.sdg),
      supabase.from('official_sdgs').select('official_id').eq('sdg_id', filter.sdg),
      supabase.from('service_sdgs').select('service_id').eq('sdg_id', filter.sdg),
      supabase.from('organization_sdgs').select('org_id').eq('sdg_id', filter.sdg),
      supabase.from('policy_sdgs').select('policy_id').eq('sdg_id', filter.sdg),
    ])
    c.data?.forEach(r => contentIds.add(r.content_id))
    o.data?.forEach(r => officialIds.add(r.official_id))
    s.data?.forEach(r => serviceIds.add(r.service_id))
    org.data?.forEach(r => orgIds.add(r.org_id))
    p.data?.forEach(r => policyIds.add(r.policy_id))
  }

  if (filter.sdoh) {
    // SDOH links through focus_areas → content_focus_areas
    const { data: focusAreas } = await supabase
      .from('focus_areas')
      .select('focus_id')
      .eq('sdoh_code', filter.sdoh)
    if (focusAreas && focusAreas.length > 0) {
      const focusIds = focusAreas.map(f => f.focus_id)
      const [c, o, s, org, p] = await Promise.all([
        supabase.from('content_focus_areas').select('content_id').in('focus_id', focusIds),
        supabase.from('official_focus_areas').select('official_id').in('focus_id', focusIds),
        supabase.from('service_focus_areas').select('service_id').in('focus_id', focusIds),
        supabase.from('organization_focus_areas').select('org_id').in('focus_id', focusIds),
        supabase.from('policy_focus_areas').select('policy_id').in('focus_id', focusIds),
      ])
      c.data?.forEach(r => contentIds.add(r.content_id))
      o.data?.forEach(r => officialIds.add(r.official_id))
      s.data?.forEach(r => serviceIds.add(r.service_id))
      org.data?.forEach(r => orgIds.add(r.org_id))
      p.data?.forEach(r => policyIds.add(r.policy_id))
    }
  }

  if (filter.gov_level) {
    const { data } = await supabase.from('content_government_levels').select('content_id').eq('gov_level_id', filter.gov_level)
    data?.forEach(r => contentIds.add(r.content_id))
  }

  if (filter.action_type) {
    const { data } = await supabase.from('content_action_types').select('content_id').eq('action_type_id', filter.action_type)
    data?.forEach(r => contentIds.add(r.content_id))
  }

  if (filter.time) {
    // Time commitment is stored on opportunities, not content
    // For now just return empty for this filter type
  }

  // Fetch full entities for all collected IDs
  const cIds = Array.from(contentIds).slice(0, 30)
  const oIds = Array.from(officialIds).slice(0, 20)
  const sIds = Array.from(serviceIds).slice(0, 20)
  const oiIds = Array.from(orgIds).slice(0, 20)
  const pIds = Array.from(policyIds).slice(0, 20)

  const [contentRes, officialsRes, servicesRes, orgsRes, policiesRes] = await Promise.all([
    cIds.length > 0
      ? supabase.from('content_published').select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at').in('id', cIds).eq('is_active', true)
      : { data: [] },
    oIds.length > 0
      ? supabase.from('elected_officials').select('official_id, official_name, title, level, party, jurisdiction, email, office_phone, website').in('official_id', oIds)
      : { data: [] },
    sIds.length > 0
      ? supabase.from('services_211').select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website').in('service_id', sIds).eq('is_active', 'Yes')
      : { data: [] },
    oiIds.length > 0
      ? supabase.from('organizations').select('org_id, org_name, description_5th_grade, website, org_type, logo_url').in('org_id', oiIds)
      : { data: [] },
    pIds.length > 0
      ? supabase.from('policies').select('policy_id, policy_name, title_6th_grade, policy_type, level, status, summary_5th_grade, summary_6th_grade, bill_number, source_url').in('policy_id', pIds)
      : { data: [] },
  ])

  // Enrich services with org names
  let services: SearchResultService[] = []
  if (servicesRes.data && servicesRes.data.length > 0) {
    const svcOrgIds = Array.from(new Set(servicesRes.data.map(function (s) { return s.org_id }).filter(Boolean)))
    if (svcOrgIds.length > 0) {
      const { data: orgs } = await supabase.from('organizations').select('org_id, org_name').in('org_id', svcOrgIds as string[])
      const orgMap = new Map(orgs?.map(function (o) { return [o.org_id, o.org_name] as [string, string] }) ?? [])
      services = servicesRes.data.map(function (s) { return Object.assign({}, s, { org_name: orgMap.get(s.org_id!) ?? undefined }) })
    } else {
      services = servicesRes.data
    }
  }

  return {
    content: contentRes.data ?? [],
    officials: officialsRes.data ?? [],
    services,
    organizations: orgsRes.data ?? [],
    policies: policiesRes.data ?? [],
    situations: [],
    resources: [],
    paths: [],
  }
}

export async function searchAll(query: string): Promise<SearchResults> {
  const empty: SearchResults = { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  if (!query || query.trim().length === 0) return empty

  const supabase = await createClient()
  // Strip non-word chars (& symbols etc.) and OR the words for broader matching
  const words = query.trim().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 0) return empty
  const tsQuery = words.join(' | ')

  const [contentRes, servicesRes, officialsRes, orgsRes, policiesRes, situationsRes, resourcesRes, pathsRes] = await Promise.all([
    supabase
      .from('content_published')
      .select('id, inbox_id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at')
      .textSearch('fts', tsQuery)
      .eq('is_active', true)
      .limit(20),
    supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, org_id, phone, address, city, state, zip_code, website')
      .textSearch('fts', tsQuery)
      .eq('is_active', 'Yes')
      .limit(20),
    supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, jurisdiction, email, office_phone, website')
      .textSearch('fts', tsQuery)
      .limit(20),
    supabase
      .from('organizations')
      .select('org_id, org_name, description_5th_grade, website, org_type, logo_url')
      .textSearch('fts', tsQuery)
      .limit(20),
    supabase
      .from('policies')
      .select('policy_id, policy_name, title_6th_grade, policy_type, level, status, summary_5th_grade, summary_6th_grade, bill_number, source_url')
      .textSearch('fts', tsQuery)
      .limit(10),
    supabase
      .from('life_situations')
      .select('situation_id, situation_name, situation_slug, description_5th_grade, urgency_level, icon_name')
      .textSearch('fts', tsQuery)
      .limit(10),
    supabase
      .from('resources')
      .select('resource_id, resource_name, description_5th_grade, source_url')
      .textSearch('fts', tsQuery)
      .eq('is_active', 'Yes')
      .limit(20),
    supabase
      .from('learning_paths')
      .select('path_id, path_name, description_5th_grade, theme_id, difficulty_level')
      .textSearch('fts', tsQuery)
      .eq('is_active', 'Yes')
      .limit(10),
  ])

  // Enrich services with org names
  let services: SearchResultService[] = []
  if (servicesRes.data && servicesRes.data.length > 0) {
    const orgIds = Array.from(new Set(servicesRes.data.map(function (s) { return s.org_id }).filter(Boolean)))
    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from('organizations')
        .select('org_id, org_name')
        .in('org_id', orgIds as string[])
      const orgMap = new Map(orgs?.map(function (o) { return [o.org_id, o.org_name] as [string, string] }) ?? [])
      services = servicesRes.data.map(function (s) {
        return Object.assign({}, s, { org_name: orgMap.get(s.org_id!) ?? undefined })
      })
    } else {
      services = servicesRes.data
    }
  }

  return {
    content: contentRes.data ?? [],
    officials: officialsRes.data ?? [],
    services: services,
    organizations: orgsRes.data ?? [],
    policies: policiesRes.data ?? [],
    situations: situationsRes.data ?? [],
    resources: resourcesRes.data ?? [],
    paths: pathsRes.data ?? [],
  }
}
