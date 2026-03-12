'use client'

/**
 * @fileoverview Editorial landing page for the Community Exchange MVP.
 *
 * Magazine-style layout with FOL as the visual DNA — backgrounds, bullets,
 * dividers, glassmorphic cards, depth layers. Features:
 *  - Full-width hero with Compass on right, editorial copy on left
 *  - "What's Here For You" — glassmorphic cards for each MVP resource
 *  - "The Pulse" — latest news in magazine grid
 *  - "Your Representatives" — officials strip
 *  - "Good Things Happening" — community widget
 *  - FOL depth layers throughout for visual richness
 */

import Link from 'next/link'
import Image from 'next/image'
import { HeroZipInput } from './HeroZipInput'
import { HeroSearchInput } from './HeroSearchInput'
import { GradientFOL } from './GradientFOL'
import { FOLDepthLayer, FOLSectionDivider, FOLGlassCard, FOLStat, FOLButton, FOLBullet } from './FOLElements'
import { FeaturedPromo } from './FeaturedPromo'
import { GoodThingsWidget } from './GoodThingsWidget'
import { MapPin, BookOpen, Users, Building2, Heart, Vote, Newspaper, Search, ArrowRight, Shield, Scale } from 'lucide-react'

// ── MVP Resource Cards ────────────────────────────────────────────

interface EditorialHomeProps {
  stats: { resources: number; officials: number; policies: number; focusAreas: number; services?: number; opportunities?: number; elections?: number }
  organizations: number
  latestContent: Array<Record<string, unknown>>
}

function getMvpSections(stats: EditorialHomeProps['stats'], organizations: number) {
  return [
    {
      title: 'Services & Resources',
      description: `Food banks, legal aid, shelters, health clinics — ${stats.services || 0} services mapped and searchable.`,
      href: '/services',
      icon: Heart,
      color: '#1b5e8a',
      stat: String(stats.services || 0),
      statLabel: 'services',
      image: '/images/editorial/health-worker.jpg',
    },
    {
      title: 'Organizations',
      description: `${organizations} nonprofits, foundations, and community groups. Every one is a doorway.`,
      href: '/organizations',
      icon: Building2,
      color: '#1a6b56',
      stat: String(organizations),
      statLabel: 'organizations',
      image: '/images/editorial/community-meeting.jpg',
    },
    {
      title: 'Elected Officials',
      description: 'City council to Congress. Who represents you, how to reach them, what they\'re working on.',
      href: '/officials',
      icon: Shield,
      color: '#4a2870',
      stat: String(stats.officials),
      statLabel: 'officials',
      image: '/images/editorial/civic-building.jpg',
    },
    {
      title: 'Elections & Voting',
      description: 'Upcoming elections, polling places, ballot items, candidates — your voice matters.',
      href: '/elections',
      icon: Vote,
      color: '#7a2018',
      stat: String(stats.elections || 8),
      statLabel: 'elections tracked',
      image: '/images/editorial/polling-place.jpg',
    },
    {
      title: 'News & Library',
      description: `${stats.resources} articles covering policy, community, health, education — all written for real people.`,
      href: '/news',
      icon: Newspaper,
      color: '#1b5e8a',
      stat: String(stats.resources),
      statLabel: 'articles',
      image: '/images/editorial/person-reading.jpg',
    },
    {
      title: 'Opportunities',
      description: `Volunteer, intern, get involved. ${stats.opportunities || 0} ways to turn caring into action right now.`,
      href: '/opportunities',
      icon: Users,
      color: '#4a2870',
      stat: String(stats.opportunities || 0),
      statLabel: 'opportunities',
      image: '/images/editorial/volunteers.jpg',
    },
  ]
}

