'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Target, Flame, ArrowRight, ChevronRight, ExternalLink, Globe, Heart, Users, BookOpen, Shield, Sparkles, Clock, MapPin, Volume2 } from 'lucide-react'
import Image from 'next/image'

// ── Types ──

interface ContentItem {
  id: string
  title: string
  summary: string
  imageUrl?: string | null
  pathway?: string | null
  center?: string | null
  type?: string | null
  href: string
}

interface MissionItem extends ContentItem {
  effort: string
  category: 'learn' | 'act' | 'build'
}

interface OrgItem {
  id: string
  name: string
  description: string
  logoUrl?: string | null
  website?: string | null
  href: string
}

interface EventItem {
  id: string
  name: string
  description: string
  startDatetime?: string | null
  registrationUrl?: string | null
  isFree: boolean
  isVirtual: boolean
  href: string
}

interface ServiceItem {
  id: string
  name: string
  description: string
  href: string
}

interface TeenHubProps {
  missions: {
    quickWins: MissionItem[]
    getInvolved: MissionItem[]
    goDeeper: MissionItem[]
  }
  content: ContentItem[]
  orgs: OrgItem[]
  events: EventItem[]
  services: ServiceItem[]
  stats: { orgs: number; stories: number; events: number; services: number }
}

// ── Vibe System (Identity Selection — Self-Determination Theory) ──

const VIBES = [
  { id: 'curious', label: 'The Curious One', icon: BookOpen, color: '#6a4e10', gradient: 'from-blue-500 to-cyan-400', desc: 'You want to understand how things actually work', filter: 'learn' },
  { id: 'fired-up', label: 'The Fired Up One', icon: Flame, color: '#1a6b56', gradient: 'from-red-500 to-orange-400', desc: 'You see something wrong and want to fix it', filter: 'act' },
  { id: 'builder', label: 'The Builder', icon: Target, color: '#7a2018', gradient: 'from-green-500 to-emerald-400', desc: 'You want to create something that lasts', filter: 'build' },
  { id: 'connector', label: 'The Connector', icon: Users, color: '#1b5e8a', gradient: 'from-purple-500 to-pink-400', desc: 'You bring people together', filter: null },
] as const

// ── Pathway colors for accent mapping ──

const PATHWAY_COLORS: Record<string, string> = {
  THEME_01: '#1a6b56', THEME_02: '#1e4d7a', THEME_03: '#4a2870',
  THEME_04: '#7a2018', THEME_05: '#6a4e10', THEME_06: '#1a5030', THEME_07: '#1b5e8a',
}

// ── Component ──

