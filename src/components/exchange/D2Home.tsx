import Link from 'next/link'
import { FeaturedPromo } from './FeaturedPromo'
import { GoodThingsWidget } from './GoodThingsWidget'
import { InfoBubble } from './InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'
import { HeroZipInput } from './HeroZipInput'
import { HeroSearchInput } from './HeroSearchInput'
import { CENTERS, CENTER_COLORS } from '@/lib/constants'
import Image from 'next/image'

const QUICK_ACCESS = [
  {
    label: 'Chart Your Course',
    sub: 'Choose your own adventure',
    href: '/compass',
    image: '/images/editorial/community-meeting.jpg',
    color: '#C75B2A',
    cta: true,
  },
  {
    label: 'Library',
    sub: 'Read. Learn. Go deeper.',
    href: '/library',
    image: '/images/editorial/person-reading.jpg',
    color: '#2b6cb0',
  },
  {
    label: 'News',
    sub: 'What\'s happening in Houston.',
    href: '/news',
    image: '/images/editorial/town-hall.jpg',
    color: '#553c9a',
  },
  {
    label: 'Ask Chance',
    sub: 'Your civic AI guide',
    href: '/chat',
    image: '/images/editorial/two-people-talking.jpg',
    color: '#c05621',
  },
  {
    label: 'Events',
    sub: "What's happening near you",
    href: '/calendar',
    image: '/images/editorial/volunteers.jpg',
    color: '#276749',
  },
]

const GAP_STATS = [
  { pct: '90%', label: 'feel responsible to help their community', source: 'Citizens & Scholars 2024', color: '#C75B2A' },
  { pct: '37%', label: "don't know where to start", source: 'Citizens & Scholars 2024', color: '#c43c4c' },
  { pct: '28%', label: 'actually volunteer', source: 'AmeriCorps 2024', color: '#38a169' },
]

