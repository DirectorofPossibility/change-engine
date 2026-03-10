/**
 * @fileoverview Data fetching for the "State of My Neighborhood" story page.
 *
 * Aggregates neighborhood demographics, nearby services by category,
 * elected officials, upcoming elections, and recent content into a
 * single data bundle for the NeighborhoodStory component.
 *
 * @datasource Supabase tables: neighborhoods, neighborhood_zip_codes,
 *   services_211, elected_officials, elections, content_published, policies,
 *   zip_codes, precincts, precinct_neighborhoods, organizations
 */

import { createClient } from '@/lib/supabase/server'

// ── Types ──

export interface NeighborhoodStoryOfficial {
  official_id: string
  official_name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  website: string | null
}

export interface NeighborhoodStoryService {
  service_id: string
  service_name: string | null
  description_5th_grade: string | null
  phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  website: string | null
  service_category: string | null
}

export interface NeighborhoodStoryPolicy {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  last_action_date: string | null
}

export interface NeighborhoodStoryContent {
  id: string
  title_6th_grade: string | null
  summary_6th_grade: string | null
  pathway_primary: string | null
  source_url: string | null
  published_at: string | null
  content_type: string | null
}

export interface NeighborhoodStoryElection {
  election_name: string
  election_date: string
  election_type: string | null
  registration_deadline: string | null
  early_voting_start: string | null
  early_voting_end: string | null
  find_polling_url: string | null
  register_url: string | null
}

export interface ServiceCategoryCount {
  category: string
  count: number
}

export interface NeighborhoodStoryData {
  neighborhood: {
    neighborhood_id: string
    neighborhood_name: string
    description: string | null
    population: number | null
    median_income: number | null
    council_district: string | null
    super_neighborhood_id: string | null
  }
  superNeighborhoodName: string | null
  zipCodes: string[]
  stats: {
    serviceCount: number
    organizationCount: number
    officialCount: number
  }
  serviceCategoryCounts: ServiceCategoryCount[]
  topServices: NeighborhoodStoryService[]
  officials: NeighborhoodStoryOfficial[]
  recentPolicies: NeighborhoodStoryPolicy[]
  recentContent: NeighborhoodStoryContent[]
  upcomingElections: NeighborhoodStoryElection[]
}

// ── Main fetch ──

