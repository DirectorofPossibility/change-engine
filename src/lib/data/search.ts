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
 * Multi-word queries are AND'd together (all words must match).
 * Services are enriched with their parent organization name via a follow-up query.
 */
export async function searchAll(query: string): Promise<SearchResults> {
  const empty: SearchResults = { content: [], officials: [], services: [], organizations: [], policies: [], situations: [], resources: [], paths: [] }
  if (!query || query.trim().length === 0) return empty

  const supabase = await createClient()
  const tsQuery = query.trim().split(/\s+/).join(' & ')

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
      .select('org_id, org_name, description_5th_grade, website')
      .textSearch('fts', tsQuery)
      .limit(20),
    supabase
      .from('policies')
      .select('policy_id, policy_name, policy_type, level, status, summary_5th_grade, bill_number')
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
