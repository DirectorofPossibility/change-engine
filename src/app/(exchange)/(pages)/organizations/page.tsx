import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getOrganizations } from '@/lib/data/exchange'
import { getOrganizationsWithCoords } from '@/lib/data/organizations'
import { OrganizationsClient } from './OrganizationsClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'


export const dynamic = 'force-dynamic'

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
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Organizations"
        subtitle="Houston is powered by hundreds of nonprofits, foundations, agencies, and community groups. Browse, search, and connect with the organizations strengthening your neighborhood."
        color="#1a6b56"
        stats={[{ value: organizations.length, label: 'Organizations' }]}
      />

      <Breadcrumb items={[{ label: 'Organizations' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <OrganizationsClient organizations={organizations} />
        <PageCrossLinks preset="resources" />
      </div>
    </div>
  )
}
