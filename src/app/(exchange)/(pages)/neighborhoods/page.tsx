import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { MapPin } from 'lucide-react'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Neighborhoods — Community Exchange',
  description: 'Explore Houston neighborhoods and the resources, officials, and organizations that serve them.',
}

export default async function NeighborhoodsPage() {
  const supabase = await createClient()
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('neighborhood_id, neighborhood_name, super_neighborhood_id, zip_codes')
    .order('neighborhood_name')

  const { data: supers } = await supabase
    .from('super_neighborhoods')
    .select('sn_id, sn_name')
    .order('sn_name')

  const snMap: Record<string, string> = {}
  for (const sn of supers || []) { snMap[sn.sn_id] = sn.sn_name }

  const allNeighborhoods = neighborhoods || []

  return (
    <div>
      <IndexPageHero
        color="#d69e2e"
        pattern="flower"
        title="Houston Neighborhoods"
        subtitle="Every corner of Houston, mapped and connected"
        intro="Explore your neighborhood. Find the services, officials, organizations, and community resources near you. Enter your ZIP code or browse the full list."
        stats={[
          { value: allNeighborhoods.length, label: 'Neighborhoods' },
          { value: (supers || []).length, label: 'Super Neighborhoods' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Neighborhoods' }]} />
        <div className="flex gap-4 mt-4 mb-6">
          <Link href="/super-neighborhoods" className="text-sm font-medium text-brand-accent hover:underline">View by Super Neighborhood</Link>
          <Link href="/geography" className="text-sm font-medium text-brand-accent hover:underline">View on Map</Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allNeighborhoods.map(function (n) {
                return (
                  <Link
                    key={n.neighborhood_id}
                    href={'/neighborhoods/' + n.neighborhood_id}
                    className="bg-white rounded-xl border-2 border-brand-border p-4 hover:border-brand-text transition-all group relative overflow-hidden"
                    style={{ boxShadow: '2px 2px 0 #D1D5E0' }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#d69e2e] group-hover:w-1.5 transition-all" />
                    <div className="flex items-start gap-2 pl-2">
                      <MapPin className="w-4 h-4 text-[#d69e2e] mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors">{n.neighborhood_name}</h3>
                        {n.super_neighborhood_id && snMap[n.super_neighborhood_id] && (
                          <p className="text-[11px] text-brand-muted mt-0.5">{snMap[n.super_neighborhood_id]}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="neighborhoods"
                color="#d69e2e"
                related={[
                  { label: 'Geography Map', href: '/geography', color: '#d69e2e' },
                  { label: 'Services Near You', href: '/services', color: '#38a169' },
                  { label: 'Officials', href: '/officials', color: '#805ad5' },
                  { label: 'Organizations', href: '/organizations', color: '#dd6b20' },
                ]}
              />
              <div className="mt-4"><FeaturedPromo variant="card" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
