import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { FOLWatermark } from './FOLWatermark'

const QUICK_ACCESS = [
  {
    label: 'Chart Your Course',
    sub: 'Find where you fit in',
    href: '/compass',
    gradient: '',
    cta: true,
  },
  {
    label: 'Library',
    sub: 'Articles, guides, deep dives',
    href: '/library',
    gradient: 'linear-gradient(135deg,#2b6cb0 0%,#4299e1 100%)',
  },
  {
    label: 'News',
    sub: 'Stories and coverage',
    href: '/news',
    gradient: 'linear-gradient(135deg,#553c9a 0%,#7c5cbf 100%)',
  },
  {
    label: 'Ask Chance',
    sub: 'Your civic AI guide',
    href: '/chat',
    gradient: 'linear-gradient(135deg,#c05621 0%,#ed8936 100%)',
  },
  {
    label: 'Events',
    sub: "What's happening near you",
    href: '/calendar',
    gradient: 'linear-gradient(135deg,#276749 0%,#48bb78 100%)',
  },
]

const GAP_STATS = [
  { pct: '90%', label: 'feel responsible to help their community', source: 'Citizens & Scholars 2024', color: '#C75B2A' },
  { pct: '37%', label: "don't know where to start", source: 'Citizens & Scholars 2024', color: '#c43c4c' },
  { pct: '28%', label: 'actually volunteer', source: 'AmeriCorps 2024', color: '#38a169' },
]

interface D2HomeProps {
  stats: { resources: number; officials: number; policies: number; focusAreas: number }
  pathwayCounts: Record<string, number>
  newThisWeek: number
  latestContent: Array<Record<string, unknown>>
  centerCounts: Record<string, number>
  organizations: number
  quote?: { quote_text: string; attribution?: string } | null
}

