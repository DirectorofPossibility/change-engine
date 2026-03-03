/**
 * @fileoverview Super neighborhood detail page.
 *
 * Displays a single Houston super neighborhood with demographic stats
 * (population, median income), an interactive map showing services,
 * voting locations, and organizations as markers, a list of child
 * neighborhoods, and a grid of nearby services.
 *
 * Data is fetched in parallel: super neighborhood record, child
 * neighborhoods, and map marker data (services, voting locations,
 * organizations).
 *
 * @datasource Supabase tables: super_neighborhoods, neighborhoods,
 *   services_211, voting_locations, organizations
 * @caching ISR with `revalidate = 300` (5 minutes)
 * @route GET /super-neighborhoods/[id]
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Users, DollarSign, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { getSuperNeighborhood, getNeighborhoodsBySuperNeighborhood, getMapMarkersForSuperNeighborhood } from '@/lib/data/exchange'
import { SuperNeighborhoodDetailMap } from './SuperNeighborhoodDetailMap'
import { ServiceCard } from '@/components/exchange/ServiceCard'

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
  const [sn, neighborhoods, mapData] = await Promise.all([
    getSuperNeighborhood(id),
    getNeighborhoodsBySuperNeighborhood(id),
    getMapMarkersForSuperNeighborhood(id),
  ])

  if (!sn) notFound()

  // Build marker data for the map
  const markers = [
    ...mapData.services
      .filter(s => s.latitude != null && s.longitude != null)
      .slice(0, 30)
      .map(s => ({
        id: 'svc-' + s.service_id,
        lat: s.latitude as number,
        lng: s.longitude as number,
        title: s.service_name,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Breadcrumb ── */}
      <div className="text-sm text-brand-muted mb-4">
        <Link href="/super-neighborhoods" className="hover:text-brand-accent">Super Neighborhoods</Link>
        <span className="mx-2">/</span>
        <span className="text-brand-text">{sn.sn_name}</span>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: THEMES.THEME_07.color }}
        >
          {sn.sn_number}
        </span>
        <h1 className="text-3xl font-bold text-brand-text">{sn.sn_name}</h1>
      </div>

      {/* ── Demographics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 mb-8">
        {sn.population != null && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <Users size={20} className="mx-auto text-brand-accent mb-1" />
            <div className="text-xl font-bold text-brand-text">{sn.population.toLocaleString()}</div>
            <div className="text-xs text-brand-muted">Population</div>
          </div>
        )}
        {sn.median_income != null && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <DollarSign size={20} className="mx-auto text-brand-accent mb-1" />
            <div className="text-xl font-bold text-brand-text">${sn.median_income.toLocaleString()}</div>
            <div className="text-xs text-brand-muted">Median Income</div>
          </div>
        )}
        {neighborhoods.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <MapPin size={20} className="mx-auto text-brand-accent mb-1" />
            <div className="text-xl font-bold text-brand-text">{neighborhoods.length}</div>
            <div className="text-xs text-brand-muted">Neighborhoods</div>
          </div>
        )}
        {mapData.services.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
            <div className="text-xl font-bold text-brand-text">{mapData.services.length}</div>
            <div className="text-xs text-brand-muted">Services</div>
          </div>
        )}
      </div>

      {/* ── Description ── */}
      {sn.description && (
        <section className="mb-8">
          <p className="text-brand-muted leading-relaxed">{sn.description}</p>
        </section>
      )}

      {/* ── Map ── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-brand-text mb-4">Map</h2>
        <SuperNeighborhoodDetailMap markers={markers} snId={sn.sn_id} />
      </section>

      {/* ── ZIP Codes ── */}
      {zips.length > 0 && (
        <div className="bg-brand-accent/5 rounded-xl border border-brand-border p-4 mb-8">
          <p className="text-sm text-brand-text">
            ZIP codes: {zips.join(', ')} &mdash;{' '}
            <Link href="/officials/lookup" className="text-brand-accent hover:underline font-medium">
              Find your representatives &rarr;
            </Link>
          </p>
        </div>
      )}

      {/* ── Child Neighborhoods ── */}
      {neighborhoods.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-brand-text mb-4">Neighborhoods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {neighborhoods.map(hood => (
              <Link
                key={hood.neighborhood_id}
                href={'/neighborhoods/' + hood.neighborhood_id}
                className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md hover:border-brand-accent/30 transition-all"
              >
                <h3 className="font-semibold text-brand-text text-sm">{hood.neighborhood_name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted">
                  {hood.neighborhood_type && <span>{hood.neighborhood_type}</span>}
                  {hood.population != null && (
                    <span className="flex items-center gap-1">
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

      {/* ── Services ── */}
      {mapData.services.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-text mb-4">Services in This Area</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mapData.services.slice(0, 12).map(svc => (
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
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
