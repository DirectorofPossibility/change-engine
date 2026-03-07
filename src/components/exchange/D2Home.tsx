import Link from 'next/link'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { FOLWatermark } from './FOLWatermark'
import { FeaturedPromo } from './FeaturedPromo'
import { GoodThingsWidget } from './GoodThingsWidget'
import { InfoBubble } from './InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'

const QUICK_ACCESS = [
  {
    label: 'Chart Your Course',
    sub: 'Choose your own adventure',
    href: '/compass',
    gradient: '',
    cta: true,
    fol: 'flower' as const,
    folImage: '/images/fol/flower-full.svg',
  },
  {
    label: 'Library',
    sub: 'Articles, guides, deep dives',
    href: '/library',
    gradient: 'linear-gradient(135deg,#2b6cb0 0%,#4299e1 100%)',
    fol: 'vesica' as const,
    folImage: '/images/fol/vesica-piscis.svg',
    folImage2: '/images/fol/seed-of-life.svg',
    lensColor: 'rgba(66,153,225,0.5)',
  },
  {
    label: 'News',
    sub: 'Stories and coverage',
    href: '/news',
    gradient: 'linear-gradient(135deg,#553c9a 0%,#7c5cbf 100%)',
    fol: 'metatron' as const,
    folImage: '/images/fol/metatrons-cube.svg',
    folImage2: '/images/fol/genesis.svg',
    lensColor: 'rgba(124,92,191,0.5)',
  },
  {
    label: 'Ask Chance',
    sub: 'Your civic AI guide',
    href: '/chat',
    gradient: 'linear-gradient(135deg,#c05621 0%,#ed8936 100%)',
    fol: 'seed' as const,
    folImage: '/images/fol/seed-of-life.svg',
    folImage2: '/images/fol/flower-full.svg',
    lensColor: 'rgba(237,137,54,0.5)',
  },
  {
    label: 'Events',
    sub: "What's happening near you",
    href: '/calendar',
    gradient: 'linear-gradient(135deg,#276749 0%,#48bb78 100%)',
    fol: 'tripod' as const,
    folImage: '/images/fol/tripod-of-life.svg',
    folImage2: '/images/fol/vesica-piscis.svg',
    lensColor: 'rgba(72,187,120,0.5)',
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
      <section className="relative overflow-hidden" style={{ background: '#FAF8F5' }}>
        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />

        {/* MASSIVE FOL — the signature element */}
        <img
          src="/images/fol/flower-full.svg"
          alt="" aria-hidden="true"
          className="absolute pointer-events-none z-0 animate-fol-pulse"
          style={{ width: '800px', height: '800px', top: '-120px', right: '-160px', opacity: 0.07 }}
        />
        {/* Secondary FOL layer — offset, counter-rotate */}
        <img
          src="/images/fol/seed-of-life.svg"
          alt="" aria-hidden="true"
          className="absolute pointer-events-none z-0"
          style={{ width: '400px', height: '400px', bottom: '-80px', left: '-80px', opacity: 0.04, animation: 'fol-pulse 8s ease-in-out infinite reverse' }}
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-20 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="font-serif text-[clamp(3rem,6vw,5rem)] leading-[1.0] tracking-tight mb-6 text-brand-text">
              You care.<br />
              Now{' '}
              <span className="text-brand-accent">find<br />your place.</span>
            </h1>
            <p className="text-xl leading-relaxed text-brand-muted mb-8 max-w-lg">
              Most people want to be part of something.
              They just don&apos;t know where to start.{' '}
              <strong className="text-brand-text">That&apos;s not a motivation problem. It&apos;s a navigation problem.</strong>
            </p>

            <div className="flex items-center gap-3 max-w-[520px] px-5 py-5 bg-white border-2 border-brand-text rounded-xl mb-6"
              style={{ boxShadow: '4px 4px 0 #D5D0C8' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              <span className="text-brand-muted">Enter your zip code or address</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/compass" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                Take the quiz
              </Link>
              <Link href="/search" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                Search
              </Link>
              <Link href="/calendar" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                What&apos;s happening
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-10">
              <Link href="/services" className="group">
                <span className="block text-[36px] font-black text-brand-accent leading-none group-hover:scale-105 transition-transform">{(stats.resources || 0).toLocaleString()}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">resources</span>
              </Link>
              <div className="w-px h-10 bg-brand-border" />
              <Link href="/organizations" className="group">
                <span className="block text-[36px] font-black text-brand-accent leading-none group-hover:scale-105 transition-transform">{(organizations || 0).toLocaleString()}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">organizations</span>
              </Link>
              <div className="w-px h-10 bg-brand-border" />
              <Link href="/officials" className="group">
                <span className="block text-[36px] font-black text-brand-accent leading-none group-hover:scale-105 transition-transform">{(stats.officials || 0).toLocaleString()}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">officials</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS GRID — 5 cards with unique FOL patterns ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-10 pb-6">
        <div className="relative inline-block mb-4">
          <InfoBubble id={TOOLTIPS.pathway_cards.id} text={TOOLTIPS.pathway_cards.text} position="bottom" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK_ACCESS.map(function (item, idx) {
            if (item.cta) {
              // "Chart Your Course" — Choose Your Own Adventure style
              return (
                <div key={item.label} className="relative col-span-2 md:col-span-1">
                  <InfoBubble id={TOOLTIPS.persona_cards.id} text={TOOLTIPS.persona_cards.text} position="bottom" />
                  <Link
                    href={item.href}
                    className="relative aspect-square rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all duration-300 hover:-translate-y-1 group border-3"
                  style={{
                    background: 'linear-gradient(145deg, #F0ECE6 0%, #E8E2D8 50%, #F0ECE6 100%)',
                    border: '3px solid #C75B2A',
                    boxShadow: '4px 4px 0 #C75B2A40',
                  }}
                >
                  {/* Pulsing FOL background */}
                  <img
                    src="/images/fol/flower-full.svg"
                    alt="" aria-hidden="true"
                    className="absolute top-1/2 left-1/2 w-[200px] h-[200px] pointer-events-none animate-fol-pulse-cta group-hover:opacity-[0.35] group-hover:scale-[1.15] group-hover:rotate-[30deg] transition-all duration-700"
                    style={{ opacity: 0.08 }}
                  />
                  {/* Second layer — counter-rotating seed */}
                  <img
                    src="/images/fol/genesis.svg"
                    alt="" aria-hidden="true"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] group-hover:scale-[0.9] group-hover:rotate-[-15deg] transition-all duration-500"
                    style={{ animation: 'fol-pulse 5s ease-in-out infinite reverse' }}
                  />

                  {/* Lens flare accents */}
                  <div className="absolute top-[20%] left-[15%] w-3 h-3 rounded-full pointer-events-none animate-lens-drift" style={{ background: 'radial-gradient(circle, rgba(199,91,42,0.7) 0%, transparent 70%)' }} />
                  <div className="absolute top-[60%] right-[20%] w-2 h-2 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)', animation: 'lens-drift 8s ease-in-out 2s infinite' }} />
                  <div className="absolute top-[35%] right-[30%] w-4 h-4 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(128,90,213,0.4) 0%, transparent 70%)', animation: 'lens-drift 7s ease-in-out 1s infinite' }} />

                  {/* Geometric grid lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#C75B2A" strokeWidth="0.3" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#C75B2A" strokeWidth="0.3" />
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#C75B2A" strokeWidth="0.2" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#C75B2A" strokeWidth="0.2" />
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#C75B2A" strokeWidth="0.2" />
                    <circle cx="50" cy="50" r="20" fill="none" stroke="#C75B2A" strokeWidth="0.15" />
                  </svg>

                  {/* Adventure book corner fold */}
                  <div className="absolute top-0 right-0 w-10 h-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-14 h-14 bg-brand-accent/20 transform rotate-45 translate-x-4 -translate-y-4" />
                  </div>

                  {/* Page number */}
                  <span className="absolute top-2.5 left-3 font-mono text-[9px] font-bold text-brand-muted-light/40 tracking-widest">PAGE 1</span>

                  <span className="relative z-[2] font-hand text-[22px] font-bold text-brand-text text-center leading-tight group-hover:scale-105 transition-transform">
                    Chart Your<br />Course
                  </span>
                  <span className="relative z-[2] text-[11px] text-brand-muted mt-1.5 text-center px-3 group-hover:text-brand-text transition-colors">
                    Choose your own adventure
                  </span>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-brand-accent/30 flex items-center justify-center group-hover:bg-brand-accent/60 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                  </Link>
                </div>
              )
            }

            const delay = idx * 0.8
            return (
              <Link
                key={item.label}
                href={item.href}
                className="relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
                style={{ background: item.gradient }}
              >
                {/* Primary FOL — pulsing */}
                <img
                  src={item.folImage}
                  alt="" aria-hidden="true"
                  className="absolute top-1/2 left-1/2 w-[160px] h-[160px] pointer-events-none animate-fol-pulse group-hover:opacity-[0.28] group-hover:scale-[1.12] group-hover:rotate-[15deg] transition-all duration-500"
                  style={{ filter: 'brightness(10)', animationDelay: delay + 's' }}
                />
                {/* Secondary geometry — smaller, offset, counter-pulse */}
                <img
                  src={(item as any).folImage2 || item.folImage}
                  alt="" aria-hidden="true"
                  className="absolute pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                  style={{
                    filter: 'brightness(10)',
                    width: '80px', height: '80px',
                    top: '8px', right: '8px',
                    animation: 'fol-pulse 5s ease-in-out ' + (delay + 1) + 's infinite reverse',
                  }}
                />

                {/* Geometric grid overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] group-hover:opacity-[0.09] transition-opacity duration-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.2" />
                  <circle cx="50" cy="50" r="22" fill="none" stroke="white" strokeWidth="0.15" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.15" />
                  <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="0.15" />
                </svg>

                {/* Lens flare dots */}
                <div
                  className="absolute w-3 h-3 rounded-full pointer-events-none animate-lens-drift"
                  style={{ top: '25%', left: '20%', background: 'radial-gradient(circle, ' + ((item as any).lensColor || 'rgba(255,255,255,0.4)') + ' 0%, transparent 70%)', animationDelay: delay + 's' }}
                />
                <div
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{ bottom: '30%', right: '18%', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)', animation: 'lens-drift 7s ease-in-out ' + (delay + 2) + 's infinite' }}
                />

                <span className="relative z-[2] font-serif text-lg font-normal text-center text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                  {item.label}
                </span>
                <span className="relative z-[2] text-[11px] text-center px-4 leading-snug text-white/70">
                  {item.sub}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── FEATURED PROMO ── */}
      <div className="max-w-[1200px] mx-auto px-8">
        <FeaturedPromo variant="banner" />
      </div>

      {/* ── GOOD THINGS ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-4">
        <GoodThingsWidget variant="inline" />
      </div>

      {/* ── GAP STATS ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-4 pb-10">
        <div className="relative inline-block mb-3">
          <InfoBubble id={TOOLTIPS.stats_bar.id} text={TOOLTIPS.stats_bar.text} position="bottom" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {GAP_STATS.map(function (stat, i) {
            const folImages = ['/images/fol/genesis.svg', '/images/fol/vesica-piscis.svg', '/images/fol/tripod-of-life.svg']
            return (
              <div
                key={stat.label}
                className="relative overflow-hidden border-2 border-brand-text rounded-xl p-5 text-center"
                style={{ background: '#F8F9FC', boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <img
                  src={folImages[i]}
                  alt="" aria-hidden="true"
                  className="absolute right-[-20px] top-[-20px] w-[80px] h-[80px] pointer-events-none opacity-[0.06]"
                />
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
