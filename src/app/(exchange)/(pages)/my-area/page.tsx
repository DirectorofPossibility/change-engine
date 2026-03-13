import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import { MyAreaClient } from './MyAreaClient'

export const revalidate = 600

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My Area — Your Civic Profile',
  description: 'Your representatives, local services, active policies, and neighborhood resources — all personalized to your ZIP code.',
}

// ── Design tokens ─────────────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function MyAreaPage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value

  if (!zip || zip.length !== 5) {
    redirect('/?needsZip=1')
  }

  const langId = await getLangId()
  const archetype = cookieStore.get('archetype')?.value || ''

  const [civicProfile, services, municipal, neighborhood, activePathways] = await Promise.all([
    getCivicProfileByZip(zip),
    getServicesByZip(zip),
    getMunicipalServices(zip),
    getNeighborhoodByZip(zip),
    getActivePathwaysForZip(zip),
  ])

  const neighborhoodContent = neighborhood
    ? await getContentForNeighborhood(neighborhood.neighborhood_id)
    : []

  const contentTranslations = langId && neighborhoodContent.length > 0
    ? await fetchTranslationsForTable(
        'content_published',
        neighborhoodContent.map(function (c) { return c.inbox_id || c.id }),
        langId
      )
    : {}

  const officials = civicProfile ? {
    federal: civicProfile.officials?.federal || [],
    state: civicProfile.officials?.state || [],
    county: civicProfile.officials?.county || [],
    city: civicProfile.officials?.city || [],
  } : { federal: [], state: [], county: [], city: [] }

  const totalOfficials = officials.federal.length + officials.state.length +
    officials.county.length + officials.city.length

  const policies = civicProfile ? {
    federal: civicProfile.policies?.federal || [],
    state: civicProfile.policies?.state || [],
    city: civicProfile.policies?.city || [],
  } : { federal: [], state: [], city: [] }

  const totalPolicies = policies.federal.length + policies.state.length + policies.city.length

  const neighborhoodName = neighborhood?.neighborhood_name || 'Houston Area'

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
            Your Wayfinder
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: MUTED, lineHeight: 1.7 }} className="mt-3 max-w-xl">
            {neighborhoodName} -- ZIP {zip}. Your personalized civic profile, services, and community connections.
          </p>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>My Area</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">
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

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        <div className="text-center py-4">
          <Link href="/" style={{ fontFamily: MONO, fontSize: '0.7rem', color: CLAY, letterSpacing: '0.1em' }} className="uppercase hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