export function D2Home({ stats, organizations }: D2HomeProps) {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: '#F8F9FC' }}>
        {/* Dot pattern + radial gradients */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'radial-gradient(circle, rgba(44,44,44,0.04) 1px, transparent 1px)',
            'radial-gradient(circle at 85% 15%, rgba(199,91,42,0.06) 0%, transparent 40%)',
            'radial-gradient(circle at 10% 85%, rgba(128,90,213,0.04) 0%, transparent 40%)',
          ].join(', '),
          backgroundSize: '20px 20px, 100% 100%, 100% 100%',
        }} />

        {/* FOL watermark top-right */}
        <div className="absolute -top-[120px] -right-[120px] z-0">
          <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
        </div>

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 items-center">
          {/* Left: text */}
          <div>
            <h1 className="font-serif text-[clamp(2.8rem,5.5vw,4.2rem)] leading-[1.05] tracking-tight mb-5 text-brand-text">
              You care.<br />
              Now{' '}
              <span className="text-brand-accent">
                <span className="font-hand text-[1.15em] font-bold">find</span>
                <br />your place.
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-brand-muted mb-6 max-w-xl">
              Most people want to be part of something.
              They just don&apos;t know where to start.{' '}
              <strong className="text-brand-text">That&apos;s not a motivation problem. It&apos;s a navigation problem.</strong>
            </p>

            {/* Search */}
            <Link
              href="/search"
              className="flex items-center gap-3 max-w-[480px] px-4 py-4 bg-white border-2 border-brand-text rounded-xl mb-4"
              style={{ boxShadow: '3px 3px 0 #2d2d2d' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <span className="text-sm text-brand-muted-light">What are you looking for?</span>
              <span className="ml-auto px-3 py-1.5 bg-brand-text text-white font-mono text-[11px] font-bold uppercase rounded-lg">Go</span>
            </Link>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <Link href="/compass" className="px-3 py-1.5 rounded-lg border-[1.5px] border-brand-border bg-white hover:border-brand-accent hover:text-brand-accent transition-colors">
                Take the quiz
              </Link>
              <Link href="/search?q=near+me" className="px-3 py-1.5 rounded-lg border-[1.5px] border-brand-border bg-white hover:border-brand-accent hover:text-brand-accent transition-colors">
                Near me
              </Link>
              <Link href="/calendar" className="px-3 py-1.5 rounded-lg border-[1.5px] border-brand-border bg-white hover:border-brand-accent hover:text-brand-accent transition-colors">
                What&apos;s happening
              </Link>
            </div>
          </div>

          {/* Right: Photo collage */}
          <div className="relative h-[400px] hidden lg:block">
            {/* Background FOL */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
              <FOLWatermark variant="flower" size="lg" color="#C75B2A" />
            </div>

            {/* Photo frames */}
            <div
              className="absolute w-[280px] h-[200px] rounded-[10px] border-[3px] border-white overflow-hidden z-[2]"
              style={{ top: 0, left: 30, transform: 'rotate(-3deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
            >
              <img
                src="https://xesojwzcnjqtpuossmuv.supabase.co/storage/v1/object/public/Images/editorial/community-meeting.jpg"
                alt="Community meeting in Houston"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute w-[190px] h-[140px] rounded-[10px] border-[3px] border-white overflow-hidden z-[1]"
              style={{ top: 140, left: -10, transform: 'rotate(4deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
            >
              <img
                src="https://xesojwzcnjqtpuossmuv.supabase.co/storage/v1/object/public/Images/editorial/volunteers.jpg"
                alt="Volunteers working together"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="absolute w-[250px] h-[180px] rounded-[10px] border-[3px] border-white overflow-hidden z-[3]"
              style={{ top: 180, right: 0, transform: 'rotate(-1.5deg)', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
            >
              <img
                src="https://xesojwzcnjqtpuossmuv.supabase.co/storage/v1/object/public/Images/editorial/town-hall.jpg"
                alt="Town hall civic engagement"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tape decorations */}
            <div
              className="absolute w-[60px] h-[20px] rounded-sm z-[6]"
              style={{ top: 5, left: 140, transform: 'rotate(-3deg)', background: 'rgba(199,91,42,0.15)' }}
            />
            <div
              className="absolute w-[60px] h-[20px] rounded-sm z-[6]"
              style={{ bottom: 170, right: 80, transform: 'rotate(6deg)', background: 'rgba(199,91,42,0.15)' }}
            />

            {/* Sticker */}
            <div
              className="absolute z-[6] font-hand text-sm font-bold text-white px-3 py-1.5 rounded-full"
              style={{ top: 30, right: 10, transform: 'rotate(8deg)', background: '#C75B2A', boxShadow: '2px 2px 0 rgba(0,0,0,0.15)' }}
            >
              New
            </div>

            {/* Floating stat badges */}
            <div
              className="absolute z-[5] bg-white border-2 border-brand-text rounded-[10px] px-3.5 py-2 font-mono text-[10px]"
              style={{ bottom: 20, left: 0, boxShadow: '3px 3px 0 #2d2d2d' }}
            >
              <span className="block text-[28px] font-black text-brand-accent leading-none">
                {(stats.resources || 0).toLocaleString()}
              </span>
              resources
            </div>
            <div
              className="absolute z-[5] bg-white border-2 border-brand-text rounded-[10px] px-3.5 py-2 font-mono text-[10px]"
              style={{ top: 60, right: -20, boxShadow: '3px 3px 0 #2d2d2d' }}
            >
              <span className="block text-[28px] font-black text-brand-accent leading-none">
                {(organizations || 0).toLocaleString()}
              </span>
              organizations
            </div>

            {/* Floating FOL decoration */}
            <div className="absolute -bottom-[30px] right-[60px] opacity-[0.04]" style={{ animation: 'spin 60s linear infinite' }}>
              <FOLWatermark variant="flower" size="sm" color="#C75B2A" />
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS GRID — 5 cards ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK_ACCESS.map(function (item) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                style={
                  item.cta
                    ? { background: '#F8F9FC', border: '3px solid #C75B2A' }
                    : { background: item.gradient }
                }
              >
                {/* FOL pattern background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.12] group-hover:opacity-[0.2] group-hover:scale-[1.08] group-hover:rotate-[15deg] transition-all duration-500">
                  <FOLWatermark
                    variant="flower"
                    size="md"
                    color={item.cta ? '#C75B2A' : '#ffffff'}
                  />
                </div>
                <span
                  className="relative z-[2] font-serif text-lg font-normal text-center"
                  style={item.cta ? { fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, color: '#C75B2A' } : { color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                >
                  {item.label}
                </span>
                <span
                  className="relative z-[2] text-[11px] text-center px-4 leading-snug"
                  style={item.cta ? { color: '#C75B2A', opacity: 0.6 } : { color: 'rgba(255,255,255,0.7)' }}
                >
                  {item.sub}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── GAP STATS ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-4 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {GAP_STATS.map(function (stat) {
            return (
              <div
                key={stat.label}
                className="relative overflow-hidden border-2 border-brand-text rounded-xl p-5 text-center"
                style={{ background: '#F8F9FC', boxShadow: '3px 3px 0 #2d2d2d' }}
              >
                <span className="block font-hand text-[52px] font-bold leading-none mb-1.5" style={{ color: stat.color }}>
                  {stat.pct}
                </span>
                <span className="block text-[15px] font-semibold text-brand-muted">
                  {stat.label}
                </span>
                <span className="block mt-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-brand-muted-light">
                  {stat.source}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
