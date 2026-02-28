import { getServices } from '@/lib/data/exchange'
import { ServicesClient } from './ServicesClient'

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Services</h1>
      <p className="text-brand-muted mb-8">
        Find community services and support organizations in the Houston area.
      </p>

      <ServicesClient services={services} />
    </div>
  )
}