export function TeenHubClient({ missions, content, orgs, events, services, stats }: TeenHubProps) {
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null)
  const [hoveredMission, setHoveredMission] = useState<string | null>(null)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Intersection observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => { const next = new Set(prev); next.add(entry.target.id); return next })
          }
        })
      },
      { threshold: 0.15 }
    )
    Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [])

  const registerSection = (id: string) => (el: HTMLElement | null) => { sectionRefs.current[id] = el }
  const isVisible = (id: string) => visibleSections.has(id)

  // Filter missions based on selected vibe
  const activeMissions = selectedVibe
    ? (() => {
        const vibe = VIBES.find(v => v.id === selectedVibe)
        if (!vibe?.filter) return [...missions.quickWins, ...missions.getInvolved, ...missions.goDeeper]
        return [...missions.quickWins, ...missions.getInvolved, ...missions.goDeeper].filter(m => m.category === vibe.filter)
      })()
    : [...missions.quickWins.slice(0, 3), ...missions.getInvolved.slice(0, 3), ...missions.goDeeper.slice(0, 3)]

  return (
    <div className="bg-[#0a0a0a] min-h-screen overflow-hidden">

      {/* ════════════════════════════════════════════════════════════
          HERO — Full-bleed dark gradient with bold type
          Psychology: Autonomy + Identity ("YOUR city, YOUR move")
         ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0a1628]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-[10%] w-[400px] h-[400px] rounded-full opacity-20 blur-[120px] animate-pulse" style={{ background: 'radial-gradient(circle, #1b5e8a, transparent)' }} />
        <div className="absolute bottom-20 right-[15%] w-[350px] h-[350px] rounded-full opacity-15 blur-[100px] animate-pulse" style={{ background: 'radial-gradient(circle, #6a4e10, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[30%] w-[250px] h-[250px] rounded-full opacity-10 blur-[80px] animate-pulse" style={{ background: 'radial-gradient(circle, #1a6b56, transparent)', animationDelay: '2s' }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Glitch-style label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Teen Hub</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight">
            Your City.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Your Move.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            Houston has {stats.orgs}+ organizations, {stats.stories}+ stories, and {stats.events}+ events happening right now.
            This is your city. What are you going to do about it?
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="#vibes"
              className="group relative px-8 py-4 text-base font-bold text-white overflow-hidden transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                Pick Your Vibe <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a
              href="#missions"
              className="px-8 py-4 text-base font-bold text-white/70 border-2 border-white/10 hover:border-white/30 hover:text-white transition-all"
            >
              Browse Missions
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 mx-auto flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          SOCIAL PROOF TICKER — Animated stats bar
          Psychology: Social proof + Competence ("look how much is happening")
         ════════════════════════════════════════════════════════════ */}
      <section className="relative border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-12 py-4 px-6 overflow-x-auto scrollbar-hide">
          <StatPill value={stats.orgs + '+'} label="organizations" color="#1b5e8a" />
          <div className="w-px h-6 bg-white/10 flex-shrink-0" />
          <StatPill value={stats.stories + '+'} label="stories" color="#6a4e10" />
          <div className="w-px h-6 bg-white/10 flex-shrink-0" />
          <StatPill value={stats.events + '+'} label="events this month" color="#7a2018" />
          <div className="w-px h-6 bg-white/10 flex-shrink-0" />
          <StatPill value={stats.services + '+'} label="services" color="#1a6b56" />
          <div className="w-px h-6 bg-white/10 flex-shrink-0" />
          <StatPill value="7" label="pathways to explore" color="#1e4d7a" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          VIBE SELECTOR — Identity formation (Self-Determination Theory)
          Psychology: Autonomy + Identity + Competence
         ════════════════════════════════════════════════════════════ */}
      <section
        id="vibes"
        ref={registerSection('vibes')}
        className={'relative py-20 px-6 transition-all duration-1000 ' + (isVisible('vibes') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
      >
        <div className="max-w-5xl mx-auto">
          <SectionLabel text="Identity" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
            What{'\u2019'}s your vibe?
          </h2>
          <p className="text-white/40 mt-3 text-lg max-w-xl">
            Pick the one that fits you right now. You can always switch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {VIBES.map((vibe) => {
              const Icon = vibe.icon
              const active = selectedVibe === vibe.id
              return (
                <button
                  key={vibe.id}
                  onClick={() => setSelectedVibe(active ? null : vibe.id)}
                  className={'group relative p-6 text-left transition-all duration-300 overflow-hidden border-2 ' +
                    (active
                      ? 'border-white/30 scale-[1.02] shadow-2xl'
                      : 'border-white/5 hover:border-white/15 hover:scale-[1.01]'
                    )
                  }
                >
                  {/* Background gradient */}
                  <div
                    className={'absolute inset-0 transition-opacity duration-300 ' + (active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')}
                    style={{ background: `linear-gradient(135deg, ${vibe.color}15, ${vibe.color}05)` }}
                  />

                  <div className="relative">
                    <div
                      className="w-12 h-12 flex items-center justify-center mb-4 transition-all duration-300"
                      style={{ backgroundColor: active ? vibe.color + '30' : vibe.color + '12' }}
                    >
                      <Icon className="w-6 h-6 transition-colors" style={{ color: vibe.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{vibe.label}</h3>
                    <p className="text-sm text-white/40 mt-1 leading-relaxed">{vibe.desc}</p>

                    {active && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: vibe.color }}>
                        <Sparkles className="w-3.5 h-3.5" /> Active
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          MISSION BOARD — Game Theory: Quests with effort levels
          Psychology: Competence (graduated difficulty) + Autonomy (choice)
         ════════════════════════════════════════════════════════════ */}
      <section
        id="missions"
        ref={registerSection('missions')}
        className={'relative py-20 px-6 transition-all duration-1000 delay-100 ' + (isVisible('missions') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
      >
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Mission Board" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
            {selectedVibe
              ? `Missions for ${VIBES.find(v => v.id === selectedVibe)?.label || 'you'}`
              : 'Pick a mission'
            }
          </h2>
          <p className="text-white/40 mt-3 text-lg max-w-xl">
            Start small or go big. Every action counts.
          </p>

          {/* Effort level tabs */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { label: 'Quick Wins', icon: Zap, desc: '5 min', color: '#7a2018', missions: missions.quickWins },
              { label: 'Get Involved', icon: Target, desc: '1-2 hrs', color: '#6a4e10', missions: missions.getInvolved },
              { label: 'Go Deeper', icon: Flame, desc: 'Ongoing', color: '#1a6b56', missions: missions.goDeeper },
            ].map(tier => (
              <div
                key={tier.label}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10"
              >
                <tier.icon className="w-4 h-4" style={{ color: tier.color }} />
                <span className="text-sm font-bold text-white">{tier.label}</span>
                <span className="text-xs text-white/30">{tier.desc}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-white/50">{tier.missions.length}</span>
              </div>
            ))}
          </div>

          {/* Mission grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {activeMissions.slice(0, 9).map((mission, i) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                index={i}
                isHovered={hoveredMission === mission.id}
                onHover={setHoveredMission}
              />
            ))}
          </div>

          {activeMissions.length > 9 && (
            <div className="mt-8 text-center">
              <Link
                href="/news"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all"
              >
                See all missions <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          REAL TALK — Content that speaks to teens directly
          Psychology: Relatedness + Belonging (peer voice)
         ════════════════════════════════════════════════════════════ */}
      <section
        id="real-talk"
        ref={registerSection('real-talk')}
        className={'relative py-20 px-6 transition-all duration-1000 delay-150 ' + (isVisible('real-talk') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
      >
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Real Talk" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
            Stories that actually matter
          </h2>
          <p className="text-white/40 mt-3 text-lg max-w-xl">
            Not boring news. Real stories about real things happening in your city.
          </p>

          {/* Featured story (large card) */}
          {content[0] && (
            <Link href={content[0].href} className="group block mt-10">
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/5 hover:border-white/15 transition-all duration-500">
                {content[0].imageUrl ? (
                  <div className="aspect-[21/9] bg-white/5 overflow-hidden">
                    <Image
                      src={content[0].imageUrl}
                      alt={content[0].title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
                     width={800} height={400} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
                  </div>
                ) : (
                  <div className="aspect-[21/9] bg-gradient-to-br from-purple-900/30 to-blue-900/30" />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-purple-400">Featured</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight max-w-3xl group-hover:text-purple-200 transition-colors">
                    {content[0].title}
                  </h3>
                  <p className="text-white/40 mt-3 text-sm max-w-2xl line-clamp-2">{content[0].summary}</p>
                  <div className="flex items-center gap-2 mt-4 text-sm font-bold text-white/50 group-hover:text-white/70 transition-colors">
                    Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Story grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {content.slice(1, 7).map(item => (
              <Link
                key={item.id}
                href={item.href}
                className="group relative overflow-hidden border-2 border-white/5 hover:border-white/15 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
              >
                {item.imageUrl && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                     width={800} height={400} />
                  </div>
                )}
                <div className="p-5">
                  {item.pathway && (
                    <div className="w-8 h-1 rounded-full mb-3" style={{ backgroundColor: PATHWAY_COLORS[item.pathway] || '#666' }} />
                  )}
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/30 mt-2 line-clamp-2">{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              All stories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          ORGS THAT GET IT — Organizations teens can connect with
          Psychology: Relatedness + Belonging + Social proof
         ════════════════════════════════════════════════════════════ */}
      <section
        id="orgs"
        ref={registerSection('orgs')}
        className={'relative py-20 px-6 transition-all duration-1000 delay-200 ' + (isVisible('orgs') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
      >
        <div className="max-w-6xl mx-auto">
          <SectionLabel text="Your Squad" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
            Orgs that get it
          </h2>
          <p className="text-white/40 mt-3 text-lg max-w-xl">
            Real organizations doing real work for young people in Houston and beyond.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {orgs.slice(0, 9).map((org, i) => (
              <Link
                key={org.id}
                href={org.href}
                className="group relative p-6 border-2 border-white/5 hover:border-white/15 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
              >
                <div className="flex items-start gap-4">
                  {org.logoUrl ? (
                    <Image src={org.logoUrl} alt={org.name + ' logo'} className="w-10 h-10 object-contain bg-white/10 p-1 flex-shrink-0"  width={48} height={40} />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-black text-white/40">{org.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-200 transition-colors">{org.name}</h3>
                    <p className="text-xs text-white/30 mt-1 line-clamp-3 leading-relaxed">{org.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-xs font-bold text-white/20 group-hover:text-white/50 transition-colors">
                  Learn more <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              All organizations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HAPPENING NOW — Events with urgency framing
          Psychology: Scarcity + Social proof + FOMO (ethical)
         ════════════════════════════════════════════════════════════ */}
      {events.length > 0 && (
        <section
          id="events"
          ref={registerSection('events')}
          className={'relative py-20 px-6 transition-all duration-1000 delay-100 ' + (isVisible('events') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
        >
          <div className="max-w-6xl mx-auto">
            <SectionLabel text="Happening Now" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
              Don{'\u2019'}t just scroll. Show up.
            </h2>
            <p className="text-white/40 mt-3 text-lg max-w-xl">
              Events happening in Houston that you can actually attend.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {events.slice(0, 6).map(event => {
                const date = event.startDatetime ? new Date(event.startDatetime) : null
                return (
                  <Link
                    key={event.id}
                    href={event.href}
                    className="group relative p-6 border-2 border-white/5 hover:border-white/15 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date block */}
                      {date && (
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex flex-col items-center justify-center border border-white/5">
                          <span className="text-[10px] font-bold uppercase text-orange-400">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-xl font-black text-white leading-none">{date.getDate()}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {event.isFree && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded-md">Free</span>
                          )}
                          {event.isVirtual && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-md">Virtual</span>
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug group-hover:text-orange-200 transition-colors">{event.name}</h3>
                        <p className="text-xs text-white/30 mt-1 line-clamp-2">{event.description}</p>
                        {date && (
                          <p className="text-xs text-white/20 mt-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleDateString('en-US', { weekday: 'long' })} at {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/calendar"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all"
              >
                Full calendar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          RESOURCES — Services as strength-based support
          Psychology: Asset-based framing + Competence
         ════════════════════════════════════════════════════════════ */}
      {services.length > 0 && (
        <section
          id="services"
          ref={registerSection('services')}
          className={'relative py-20 px-6 transition-all duration-1000 delay-150 ' + (isVisible('services') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
        >
          <div className="max-w-5xl mx-auto">
            <SectionLabel text="Got You" />
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
              We've got resources for you.
            </h2>
            <p className="text-white/40 mt-3 text-lg max-w-xl">
              Free services and support available to young people in Houston.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
              {services.slice(0, 6).map(service => (
                <Link
                  key={service.id}
                  href={service.href}
                  className="group flex items-start gap-4 p-5 border-2 border-white/5 hover:border-white/15 transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04]"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-teal-200 transition-colors">{service.name}</h3>
                    <p className="text-xs text-white/30 mt-1 line-clamp-2">{service.description}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all"
              >
                All services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════
          PATHWAYS — The 7 themes reframed for teens
          Psychology: Autonomy + Exploration + Identity
         ════════════════════════════════════════════════════════════ */}
      <section
        id="pathways"
        ref={registerSection('pathways')}
        className={'relative py-20 px-6 transition-all duration-1000 delay-200 ' + (isVisible('pathways') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12')}
      >
        <div className="max-w-5xl mx-auto">
          <SectionLabel text="Go Deeper" />
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 leading-tight">
            Pick a lane
          </h2>
          <p className="text-white/40 mt-3 text-lg max-w-xl">
            Seven pathways into what matters. Each one connects to everything else.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-10">
            {[
              { slug: 'health', name: 'Health', desc: 'Mental health, wellness, clinics, nutrition', color: '#1a6b56' },
              { slug: 'families', name: 'Families', desc: 'Schools, youth programs, childcare, safety', color: '#1e4d7a' },
              { slug: 'neighborhood', name: 'Neighborhood', desc: 'Housing, parks, libraries, your block', color: '#4a2870' },
              { slug: 'voice', name: 'Voice', desc: 'Voting, advocacy, town halls, power', color: '#7a2018' },
              { slug: 'money', name: 'Money', desc: 'Jobs, internships, scholarships, business', color: '#6a4e10' },
              { slug: 'planet', name: 'Planet', desc: 'Climate, environment, energy, water', color: '#1a5030' },
              { slug: 'the-bigger-we', name: 'The Bigger We', desc: 'Bridging, dialogue, inclusion, trust', color: '#1b5e8a' },
            ].map(p => (
              <Link
                key={p.slug}
                href={`/pathways/${p.slug}`}
                className="group relative flex items-center gap-4 p-5 border-2 border-white/5 hover:border-white/15 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${p.color}08, ${p.color}03)` }} />
                <div
                  className="relative w-3 h-12 rounded-full flex-shrink-0 transition-all duration-300 group-hover:h-14"
                  style={{ backgroundColor: p.color }}
                />
                <div className="relative min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">{p.name}</h3>
                  <p className="text-xs text-white/30 mt-0.5">{p.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 ml-auto flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          BOTTOM CTA — Full-bleed gradient close
         ════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-[20%] w-[500px] h-[500px] rounded-full opacity-10 blur-[150px]" style={{ background: 'radial-gradient(circle, #1b5e8a, transparent)' }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            Houston is yours.
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              What happens next is up to you.
            </span>
          </h2>
          <p className="text-white/40 mt-4 text-lg max-w-lg mx-auto">
            Start with one mission. Read one story. Show up to one event. That{'\u2019'}s how it begins.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="#vibes"
              className="group relative px-8 py-4 text-base font-bold text-white overflow-hidden transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500" />
              <span className="relative flex items-center gap-2">
                Start Now <Zap className="w-5 h-5" />
              </span>
            </a>
            <Link
              href="/chat"
              className="px-8 py-4 text-base font-bold text-white/60 border-2 border-white/10 hover:border-white/25 hover:text-white transition-all"
            >
              Talk to Chance (AI)
            </Link>
          </div>
        </div>
      </section>

      {/* Spectrum bar at very bottom */}
      <div className="h-1 flex">
        {['#1a6b56', '#1e4d7a', '#4a2870', '#7a2018', '#6a4e10', '#1a5030', '#1b5e8a'].map(c => (
          <div key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  )
}

// ── Sub-components ──

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-px bg-gradient-to-r from-purple-500 to-transparent" />
      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-purple-400/60">{text}</span>
    </div>
  )
}

function StatPill({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xl font-black" style={{ color }}>{value}</span>
      <span className="text-xs text-white/30 uppercase tracking-wider font-medium">{label}</span>
    </div>
  )
}

function MissionCard({ mission, index, isHovered, onHover }: {
  mission: MissionItem
  index: number
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  const categoryColors = {
    learn: { bg: 'from-blue-500/20 to-cyan-500/20', border: '#6a4e10', label: 'Learn', icon: BookOpen },
    act: { bg: 'from-green-500/20 to-emerald-500/20', border: '#7a2018', label: 'Act', icon: Target },
    build: { bg: 'from-red-500/20 to-orange-500/20', border: '#1a6b56', label: 'Build', icon: Flame },
  }

  const cat = categoryColors[mission.category]
  const Icon = cat.icon

  return (
    <Link
      href={mission.href}
      className={'group relative overflow-hidden border-2 transition-all duration-300 ' +
        (isHovered ? 'border-white/20 scale-[1.02] shadow-2xl' : 'border-white/5 hover:border-white/15')
      }
      onMouseEnter={() => onHover(mission.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Top gradient bar */}
      <div className={'h-1 bg-gradient-to-r ' + cat.bg} />

      <div className="p-5 bg-white/[0.02]">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center" style={{ backgroundColor: cat.border + '15' }}>
              <Icon className="w-3.5 h-3.5" style={{ color: cat.border }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.border }}>{cat.label}</span>
          </div>
          <span className="text-[10px] font-medium text-white/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {mission.effort}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors">
          {mission.title}
        </h3>
        <p className="text-xs text-white/25 mt-2 line-clamp-2 leading-relaxed">{mission.summary}</p>

        {/* Action hint */}
        <div className="flex items-center gap-1 mt-4 text-xs font-bold text-white/15 group-hover:text-white/50 transition-colors">
          Start mission <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
