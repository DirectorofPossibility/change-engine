/**
 * @fileoverview Super neighborhood detail page for design2 A/B test.
 *
 * Displays a single Houston super neighborhood with demographic stats,
 * an interactive map, child neighborhoods, policies, and services.
 * Uses warm tan design system (#FAF8F5 background, white cards).
 *
 * @route GET /design2/super-neighborhoods/[id]
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Users, DollarSign, MapPin, Scale, Building2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getSuperNeighborhood,
  getNeighborhoodsBySuperNeighborhood,
  getMapMarkersForSuperNeighborhood,
  getLangId,
  fetchTranslationsForTable,
  getPoliciesForNeighborhood,
} from '@/lib/data/exchange'
import { SuperNeighborhoodDetailMap } from '@/app/(exchange)/(pages)/super-neighborhoods/[id]/SuperNeighborhoodDetailMap'
import { ServiceCard } from '@/components/exchange/ServiceCard'
import { getUIStrings } from '@/lib/i18n'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const sn = await getSuperNeighborhood(id)
  if (!sn) return { title: 'Not Found' }
  return {
    title: sn.sn_name + ' — Super Neighborhood',
    description:
      'Community resources, services, and information for the ' +
      sn.sn_name +
      ' super neighborhood in Houston.',
  }
}

export default async function Design2SuperNeighborhoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [sn, neighborhoods, mapData, snPolicies] = await Promise.all([
    getSuperNeighborhood(id),
    getNeighborhoodsBySuperNeighborhood(id),
    getMapMarkersForSuperNeighborhood(id),
    getPoliciesForNeighborhood(id),
  ])

  if (!sn) notFound()

  // Translation support
  const langId = await getLangId()
  const snTranslations = langId
    ? await fetchTranslationsForTable('super_neighborhoods', [sn.sn_id], langId)
    : {}
  const serviceIds = mapData.services.map((s) => s.service_id)
  const serviceTranslations =
    langId && serviceIds.length > 0
      ? await fetchTranslationsForTable('services_211', serviceIds, langId)
      : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const snName = snTranslations[sn.sn_id]?.title || sn.sn_name
  const snDescription = snTranslations[sn.sn_id]?.summary || sn.description

  // Build marker data for the map — update links to design2 paths
  const markers = [
    ...mapData.services
      .filter((s) => s.latitude != null && s.longitude != null)
      .slice(0, 30)
      .map((s) => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: serviceTranslations[s.service_id]?.title || s.service_name,
        type: 'service' as const,
        address: [s.address, s.city].filter(Boolean).join(', '),
        link: '/design2/services/' + s.service_id,
      })),
    ...mapData.votingLocations
      .filter((v) => v.latitude != null && v.longitude != null)
      .slice(0, 20)
      .map((v) => ({
        id: 'vote-' + v.location_id,
        lat: v.latitude as number,
        lng: v.longitude as number,
        title: v.location_name,
        type: 'voting' as const,
        address: [v.address, v.city].filter(Boolean).join(', '),
      })),
    ...mapData.organizations
      .filter((o) => o.latitude != null && o.longitude != null)
      .slice(0, 20)
      .map((o) => ({
        id: 'org-' + o.org_id,
        lat: o.latitude as number,
        lng: o.longitude as number,
        title: o.org_name,
        type: 'organization' as const,
        link: '/design2/organizations/' + o.org_id,
      })),
  ]

  // Get ZIP codes via junction table for child neighborhoods
  const supabase = await createClient()
  const { data: childHoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id')
    .eq('super_neighborhood_id', sn.sn_id)
  const hoodIds = (childHoods ?? []).map((h) => h.neighborhood_id)
  let zips: string[] = []
  if (hoodIds.length > 0) {
    const { data: zipJunctions } = await supabase
      .from('neighborhood_zip_codes')
      .select('zip_code')
      .in('neighborhood_id', hoodIds)
    zips = Array.from(new Set((zipJunctions ?? []).map((j) => j.zip_code)))
  }

  return (
    <div style={{ backgroundColor: '#FAF8F5' }} className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link
          href="/design2/neighborhoods"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
          style={{ color: '#6B6560' }}
        >
          <ArrowLeft size={16} />
          Back to Neighborhoods
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: '#C75B2A' }}
          >
            {sn.sn_number}
          </span>
          <h1 className="text-3xl font-serif font-bold" style={{ color: '#1a1a1a' }}>
            {snName}
          </h1>
        </div>

        {/* Demographics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 mb-8">
          {sn.population != null && (
            <div
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <Users size={20} className="mx-auto mb-1" style={{ color: '#C75B2A' }} />
              <div className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                {sn.population.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: '#6B6560' }}>
                {t('superNeighborhoods.population')}
              </div>
            </div>
          )}
          {sn.median_income != null && (
            <div
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <DollarSign size={20} className="mx-auto mb-1" style={{ color: '#C75B2A' }} />
              <div className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                ${sn.median_income.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: '#6B6560' }}>
                {t('superNeighborhoods.median_income')}
              </div>
            </div>
          )}
          {neighborhoods.length > 0 && (
            <div
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <MapPin size={20} className="mx-auto mb-1" style={{ color: '#C75B2A' }} />
              <div className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                {neighborhoods.length}
              </div>
              <div className="text-xs" style={{ color: '#6B6560' }}>
                {t('superNeighborhoods.neighborhoods')}
              </div>
            </div>
          )}
          {mapData.services.length > 0 && (
            <div
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <Building2 size={20} className="mx-auto mb-1" style={{ color: '#C75B2A' }} />
              <div className="text-xl font-bold" style={{ color: '#1a1a1a' }}>
                {mapData.services.length}
              </div>
              <div className="text-xs" style={{ color: '#6B6560' }}>
                {t('superNeighborhoods.services')}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {snDescription && (
          <section className="mb-8">
            <p className="leading-relaxed" style={{ color: '#6B6560' }}>
              {snDescription}
            </p>
          </section>
        )}

        {/* Map */}
        <section className="mb-8">
          <h2 className="text-xl font-serif font-bold mb-4" style={{ color: '#1a1a1a' }}>
            {t('superNeighborhoods.map')}
          </h2>
          <div
            className="bg-white rounded-xl overflow-hidden"
            style={{ border: '1px solid #E2DDD5' }}
          >
            <SuperNeighborhoodDetailMap markers={markers} snId={sn.sn_id} />
          </div>
        </section>

        {/* ZIP Codes */}
        {zips.length > 0 && (
          <div
            className="bg-white rounded-xl p-4 mb-8"
            style={{ border: '1px solid #E2DDD5' }}
          >
            <p className="text-sm" style={{ color: '#1a1a1a' }}>
              <span className="font-semibold">ZIP codes:</span> {zips.join(', ')}
            </p>
          </div>
        )}

        {/* Child Neighborhoods */}
        {neighborhoods.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold mb-4" style={{ color: '#1a1a1a' }}>
              {t('superNeighborhoods.neighborhoods')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {neighborhoods.map((hood) => (
                <div
                  key={hood.neighborhood_id}
                  className="bg-white rounded-xl p-4"
                  style={{ border: '1px solid #E2DDD5' }}
                >
                  <h3
                    className="font-serif font-semibold text-sm"
                    style={{ color: '#1a1a1a' }}
                  >
                    {hood.neighborhood_name}
                  </h3>
                  <div
                    className="flex items-center gap-3 mt-1 text-xs"
                    style={{ color: '#6B6560' }}
                  >
                    {hood.neighborhood_type && <span>{hood.neighborhood_type}</span>}
                    {hood.population != null && (
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {hood.population.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Policies */}
        {snPolicies.length > 0 && (
          <section className="mb-8">
            <h2
              className="text-xl font-serif font-bold mb-4 flex items-center gap-2"
              style={{ color: '#1a1a1a' }}
            >
              <Scale size={20} style={{ color: '#C75B2A' }} />
              Policies Affecting This Neighborhood
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {snPolicies.slice(0, 6).map(function (p: any) {
                return (
                  <Link
                    key={p.policy_id}
                    href={'/design2/policies/' + p.policy_id}
                    className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow block"
                    style={{ border: '1px solid #E2DDD5' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {p.level && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: '#FAF8F5', color: '#6B6560' }}
                        >
                          {p.level}
                        </span>
                      )}
                      {p.status && (
                        <span className="text-xs" style={{ color: '#6B6560' }}>
                          {p.status}
                        </span>
                      )}
                    </div>
                    <h3
                      className="font-serif font-semibold text-sm line-clamp-2"
                      style={{ color: '#1a1a1a' }}
                    >
                      {p.title_6th_grade || p.policy_name}
                    </h3>
                    {p.bill_number && (
                      <p className="text-xs font-mono mt-1" style={{ color: '#6B6560' }}>
                        {p.bill_number}
                      </p>
                    )}
                    {p.impact_statement && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: '#9A7B4F' }}>
                        {p.impact_statement}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Services */}
        {mapData.services.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-serif font-bold mb-4" style={{ color: '#1a1a1a' }}>
              {t('superNeighborhoods.services_area')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapData.services.slice(0, 12).map((svc) => (
                <Link key={svc.service_id} href={'/design2/services/' + svc.service_id}>
                  <ServiceCard
                    name={
                      serviceTranslations[svc.service_id]?.title || svc.service_name
                    }
                    description={
                      serviceTranslations[svc.service_id]?.summary ||
                      svc.description_5th_grade
                    }
                    phone={svc.phone}
                    address={svc.address}
                    city={svc.city}
                    state={svc.state}
                    zipCode={svc.zip_code}
                    website={svc.website}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
