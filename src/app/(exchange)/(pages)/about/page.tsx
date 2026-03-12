import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { GradientFOL } from '@/components/exchange/GradientFOL'
import { FOLDepthLayer, FOLSectionDivider, FOLGlassCard, FOLStat, FOLBullet, FOLButton } from '@/components/exchange/FOLElements'
import { BookOpen, Users, Globe, MapPin, Shield, Mail, TrendingUp, Lightbulb, Heart, ArrowRight } from 'lucide-react'
import { getExchangeStats } from '@/lib/data/homepage'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'About — The Change Engine',
  description: 'The Change Engine is a civic platform connecting Houston residents with resources, services, officials, and civic participation opportunities — in English, Spanish, and Vietnamese.',
}

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Our Mission',
    color: '#1b5e8a',
    body: 'Change Engine organizes community life — making it easier to discover resources, connect with organizations, and participate in civic life. We believe every person has strengths to contribute and every neighborhood has assets to build on.',
  },
  {
    icon: Users,
    title: 'How It Works',
    color: '#1a6b56',
    body: 'We aggregate resources from community organizations, government agencies, and civic groups across Houston. Every piece of content is classified using AI across 16 taxonomy dimensions and reviewed by community partners. All content is written at a 6th-grade reading level so information is accessible to everyone.',
  },
  {
    icon: Globe,
    title: 'Available in Three Languages',
    color: '#4a2870',
    body: 'Change Engine is available in English, Spanish, and Vietnamese — reflecting the three most-spoken languages in Greater Houston. Translations are generated using AI and reviewed for accuracy and cultural relevance.',
  },
  {
    icon: MapPin,
    title: 'Built in Houston, Built for Replication',
    color: '#1b5e8a',
    body: 'The Change Engine is designed for Houston but architected for replication. Our open approach to civic technology means any community can adapt this model to organize their own community life around their own priorities.',
  },
]

const THEORY_OF_CHANGE = [
  {
    icon: Lightbulb,
    title: 'Information Is Power',
    color: '#4a2870',
    body: 'When people can easily find who represents them, what policies affect them, and what services are available — they participate. We remove the friction between residents and civic life.',
  },
  {
    icon: Heart,
    title: 'Asset-Based, Not Deficit-Based',
    color: '#7a2018',
    body: 'We focus on what communities have, not what they lack. Every neighborhood has organizations, leaders, and resources. We make them visible and connected.',
  },
  {
    icon: TrendingUp,
    title: 'AI for Equity',
    color: '#1a5030',
    body: 'We use AI to classify, translate, and simplify civic information — ensuring that language, literacy, and time are never barriers to participation. Technology should serve everyone, not just the privileged.',
  },
]

