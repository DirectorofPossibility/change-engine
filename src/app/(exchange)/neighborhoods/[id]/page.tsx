import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Users, DollarSign } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'

export default async function NeighborhoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('neighborhood_id', id)
    .single()

  if (!hood) notFound()

  // Services in this neighborhood's ZIP codes
  var zips = hood.zip_codes ? hood.zip_codes.split(',').map(function (s) { return s.trim() }).filter(Boolean) : []
  var services: Array<{ service_id: string; service_name: string; description_5th_grade: string | null; phone: string | null; address: string | null; city: string | null; state: string | null; zip_code: string | null; website: string | null }> = []
  if (zips.length > 0) {
    const { data: svcData } = await supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, address, city, state, zip_code, website')
      .in('zip_code', zips)
      .eq('is_active', 'Yes')
      .limit(12)
    services = svcData || []
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">{hood.neighborhood_name}</h1>
      <div className="flex items-center gap-3 text-sm text-brand-muted mb-6">
        {hood.neighborhood_type && <span>{hood.neighborhood_type}</span>}
        {hood.city && <span><MapPin size={12} className="inline" /> {hood.city}</span>}
        {hood.council_district && <span>Council District {hood.council_district}</span>}
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {hood.population != null && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <Users size={20} className="mx-auto text-brand-accent mb-1" />
            <div className="text-xl font-bold text-brand-text">{hood.population.toLocaleString()}</div>
            <div className="text-xs text-brand-muted">Population</div>
          </div>
        )}
        {hood.median_income != null && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <DollarSign size={20} className="mx-auto text-brand-accent mb-1" />
            <div className="text-xl font-bold text-brand-text">${hood.median_income.toLocaleString()}</div>
            <div className="text-xs text-brand-muted">Median Income</div>
          </div>
        )}
      </div>

      {/* Description */}
      {hood.description && (
        <section className="mb-8">
          <p className="text-brand-muted leading-relaxed">{hood.description}</p>
        </section>
      )}

      {/* ZIP code lookup link */}
      {zips.length > 0 && (
        <div className="bg-brand-accent/5 rounded-xl border border-brand-border p-4 mb-8">
          <p className="text-sm text-brand-text">
            ZIP codes: {zips.join(', ')} &mdash;{' '}
            <Link href={'/officials/lookup'} className="text-brand-accent hover:underline font-medium">
              Find your representatives &rarr;
            </Link>
          </p>
        </div>
      )}

      {/* Local services */}
      {services.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Services in Your Area</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(function (svc) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id}>
                  <ServiceCard
                    name={svc.service_name}
                    description={svc.description_5th_grade}
                    phone={svc.phone}
                    address={svc.address}
                    city={svc.city}
                    state={svc.state}
                    zipCode={svc.zip_code}
                    website={svc.website}
                  />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
