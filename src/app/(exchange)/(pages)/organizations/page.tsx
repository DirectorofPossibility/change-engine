import type { Metadata } from 'next'
import { getOrganizations } from '@/lib/data/exchange'
import { OrganizationsClient } from './OrganizationsClient'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Organizations — Community Exchange',
  description: 'Browse nonprofits, foundations, agencies, and community organizations serving the Houston area.',
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div>
      <PageHero
        variant="sacred"
        sacredPattern="seed"
        gradientColor="#dd6b20"
        titleKey="organizations.title"
        subtitleKey="organizations.subtitle"
        intro={PAGE_INTROS.organizations}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Organizations' }]} />
        <OrganizationsClient organizations={organizations} />
      </div>
    </div>
  )
}
