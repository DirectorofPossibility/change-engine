import type { Metadata } from 'next'
import { getServices, getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'
import { PageHero } from '@/components/exchange/PageHero'
import { PAGE_INTROS } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'

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
    <div>
      <PageHero variant="sacred" sacredPattern="flower" gradientColor="#38a169" titleKey="services.title" subtitleKey="services.subtitle" intro={PAGE_INTROS.services} />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Local Resources' }]} />
        <ServicesClient services={services} translations={translations} />
      </div>
    </div>
  )
}
