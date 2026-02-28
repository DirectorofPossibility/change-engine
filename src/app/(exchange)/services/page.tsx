import type { Metadata } from 'next'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'

export const revalidate = 86400

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
      <h1 className="text-3xl font-bold text-brand-text mb-2">Services</h1>
      <p className="text-brand-muted mb-8">
        Find community services and support organizations in the Houston area.
      </p>

      <ServicesClient services={services} translations={translations} />
    </div>
  )
}
