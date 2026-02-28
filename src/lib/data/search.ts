import { createClient } from '@/lib/supabase/server'
import type { SearchResults, ServiceWithOrg } from '@/lib/types/exchange'

export async function searchAll(query: string): Promise<SearchResults> {
  if (!query || query.trim().length === 0) {
    return { content: [], officials: [], services: [] }
  }

  const supabase = await createClient()
  const pattern = '%' + query.trim() + '%'

  const [contentRes, officialsRes, servicesRes] = await Promise.all([
    supabase
      .from('content_published')
      .select('*')
      .eq('is_active', true)
      .or('title_6th_grade.ilike.' + pattern + ',summary_6th_grade.ilike.' + pattern)
      .order('published_at', { ascending: false })
      .limit(20),
    supabase
      .from('elected_officials')
      .select('*')
      .or('official_name.ilike.' + pattern + ',title.ilike.' + pattern)
      .limit(20),
    supabase
      .from('services_211')
      .select('*')
      .eq('is_active', 'Yes')
      .or('service_name.ilike.' + pattern + ',description_5th_grade.ilike.' + pattern)
      .limit(20),
  ])

  // Enrich services with org names
  var services: ServiceWithOrg[] = []
  if (servicesRes.data && servicesRes.data.length > 0) {
    var orgIds = Array.from(new Set(servicesRes.data.map(function (s) { return s.org_id }).filter(Boolean)))
    if (orgIds.length > 0) {
      var { data: orgs } = await supabase
        .from('organizations')
        .select('org_id, org_name')
        .in('org_id', orgIds as string[])
      var orgMap = new Map(orgs?.map(function (o) { return [o.org_id, o.org_name] as [string, string] }) ?? [])
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
  }
}
