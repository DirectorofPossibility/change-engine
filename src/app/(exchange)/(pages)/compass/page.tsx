import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requirePageEnabled } from '@/lib/data/page-gate'
import { CompassClient } from './CompassClient'
import { THEMES } from '@/lib/constants'
import { getNewsFeed } from '@/lib/data/exchange'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Civic Compass — Change Engine',
  description: 'Your personal civic mission control for Houston.',
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
        yourOfficials={[]}
        nearbyServices={[]}
        yourPolicies={[]}
        nextEvents={[]}
        pathwayContent={[]}
        recentNews={[]}
        pathwayStats={{}}
        platformStats={{ content: 0, services: 0, officials: 0, policies: 0, organizations: 0, opportunities: 0 }}
      />
    )
  }

  const supabase = await createClient()

  // Resolve user's districts from ZIP
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

  // Build officials filter
  let officialFilter = districts.map(d => 'district_id.eq.' + d).join(',')
  officialFilter += ',district_id.eq.TX-SEN'
  if (councilDistrict) officialFilter += ',district_id.eq.' + councilDistrict
  officialFilter += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
  if (countyId) officialFilter += ',counties_served.like.%' + countyId + '%'

  // Focus area IDs for user's themes
  const { data: focusAreaRows } = await supabase
    .from('focus_areas')
    .select('focus_id')
    .in('theme_id', selectedThemes)
  const focusIds = (focusAreaRows || []).map(f => f.focus_id)

  // Fetch everything in parallel
  const [
    officialsResult,
    servicesResult,
    policiesResult,
    eventsResult,
    contentResult,
    recentNews,
    pathwayStatsResult,
    platformStatsResult,
  ] = await Promise.all([
    // All officials for user's ZIP (city → county → state → federal)
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

    // Services near user + theme-relevant
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
      if (serviceIds.length === 0) {
        const { data } = await supabase
          .from('services_211')
          .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
          .eq('zip_code', zip)
          .eq('is_active', 'Yes')
          .limit(6)
        return data || []
      }
      // Get theme-matched services in ZIP, then fill with any ZIP services
      const { data: themed } = await supabase
        .from('services_211')
        .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
        .in('service_id', serviceIds.slice(0, 50))
        .eq('zip_code', zip)
        .eq('is_active', 'Yes')
        .limit(6)
      if ((themed || []).length >= 3) return themed || []
      const themedIds = new Set((themed || []).map(s => s.service_id))
      const { data: extra } = await supabase
        .from('services_211')
        .select('service_id, service_name, phone, address, city, description_5th_grade, org_id')
        .eq('zip_code', zip)
        .eq('is_active', 'Yes')
        .limit(6)
      const combined = [...(themed || []), ...(extra || []).filter(s => !themedIds.has(s.service_id))]
      return combined.slice(0, 6)
    })() : Promise.resolve([]),

    // Multiple policies relevant to user's themes
    (async () => {
      if (focusIds.length === 0) return []
      const { data: junctions } = await supabase
        .from('policy_focus_areas')
        .select('policy_id')
        .in('focus_id', focusIds)
        .limit(30)
      const policyIds = Array.from(new Set((junctions || []).map(j => j.policy_id)))
      if (policyIds.length === 0) return []
      const { data } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number')
        .in('policy_id', policyIds)
        .eq('is_published', true)
        .order('last_action_date', { ascending: false })
        .limit(5)
      return data || []
    })(),

    // Upcoming events/opportunities
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

    // Multiple content pieces from selected themes
    (async () => {
      const { data } = await supabase
        .from('content_published')
        .select('id, slug, title_6th_grade, summary_6th_grade, pathway_primary, source_org_name, published_at, image_url, content_type')
        .in('pathway_primary', selectedThemes)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(8)
      return data || []
    })(),

    getNewsFeed(undefined, 6),

    // Per-pathway content/service counts
    (async () => {
      const stats: Record<string, { content: number; services: number; policies: number }> = {}
      for (const themeId of selectedThemes) {
        const { count: contentCount } = await supabase
          .from('content_published')
          .select('id', { count: 'exact', head: true })
          .eq('pathway_primary', themeId)
          .eq('is_active', true)
        stats[themeId] = { content: contentCount || 0, services: 0, policies: 0 }
      }
      // Service counts via focus area junctions
      if (focusIds.length > 0) {
        const { data: svcJunctions } = await supabase
          .from('service_focus_areas')
          .select('service_id, focus_id')
          .in('focus_id', focusIds)
        const focusToTheme: Record<string, string> = {}
        for (const row of (focusAreaRows || [])) {
          // Map focus back to theme — we need the theme_id
          const { data: fa } = await supabase.from('focus_areas').select('theme_id').eq('focus_id', row.focus_id).single()
          if (fa?.theme_id) focusToTheme[row.focus_id] = fa.theme_id
        }
        for (const j of (svcJunctions || [])) {
          const theme = focusToTheme[j.focus_id]
          if (theme && stats[theme]) stats[theme].services++
        }
      }
      return stats
    })(),

    // Platform-wide totals
    (async () => {
      const [c1, c2, c3, c4, c5, c6] = await Promise.all([
        supabase.from('content_published').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
        supabase.from('elected_officials').select('official_id', { count: 'exact', head: true }),
        supabase.from('policies').select('policy_id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
        supabase.from('opportunities').select('opportunity_id', { count: 'exact', head: true }),
      ])
      return {
        content: c1.count || 0,
        services: c2.count || 0,
        officials: c3.count || 0,
        policies: c4.count || 0,
        organizations: c5.count || 0,
        opportunities: c6.count || 0,
      }
    })(),
  ])

  return (
    <CompassClient
      onboardingComplete={true}
      zip={zip}
      selectedThemes={selectedThemes}
      archetype={archetype}
      themeColors={themeColors}
      yourOfficials={officialsResult}
      nearbyServices={servicesResult}
      yourPolicies={policiesResult}
      nextEvents={eventsResult}
      pathwayContent={contentResult}
      recentNews={recentNews}
      pathwayStats={pathwayStatsResult}
      platformStats={platformStatsResult}
    />
  )
}
