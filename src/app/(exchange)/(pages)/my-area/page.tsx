/**
 * @fileoverview My Area — personalized civic profile page.
 *
 * When a ZIP is set (via cookie), this page pulls together everything
 * relevant to that resident's location: their elected officials at every
 * level, policies affecting their districts, nearby services, municipal
 * services, neighborhood context, and opportunities to get involved.
 *
 * For civic leaders (Leadership Houston, ALF, Center for Houston's Future
 * alumni), this serves as a civic operating dashboard — the policy landscape,
 * the organizations working in their area, the gaps and opportunities.
 *
 * @datasource getCivicProfileByZip, getServicesByZip, getMunicipalServices,
 *   getNeighborhoodByZip, getContentForNeighborhood, fetchTranslationsForTable
 * @caching Dynamic (reads ZIP from cookies)
 * @route GET /my-area
 */

import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getCivicProfileByZip,
  getServicesByZip,
  getMunicipalServices,
  getNeighborhoodByZip,
  getContentForNeighborhood,
  getActivePathwaysForZip,
  getLangId,
  fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { MyAreaClient } from './MyAreaClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Area — Your Civic Profile',
  description: 'Your representatives, local services, active policies, and neighborhood resources — all personalized to your ZIP code.',
}

export default async function MyAreaPage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value

  if (!zip || zip.length !== 5) {
    redirect('/?needsZip=1')
  }

  const langId = await getLangId()

  const archetype = cookieStore.get('archetype')?.value || ''

  // Parallel fetch everything for this ZIP
  const [civicProfile, services, municipal, neighborhood, activePathways] = await Promise.all([
    getCivicProfileByZip(zip),
    getServicesByZip(zip),
    getMunicipalServices(zip),
    getNeighborhoodByZip(zip),
    getActivePathwaysForZip(zip),
  ])

  // If we got a neighborhood, fetch content for it
  const neighborhoodContent = neighborhood
    ? await getContentForNeighborhood(neighborhood.neighborhood_id)
    : []

  // Fetch translations for content if needed
  const contentTranslations = langId && neighborhoodContent.length > 0
    ? await fetchTranslationsForTable(
        'content_published',
        neighborhoodContent.map(function (c) { return c.inbox_id || c.id }),
        langId
      )
    : {}

  // Flatten officials
  const officials = civicProfile ? {
    federal: civicProfile.officials?.federal || [],
    state: civicProfile.officials?.state || [],
    county: civicProfile.officials?.county || [],
    city: civicProfile.officials?.city || [],
  } : { federal: [], state: [], county: [], city: [] }

  const totalOfficials = officials.federal.length + officials.state.length +
    officials.county.length + officials.city.length

  // Flatten policies
  const policies = civicProfile ? {
    federal: civicProfile.policies?.federal || [],
    state: civicProfile.policies?.state || [],
    city: civicProfile.policies?.city || [],
  } : { federal: [], state: [], city: [] }

  const totalPolicies = policies.federal.length + policies.state.length + policies.city.length

  const neighborhoodName = neighborhood?.neighborhood_name || 'Houston Area'

  return (
    <div>
      <div className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumb items={[{ label: 'My Area' }]} />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mt-4">
            Your Wayfinder
          </h1>
          <p className="text-brand-muted mt-2 max-w-2xl leading-relaxed">
            {neighborhoodName} &middot; ZIP {zip} &mdash; Your personalized civic profile, services, and community connections.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MyAreaClient
          zip={zip}
          neighborhoodName={neighborhoodName}
          councilDistrict={neighborhood?.council_district || null}
          officials={officials}
          totalOfficials={totalOfficials}
          policies={policies}
          totalPolicies={totalPolicies}
          services={services}
          municipal={municipal}
          neighborhoodContent={neighborhoodContent}
          contentTranslations={contentTranslations}
          activePathways={activePathways}
          archetype={archetype}
        />
      </div>
    </div>
  )
}