export function EditorialHome({ stats, organizations, latestContent }: EditorialHomeProps) {
  const totalResources = stats.resources + stats.officials + (stats.policies || 0) + organizations
  const MVP_SECTIONS = getMvpSections(stats, organizations)

  return (
    <div className="relative">
      {/* ══════════════════════════════════════════════════════════════
          HERO — Full-width, editorial left / compass right
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF8F5 0%, #EDE8E0 50%, #FAF8F5 100%)' }}>
        {/* Noise texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />

        {/* FOL depth layers */}
        <FOLDepthLayer position="top-right" size={700} opacity={0.07} />
        <FOLDepthLayer position="bottom-left" size={500} opacity={0.04} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 sm:px-8 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left — editorial content */}
            <div className="flex-1 min-w-0 max-w-xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-3">
                Community Guide — Houston, Texas
              </p>
              <h1 className="font-display text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05] tracking-tight mb-5 text-brand-text">
                This is the{' '}
                <span className="relative inline-block">
                  <span className="text-brand-accent">way in.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" preserveAspectRatio="none">
                    <path d="M0 5c50-4 150-4 200 0" stroke="#1b5e8a" strokeWidth="2" opacity="0.4" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted mb-3 max-w-lg">
                Houston has everything — the organizations, the officials, the resources, the people doing the work.
              </p>
              <p className="text-lg leading-relaxed text-brand-text font-medium mb-6 max-w-lg">
                We mapped it all. Where do you want to start?
              </p>

              {/* Search + ZIP inline */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mb-6">
                <HeroSearchInput />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-lg mb-8">
                <HeroZipInput />
              </div>

              {/* Stats row with FOL backgrounds */}
              <div className="flex items-center gap-8">
                <FOLStat value={totalResources.toLocaleString()} label="total resources" color="#1b5e8a" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value={organizations} label="organizations" color="#1a6b56" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value={stats.officials} label="officials" color="#4a2870" />
              </div>
            </div>

            {/* Right — Compass visualization */}
            <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 max-w-[480px]">
              <Link href="/compass" className="block relative group">
                {/* Animated FOL behind compass */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[380px] h-[380px] opacity-[0.12] group-hover:opacity-[0.2] transition-opacity duration-700">
                    <GradientFOL variant="full" spinDur={60} colorDur={10} />
                  </div>
                </div>
                {/* Compass entry card */}
                <div className="relative bg-white/80 border border-brand-border p-8 shadow-offset-lg group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300" style={{ backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: '#1b5e8a' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" /></svg>
                    </div>
                    <div>
                      <span className="block font-display text-xl font-bold text-brand-text">Civic Compass</span>
                      <span className="block text-xs text-brand-muted">Chart your own course</span>
                    </div>
                  </div>
                  <p className="text-sm text-brand-muted leading-relaxed mb-4">
                    An interactive guide through 7 civic pathways. Pick a theme that matters to you — we&apos;ll show you everything connected to it.
                  </p>
                  {/* Mini pathway dots */}
                  <div className="flex items-center gap-2 mb-4">
                    {['#7a2018', '#1e4d7a', '#4a2870', '#1a6b56', '#1b5e8a', '#1a5030', '#4a2870'].map(function (c, i) {
                      return (
                        <div key={i} className="w-4 h-4 rounded-full border-2 group-hover:scale-110 transition-transform" style={{ borderColor: c, background: c + '20' }}>
                          <div className="w-full h-full rounded-full animate-pulse" style={{ background: c + '30', animationDelay: `${i * 0.3}s` }} />
                        </div>
                      )
                    })}
                    <span className="text-[10px] text-brand-muted ml-1">7 pathways</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-accent group-hover:gap-2.5 transition-all">
                    Open the Compass <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHAT'S HERE FOR YOU — MVP resource cards
         ══════════════════════════════════════════════════════════════ */}
      <FOLSectionDivider />

      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 pb-8">
        <div className="text-center mb-10">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">The Exchange</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-text mb-3">What&apos;s here for you</h2>
          <p className="text-brand-muted max-w-lg mx-auto">Everything mapped, classified, and connected. Pick a door.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MVP_SECTIONS.map(function (section) {
            const Icon = section.icon
            return (
              <FOLGlassCard key={section.href} href={section.href} accentColor={section.color}>
                {/* Image header */}
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${section.color}cc 0%, ${section.color}40 40%, transparent 100%)` }} />
                  {/* Stat badge */}
                  <div className="absolute bottom-3 left-4 flex items-center gap-2">
                    <span className="text-2xl font-black text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{section.stat}</span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/80">{section.statLabel}</span>
                  </div>
                  {/* Icon */}
                  <div className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)' }}>
                    <Icon size={16} color="white" />
                  </div>
                </div>
                {/* Body */}
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-brand-text mb-2 flex items-center gap-2">
                    <FOLBullet size={14} color={section.color} />
                    {section.title}
                  </h3>
                  <p className="text-sm text-brand-muted leading-relaxed">{section.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold transition-colors group-hover:gap-2" style={{ color: section.color }}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
              </FOLGlassCard>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          THE PULSE — Latest content, magazine-style
         ══════════════════════════════════════════════════════════════ */}
      <FOLSectionDivider />

      <section className="relative overflow-hidden py-8">
        <FOLDepthLayer position="top-left" size={400} opacity={0.04} />

        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-1">The Pulse</p>
              <h2 className="font-display text-2xl font-bold text-brand-text">What&apos;s happening in Houston</h2>
            </div>
            <FOLButton href="/news" variant="ghost">All News</FOLButton>
          </div>

          {/* Magazine grid — 1 large + 4 small */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Featured article (large) */}
            {latestContent.length > 0 && (
              <Link
                href={'/content/' + (latestContent[0] as any).id}
                className="lg:col-span-2 relative overflow-hidden group border border-brand-border hover:-translate-y-1 transition-all duration-300"
                style={{ minHeight: '320px', boxShadow: '3px 3px 0 #D5D0C8' }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent z-[1]" />
                {(latestContent[0] as any).hero_image_url ? (
                  <Image src={(latestContent[0] as any).hero_image_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1b5e8a 0%, #4a2870 100%)' }} />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-[2]">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 bg-white/10 mb-2">
                    {(latestContent[0] as any).center || 'Learning'}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-white mb-2 line-clamp-2">
                    {(latestContent[0] as any).title_6th_grade || 'Latest from the Exchange'}
                  </h3>
                  <p className="text-sm text-white/70 line-clamp-2">
                    {(latestContent[0] as any).summary_6th_grade}
                  </p>
                </div>
              </Link>
            )}

            {/* Smaller articles */}
            <div className="space-y-4">
              {latestContent.slice(1, 5).map(function (item: any) {
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="flex gap-3 p-3 border border-brand-border bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0 w-16 h-16 overflow-hidden bg-brand-bg-alt">
                      {item.hero_image_url ? (
                        <Image src={item.hero_image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FOLBullet size={20} color="#1b5e8a" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-[10px] font-mono text-brand-muted uppercase tracking-wider">{item.center || 'Learning'}</span>
                      <h4 className="text-sm font-semibold text-brand-text line-clamp-2 group-hover:text-brand-accent transition-colors">{item.title_6th_grade}</h4>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4 WAYS IN — Centers quick access
         ══════════════════════════════════════════════════════════════ */}
      <FOLSectionDivider />

      <section className="max-w-[1200px] mx-auto px-6 sm:px-8 pb-6">
        <div className="text-center mb-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">Choose Your Intent</p>
          <h2 className="font-display text-2xl font-bold text-brand-text">4 ways to jump in</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'I want to learn', question: 'How can I understand?', href: '/library', color: '#1b5e8a', icon: BookOpen },
            { label: 'I want to help', question: 'How can I contribute?', href: '/opportunities', color: '#1a6b56', icon: Users },
            { label: 'I need resources', question: 'What\'s available?', href: '/services', color: '#1b5e8a', icon: Heart },
            { label: 'I want accountability', question: 'Who decides?', href: '/officials', color: '#4a2870', icon: Scale },
          ].map(function (center) {
            const Icon = center.icon
            return (
              <Link
                key={center.href}
                href={center.href}
                className="relative overflow-hidden border group hover:-translate-y-1 transition-all duration-300"
                style={{ borderColor: center.color + '30', boxShadow: `3px 3px 0 ${center.color}15` }}
              >
                {/* Color header with FOL */}
                <div className="relative h-24 flex flex-col items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${center.color} 0%, ${center.color}dd 100%)` }}>
                  {/* FOL watermark */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] group-hover:opacity-[0.2] transition-opacity">
                    <div className="w-32 h-32" style={{ animation: 'fol-spin 60s linear infinite' }}>
                      <svg viewBox="2 2 16 16" fill="none">
                        <circle cx="10" cy="10" r="4" stroke="white" strokeWidth="1" />
                        {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
                          const rad = (deg * Math.PI) / 180
                          return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke="white" strokeWidth="0.6" />
                        })}
                      </svg>
                    </div>
                  </div>
                  <Icon size={24} color="white" className="relative z-[1] mb-1" />
                  <span className="relative z-[1] font-display text-base font-bold text-white text-center" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{center.label}</span>
                </div>
                {/* Body */}
                <div className="p-4 bg-white">
                  <p className="text-sm text-brand-muted italic">&ldquo;{center.question}&rdquo;</p>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold group-hover:gap-2 transition-all" style={{ color: center.color }}>
                    Explore <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURED PROMO + GOOD THINGS
         ══════════════════════════════════════════════════════════════ */}
      <FOLSectionDivider />

      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pb-4 space-y-4">
        <FeaturedPromo variant="banner" />
        <GoodThingsWidget variant="banner" />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE COMPASS CTA (shown only on mobile, replaces hidden desktop compass)
         ══════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden max-w-[1200px] mx-auto px-6 sm:px-8 py-6">
        <Link href="/compass" className="block relative overflow-hidden border border-brand-accent/20 p-6 group" style={{ background: 'linear-gradient(135deg, #FAF8F5, #EDE8E0)', boxShadow: '3px 3px 0 #1b5e8a20' }}>
          <div className="absolute top-2 right-2 w-24 h-24 opacity-[0.1]">
            <GradientFOL variant="seed" spinDur={30} colorDur={8} />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-brand-accent">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" /></svg>
            </div>
            <div>
              <span className="block font-display text-lg font-bold text-brand-text">Open the Civic Compass</span>
              <span className="block text-xs text-brand-muted">7 pathways to explore &middot; Choose your own adventure</span>
            </div>
            <ArrowRight size={20} className="text-brand-accent ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
    </div>
  )
}
