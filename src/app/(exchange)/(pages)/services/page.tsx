import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { getServicesByZip } from '@/lib/data/services'
import { ServicesClient } from './ServicesClient'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageCrossLinks } from '@/components/exchange/PageCrossLinks'


export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find Services — Change Engine',
  description: 'Free and low-cost services in the Houston area — a community resource directory.',
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ zip?: string }> }) {
  const { zip: urlZip } = await searchParams
  const cookieStore = await cookies()
  const userZip = urlZip || cookieStore.get('zip')?.value || ''
  const supabase = await createClient()

  const [allServices, zipServices, { data: categories }] = await Promise.all([
    getServices(),
    userZip ? getServicesByZip(userZip) : Promise.resolve([]),
    supabase.from('service_categories').select('*').order('service_cat_name'),
  ])

  // If ZIP available, put local services first
  let services: typeof allServices
  if (zipServices.length > 0) {
    const zipIds = new Set(zipServices.map(s => s.service_id))
    const rest = allServices.filter(s => !zipIds.has(s.service_id))
    services = [...zipServices, ...rest]
  } else {
    services = allServices
  }

  const langId = await getLangId()
  const serviceIds = services.map(function (s) { return s.service_id })
  const translations = langId ? await fetchTranslationsForTable('services_211', serviceIds, langId) : {}

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
    <div className="bg-paper min-h-screen">
      <IndexPageHero
        title="Community Services"
        subtitle="Houston has a deep network of services dedicated to your well-being. Browse by category, search by name, or switch to map view."
        color="#16a34a"
        stats={[
          { value: services.length, label: 'Services' },
          { value: uniqueOrgs, label: 'Organizations' },
          { value: Object.keys(categoryMap).length, label: 'Categories' },
        ]}
      />

      <Breadcrumb items={[{ label: 'Services' }]} />

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <ServicesClient
          services={services}
          translations={translations}
          categories={categoryMap}
          initialZip={urlZip}
          hasLocations={withLocation > 0}
        />
        <PageCrossLinks preset="civic" />
      </div>
    </div>
  )
}