export default async function AboutPage() {
  const stats = await getExchangeStats()
  const totalResources = (stats.resources || 0) + (stats.services || 0) + (stats.organizations || 0) + (stats.policies || 0) + (stats.officials || 0)

  return (
    <div>
      {/* ══════════════════════════════════════════════════════════════
          HERO — Full-width, editorial left / FOL wayfinder right
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f4f5f7 0%, #dde1e8 50%, #f4f5f7 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, rgba(44,44,44,0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }} />
        <FOLDepthLayer position="top-right" size={600} opacity={0.06} />
        <FOLDepthLayer position="bottom-left" size={400} opacity={0.04} />

        <div className="relative z-10 max-w-[1080px] mx-auto px-6 sm:px-8 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
            {/* Left — editorial */}
            <div className="flex-1 min-w-0 max-w-xl">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-3">About</p>
              <h1 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] leading-[1.05] tracking-tight mb-5 text-brand-text">
                Community life,{' '}
                <span className="relative inline-block">
                  <span className="text-brand-accent">organized.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" preserveAspectRatio="none">
                    <path d="M0 5c50-4 150-4 200 0" stroke="#1b5e8a" strokeWidth="2" opacity="0.4" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-brand-muted mb-8 max-w-lg">
                Most people never show up — not because they don&apos;t care, but because nobody showed them the way in. Change Engine maps every resource, every official, every opportunity in Houston and connects them into one accessible platform.
              </p>
              {/* Stats */}
              <div className="flex items-center gap-8">
                <FOLStat value={totalResources.toLocaleString()} label="total resources" color="#1b5e8a" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value={stats.organizations || 0} label="organizations" color="#1a6b56" />
                <div className="w-px h-10 bg-brand-border" />
                <FOLStat value={stats.officials || 0} label="officials" color="#4a2870" />
              </div>
            </div>

            {/* Right — animated FOL wayfinder */}
            <div className="hidden lg:flex flex-1 items-center justify-center min-w-0 max-w-[400px]">
              <div className="relative">
                <div className="w-[320px] h-[320px] opacity-20">
                  <GradientFOL variant="full" spinDur={60} colorDur={10} />
                </div>
                {/* 7 pathways label */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/80 rounded-full px-4 py-1.5 border border-brand-border" style={{ backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center gap-1.5">
                    {['#7a2018', '#1e4d7a', '#4a2870', '#1a6b56', '#1b5e8a', '#1a5030', '#4a2870'].map(function (c, i) {
                      return <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    })}
                    <span className="text-[10px] font-mono font-bold text-brand-muted ml-1">7 pathways</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1080px] mx-auto px-6 sm:px-8 py-8">
        <Breadcrumb items={[{ label: 'About' }]} />

        {/* ── Mission & approach ── */}
        <FOLSectionDivider className="mt-2" />

        <div className="text-center mb-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">What We Do</p>
          <h2 className="font-display text-2xl font-bold text-brand-text">Connecting people to civic life</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SECTIONS.map(function (section) {
            const Icon = section.icon
            return (
              <FOLGlassCard key={section.title} accentColor={section.color}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: section.color + '15' }}>
                      <Icon size={20} style={{ color: section.color }} />
                    </div>
                    <h3 className="font-display font-bold text-brand-text text-lg">{section.title}</h3>
                  </div>
                  <p className="text-sm text-brand-muted leading-relaxed">{section.body}</p>
                </div>
              </FOLGlassCard>
            )
          })}
        </div>

        {/* ── Theory of Change ── */}
        <FOLSectionDivider />

        <div className="text-center mb-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">Why It Matters</p>
          <p className="font-display text-2xl font-bold text-brand-text">Theory of Change</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {THEORY_OF_CHANGE.map(function (item) {
            const Icon = item.icon
            return (
              <FOLGlassCard key={item.title} accentColor={item.color}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center" style={{ background: item.color + '15' }}>
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <h3 className="font-display font-bold text-brand-text text-base">{item.title}</h3>
                  </div>
                  <p className="text-sm text-brand-muted leading-relaxed">{item.body}</p>
                </div>
              </FOLGlassCard>
            )
          })}
        </div>

        {/* ── How We Organize ── */}
        <FOLSectionDivider />

        <div className="relative overflow-hidden border border-brand-border bg-white p-8">
          <FOLDepthLayer position="top-right" size={200} opacity={0.04} spin={false} />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-accent/10 flex items-center justify-center">
              <Shield size={20} className="text-brand-accent" />
            </div>
            <h2 className="font-display font-bold text-brand-text text-xl">How We Organize</h2>
          </div>
          <div className="text-sm text-brand-muted leading-relaxed space-y-3 max-w-2xl">
            <p className="flex gap-2">
              <FOLBullet size={14} color="#1b5e8a" className="mt-1" />
              <span>All content is organized around <strong className="text-brand-text">7 community pathways</strong> — Health, Families, Neighborhood, Voice, Money, Planet, and The Bigger We — and <strong className="text-brand-text">4 engagement modes</strong>: Learning, Action, Resource, and Accountability.</span>
            </p>
            <p className="flex gap-2">
              <FOLBullet size={14} color="#1a6b56" className="mt-1" />
              <span>We use <strong className="text-brand-text">asset-based language</strong> — focusing on strengths, opportunities, and what is available rather than deficits. Every community has resources to build on, and every resident has something valuable to contribute.</span>
            </p>
            <p className="flex gap-2">
              <FOLBullet size={14} color="#1b5e8a" className="mt-1" />
              <span>Every entity is classified across <strong className="text-brand-text">16 taxonomy dimensions</strong> using AI — from focus areas and SDGs to audiences and service categories — then connected via a knowledge mesh so resources travel across pathways.</span>
            </p>
          </div>
        </div>

        {/* ── Explore the Exchange ── */}
        <FOLSectionDivider />

        <div className="text-center mb-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-brand-accent mb-2">Get Started</p>
          <h2 className="font-display text-2xl font-bold text-brand-text">Explore the Exchange</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { href: '/library', label: 'Library', desc: 'Research, reports, and policy briefs', color: '#1b5e8a' },
            { href: '/services', label: 'Services', desc: 'Food, health, legal aid, and more', color: '#1b5e8a' },
            { href: '/officials', label: 'Officials', desc: 'Who represents you at every level', color: '#4a2870' },
            { href: '/opportunities', label: 'Opportunities', desc: 'Volunteer, intern, get involved', color: '#1a6b56' },
          ].map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative overflow-hidden border p-5 hover:-translate-y-1 hover:border-ink transition-all duration-300"
                style={{ borderColor: item.color + '30' }}
              >
                <div className="absolute -top-3 -right-3 w-16 h-16 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity" style={{ animation: 'fol-spin 60s linear infinite' }}>
                  <svg viewBox="2 2 16 16" fill="none">
                    <circle cx="10" cy="10" r="4" stroke={item.color} strokeWidth="1.5" />
                    {[0, 60, 120, 180, 240, 300].map(function (deg, i) {
                      const rad = (deg * Math.PI) / 180
                      return <circle key={i} cx={10 + 4 * Math.cos(rad)} cy={10 + 4 * Math.sin(rad)} r="4" stroke={item.color} strokeWidth="0.8" />
                    })}
                  </svg>
                </div>
                <h3 className="font-display font-bold text-brand-text text-sm flex items-center gap-2 group-hover:text-brand-accent transition-colors">
                  <FOLBullet size={12} color={item.color} />
                  {item.label}
                </h3>
                <p className="text-xs text-brand-muted mt-1">{item.desc}</p>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold transition-all group-hover:gap-2" style={{ color: item.color }}>
                  Explore <ArrowRight size={10} />
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── Partner + Contact ── */}
        <FOLSectionDivider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative overflow-hidden bg-brand-bg-alt p-6">
            <FOLDepthLayer position="bottom-right" size={120} opacity={0.04} spin={false} />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <FOLBullet size={18} color="#1b5e8a" />
              </div>
              <div>
                <p className="font-display font-bold text-brand-text mb-1">Built by The Change Lab</p>
                <p className="text-sm text-brand-muted leading-relaxed">
                  The Change Lab builds civic technology in Houston. We use AI and open data to make it easier for people to show up, find resources, and get involved.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-brand-bg-alt p-6">
            <FOLDepthLayer position="bottom-right" size={120} opacity={0.04} spin={false} />
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-brand-accent" />
              </div>
              <div>
                <p className="font-display font-bold text-brand-text mb-1">Partner With Us</p>
                <p className="text-sm text-brand-muted leading-relaxed">
                  We work with community organizations, government agencies, and funders who believe in equitable access to civic information.{' '}
                  <a href="mailto:hello@thechangelab.net" className="text-brand-accent hover:underline font-medium">
                    hello@thechangelab.net
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-brand-border">
          {[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/accessibility', label: 'Accessibility' },
            { href: '/contact', label: 'Contact Us' },
          ].map(function (link) {
            return (
              <Link key={link.href} href={link.href} className="text-xs text-brand-muted hover:text-brand-accent transition-colors">
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
