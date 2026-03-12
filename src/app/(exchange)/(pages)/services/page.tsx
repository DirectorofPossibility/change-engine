import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Find Services — Community Exchange',
  description: 'Free and low-cost services in the Houston area — a community resource directory.',
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ zip?: string }> }) {
  const { zip: urlZip } = await searchParams
  const supabase = await createClient()

  const [services, { data: categories }] = await Promise.all([
    getServices(),
    supabase.from('service_categories').select('*').order('service_cat_name'),
  ])

  const langId = await getLangId()
  const serviceIds = services.map(function (s) { return s.service_id })
  const translations = langId ? await fetchTranslationsForTable('services_211', serviceIds, langId) : {}

  // Build category map for the client
  const categoryMap = (categories ?? []).reduce<Record<string, { name: string; description: string; examples: string }>>(
    function (acc, c) {
      acc[c.service_cat_id] = {
        name: c.service_cat_name,
        description: c.description_5th_grade ?? '',
        examples: c.example_services ?? '',
      }
      return acc
    }, {}
  )

  const withLocation = services.filter(function (s) { return s.latitude != null }).length
  const uniqueOrgs = new Set(services.map(function (s) { return s.org_id }).filter(Boolean)).size

  return (
    <div>
      <IndexPageHero
        color="#1a6b56"
        titleKey="services.title"
        subtitleKey="services.subtitle"
        intro="Houston has a deep network of services dedicated to your well-being. Browse by category, search by name, or switch to map view."
        stats={[
          { value: services.length, label: 'Services' },
          { value: uniqueOrgs, label: 'Organizations' },
          { value: Object.keys(categoryMap).length, label: 'Categories' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Services' }]} />

        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          <div className="flex-1 min-w-0">
            <ServicesClient
              services={services}
              translations={translations}
              categories={categoryMap}
              initialZip={urlZip}
              hasLocations={withLocation > 0}
            />
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="services"
                color="#1a6b56"
                related={[
                  { label: 'Organizations', href: '/organizations', color: '#1e4d7a' },
                  { label: 'Opportunities', href: '/opportunities', color: '#1a5030' },
                  { label: 'Neighborhoods', href: '/neighborhoods', color: '#4a2870' },
                  { label: 'Available Resources', href: '/help', color: '#7a2018' },
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
