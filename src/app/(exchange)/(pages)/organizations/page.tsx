import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { getOrganizations } from '@/lib/data/exchange'
import { OrganizationsClient } from './OrganizationsClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Organizations — Community Exchange',
  description: 'Browse nonprofits, foundations, agencies, and community organizations serving the Houston area.',
}

export default async function OrganizationsPage() {
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''
  const allOrgs = await getOrganizations()

  // When user has a ZIP, sort matching organizations to the top
  const organizations = userZip
    ? [
        ...allOrgs.filter(function (o: any) { return o.zip_code === userZip }),
        ...allOrgs.filter(function (o: any) { return o.zip_code !== userZip }),
      ]
    : allOrgs

  return (
    <div>
      <IndexPageHero
        color="#dd6b20"
        pattern="seed"
        titleKey="organizations.title"
        subtitleKey="organizations.subtitle"
        intro="Houston is powered by hundreds of nonprofits, foundations, agencies, and community groups. Browse, search, and connect with the organizations strengthening your neighborhood."
        stats={[
          { value: organizations.length, label: 'Organizations' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Organizations' }]} />

        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          <div className="flex-1 min-w-0">
            <OrganizationsClient organizations={organizations} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="organizations"
                color="#dd6b20"
                related={[
                  { label: 'Services', href: '/services', color: '#38a169' },
                  { label: 'Foundations', href: '/foundations', color: '#805ad5' },
                  { label: 'Opportunities', href: '/opportunities', color: '#38a169' },
                  { label: 'Community Partners', href: '/partners', color: '#C75B2A' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
