import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { MapPin, Users, DollarSign } from 'lucide-react'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { NeighborhoodMap } from '@/components/exchange/NeighborhoodMap'
import { getMapMarkersForNeighborhood, getLangId, fetchTranslationsForTable, getWayfinderContext } from '@/lib/data/exchange'
import { getUIStrings } from '@/lib/i18n'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
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

  // Get ZIP codes from junction table (REST API — table not in generated types)
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

  // Fetch map markers for neighborhood
  const userProfile = await getUserProfile()
  const [mapData, wayfinderData] = await Promise.all([
    getMapMarkersForNeighborhood(id),
    getWayfinderContext('neighborhood' as any, id, userProfile?.role),
  ])

  // Translation support
  const langId = await getLangId()
  const serviceTranslations = langId && services.length > 0
    ? await fetchTranslationsForTable('services_211', services.map(s => s.service_id), langId)
    : {}
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-6">
      <Breadcrumb items={[{ label: 'Neighborhoods', href: '/neighborhoods' }, { label: hood.neighborhood_name }]} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 items-start">
      <div className="py-8 lg:pr-10 lg:border-r min-w-0" style={{ borderColor: '#dde1e8' }}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="font-mono uppercase tracking-[0.12em] px-2 py-0.5"
          style={{ fontSize: '0.52rem', background: '#0d1117', color: '#ffffff' }}
        >
          Neighborhood
        </span>
        <span
          className="font-mono uppercase tracking-[0.12em]"
          style={{ fontSize: '0.58rem', color: '#5c6474', letterSpacing: '0.2em' }}
        >
          {hood.neighborhood_type && <>{hood.neighborhood_type} &middot; </>}
          {hood.city && <>{hood.city}</>}
          {hood.council_district && <> &middot; District {hood.council_district}</>}
        </span>
      </div>
      <h1
        className="font-display leading-[1] tracking-tight mb-4"
        style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, color: '#0d1117' }}
      >
        {hood.neighborhood_name}
      </h1>

      {/* Demographics */}
      <div className="flex flex-wrap gap-6 mb-6 py-4" style={{ borderTop: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
        {hood.population != null && (
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: '#1b5e8a' }} />
            <div>
              <span className="font-display text-lg font-bold" style={{ color: '#0d1117' }}>{hood.population.toLocaleString()}</span>
              <span className="font-mono uppercase tracking-[0.1em] ml-2" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('neighborhoods.population')}</span>
            </div>
          </div>
        )}
        {hood.median_income != null && (
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: '#1b5e8a' }} />
            <div>
              <span className="font-display text-lg font-bold" style={{ color: '#0d1117' }}>${hood.median_income.toLocaleString()}</span>
              <span className="font-mono uppercase tracking-[0.1em] ml-2" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('neighborhoods.median_income')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {hood.description && (
        <section className="mb-6">
          <p className="font-body leading-[1.85]" style={{ fontSize: '0.88rem', color: '#0d1117' }}>{hood.description}</p>
        </section>
      )}

      {/* Neighborhood Map */}
      <NeighborhoodMap
        services={mapData.services}
        votingLocations={mapData.votingLocations}
        distributionSites={mapData.distributionSites}
        organizations={mapData.organizations}
        municipalServices={mapData.municipalServices}
      />

      {/* ZIP code lookup link */}
      {zips.length > 0 && (
        <div className="p-4 mb-6" style={{ background: '#f4f5f7', border: '1px solid #dde1e8' }}>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: '#0d1117' }}>
            ZIP codes: {zips.join(', ')} &mdash;{' '}
            <Link href={'/officials/lookup'} className="hover:underline font-medium" style={{ color: '#1b5e8a' }}>
              {t('neighborhoods.find_reps')} &rarr;
            </Link>
          </p>
        </div>
      )}

      {/* Local services */}
      {services.length > 0 && (
        <section>
          <span
            className="font-mono uppercase tracking-[0.2em] block mb-3"
            style={{ fontSize: '0.58rem', color: '#5c6474' }}
          >
            {t('neighborhoods.services_area')}
          </span>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-0"
            style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}
          >
            {services.map(function (svc) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block p-4 bg-white transition-colors hover:bg-[#f4f5f7]" style={{ borderRight: '1.5px solid #dde1e8', borderBottom: '1.5px solid #dde1e8' }}>
                  <h4 className="font-display line-clamp-2 mb-1" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0d1117' }}>
                    {serviceTranslations[svc.service_id]?.title || svc.service_name}
                  </h4>
                  {(serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade) && (
                    <p className="font-body italic line-clamp-2" style={{ fontSize: '0.75rem', color: '#5c6474' }}>
                      {serviceTranslations[svc.service_id]?.summary || svc.description_5th_grade}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}
      </div>
      <aside className="py-8 lg:pl-10 flex flex-col gap-7">
        <DetailWayfinder data={wayfinderData} currentType={'neighborhood' as any} currentId={id} userRole={userProfile?.role} />
      </aside>
      </div>
    </div>
  )
}
