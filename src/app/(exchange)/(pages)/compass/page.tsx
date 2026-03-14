import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { CompassClient } from './CompassClient'
import { THEMES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Civic Compass — Change Engine',
  description: 'A personalized guide to the organizations, policies, leaders, and services aligned with what matters to you.',
}

export default async function CompassPage() {
  await requirePageEnabled('page_compass')

  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || undefined
  const compassThemes = cookieStore.get('compass_themes')?.value || undefined
  const archetype = cookieStore.get('archetype')?.value || undefined

  const selectedThemes = compassThemes ? compassThemes.split(',').filter(Boolean) : []
  const onboardingComplete = selectedThemes.length > 0
  const themeColors = Object.values(THEMES).map(t => t.color)

  if (!onboardingComplete) {
    return (
      <CompassClient
        onboardingComplete={false}
        zip={zip}
        selectedThemes={[]}
        archetype={archetype}
        themeColors={themeColors}
        guideOrgs={[]}
        guideContent={[]}
        guidePolicies={[]}
        guideOfficials={[]}
        guideServices={[]}
        guideEvents={[]}
        pathwayStats={{}}
      />
    )
  }

  const supabase = await createClient()

  // ── Resolve user's districts from ZIP ──
  const districtLookup = zip ? (async () => {
    const { data: zipData } = await supabase
      .from('zip_codes')
      .select('congressional_district, state_senate_district, state_house_district, county_id')
      .eq('zip_code', parseInt(zip))
      .single()
    const { data: hoodRows } = await supabase
      .from('neighborhoods')
      .select('council_district')
      .like('zip_codes', '%' + zip + '%')
      .not('council_district', 'is', null)
      .limit(1)
    return {
      districts: [
        zipData?.congressional_district,
        zipData?.state_senate_district,
        zipData?.state_house_district,
      ].filter(Boolean) as string[],
      councilDistrict: hoodRows?.[0]?.council_district || null,
      countyId: zipData?.county_id || null,
    }
  })() : Promise.resolve({ districts: [] as string[], councilDistrict: null as string | null, countyId: null as string | null })

  const { districts, councilDistrict, countyId } = await districtLookup

  // ── Focus area IDs for user's themes ──
  const { data: focusAreaRows } = await supabase
    .from('focus_areas')
    .select('focus_id, theme_id')
    .in('theme_id', selectedThemes)
  const focusIds = (focusAreaRows || []).map(f => f.focus_id)

  // Build officials filter
  let officialFilter = districts.map(d => 'district_id.eq.' + d).join(',')
  officialFilter += ',district_id.eq.TX-SEN'
  if (councilDistrict) officialFilter += ',district_id.eq.' + councilDistrict
  officialFilter += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  if (countyId) officialFilter += ',counties_served.like.%' + countyId + '%'

  // ── Fetch everything in parallel ──
  const [
    orgsResult,
    contentResult,
    policiesResult,
    officialsResult,
    servicesResult,
    eventsResult,
    pathwayStatsResult,
  ] = await Promise.all([

    // 1. ORGANIZATIONS — aligned to user's pathways via focus area junctions
    (async () => {
      if (focusIds.length === 0) return []
      const { data: junctions } = await supabase
        .from('organization_focus_areas')
        .select('org_id')
        .in('focus_id', focusIds)
      const orgIds = Array.from(new Set((junctions || []).map(j => j.org_id)))
      if (orgIds.length === 0) return []
      const { data } = await supabase
        .from('organizations')
        .select('org_id, org_name, description_5th_grade, logo_url, website, phone, city, theme_id, mission_statement')
        .in('org_id', orgIds.slice(0, 100))
        .order('org_name')
        .limit(12)
      return data || []
    })(),

    // 2. CONTENT — from user's selected pathways
    (async () => {
      const { data } = await supabase
        .from('content_published')
        .select('id, title_6th_grade, summary_6th_grade, pathway_primary, source_org_name, published_at, image_url, content_type')
        .in('pathway_primary', selectedThemes)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(8)
      return data || []
    })(),

    // 3. POLICIES — aligned via focus area junctions
    (async () => {
      if (focusIds.length === 0) return []
      const { data: junctions } = await supabase
        .from('policy_focus_areas')
        .select('policy_id')
        .in('focus_id', focusIds)
        .limit(40)
      const policyIds = Array.from(new Set((junctions || []).map(j => j.policy_id)))
      if (policyIds.length === 0) return []
      const { data } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number')
        .in('policy_id', policyIds)
        .eq('is_published', true)
        .order('last_action_date', { ascending: false })
        .limit(6)
      return data || []
    })(),

    // 4. OFFICIALS — for user's ZIP, City → County → State → Federal
    zip ? (async () => {
      const { data } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url, district_id, email, office_phone, website')
        .or(officialFilter)
        .order('official_name')
      const all = data || []
      const LEVEL_ORDER: Record<string, number> = { City: 0, County: 1, State: 2, Federal: 3 }
      return all.sort((a, b) => (LEVEL_ORDER[a.level || ''] ?? 9) - (LEVEL_ORDER[b.level || ''] ?? 9))
    })() : Promise.resolve([]),

    // 5. 211 SERVICES — theme-aligned + local (parallel fetch)
    zip ? (async () => {
      if (focusIds.length === 0) {
        const { data } = await supabase
          .from('services_211')
          .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
          .eq('zip_code', zip)
          .eq('is_active', 'Yes')
          .limit(6)
        return data || []
      }
      const { data: junctions } = await supabase
        .from('service_focus_areas')
        .select('service_id')
        .in('focus_id', focusIds)
      const serviceIds = Array.from(new Set((junctions || []).map(j => j.service_id)))
      // Fetch themed + local in parallel instead of sequentially
      const [{ data: themed }, { data: local }] = await Promise.all([
        supabase
          .from('services_211')
          .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
          .in('service_id', serviceIds.length > 0 ? serviceIds.slice(0, 50) : ['_none_'])
          .eq('is_active', 'Yes')
          .limit(6),
        supabase
          .from('services_211')
          .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
          .eq('zip_code', zip)
          .eq('is_active', 'Yes')
          .limit(6),
      ])
      if ((themed || []).length >= 4) return themed || []
      const themedIds = new Set((themed || []).map(s => s.service_id))
      return [...(themed || []), ...(local || []).filter(s => !themedIds.has(s.service_id))].slice(0, 6)
    })() : Promise.resolve([]),

    // 6. EVENTS / OPPORTUNITIES
    (async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('opportunities')
        .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, address, city, registration_url, is_virtual')
        .gte('end_date', now)
        .order('start_date', { ascending: true })
        .limit(4)
      return data || []
    })(),

    // Per-pathway stats — single query instead of N+1
    (async () => {
      const stats: Record<string, { content: number; orgs: number; policies: number }> = {}
      // Initialize all selected themes
      for (const themeId of selectedThemes) {
        stats[themeId] = { content: 0, orgs: 0, policies: 0 }
      }
      // Content counts: fetch pathway_primary for selected themes in one query, count in memory
      const { data: contentRows } = await supabase
        .from('content_published')
        .select('pathway_primary')
        .in('pathway_primary', selectedThemes)
        .eq('is_active', true)
      for (const row of (contentRows || [])) {
        if (row.pathway_primary && stats[row.pathway_primary]) {
          stats[row.pathway_primary].content++
        }
      }
      // Org counts per theme
      if (focusIds.length > 0) {
        const focusToTheme: Record<string, string> = {}
        for (const row of (focusAreaRows || [])) {
          if (row.theme_id) focusToTheme[row.focus_id] = row.theme_id
        }
        const { data: orgJunctions } = await supabase
          .from('organization_focus_areas')
          .select('org_id, focus_id')
          .in('focus_id', focusIds)
        const orgsByTheme: Record<string, Set<string>> = {}
        for (const j of (orgJunctions || [])) {
          const theme = focusToTheme[j.focus_id]
          if (theme) {
            if (!orgsByTheme[theme]) orgsByTheme[theme] = new Set()
            orgsByTheme[theme].add(j.org_id)
          }
        }
        for (const [theme, orgSet] of Object.entries(orgsByTheme)) {
          if (stats[theme]) stats[theme].orgs = orgSet.size
        }
      }
      return stats
    })(),
  ])

  return (
    <CompassClient
      onboardingComplete={true}
      zip={zip}
      selectedThemes={selectedThemes}
      archetype={archetype}
      themeColors={themeColors}
      guideOrgs={orgsResult}
      guideContent={contentResult}
      guidePolicies={policiesResult}
      guideOfficials={officialsResult}
      guideServices={servicesResult}
      guideEvents={eventsResult}
      pathwayStats={pathwayStatsResult}
    />
  )
}
