import type { Metadata } from 'next'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { GoodThingsWidget } from '@/components/exchange/GoodThingsWidget'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Find Services — Community Exchange',
  description: 'Free and low-cost services in the Houston area — a community resource directory.',
}

export default async function ServicesPage() {
  const services = await getServices()

  const langId = await getLangId()
  const serviceIds = services.map(function (s) { return s.service_id })
  const translations = langId ? await fetchTranslationsForTable('services_211', serviceIds, langId) : {}

  // Stats for social proof
  const withLocation = services.filter(function (s) { return s.latitude != null }).length
  const uniqueOrgs = new Set(services.map(function (s) { return s.org_id }).filter(Boolean)).size

  return (
    <div>
      <IndexPageHero
        color="#38a169"
        pattern="flower"
        titleKey="services.title"
        subtitleKey="services.subtitle"
        intro="Houston has a deep network of services dedicated to your well-being. Search by name, filter by ZIP, or switch to map view to find what is near you."
        stats={[
          { value: services.length, label: 'Services' },
          { value: uniqueOrgs, label: 'Organizations' },
          { value: withLocation, label: 'Mapped Locations' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Local Resources' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          <div className="flex-1 min-w-0">
            <ServicesClient services={services} translations={translations} />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="services"
                color="#38a169"
                related={[
                  { label: 'Organizations', href: '/organizations', color: '#dd6b20' },
                  { label: 'Opportunities', href: '/opportunities', color: '#38a169' },
                  { label: 'Neighborhoods', href: '/neighborhoods', color: '#d69e2e' },
                  { label: 'Get Help', href: '/help', color: '#e53e3e' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
              <div className="mt-4"><GoodThingsWidget variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
