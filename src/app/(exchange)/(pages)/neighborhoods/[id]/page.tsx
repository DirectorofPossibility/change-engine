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
import { getUserProfile } from '@/lib/auth/roles'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'

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

  const eyebrowMeta = (
    <span
      className="font-mono uppercase tracking-[0.12em]"
      style={{ fontSize: '0.58rem', color: '#5c6474', letterSpacing: '0.2em' }}
    >
      {hood.neighborhood_type && <>{hood.neighborhood_type} &middot; </>}
      {hood.city && <>{hood.city}</>}
      {hood.council_district && <> &middot; District {hood.council_district}</>}
    </span>
  )

  const metaRow = (
    <div className="flex flex-wrap gap-6" style={{ borderTop: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8', padding: '1rem 0' }}>
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
  )

  const sidebarContent = (
    <>
      {/* ZIP code lookup link */}
      {zips.length > 0 && (
        <div className="p-4" style={{ background: '#f4f5f7', border: '1px solid #dde1e8' }}>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: '#0d1117' }}>
            ZIP codes: {zips.join(', ')} &mdash;{' '}
            <Link href={'/officials/lookup'} className="hover:underline font-medium" style={{ color: '#1b5e8a' }}>
              {t('neighborhoods.find_reps')} &rarr;
            </Link>
          </p>
        </div>
      )}
    </>
  )

  return (
    <DetailPageLayout
      breadcrumbs={[{ label: 'Neighborhoods', href: '/neighborhoods' }, { label: hood.neighborhood_name }]}
      eyebrow={{ text: 'Neighborhood', bgColor: '#0d1117' }}
      eyebrowMeta={eyebrowMeta}
      title={hood.neighborhood_name}
      subtitle={hood.description || null}
      metaRow={metaRow}
      themeColor="#1b5e8a"
      wayfinderData={wayfinderData}
      wayfinderType="neighborhood"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      actions={{
        translate: { isTranslated: false, contentType: 'neighborhood', contentId: id },
        share: { title: hood.neighborhood_name, url: `https://www.changeengine.us/neighborhoods/${id}` },
      }}
      sidebar={sidebarContent}
      feedbackType="neighborhood"
      feedbackId={id}
      feedbackName={hood.neighborhood_name}
    >
      {/* Neighborhood Map */}
      <div className="mb-6">
        <NeighborhoodMap
          services={mapData.services}
          votingLocations={mapData.votingLocations}
          distributionSites={mapData.distributionSites}
          organizations={mapData.organizations}
          municipalServices={mapData.municipalServices}
        />
      </div>

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
    </DetailPageLayout>
  )
}
