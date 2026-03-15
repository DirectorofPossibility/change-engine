import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { NeighborhoodMap } from '@/components/exchange/NeighborhoodMap'
import { getMapMarkersForNeighborhood, getLangId, fetchTranslationsForTable, getWayfinderContext } from '@/lib/data/exchange'
import { getUIStrings } from '@/lib/i18n'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('neighborhoods').select('neighborhood_name').eq('neighborhood_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.neighborhood_name,
    description: 'Community resources, services, and information for ' + data.neighborhood_name + '.',
  }
}


export default async function NeighborhoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: hood } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('neighborhood_id', id)
    .single()

  if (!hood) notFound()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const zipRes = await fetch(
    url + '/rest/v1/neighborhood_zip_codes?neighborhood_id=eq.' + id + '&select=zip_code',
    { headers: { apikey: key, Authorization: 'Bearer ' + key } }
  )
  const zipJunctions: Array<{ zip_code: string }> = zipRes.ok ? await zipRes.json() : []
  const zips = zipJunctions.map(j => j.zip_code)

  let services: Array<{ service_id: string; service_name: string; description_5th_grade: string | null; phone: string | null; address: string | null; city: string | null; state: string | null; zip_code: string | null; website: string | null }> = []
  if (zips.length > 0) {
    const { data: svcData } = await supabase
      .from('services_211')
      .select('service_id, service_name, description_5th_grade, phone, address, city, state, zip_code, website')
      .in('zip_code', zips)
      .eq('is_active', 'Yes')
      .limit(12)
    services = svcData || []
  }

  const userProfile = await getUserProfile()
  const [mapData, wayfinderData] = await Promise.all([
    getMapMarkersForNeighborhood(id),
    getWayfinderContext('neighborhood' as any, id, userProfile?.role),
  ])

  const langId = await getLangId()
  const serviceTranslations = langId && services.length > 0
    ? await fetchTranslationsForTable('services_211', services.map(s => s.service_id), langId)
    : {}
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#1b5e8a", textTransform: 'uppercase', marginTop: '0.5rem' }}>
            Neighborhood
            {hood.neighborhood_type && <> -- {hood.neighborhood_type}</>}
            {hood.city && <> -- {hood.city}</>}
            {hood.council_district && <> -- District {hood.council_district}</>}
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {hood.neighborhood_name}
          </h1>
          {hood.description && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {hood.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {hood.population != null && (
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{hood.population.toLocaleString()}</span>
                <span style={{ fontSize: '0.875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>{t('neighborhoods.population')}</span>
              </div>
            )}
            {hood.median_income != null && (
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>${hood.median_income.toLocaleString()}</span>
                <span style={{ fontSize: '0.875rem', color: "#5c6474", letterSpacing: '0.1em', marginLeft: '0.5rem', textTransform: 'uppercase' }}>{t('neighborhoods.median_income')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.875rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/neighborhoods" className="hover:underline" style={{ color: "#1b5e8a" }}>Neighborhoods</Link>
          <span className="mx-2">/</span>
          <span>{hood.neighborhood_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Map */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 style={{ fontSize: '1.5rem',  }}>Neighborhood Map</h2>
          </div>
          <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
          <div style={{ border: '1px solid #dde1e8' }}>
            <NeighborhoodMap
              services={mapData.services}
              votingLocations={mapData.votingLocations}
              distributionSites={mapData.distributionSites}
              organizations={mapData.organizations}
              municipalServices={mapData.municipalServices}
            />
          </div>
        </section>

        {/* ZIP codes */}
        {zips.length > 0 && (
          <div className="p-4 mb-8" style={{ background: "#f4f5f7", border: '1px solid #dde1e8' }}>
            <p style={{ fontSize: '0.875rem',  }}>
              ZIP codes: {zips.join(', ')} --{' '}
              <Link href="/officials/lookup" className="hover:underline" style={{ color: "#1b5e8a", fontWeight: 600 }}>
                {t('neighborhoods.find_reps')}
              </Link>
            </p>
          </div>
        )}

        {/* Civic data reference */}
        <div className="p-4 mb-8" style={{ border: '1px solid #dde1e8' }}>
          <p style={{ fontSize: '0.875rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase', marginBottom: '0.5rem' }}>Neighborhood data</p>
          <a
            href="https://www.understandinghouston.org/topic/demographics"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.9rem', color: "#1b5e8a" }}
            className="hover:underline"
          >
            Understanding Houston
          </a>
          <p style={{ fontSize: '0.875rem', color: "#5c6474", marginTop: '0.25rem' }}>
            Tract-level data on demographics, health, economy, and housing across the Houston region.
          </p>
        </div>

        {/* Local services */}
        {services.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 style={{ fontSize: '1.5rem',  }}>{t('neighborhoods.services_area')}</h2>
              <span style={{ fontSize: '0.875rem', color: "#5c6474" }}>{services.length} services</span>
            </div>
            <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />

            <div className="space-y-0">
              {services.slice(0, 4).map(function (svc) {
                return (
                  <Link
                    key={svc.service_id}
                    href={'/services/' + svc.service_id}
                    className="block group"
                    style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem', paddingTop: '0.75rem' }}
                  >
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }} className="line-clamp-2 group-hover:underline">
                      {serviceTranslations[svc.service_id]?.title || svc.service_name}
                    </h4>
                    {(serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade) && (
                      <p style={{ fontSize: '0.875rem', color: "#5c6474", lineHeight: 1.5, marginTop: '0.25rem' }} className="line-clamp-2">
                        {serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>

            {services.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.9rem', cursor: 'pointer' }}>
                  Show all {services.length} services
                </summary>
                <div className="space-y-0 mt-2">
                  {services.slice(4).map(function (svc) {
                    return (
                      <Link
                        key={svc.service_id}
                        href={'/services/' + svc.service_id}
                        className="block group"
                        style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.75rem', paddingTop: '0.75rem' }}
                      >
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3 }} className="line-clamp-2 group-hover:underline">
                          {serviceTranslations[svc.service_id]?.title || svc.service_name}
                        </h4>
                        {(serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade) && (
                          <p style={{ fontSize: '0.875rem', color: "#5c6474", lineHeight: 1.5, marginTop: '0.25rem' }} className="line-clamp-2">
                            {serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/neighborhoods" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Neighborhoods
        </Link>
      </div>
    </div>
  )
}