const CENTERS_DATA = Object.fromEntries(
  Object.entries(CENTERS).map(function ([key, c]) {
    return [key, { ...c, color: CENTER_COLORS[key] || '#6B6560' }]
  })
)

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
        <Image
          src="/images/fol/flower-full.svg"
          alt="" aria-hidden="true"
          className="absolute pointer-events-none z-0 animate-fol-pulse"
          style={{ width: '800px', height: '800px', top: '-120px', right: '-160px', opacity: 0.07 }}
         width={800} height={800} />
        {/* Secondary FOL layer — offset, counter-rotate */}
        <Image
          src="/images/fol/seed-of-life.svg"
          alt="" aria-hidden="true"
          className="absolute pointer-events-none z-0"
          style={{ width: '400px', height: '400px', bottom: '-80px', left: '-80px', opacity: 0.04, animation: 'fol-pulse 8s ease-in-out infinite reverse' }}
         width={400} height={400} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-12 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-10">
            {/* Left — text */}
            <div className="flex-1 min-w-0 max-w-xl">
              <p className="text-sm text-brand-muted mb-2 max-w-lg">
                Most people never show up. Not because they don&apos;t care. Because nobody showed them the way in.
              </p>
              <h1 className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[1.05] tracking-tight mb-4 text-brand-text">
                This is the{' '}
                <span className="text-brand-accent">way in.</span>
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted mb-6 max-w-lg">
                Houston has everything — the organizations, the officials, the resources, the people doing the work.{' '}
                <strong className="text-brand-text">Where do you want to jump in?</strong>
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mb-5">
                <HeroZipInput />
                <HeroSearchInput />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/compass" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                  Find my way in
                </Link>
                <Link href="/neighborhoods" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                  In my neighborhood
                </Link>
                <Link href="/calendar" className="px-5 py-2.5 rounded-lg border-2 border-brand-text bg-white text-sm font-bold hover:bg-brand-text hover:text-white transition-all" style={{ boxShadow: '2px 2px 0 #D5D0C8' }}>
                  What&apos;s happening now
                </Link>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-8">
                <div>
                  <span className="block text-[32px] font-black leading-none" style={{ color: '#C75B2A' }}>90%</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">feel responsible to help</span>
                </div>
                <div className="w-px h-8 bg-brand-border" />
                <div>
                  <span className="block text-[32px] font-black leading-none" style={{ color: '#c43c4c' }}>37%</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">don&apos;t know where to start</span>
                </div>
                <div className="w-px h-8 bg-brand-border" />
                <div>
                  <span className="block text-[32px] font-black leading-none" style={{ color: '#38a169' }}>28%</span>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted">actually volunteer</span>
                </div>
              </div>
            </div>

            {/* Right — image collage (photos on a table) */}
            <div className="hidden lg:block flex-1 min-w-0 max-w-[480px]">
              <div className="relative h-[400px]">
                {/* 1 — back of the pile, peeking top-right */}
                <div className="absolute rounded-xl overflow-hidden border-2 border-brand-border"
                  style={{ width: '280px', height: '200px', top: '0', right: '0', transform: 'rotate(3deg)', boxShadow: '4px 4px 0 #D5D0C8', zIndex: 1 }}>
                  <Image src="/images/editorial/organizing.jpg" alt="Community organizing" className="w-full h-full object-cover"  width={800} height={400} />
                </div>
                {/* 2 — peeking bottom-right */}
                <div className="absolute rounded-xl overflow-hidden border-2 border-brand-border"
                  style={{ width: '240px', height: '170px', bottom: '0', right: '20px', transform: 'rotate(-2deg)', boxShadow: '3px 4px 0 #D5D0C8', zIndex: 2 }}>
                  <Image src="/images/editorial/cleanup.jpg" alt="Community cleanup" className="w-full h-full object-cover"  width={800} height={400} />
                </div>
                {/* 3 — large, anchors the pile center-left */}
                <div className="absolute rounded-xl overflow-hidden border-2 border-brand-border"
                  style={{ width: '300px', height: '220px', top: '20px', left: '0', transform: 'rotate(-1.5deg)', boxShadow: '4px 4px 0 #D5D0C8', zIndex: 3 }}>
                  <Image src="/images/editorial/community-meeting.jpg" alt="Community meeting" className="w-full h-full object-cover"  width={800} height={400} />
                </div>
                {/* 4 — overlaps center, tilted right */}
                <div className="absolute rounded-xl overflow-hidden border-2 border-brand-border"
                  style={{ width: '260px', height: '190px', top: '80px', right: '10px', transform: 'rotate(2deg)', boxShadow: '3px 5px 0 #D5D0C8', zIndex: 4 }}>
                  <Image src="/images/editorial/volunteers.jpg" alt="Volunteers" className="w-full h-full object-cover"  width={800} height={400} />
                </div>
                {/* 5 — top of the pile, bottom-left */}
                <div className="absolute rounded-xl overflow-hidden border-2 border-brand-border"
                  style={{ width: '250px', height: '180px', bottom: '0', left: '10px', transform: 'rotate(1.5deg)', boxShadow: '3px 4px 0 #D5D0C8', zIndex: 5 }}>
                  <Image src="/images/editorial/neighbors-talking.jpg" alt="Neighbors talking" className="w-full h-full object-cover"  width={800} height={400} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK ACCESS GRID — 5 image-backed cards ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-3 pb-4">
        <div className="relative inline-block mb-4">
          <InfoBubble id={TOOLTIPS.pathway_cards.id} text={TOOLTIPS.pathway_cards.text} position="bottom" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {QUICK_ACCESS.map(function (item) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={'relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 group border-2' + (item.cta ? ' col-span-2 md:col-span-1' : '')}
                style={{ aspectRatio: '1', borderColor: item.color + '40', boxShadow: '3px 3px 0 ' + item.color + '25' }}
              >
                {item.cta && (
                  <div className="relative inline-block" style={{ position: 'absolute', top: 4, left: 4, zIndex: 5 }}>
                    <InfoBubble id={TOOLTIPS.persona_cards.id} text={TOOLTIPS.persona_cards.text} position="bottom" />
                  </div>
                )}
                {/* Background image */}
                <Image
                  src={item.image}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                 width={800} height={400} />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, ' + item.color + ' 0%, ' + item.color + '99 35%, transparent 70%)' }} />
                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-[2]">
                  <span className="block font-serif text-lg font-bold text-white leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-white/80 mt-0.5 leading-snug">
                    {item.sub}
                  </span>
                </div>
                {/* Arrow */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-[2]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── 4 WAYS TO ENGAGE ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-8 pb-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-4">4 ways to jump in</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(CENTERS_DATA).map(function ([key, c]) {
            return (
              <Link
                key={key}
                href={'/centers/' + c.slug}
                className="relative border-2 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 group"
                style={{ borderColor: c.color + '50', boxShadow: '3px 3px 0 ' + c.color + '20' }}
              >
                {/* Color header with icon */}
                <div className="relative h-20 flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, ' + c.color + ' 0%, ' + c.color + 'dd 100%)' }}>
                  <Image
                    src={'/images/centers/' + key.toLowerCase() + '.svg'}
                    alt="" aria-hidden="true"
                    className="absolute w-[100px] h-[100px] opacity-[0.15] pointer-events-none"
                   width={200} height={200} />
                  <span className="relative z-[1] font-serif text-xl font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{key}</span>
                </div>
                {/* Body */}
                <div className="p-4 bg-white">
                  <p className="text-sm text-brand-text font-medium leading-snug">{c.question}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold transition-colors" style={{ color: c.color }}>
                    Explore
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── FEATURED PROMO ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-6 pb-2">
        <FeaturedPromo variant="banner" />
      </div>

      {/* ── THREE GOOD THINGS ── */}
      <div className="max-w-[1200px] mx-auto px-8 pt-2 pb-4">
        <GoodThingsWidget variant="banner" />
      </div>

    </div>
  )
}
