import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { CompassClient } from './CompassClient'
import { THEMES } from '@/lib/constants'
import { getNewsFeed } from '@/lib/data/exchange'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Civic Compass — Change Engine',
  description: 'Your personalized guide to Houston civic life.',
}

export default async function CompassPage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || undefined
  const compassThemes = cookieStore.get('compass_themes')?.value || undefined
  const archetype = cookieStore.get('archetype')?.value || undefined

  const selectedThemes = compassThemes ? compassThemes.split(',').filter(Boolean) : []
  const onboardingComplete = selectedThemes.length > 0

  // Always pass theme colors for the spectrum bar
  const themeColors = Object.values(THEMES).map(t => t.color)

  // If onboarding not complete, return minimal data for the quiz
  if (!onboardingComplete) {
    return (
      <CompassClient
        onboardingComplete={false}
        zip={zip}
        selectedThemes={[]}
        archetype={archetype}
        themeColors={themeColors}
        councilMember={null}
        nearbyServices={[]}
        topPolicy={null}
        nextEvent={null}
        featuredContent={null}
        recentNews={[]}
      />
    )
  }

  // ── Personalized data fetching ──
  const supabase = await createClient()

  // Fetch in parallel
  const [
    officialsResult,
    servicesResult,
    policiesResult,
    eventsResult,
    contentResult,
    recentNews,
  ] = await Promise.all([
    // Council member
    zip ? (async () => {
      const { data: hoodRows } = await supabase
        .from('neighborhoods')
        .select('council_district')
        .like('zip_codes', '%' + zip + '%')
        .not('council_district', 'is', null)
        .limit(1)
      const councilDistrict = hoodRows?.[0]?.council_district || null
      if (!councilDistrict) return null
      const { data: officials } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url, district_id')
        .eq('district_id', councilDistrict)
        .eq('level', 'City')
        .limit(1)
      return officials?.[0] || null
    })() : Promise.resolve(null),

    // Nearby services filtered by theme
    zip ? (async () => {
      // Get focus areas for selected themes
      const { data: focusAreas } = await supabase
        .from('focus_areas')
        .select('focus_id')
        .in('theme_id', selectedThemes)
      const focusIds = (focusAreas || []).map(f => f.focus_id)
      if (focusIds.length === 0) {
        // Fallback: just get services by ZIP
        const { data } = await supabase
          .from('services_211')
          .select('service_id, service_name, org_name, phone, address, city, description_5th_grade')
          .eq('zip_code', zip)
          .limit(3)
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
          .select('service_id, service_name, org_name, phone, address, city, description_5th_grade')
          .eq('zip_code', zip)
          .limit(3)
        return data || []
      }
      const { data } = await supabase
        .from('services_211')
        .select('service_id, service_name, org_name, phone, address, city, description_5th_grade')
        .in('service_id', serviceIds.slice(0, 50))
        .eq('zip_code', zip)
        .limit(3)
      return data || []
    })() : Promise.resolve([]),

    // Policy relevant to user's themes
    (async () => {
      const { data: focusAreas } = await supabase
        .from('focus_areas')
        .select('focus_id')
        .in('theme_id', selectedThemes)
      const focusIds = (focusAreas || []).map(f => f.focus_id)
      if (focusIds.length === 0) return null
      const { data: junctions } = await supabase
        .from('policy_focus_areas')
        .select('policy_id')
        .in('focus_id', focusIds)
        .limit(10)
      const policyIds = (junctions || []).map(j => j.policy_id)
      if (policyIds.length === 0) return null
      const { data } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, summary_5th_grade, level, status, bill_number')
        .in('policy_id', policyIds)
        .order('last_action_date', { ascending: false })
        .limit(1)
      return data?.[0] || null
    })(),

    // Next upcoming event
    (async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('opportunities')
        .select('opportunity_id, opportunity_name, description_5th_grade, start_date, end_date, address, city, registration_url')
        .gte('end_date', now)
        .order('start_date', { ascending: true })
        .limit(1)
      return data?.[0] || null
    })(),

    // Featured content from selected themes
    (async () => {
      const { data } = await supabase
        .from('content_published')
        .select('id, slug, title_6th_grade, summary_6th_grade, pathway_primary, source_org_name, source_domain, published_at, image_url')
        .in('pathway_primary', selectedThemes)
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(1)
      return data?.[0] || null
    })(),

    // Recent news for the pulse section
    getNewsFeed(undefined, 5),
  ])

  return (
    <CompassClient
      onboardingComplete={true}
      zip={zip}
      selectedThemes={selectedThemes}
      archetype={archetype}
      themeColors={themeColors}
      councilMember={officialsResult}
      nearbyServices={servicesResult}
      topPolicy={policiesResult}
      nextEvent={eventsResult}
      featuredContent={contentResult}
      recentNews={recentNews}
    />
  )
}
