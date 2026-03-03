import type { Metadata } from 'next'
import Link from 'next/link'
import { Users, DollarSign } from 'lucide-react'
import { getSuperNeighborhoods } from '@/lib/data/exchange'
import { SuperNeighborhoodsMap } from './SuperNeighborhoodsMap'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Super Neighborhoods — The Change Engine',
  description: 'Explore Houston\'s 88 super neighborhoods. View boundaries, demographics, and community resources.',
}

export default async function SuperNeighborhoodsPage() {
  const superNeighborhoods = await getSuperNeighborhoods()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-brand-text mb-2">Super Neighborhoods</h1>
      <p className="text-brand-muted mb-8 max-w-2xl">
        Houston is divided into 88 super neighborhoods — community areas that group
        nearby neighborhoods together for civic engagement and resource planning.
        Click a boundary on the map or a card below to explore.
      </p>

      {/* Interactive map with super neighborhood boundaries */}
      <SuperNeighborhoodsMap />

      {/* Grid of super neighborhoods */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-brand-text mb-4">
          All Super Neighborhoods ({superNeighborhoods.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {superNeighborhoods.map(sn => (
            <Link
              key={sn.sn_id}
              href={'/super-neighborhoods/' + sn.sn_id}
              className="bg-white rounded-xl border border-brand-border p-4 hover:shadow-md hover:border-brand-accent/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: '#805ad5' }}
                >
                  {sn.sn_number}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-brand-text text-sm truncate">{sn.sn_name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted">
                    {sn.population != null && (
                      <span className="flex items-center gap-1">
                        <Users size={10} />
                        {sn.population.toLocaleString()}
                      </span>
                    )}
                    {sn.median_income != null && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={10} />
                        ${sn.median_income.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
