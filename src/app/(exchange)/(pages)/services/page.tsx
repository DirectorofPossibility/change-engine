import type { Metadata } from 'next'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'
import { PageHeader } from '@/components/exchange/PageHeader'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Find Services',
  description: 'Free and low-cost services in the Houston area — a community resource directory.',
}

export default async function ServicesPage() {
  const services = await getServices()

  // Fetch translations for non-English
  const langId = await getLangId()
  const serviceIds = services.map(function (s) { return s.service_id })
  const translations = langId ? await fetchTranslationsForTable('services_211', serviceIds, langId) : {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageHeader titleKey="services.title" subtitleKey="services.subtitle" />

      <ServicesClient services={services} translations={translations} />
    </div>
  )
}
