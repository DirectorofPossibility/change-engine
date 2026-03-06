import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getPathwayCounts } from '@/lib/data/exchange'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export const revalidate = 600
export const metadata: Metadata = { title: 'Pathways — Community Exchange' }

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export default async function PathwaysPage() {
  const counts = await getPathwayCounts()

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-10">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Pathways</h1>
          <p className="text-[15px] max-w-[640px]" style={{ color: '#6B6560' }}>
            Seven pathways organize everything in the Community Exchange — resources, services, officials, and policies — around the topics that matter most.
          </p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#C75B2A' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {THEME_LIST.map(function (t) {
            const count = counts[t.id] || 0
            return (
              <Link
                key={t.id}
                href={'/design2/pathways/' + t.slug}
                className="bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg hover:translate-y-[-3px] relative overflow-hidden"
                style={{ borderColor: t.color + '40' }}
              >
                <div className="absolute top-[-20px] right-[-20px] opacity-[0.06]">
                  <FlowerOfLifeIcon size={140} color={t.color} />
                </div>
                <div className="relative z-10">
                  <div className="h-1.5 w-12 rounded-full mb-4" style={{ background: t.color }} />
                  <FlowerOfLifeIcon size={36} color={t.color} />
                  <h2 className="font-serif text-xl font-bold mt-3" style={{ color: '#1a1a1a' }}>{t.name}</h2>
                  <p className="text-[13px] mt-2 leading-relaxed" style={{ color: '#6B6560' }}>
                    {count} resources, services, and policies connected to this pathway.
                  </p>
                  <span className="inline-block mt-4 text-[12px] font-bold" style={{ color: t.color }}>
                    Explore →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
