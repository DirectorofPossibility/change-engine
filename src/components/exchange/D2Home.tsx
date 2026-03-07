import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'
import { FOLWatermark } from './FOLWatermark'
import { D2StatCard } from './D2StatCard'
import { QuoteCard } from './QuoteCard'

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) { return { id, ...(t as any) } })

const SEARCH_SUGGESTIONS = [
  { label: 'food assistance', q: 'food+assistance' },
  { label: 'voter registration', q: 'voter+registration' },
  { label: 'mental health', q: 'mental+health' },
  { label: 'job training', q: 'job+training' },
  { label: 'childcare', q: 'childcare' },
]

const QUICK_ACCESS = [
  { label: 'Services', href: '/services', color: '#C75B2A', folVariant: 'seed' as const },
  { label: 'Officials', href: '/officials', color: '#805ad5', folVariant: 'metatron' as const },
  { label: 'Library', href: '/library', color: '#3182ce', folVariant: 'vesica' as const },
  { label: 'News', href: '/news', color: '#38a169', folVariant: 'tripod' as const },
  { label: 'Events', href: '/calendar', color: '#319795', folVariant: 'borromean' as const },
]

interface D2HomeProps {
  stats: { resources: number; officials: number; policies: number; focusAreas: number }
  pathwayCounts: Record<string, number>
  newThisWeek: number
  latestContent: Array<{
    id: string
    title_6th_grade?: string | null
    title?: string | null
    summary_6th_grade?: string | null
    image_url?: string | null
    source_org_name?: string | null
    published_at?: string | null
  }>
  centerCounts: Record<string, number>
  organizations: number
  quote?: { quote_text: string; attribution?: string } | null
}

export function D2Home({ stats, pathwayCounts, newThisWeek, latestContent, organizations, quote }: D2HomeProps) {
  const featured = latestContent?.[0]
  const sideItems = latestContent?.slice(1, 4) || []

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-brand-cream">
        {/* Decorative gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'radial-gradient(circle at 20% 30%, rgba(199,91,42,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 70%, rgba(128,90,213,0.02) 0%, transparent 50%)',
          ].join(', '),
        }} />

        {/* FOL watermark */}
        <div className="absolute top-8 right-12 z-0">
          <FOLWatermark variant="flower" size="lg" color="#C75B2A" animate />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 items-center">
          {/* Left: text */}
          <div>
            <h1 className="font-serif text-[clamp(2.8rem,5.5vw,4.2rem)] leading-[1.05] tracking-tight mb-5 text-brand-text">
              Community life,{' '}
              <span className="font-hand text-[1.15em] font-bold text-brand-accent">organized.</span>
            </h1>
            <p className="text-lg leading-relaxed text-brand-muted mb-6 max-w-xl">
              Most people want to be part of something. They just don&apos;t know where to start.{' '}
              <strong className="text-brand-text">That&apos;s not a motivation problem. It&apos;s a navigation problem.</strong>
            </p>

            {/* Search */}
            <Link
              href="/search"
              className="flex items-center gap-3 max-w-[520px] px-4 py-4 bg-white border-2 border-brand-text rounded-xl mb-4"
              style={{ boxShadow: '3px 3px 0 #2d2d2d' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <span className="text-sm text-brand-muted-light">Search resources, services, officials...</span>
              <span className="ml-auto px-3 py-1.5 bg-brand-text text-white font-mono text-[11px] font-bold uppercase rounded-lg">Go</span>
            </Link>

            {/* Suggestions */}
            <p className="text-[12px] text-brand-muted-light">
              Try:{' '}
              {SEARCH_SUGGESTIONS.map(function (s, i) {
                return (
                  <span key={s.label}>
                    {i > 0 && <span className="mx-1.5 text-brand-border">/</span>}
                    <Link href={'/search?q=' + s.q} className="hover:text-brand-accent transition-colors">{s.label}</Link>
                  </span>
                )
              })}
            </p>
          </div>

          {/* Right: quick access grid */}
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACCESS.map(function (item) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="card-chunky relative flex flex-col items-center justify-center aspect-square text-center group"
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] group-hover:opacity-[0.15] transition-opacity">
                    <FOLWatermark variant={item.folVariant} size="md" color={item.color} />
                  </div>
                  <span className="relative font-serif text-lg font-normal text-brand-text">{item.label}</span>
                </Link>
              )
            })}
            {/* CTA card */}
            <Link
              href="/help"
              className="col-span-2 card-chunky flex items-center justify-center py-4 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white transition-colors group"
            >
              <FlowerOfLifeIcon size={20} color="currentColor" className="mr-2" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">Get Help Now</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <D2StatCard value={stats.resources.toLocaleString()} label="Resources & Services" />
          <D2StatCard value={stats.officials.toLocaleString()} label="Elected Officials" color="#805ad5" />
          <D2StatCard value={organizations.toLocaleString()} label="Organizations" color="#38a169" />
          <D2StatCard value={newThisWeek.toLocaleString()} label="New This Week" color="#3182ce" />
        </div>
      </div>

      {/* ── PATHWAYS ── */}
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <p className="meta-label mb-4">7 Pathways</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {THEME_LIST.map(function (pw) {
            const count = pathwayCounts[pw.id] || 0
            return (
              <Link
                key={pw.id}
                href={'/pathways/' + pw.slug}
                className="card-chunky text-center py-4 group"
              >
                <div className="w-3 h-3 rounded-sm mx-auto mb-2" style={{ background: pw.color }} />
                <span className="block font-serif text-sm text-brand-text">{pw.name}</span>
                <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mt-1">
                  {count} items
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── ARCHETYPES ── */}
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <p className="meta-label mb-1">Chart Your Course</p>
        <p className="text-sm text-brand-muted mb-4">How do you want to explore Houston&apos;s civic landscape?</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ARCHETYPES.map(function (a) {
            return (
              <div key={a.id} className="card-chunky flex items-start gap-3 cursor-pointer">
                <a.Icon size={28} />
                <div>
                  <p className="font-hand text-xl font-bold text-brand-text">{a.name.replace('The ', '')}</p>
                  <p className="text-[12px] text-brand-muted leading-relaxed">{a.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── WHAT'S NEW ── */}
      {featured && (
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          <p className="meta-label mb-4">What&apos;s New</p>
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
            {/* Featured */}
            <Link href={'/content/' + featured.id} className="card-chunky p-0 overflow-hidden group">
              {featured.image_url && (
                <div className="h-48 overflow-hidden">
                  <img src={featured.image_url} alt={featured.title_6th_grade || featured.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-serif text-xl text-brand-text leading-snug mb-2">
                  {featured.title_6th_grade || featured.title}
                </h3>
                {featured.summary_6th_grade && (
                  <p className="text-sm text-brand-muted leading-relaxed line-clamp-2">{featured.summary_6th_grade}</p>
                )}
                {featured.source_org_name && <p className="meta-source mt-2">{featured.source_org_name}</p>}
              </div>
            </Link>

            {/* Side items */}
            <div className="space-y-3">
              {sideItems.map(function (item) {
                return (
                  <Link key={item.id} href={'/content/' + item.id} className="card-chunky flex gap-3 group">
                    {item.image_url && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image_url} alt={item.title_6th_grade || item.title || ''} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-sans text-sm font-bold text-brand-text leading-snug line-clamp-2">
                        {item.title_6th_grade || item.title}
                      </h4>
                      {item.source_org_name && <p className="meta-source mt-1">{item.source_org_name}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── QUOTE ── */}
      {quote && (
        <div className="max-w-[1200px] mx-auto px-8 py-4">
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
        </div>
      )}
    </div>
  )
}
