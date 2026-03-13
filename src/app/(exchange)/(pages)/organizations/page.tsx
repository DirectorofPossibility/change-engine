import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getOrganizations } from '@/lib/data/exchange'
import { getOrganizationsWithCoords } from '@/lib/data/organizations'
import { OrganizationsClient } from './OrganizationsClient'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Organizations — Change Engine',
  description: 'Browse nonprofits, foundations, agencies, and community organizations serving the Houston area.',
}

export default async function OrganizationsPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const [allOrgs, localOrgs] = await Promise.all([
    getOrganizations(),
    userZip ? getOrganizationsWithCoords(userZip) : Promise.resolve([]),
  ])

  // If ZIP available, put local orgs first via server-side query
  let organizations: typeof allOrgs
  if (localOrgs.length > 0) {
    const localIds = new Set(localOrgs.map((o: any) => o.org_id))
    const rest = allOrgs.filter((o: any) => !localIds.has(o.org_id))
    // Map local orgs to match allOrgs shape, then append rest
    organizations = [
      ...allOrgs.filter((o: any) => localIds.has(o.org_id)),
      ...rest,
    ]
  } else {
    organizations = allOrgs
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            Organizations
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Houston is powered by hundreds of nonprofits, foundations, agencies, and community groups. Browse, search, and connect with the organizations strengthening your neighborhood.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            <div>
              <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{organizations.length}</span>
              <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Organizations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>Organizations</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <OrganizationsClient organizations={organizations} />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