export async function getNeighborhoodStory(neighborhoodId: string): Promise<NeighborhoodStoryData | null> {
  const supabase = await createClient()

  // 1. Fetch the neighborhood itself
  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, neighborhood_name, description, population, median_income, council_district, super_neighborhood_id')
    .eq('neighborhood_id', neighborhoodId)
    .single()

  if (!neighborhood) return null

  // 2. Get ZIP codes for this neighborhood
  const { data: zipJunctions } = await supabase
    .from('neighborhood_zip_codes')
    .select('zip_code')
    .eq('neighborhood_id', neighborhoodId)

  const zipCodes = (zipJunctions ?? []).map(j => j.zip_code)

  // 3. Fetch super neighborhood name if applicable
  let superNeighborhoodName: string | null = null
  if (neighborhood.super_neighborhood_id) {
    const { data: sn } = await supabase
      .from('super_neighborhoods')
      .select('sn_name')
      .eq('sn_id', neighborhood.super_neighborhood_id)
      .single()
    superNeighborhoodName = sn?.sn_name ?? null
  }

  // 4. Parallel fetches for services, officials, elections, content, policies, orgs
  const today = new Date().toISOString().split('T')[0]

  // Build district IDs for officials lookup
  const districtIds: string[] = []
  if (neighborhood.council_district) {
    districtIds.push(neighborhood.council_district)
  }

  // Get additional district info from precincts
  const { data: precinctJunctions } = await supabase
    .from('precinct_neighborhoods')
    .select('precinct_id')
    .eq('neighborhood_id', neighborhoodId)

  const precinctIds = (precinctJunctions ?? []).map(j => j.precinct_id)
  if (precinctIds.length > 0) {
    const { data: precincts } = await supabase
      .from('precincts')
      .select('council_district, congressional_district, state_house_district, state_senate_district')
      .in('precinct_id', precinctIds)

    for (const p of precincts ?? []) {
      if (p.congressional_district) districtIds.push(p.congressional_district)
      if (p.state_house_district) districtIds.push(p.state_house_district)
      if (p.state_senate_district) districtIds.push(p.state_senate_district)
    }
  }

  // Always include statewide
  districtIds.push('TX')

  const uniqueDistricts = Array.from(new Set(districtIds))

  // Build services query based on ZIP codes
  const servicesPromise = zipCodes.length > 0
    ? supabase
        .from('services_211')
        .select('service_id, service_name, description_5th_grade, phone, address, city, zip_code, website, service_category')
        .eq('is_active', 'Yes')
        .in('zip_code', zipCodes)
        .order('service_name')
        .limit(100)
    : Promise.resolve({ data: [] as any[] })

  // Officials query
  let officialsFilterParts = uniqueDistricts.map(function (d) { return 'district_id.eq.' + d }).join(',')
  officialsFilterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'

  const officialsPromise = supabase
    .from('elected_officials')
    .select('official_id, official_name, title, party, level, email, website')
    .or(officialsFilterParts)
    .order('official_name')

  // Upcoming elections
  const electionsPromise = supabase
    .from('elections')
    .select('election_name, election_date, election_type, registration_deadline, early_voting_start, early_voting_end, find_polling_url, register_url')
    .eq('is_active', 'Yes')
    .gte('election_date', today)
    .order('election_date', { ascending: true })
    .limit(3)

  // Recent content (news about this area — use pathway 'Neighborhood' as proxy)
  const contentPromise = supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, source_url, published_at, content_type')
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(5)

  // Recent policies
  const policiesPromise = supabase
    .from('policies')
    .select('policy_id, policy_name, title_6th_grade, bill_number, status, level, last_action_date')
    .eq('is_published', true)
    .order('last_action_date', { ascending: false })
    .limit(6)

  // Organization count in the area
  const orgCountPromise = zipCodes.length > 0
    ? supabase
        .from('organizations')
        .select('org_id', { count: 'exact', head: true })
        .in('zip_code', zipCodes)
    : Promise.resolve({ count: 0 })

  const [
    servicesResult,
    officialsResult,
    electionsResult,
    contentResult,
    policiesResult,
    orgCountResult,
  ] = await Promise.all([
    servicesPromise,
    officialsPromise,
    electionsPromise,
    contentPromise,
    policiesPromise,
    orgCountPromise,
  ])

  const services = (servicesResult as any).data ?? []
  const officials = officialsResult.data ?? []
  const elections = electionsResult.data ?? []
  const content = contentResult.data ?? []
  const policies = policiesResult.data ?? []
  const orgCount = (orgCountResult as any).count ?? 0

  // Aggregate service categories
  const categoryMap: Record<string, number> = {}
  for (const svc of services) {
    const cat = svc.service_category || 'Other'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  }
  const serviceCategoryCounts = Object.entries(categoryMap)
    .map(function ([category, count]) { return { category, count } })
    .sort(function (a, b) { return b.count - a.count })

  return {
    neighborhood,
    superNeighborhoodName,
    zipCodes,
    stats: {
      serviceCount: services.length,
      organizationCount: orgCount,
      officialCount: officials.length,
    },
    serviceCategoryCounts,
    topServices: services.slice(0, 5),
    officials: officials.map(function (o: any) {
      return {
        official_id: o.official_id,
        official_name: o.official_name,
        title: o.title,
        party: o.party,
        level: o.level,
        email: o.email,
        website: o.website,
      }
    }),
    recentPolicies: policies.map(function (p: any) {
      return {
        policy_id: p.policy_id,
        policy_name: p.policy_name,
        title_6th_grade: p.title_6th_grade,
        bill_number: p.bill_number,
        status: p.status,
        level: p.level,
        last_action_date: p.last_action_date,
      }
    }),
    recentContent: content.map(function (c: any) {
      return {
        id: c.id,
        title_6th_grade: c.title_6th_grade,
        summary_6th_grade: c.summary_6th_grade,
        pathway_primary: c.pathway_primary,
        source_url: c.source_url,
        published_at: c.published_at,
        content_type: c.content_type,
      }
    }),
    upcomingElections: elections.map(function (e: any) {
      return {
        election_name: e.election_name,
        election_date: e.election_date,
        election_type: e.election_type,
        registration_deadline: e.registration_deadline,
        early_voting_start: e.early_voting_start,
        early_voting_end: e.early_voting_end,
        find_polling_url: e.find_polling_url,
        register_url: e.register_url,
      }
    }),
  }
}

/**
 * Resolve a neighborhood from a ZIP code.
 * Returns the neighborhood_id or null if no match.
 */
export async function getNeighborhoodIdByZip(zip: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('neighborhood_zip_codes')
    .select('neighborhood_id')
    .eq('zip_code', zip)
    .limit(1)

  if (!data || data.length === 0) return null
  return data[0].neighborhood_id
}
