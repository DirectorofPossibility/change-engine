import { createClient } from '@/lib/supabase/server'
import type { ExchangeStats, ServiceWithOrg } from '@/lib/types/exchange'

export async function getExchangeStats(): Promise<ExchangeStats> {
  const supabase = await createClient()
  const [resources, services, officials, paths] = await Promise.all([
    supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
    supabase.from('learning_paths').select('path_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
  ])
  return {
    resources: resources.count ?? 0,
    services: services.count ?? 0,
    officials: officials.count ?? 0,
    learningPaths: paths.count ?? 0,
  }
}

export async function getCenterCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}

export async function getLatestContent(limit = 6) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getLifeSituations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .order('display_order', { ascending: true })
  return data ?? []
}

export async function getLifeSituation(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('life_situations')
    .select('*')
    .eq('situation_slug', slug)
    .single()
  return data
}

export async function getLifeSituationContent(focusAreaIds: string, serviceCatIds: string | null) {
  const supabase = await createClient()
  // focus_area_ids is comma-separated TEXT in life_situations
  const focusIds = focusAreaIds.split(',').map(s => s.trim()).filter(Boolean)

  const { data: content } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .overlaps('focus_area_ids', focusIds)
    .order('published_at', { ascending: false })
    .limit(20)

  let services: ServiceWithOrg[] = []
  if (serviceCatIds) {
    const catIds = serviceCatIds.split(',').map(s => s.trim()).filter(Boolean)
    const { data: svcData } = await supabase
      .from('services_211')
      .select('*')
      .eq('is_active', 'Yes')
      .in('service_cat_id', catIds)
      .limit(20)
    if (svcData) {
      // Join with organizations
      const orgIds = Array.from(new Set(svcData.map(s => s.org_id).filter(Boolean)))
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('org_id, org_name')
          .in('org_id', orgIds as string[])
        const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
        services = svcData.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
      } else {
        services = svcData
      }
    }
  }

  return { content: content ?? [], services }
}

export async function getOfficials() {
  const supabase = await createClient()
  const [{ data: officials }, { data: levels }] = await Promise.all([
    supabase.from('elected_officials').select('*').order('official_name'),
    supabase.from('government_levels').select('*').order('level_order'),
  ])
  return { officials: officials ?? [], levels: levels ?? [] }
}

export async function getServices(): Promise<ServiceWithOrg[]> {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services_211')
    .select('*')
    .eq('is_active', 'Yes')
    .order('service_name')

  if (!services || services.length === 0) return []

  const orgIds = Array.from(new Set(services.map(s => s.org_id).filter(Boolean)))
  if (orgIds.length === 0) return services

  const { data: orgs } = await supabase
    .from('organizations')
    .select('org_id, org_name')
    .in('org_id', orgIds as string[])

  const orgMap = new Map(orgs?.map(o => [o.org_id, o.org_name]) ?? [])
  return services.map(s => ({ ...s, org_name: orgMap.get(s.org_id!) ?? undefined }))
}

export async function getLearningPaths() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('is_active', 'Yes')
    .order('display_order', { ascending: true })
  return data ?? []
}

export async function getPathwayContent(themeId: string, center?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
    .order('published_at', { ascending: false })

  if (center) {
    query = query.eq('center', center)
  }

  const { data } = await query.limit(50)
  return data ?? []
}

export async function getPathwayCounts(): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('pathway_primary')
    .eq('is_active', true)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.pathway_primary) {
      counts[item.pathway_primary] = (counts[item.pathway_primary] || 0) + 1
    }
  })
  return counts
}

export async function getCenterContentForPathway(themeId: string): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_published')
    .select('center')
    .eq('is_active', true)
    .eq('pathway_primary', themeId)
  const counts: Record<string, number> = {}
  data?.forEach((item) => {
    if (item.center) {
      counts[item.center] = (counts[item.center] || 0) + 1
    }
  })
  return counts
}
