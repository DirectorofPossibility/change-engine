import type { Metadata } from 'next'
import Link from 'next/link'
import { getExchangeStats, getLatestContent, getPathwayCounts } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Community Exchange — Design 2',
  description: 'A/B test: Center-based navigation for the Community Exchange.',
}

const QUICK_ACCESS = [
  { href: '/design2/chat', label: 'Chart Your Course', sub: 'Find where you fit in', bg: '#F7F2EA', accent: true },
  { href: '/design2/library', label: 'Library', sub: 'Articles, guides, deep dives', bg: 'linear-gradient(135deg,#2b6cb0,#4299e1)' },
  { href: '/design2/news', label: 'News', sub: 'Stories and coverage', bg: 'linear-gradient(135deg,#553c9a,#7c5cbf)' },
  { href: '/design2/chat', label: 'Ask Chance', sub: 'Your civic AI guide', bg: 'linear-gradient(135deg,#c05621,#ed8936)' },
  { href: '/design2/events', label: 'Events', sub: "What's happening near you", bg: 'linear-gradient(135deg,#276749,#48bb78)' },
]

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...t } })

export default async function Design2Home() {
  const [stats, latestContent, pathwayCounts] = await Promise.all([
    getExchangeStats(),
    getLatestContent(8),
    getPathwayCounts(),
  ])

  const totalItems = (stats.resources || 0) + (stats.services || 0) + (stats.officials || 0) + (stats.policies || 0) + (stats.organizations || 0)

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 px-8" style={{ background: '#F7F2EA' }}>
        <div className="absolute top-[-120px] right-[-120px] opacity-[0.06]">
          <FlowerOfLifeIcon size={700} color="#C75B2A" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="font-serif text-[clamp(2.8rem,5.5vw,4.2rem)] leading-[1.05] tracking-tight mb-5" style={{ color: '#1a1a1a' }}>
              You care.<br />
              Now <span style={{ color: '#C75B2A' }}>find<br />your place.</span>
            </h1>
            <p className="text-lg leading-relaxed mb-6" style={{ color: '#6B6560' }}>
              Most people want to be part of something.<br />
              They just don&apos;t know where to start.<br />
              <strong style={{ color: '#1a1a1a' }}>That&apos;s not a motivation problem. It&apos;s a navigation problem.</strong>
            </p>
            <Link
              href="/design2/search"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-[15px] font-semibold border-2"
              style={{ borderColor: '#1a1a1a', background: 'white' }}
            >
              What are you looking for?
            </Link>
          </div>

          {/* Stats cluster */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard value={totalItems.toLocaleString()} label="resources" color="#C75B2A" />
            <StatCard value={String(stats.officials || 0)} label="officials tracked" color="#38a169" />
            <StatCard value={String(stats.policies || 0)} label="policies" color="#3182ce" />
            <StatCard value={String(stats.organizations || 0)} label="organizations" color="#805ad5" />
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS ── */}
      <section className="max-w-[1200px] mx-auto px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK_ACCESS.map(function (card) {
            const isAccent = card.accent
            return (
              <Link
                key={card.label}
                href={card.href}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{
                  background: isAccent ? '#F7F2EA' : card.bg,
                  border: isAccent ? '3px solid #C75B2A' : 'none',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.12]">
                  <FlowerOfLifeIcon size={200} color={isAccent ? '#C75B2A' : 'white'} />
                </div>
                <span className="relative z-10 font-serif text-lg font-bold" style={{ color: isAccent ? '#C75B2A' : 'white' }}>
                  {card.label}
                </span>
                <span className="relative z-10 text-[12px] font-medium text-center px-4" style={{ color: isAccent ? '#C75B2A' : 'rgba(255,255,255,0.85)', opacity: isAccent ? 0.7 : 1 }}>
                  {card.sub}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── LATEST CONTENT ── */}
      <section className="max-w-[1200px] mx-auto px-8 pb-10">
        <h2 className="font-serif text-2xl mb-6" style={{ color: '#1a1a1a' }}>Latest</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(latestContent || []).map(function (item: any) {
            const theme = THEME_LIST.find(function (t) { return t.id === item.pathway_primary })
            return (
              <Link
                key={item.id}
                href={'/design2/content/' + item.id}
                className="bg-white rounded-xl overflow-hidden border transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#D4CCBE' }}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-full h-[140px] object-cover" />
                ) : (
                  <div className="h-[6px] rounded-t-xl" style={{ background: theme?.color || '#C75B2A' }} />
                )}
                <div className="p-4">
                  {theme && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: theme.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>{theme.name}</span>
                    </div>
                  )}
                  <h3 className="font-serif text-[14px] font-semibold leading-snug line-clamp-2" style={{ color: '#1a1a1a' }}>
                    {item.title_6th_grade || item.title}
                  </h3>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-wider" style={{ color: '#7A756F' }}>
                    {item.resource_type}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── PATHWAYS ── */}
      <section className="max-w-[1200px] mx-auto px-8 pb-20">
        <h2 className="font-serif text-2xl mb-6" style={{ color: '#1a1a1a' }}>Pathways</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {THEME_LIST.map(function (t) {
            const count = pathwayCounts[t.id] || 0
            return (
              <Link
                key={t.id}
                href={'/design2/pathways/' + t.slug}
                className="bg-white rounded-xl border p-4 text-center transition-all hover:shadow-md hover:translate-y-[-2px]"
                style={{ borderColor: '#D4CCBE' }}
              >
                <div className="h-1.5 rounded-full mb-3 mx-auto w-12" style={{ background: t.color }} />
                <FlowerOfLifeIcon size={28} color={t.color} />
                <div className="font-serif text-[13px] font-semibold mt-2" style={{ color: '#1a1a1a' }}>{t.name}</div>
                <div className="text-[11px] font-medium mt-1" style={{ color: '#7A756F' }}>{count} items</div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border-2 p-5 text-center" style={{ borderColor: '#1a1a1a', background: '#F7F2EA', boxShadow: '3px 3px 0 #1a1a1a' }}>
      <div className="text-4xl font-bold" style={{ color, fontFamily: "'Caveat', cursive" }}>{value}</div>
      <div className="text-[14px] font-bold mt-1" style={{ color: '#4A4540' }}>{label}</div>
    </div>
  )
}
