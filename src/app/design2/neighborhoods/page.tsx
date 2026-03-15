import type { Metadata } from 'next'
import Link from 'next/link'
import { getSuperNeighborhoods } from '@/lib/data/exchange'
import { NeighborhoodMap } from './NeighborhoodMap'

export const revalidate = 600
export const metadata: Metadata = { title: 'Neighborhoods — Community Exchange' }

export default async function NeighborhoodsPage() {
  const neighborhoods = await getSuperNeighborhoods()

  return (
    <div>
      {/* Dark editorial hero */}
      <section style={{ background: '#1a1a2e' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>Neighborhoods</span>
          </div>
          <div className="h-[2px] w-10 mb-5" style={{ background: '#C75B2A' }} />
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)]" style={{ color: 'white' }}>Neighborhoods</h1>
          <p className="font-serif text-[18px] italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Houston&apos;s communities, mapped</p>
          <p className="text-[16px] mt-4 max-w-[720px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {neighborhoods.length} super neighborhoods across Houston. Click any area to explore organizations, services, officials, and events.
          </p>
        </div>
      </section>

      <div className="max-w-[1152px] mx-auto px-8 py-12" style={{ background: '#FAF8F5' }}>
        {/* Interactive Map */}
        <NeighborhoodMap />

        {/* Neighborhood Grid */}
        <h2 className="font-serif text-xl mt-10 mb-4" style={{ color: '#1a1a1a' }}>All Super Neighborhoods</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {neighborhoods.map(function (sn: any) {
            return (
              <Link
                key={sn.sn_id}
                href={'/design2/super-neighborhoods/' + sn.sn_id}
                className="bg-white rounded-xl border p-4 transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#E2DDD5' }}
              >
                <div className="h-1 w-8 rounded-full mb-2" style={{ background: '#d69e2e' }} />
                <h3 className="font-serif text-[14px] font-semibold" style={{ color: '#1a1a1a' }}>{sn.sn_name}</h3>
                <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#9B9590' }}>SN-{sn.sn_number}</div>
                {sn.population && <div className="text-[11px] mt-1" style={{ color: '#6B6560' }}>{Number(sn.population).toLocaleString()} residents</div>}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
