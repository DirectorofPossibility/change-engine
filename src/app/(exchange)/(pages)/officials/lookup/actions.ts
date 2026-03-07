'use server'

import { createClient } from '@/lib/supabase/server'
import { getPoliciesByZip } from '@/lib/data/exchange'

interface Official {
  official_id: string
  official_name: string
  title: string | null
  party: string | null
  level: string | null
  email: string | null
  office_phone: string | null
  website: string | null
  district_id: string | null
}

interface Neighborhood {
  neighborhood_name: string
  city: string | null
  population: number | null
  median_income: number | null
}

interface VotingLocation {
  location_id: string
  location_name: string
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  hours_early_voting: string | null
  hours_election_day: string | null
  is_accessible: string | null
}

interface MunicipalService {
  id: string
  service_type: string
  service_name: string
  phone: string | null
  address: string | null
  city: string | null
  zip_code: string | null
  website: string | null
  hours: string | null
  coverage_area: string | null
  is_emergency: boolean
  display_order: number
}

interface MunicipalServicesByType {
  emergency: MunicipalService[]
  police: MunicipalService[]
  fire: MunicipalService[]
  medical: MunicipalService[]
  parks: MunicipalService[]
  library: MunicipalService[]
  utilities: MunicipalService[]
}

interface PolicySummary {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  impact_statement: string | null
}

export interface CivicProfileResult {
  zip: string
  federal: Official[]
  state: Official[]
  county: Official[]
  city: Official[]
  neighborhood: Neighborhood | null
  votingLocations: VotingLocation[]
  services: MunicipalServicesByType | null
  policies: { federal: PolicySummary[]; state: PolicySummary[]; city: PolicySummary[] } | null
}

function extractZip(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{5}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/\b(\d{5})\b/)
  return match ? match[1] : null
}

export async function lookupCivicProfile(input: string): Promise<{ data?: CivicProfileResult; error?: string }> {
  const zip = extractZip(input)
  if (!zip) return { error: 'no_zip' }

  const supabase = await createClient()

  // Step 1: Get district info
  const { data: zipData } = await supabase
    .from('zip_codes')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .single()

  if (!zipData) return { error: 'zip_not_found' }

  // Step 2: Find matching officials
  const districts = [
    zipData.congressional_district,
    zipData.state_senate_district,
    zipData.state_house_district,
    'TX',
  ].filter(Boolean)

  // Look up council district from neighborhoods
  const { data: hoodRows } = await supabase
    .from('neighborhoods')
    .select('council_district')
    .like('zip_codes', '%' + zip + '%')
    .not('council_district', 'is', null)
    .limit(1)
  const councilDistrict = hoodRows?.[0]?.council_district || null

  let filterParts = districts.map(d => 'district_id.eq.' + d).join(',')
  if (councilDistrict) {
    filterParts += ',district_id.eq.' + councilDistrict
  }
  filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  if (zipData.county_id) {
    filterParts += ',counties_served.like.%' + zipData.county_id + '%'
  }

  const { data: officials } = await supabase
    .from('elected_officials')
    .select('*')
    .or(filterParts)

  // Step 3: Municipal services
  const svcFilters: string[] = ['coverage_area.eq.citywide']
  if (zipData.county_id) svcFilters.push('county_id.eq.' + zipData.county_id)
  if (zipData.city) svcFilters.push('city.eq.' + zipData.city)

  const { data: svcData } = await supabase
    .from('municipal_services')
    .select('*')
    .or(svcFilters.join(','))
    .order('display_order')

  const svcAll = (svcData || []) as MunicipalService[]
  const servicesByType: MunicipalServicesByType = {
    emergency: svcAll.filter(s => s.service_type === 'emergency'),
    police: svcAll.filter(s => s.service_type === 'police'),
    fire: svcAll.filter(s => s.service_type === 'fire'),
    medical: svcAll.filter(s => s.service_type === 'medical'),
    parks: svcAll.filter(s => s.service_type === 'parks'),
    library: svcAll.filter(s => s.service_type === 'library'),
    utilities: svcAll.filter(s => s.service_type === 'utilities'),
  }

  const all = officials || []

  // Step 4: Neighborhood lookup
  let neighborhood: Neighborhood | null = null
  if (zipData.neighborhood_id != null) {
    const { data: hood } = await supabase
      .from('neighborhoods')
      .select('*')
      .eq('neighborhood_id', zipData.neighborhood_id.toString())
      .single()
    if (hood) neighborhood = hood
  }

  // Step 5: Voting locations
  const { data: locations } = await supabase
    .from('voting_locations')
    .select('*')
    .eq('zip_code', parseInt(zip))
    .eq('is_active', 'Yes')

  // Step 6: Policies affecting this ZIP
  let policies: { federal: PolicySummary[]; state: PolicySummary[]; city: PolicySummary[] } | null = null
  try {
    policies = await getPoliciesByZip(zip)
  } catch {
    // Non-critical — degrade gracefully
  }

  return {
    data: {
      zip,
      federal: all.filter(o => o.level === 'Federal'),
      state: all.filter(o => o.level === 'State'),
      county: all.filter(o => o.level === 'County'),
      city: all.filter(o => o.level === 'City'),
      neighborhood,
      votingLocations: locations || [],
      services: servicesByType,
      policies,
    },
  }
}
