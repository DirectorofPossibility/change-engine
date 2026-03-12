/**
 * @fileoverview Super neighborhood detail page.
 *
 * Displays a single Houston super neighborhood with demographic stats
 * (population, median income), an interactive map showing services,
 * voting locations, and organizations as markers, a list of child
 * neighborhoods, and a grid of nearby services.
 *
 * @datasource Supabase tables: super_neighborhoods, neighborhoods,
 *   services_211, voting_locations, organizations
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /super-neighborhoods/[id]
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Users, DollarSign, MapPin, Scale } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { getSuperNeighborhood, getNeighborhoodsBySuperNeighborhood, getMapMarkersForSuperNeighborhood, getLangId, fetchTranslationsForTable, getPoliciesForNeighborhood, getWayfinderContext } from '@/lib/data/exchange'
import { SuperNeighborhoodDetailMap } from './SuperNeighborhoodDetailMap'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { getUIStrings } from '@/lib/i18n'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getUserProfile } from '@/lib/auth/roles'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const sn = await getSuperNeighborhood(id)
  if (!sn) return { title: 'Not Found' }
  return {
    title: sn.sn_name + ' — Super Neighborhood',
    description: 'Community resources, services, and information for the ' + sn.sn_name + ' super neighborhood in Houston.',
  }
}

export default async function SuperNeighborhoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userProfile = await getUserProfile()
  const [sn, neighborhoods, mapData, snPolicies, wayfinderData] = await Promise.all([
    getSuperNeighborhood(id),
    getNeighborhoodsBySuperNeighborhood(id),
    getMapMarkersForSuperNeighborhood(id),
    getPoliciesForNeighborhood(id),
    getWayfinderContext('super_neighborhood' as any, id, userProfile?.role),
  ])

  if (!sn) notFound()

  // Translation support
  const langId = await getLangId()
  const snTranslations = langId
    ? await fetchTranslationsForTable('super_neighborhoods', [sn.sn_id], langId)
    : {}
  const serviceIds = mapData.services.map(s => s.service_id)
  const serviceTranslations = langId && serviceIds.length > 0
    ? await fetchTranslationsForTable('services_211', serviceIds, langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const snName = snTranslations[sn.sn_id]?.title || sn.sn_name
  const snDescription = snTranslations[sn.sn_id]?.summary || sn.description

  // Build marker data for the map
  const markers = [
    ...mapData.services
      .filter(s => s.latitude != null && s.longitude != null)
      .slice(0, 30)
      .map(s => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: serviceTranslations[s.service_id]?.title || s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        link: '/services/' + s.service_id,
      })),
    ...mapData.votingLocations
      .filter(v => v.latitude != null && v.longitude != null)
      .slice(0, 20)
      .map(v => ({
        id: 'vote-' + v.location_id,
        lat: v.latitude as number,
        lng: v.longitude as number,
        title: v.location_name,
        type: 'voting' as const,
        address: [v.address, v.city].filter(Boolean).join(', '),
      })),
    ...mapData.organizations
      .filter(o => o.latitude != null && o.longitude != null)
      .slice(0, 20)
      .map(o => ({
        id: 'org-' + o.org_id,
        lat: o.latitude as number,
        lng: o.longitude as number,
        title: o.org_name,
        type: 'organization' as const,
        link: '/organizations/' + o.org_id,
      })),
    ...(mapData.municipalServices ?? []).map(m => ({
      id: 'muni-' + m.id,
      lat: m.lat,
      lng: m.lng,
      title: m.title,
      type: (m.type || 'service') as 'service',
      address: m.address,
      phone: m.phone,
      link: m.link,
    })),
  ]

  // Get ZIP codes via junction table for child neighborhoods
  const supabase = await createClient()
  const { data: childHoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', sn.sn_id)
  const hoodIds = (childHoods ?? []).map(h => h.neighborhood_id)
  let zips: string[] = []
  if (hoodIds.length > 0) {
    const { data: zipJunctions } = await supabase
      .from('neighborhood_zip_codes')
      .select('zip_code')
      .in('neighborhood_id', hoodIds)
    zips = Array.from(new Set((zipJunctions ?? []).map(j => j.zip_code)))
  }

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-6">
      <Breadcrumb items={[{ label: t('superNeighborhoods.breadcrumb'), href: '/super-neighborhoods' }, { label: snName }]} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-0 items-start">
      <div className="py-8 lg:pr-10 lg:border-r min-w-0" style={{ borderColor: '#dde1e8' }}>

      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold font-mono"
          style={{ backgroundColor: '#0d1117' }}
        >
          {sn.sn_number}
        </span>
        <div>
          <span className="font-mono uppercase tracking-[0.12em] block" style={{ fontSize: '0.52rem', color: '#5c6474' }}>Super Neighborhood</span>
          <h1 className="font-display leading-[1] tracking-tight" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#0d1117' }}>{snName}</h1>
        </div>
      </div>

      {/* ── Demographics ── */}
      <div className="flex flex-wrap gap-6 mb-6 py-4" style={{ borderTop: '1px solid #dde1e8', borderBottom: '1px solid #dde1e8' }}>
        {sn.population != null && (
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: '#1b5e8a' }} />
            <span className="font-display text-lg font-bold" style={{ color: '#0d1117' }}>{sn.population.toLocaleString()}</span>
            <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('superNeighborhoods.population')}</span>
          </div>
        )}
        {sn.median_income != null && (
          <div className="flex items-center gap-2">
            <DollarSign size={16} style={{ color: '#1b5e8a' }} />
            <span className="font-display text-lg font-bold" style={{ color: '#0d1117' }}>${sn.median_income.toLocaleString()}</span>
            <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('superNeighborhoods.median_income')}</span>
          </div>
        )}
        {neighborhoods.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin size={16} style={{ color: '#1b5e8a' }} />
            <span className="font-display text-lg font-bold" style={{ color: '#0d1117' }}>{neighborhoods.length}</span>
            <span className="font-mono uppercase tracking-[0.1em]" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{t('superNeighborhoods.neighborhoods')}</span>
          </div>
        )}
      </div>

      {/* ── Description ── */}
      {snDescription && (
        <section className="mb-8">
          <p className="font-body leading-[1.85]" style={{ fontSize: '0.88rem', color: '#0d1117' }}>{snDescription}</p>
        </section>
      )}

      {/* ── Map ── */}
      <section className="mb-8">
        <span className="font-mono uppercase tracking-[0.2em] block mb-3" style={{ fontSize: '0.58rem', color: '#5c6474' }}>{t('superNeighborhoods.map')}</span>
        <div style={{ border: '1px solid #dde1e8' }}>
          <SuperNeighborhoodDetailMap markers={markers} snId={sn.sn_id} />
        </div>
      </section>

      {/* ── ZIP Codes ── */}
      {zips.length > 0 && (
        <div className="p-4 mb-8" style={{ background: '#f4f5f7', border: '1px solid #dde1e8' }}>
          <p className="font-mono" style={{ fontSize: '0.75rem', color: '#0d1117' }}>
            ZIP codes: {zips.join(', ')} &mdash;{' '}
            <Link href="/officials/lookup" className="hover:underline font-medium" style={{ color: '#1b5e8a' }}>
              {t('superNeighborhoods.find_reps')} &rarr;
            </Link>
          </p>
        </div>
      )}

      {/* ── Child Neighborhoods ── */}
      {neighborhoods.length > 0 && (
        <section className="mb-8">
          <span className="font-mono uppercase tracking-[0.2em] block mb-3" style={{ fontSize: '0.58rem', color: '#5c6474' }}>{t('superNeighborhoods.neighborhoods')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0" style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}>
            {neighborhoods.map(hood => (
              <Link
                key={hood.neighborhood_id}
                href={'/neighborhoods/' + hood.neighborhood_id}
                className="block p-4 bg-white transition-colors hover:bg-[#f4f5f7]"
                style={{ borderRight: '1.5px solid #dde1e8', borderBottom: '1.5px solid #dde1e8' }}
              >
                <h3 className="font-display text-sm font-bold" style={{ color: '#0d1117' }}>{hood.neighborhood_name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  {hood.neighborhood_type && <span className="font-mono" style={{ fontSize: '0.58rem', color: '#5c6474' }}>{hood.neighborhood_type}</span>}
                  {hood.population != null && (
                    <span className="flex items-center gap-1 font-mono" style={{ fontSize: '0.58rem', color: '#5c6474' }}>
                      <Users size={10} />
                      {hood.population.toLocaleString()}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Policies Affecting This Neighborhood ── */}
      {snPolicies.length > 0 && (
        <section className="mb-8">
          <span className="font-mono uppercase tracking-[0.2em] block mb-3" style={{ fontSize: '0.58rem', color: '#5c6474' }}>
            Policy Watch — This Neighborhood
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}>
            {snPolicies.slice(0, 6).map(function (p: any) {
              const isActive = ['pending', 'introduced', 'in committee', 'active'].includes((p.status || '').toLowerCase())
              return (
                <Link
                  key={p.policy_id}
                  href={'/policies/' + p.policy_id}
                  className="block p-4 bg-white transition-colors hover:bg-[#f4f5f7]"
                  style={{ borderRight: '1.5px solid #dde1e8', borderBottom: '1.5px solid #dde1e8', borderLeft: isActive ? '3px solid #b03a2a' : 'none' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {p.level && <span className="font-mono uppercase tracking-[0.12em] px-2 py-0.5" style={{ fontSize: '0.52rem', background: '#0d1117', color: '#ffffff' }}>{p.level}</span>}
                    {p.status && <span className="font-mono uppercase" style={{ fontSize: '0.52rem', color: '#5c6474' }}>{p.status}</span>}
                  </div>
                  <h3 className="font-display text-sm font-bold line-clamp-2" style={{ color: '#0d1117' }}>{p.title_6th_grade || p.policy_name}</h3>
                  {p.bill_number && <p className="font-mono mt-1" style={{ fontSize: '0.62rem', color: '#5c6474' }}>{p.bill_number}</p>}
                  {p.impact_statement && (
                    <p className="font-body italic mt-2 line-clamp-2" style={{ fontSize: '0.75rem', color: '#b03a2a' }}>{p.impact_statement}</p>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Services ── */}
      {mapData.services.length > 0 && (
        <section>
          <span className="font-mono uppercase tracking-[0.2em] block mb-3" style={{ fontSize: '0.58rem', color: '#5c6474' }}>{t('superNeighborhoods.services_area')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderLeft: '1.5px solid #dde1e8', borderTop: '1.5px solid #dde1e8' }}>
            {mapData.services.slice(0, 12).map(svc => (
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
            ))}
          </div>
        </section>
      )}
      </div>
      <aside className="py-8 lg:pl-10 flex flex-col gap-7">
        <DetailWayfinder data={wayfinderData} currentType={'super_neighborhood' as any} currentId={sn.sn_id} userRole={userProfile?.role} />
      </aside>
      </div>
    </div>
  )
}
