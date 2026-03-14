import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getOrganizations } from '@/lib/data/organizations'
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

  const organizations = await getOrganizations({ limit: 1000 })

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
        <OrganizationsClient organizations={organizations} userZip={userZip} />
        <PageCrossLinks preset="resources" />
      </div>
    </div>
  )
}
