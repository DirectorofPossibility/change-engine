import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
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

  return (
    <div>
      <PageHero variant="sacred" sacredPattern="flower" gradientColor="#d69e2e" title="Houston Neighborhoods" subtitle="Explore every corner of Houston. Find resources, officials, and organizations serving your neighborhood." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Neighborhoods' }]} />
        <div className="flex gap-4 mt-4 mb-6">
          <Link href="/super-neighborhoods" className="text-sm text-brand-accent hover:underline">View by Super Neighborhood</Link>
          <Link href="/geography" className="text-sm text-brand-accent hover:underline">View on map</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(neighborhoods || []).map(function (n) {
            return (
              <Link key={n.neighborhood_id} href={`/neighborhoods/${n.neighborhood_id}`} className="bg-white rounded-lg border border-brand-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm text-brand-text">{n.neighborhood_name}</h3>
                    {n.super_neighborhood_id && snMap[n.super_neighborhood_id] && (
                      <p className="text-xs text-brand-muted mt-0.5">{snMap[n.super_neighborhood_id]}</p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
