import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getExchangeStats, getPathwayCounts, getCenterCounts, getPathwayBridges, getCompassPreview, getNewsFeed } from '@/lib/data/exchange'
import { createClient } from '@/lib/supabase/server'
import { CompassClient } from './CompassClient'
import { THEMES } from '@/lib/constants'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'The Compass — Your Community Dashboard',
  description: 'Your personalized community dashboard. Find services, officials, news, and opportunities near you.',
}

export default async function CompassPage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || undefined

  const [stats, pathwayCounts, centerCounts, bridges, preview, recentNews] = await Promise.all([
    getExchangeStats(),
    getPathwayCounts(),
    getCenterCounts(),
    getPathwayBridges(),
    getCompassPreview(),
    getNewsFeed(undefined, 6),
  ])

  // Get nearby services and organizations if ZIP is set
  let nearbyServices: any[] = []
  let nearbyOrgs: any[] = []
  let zipOfficials: any[] = []

  if (zip) {
    const supabase = await createClient()

    // Services in this ZIP
    const { data: services } = await supabase
      .from('services_211')
      .select('service_id, service_name, org_name, phone, address, city')
      .eq('zip_code', zip)
      .limit(6)
    nearbyServices = services || []

    // Organizations with this ZIP
    const { data: orgs } = await supabase
      .from('organizations')
      .select('org_id, org_name, logo_url, description_5th_grade, website')
      .eq('zip_code', zip)
      .limit(6)
    nearbyOrgs = orgs || []

    // Officials for this ZIP
    const { data: zipData } = await supabase
      .from('zip_codes')
      .select('*')
      .eq('zip_code', parseInt(zip))
      .single()

    if (zipData) {
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

      let filterParts = districts.map(function (d) { return 'district_id.eq.' + d }).join(',')
      if (councilDistrict) {
        filterParts += ',district_id.eq.' + councilDistrict
      }
      filterParts += ',district_id.like.AL%,and(level.eq.City,district_id.is.null)'
      if (zipData.county_id) {
        filterParts += ',counties_served.like.%' + zipData.county_id + '%'
      }

      const { data: matched } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url')
        .or(filterParts)
        .order('official_name')
        .limit(8)

      zipOfficials = matched || []
    }
  }

  // Upcoming events
  let upcomingEvents: any[] = []
  try {
    const supabase = await createClient()
    const { data: events } = await supabase
      .from('opportunities')
      .select('opportunity_id, opportunity_name, description_5th_grade')
      .limit(4)
    upcomingEvents = events || []
  } catch { /* ignore */ }

  const themeColors = Object.values(THEMES).map(t => t.color)

  return (
    <CompassClient
      zip={zip}
      stats={stats}
      pathwayCounts={pathwayCounts}
      centerCounts={centerCounts}
      bridges={bridges}
      preview={preview}
      recentNews={recentNews}
      nearbyServices={nearbyServices}
      nearbyOrgs={nearbyOrgs}
      zipOfficials={zipOfficials}
      upcomingEvents={upcomingEvents}
      themeColors={themeColors}
    />
  )
}
