import type { Metadata } from 'next'
import Link from 'next/link'
import { getSuperNeighborhoods } from '@/lib/data/exchange'
import { NeighborhoodMap } from './NeighborhoodMap'

export const revalidate = 600
export const metadata: Metadata = { title: 'Neighborhoods — Community Exchange' }

export default async function NeighborhoodsPage() {
  const neighborhoods = await getSuperNeighborhoods()

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Neighborhoods</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            {neighborhoods.length} super neighborhoods across Houston. Click any area to explore organizations, services, officials, and events.
          </p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#d69e2e' }} />
        </div>

        {/* Interactive Map */}
        <NeighborhoodMap />

        {/* Neighborhood Grid */}
        <h2 className="font-serif text-xl mt-10 mb-4" style={{ color: '#1a1a1a' }}>All Super Neighborhoods</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {neighborhoods.map(function (sn: any) {
            return (
              <Link
                key={sn.sn_id}
                href={'/super-neighborhoods/' + sn.sn_id}
                className="bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#D4CCBE' }}
              >
                <div className="h-1 w-8 rounded-full mb-2" style={{ background: '#d69e2e' }} />
                <h3 className="font-serif text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>{sn.sn_name}</h3>
                <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#9B9590' }}>SN-{sn.sn_number}</div>
                {sn.population && <div className="text-[11px] mt-1" style={{ color: '#6B6560' }}>{Number(sn.population).toLocaleString()} residents</div>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
