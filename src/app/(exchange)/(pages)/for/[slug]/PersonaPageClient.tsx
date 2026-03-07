'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, ChevronRight } from 'lucide-react'
import {
  SeekerIcon, LearnerIcon, BuilderIcon,
  WatchdogIcon, PartnerIcon, ExplorerIcon,
} from '@/components/exchange/FlowerIcons'
import { ContentShelf, type ShelfItem } from '@/components/exchange/ContentShelf'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'

const ICONS: Record<string, typeof SeekerIcon> = {
  seeker: SeekerIcon,
  learner: LearnerIcon,
  builder: BuilderIcon,
  watchdog: WatchdogIcon,
  partner: PartnerIcon,
  explorer: ExplorerIcon,
}

const CENTER_ICON_PATHS: Record<string, string> = {
  Resource: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
  Learning: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342',
  Action: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
  Accountability: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
}

const OTHER_PERSONAS = [
  { slug: 'seeker', name: 'The Seeker', desc: 'Find resources', color: '#d69e2e' },
  { slug: 'learner', name: 'The Learner', desc: 'Understand issues', color: '#3182ce' },
  { slug: 'builder', name: 'The Builder', desc: 'Take action', color: '#38a169' },
  { slug: 'watchdog', name: 'The Watchdog', desc: 'Track accountability', color: '#805ad5' },
  { slug: 'partner', name: 'The Partner', desc: 'Collaborate', color: '#dd6b20' },
  { slug: 'explorer', name: 'The Explorer', desc: 'Discover it all', color: '#E8723A' },
]

interface PersonaPageClientProps {
  slug: string
  config: {
    name: string
    tagline: string
    description: string
    color: string
    folImage: string
    center: string | null
    heroQuestion: string
    sections: Array<{
      key: string
      title: string
      question: string
      seeAllHref: string
      type: string
      center?: string
    }>
    quickActions: Array<{ label: string; href: string; color: string }>
  }
  sectionData: Record<string, ShelfItem[]>
  stats: { resources: number; services: number; officials: number; organizations: number; policies: number; learningPaths: number }
  quote: { quote_text: string; attribution?: string } | null
  pathways: Array<{ id: string; name: string; color: string; slug: string }>
}

export function PersonaPageClient({ slug, config, sectionData, stats, quote, pathways }: PersonaPageClientProps) {
  const Icon = ICONS[slug] || ExplorerIcon
  const [zipCode, setZipCode] = useState('')
  const centerColor = config.color
  const iconPath = config.center ? CENTER_ICON_PATHS[config.center] : undefined

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: config.color + '08' }}>
        {/* FOL watermark */}
        <img
          src={config.folImage}
          alt="" aria-hidden="true"
          className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-[0.06]"
        />

        <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Inline breadcrumb (Breadcrumb component is server-only) */}
          <nav className="flex items-center gap-1.5 text-xs text-brand-muted mb-2">
            <Link href="/" className="hover:text-brand-accent transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link href="/personas" className="hover:text-brand-accent transition-colors">Your Journey</Link>
            <ChevronRight size={10} />
            <span className="text-brand-text font-medium">{config.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center gap-8 mt-6">
            {/* Left: icon + text */}
            <div className="flex-1">
              <div className="flex items-center gap-5 mb-5">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: centerColor + '15', border: '2px solid ' + centerColor + '30' }}
                >
                  <Icon size={48} color={centerColor} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: centerColor }}>
                    Your Journey
                  </p>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text">{config.name}</h1>
                </div>
              </div>

              <p className="text-lg font-serif italic mb-2" style={{ color: centerColor }}>
                "{config.heroQuestion}"
              </p>
              <p className="text-brand-muted leading-relaxed max-w-2xl">
                {config.description}
              </p>
            </div>

            {/* Right: quick actions + ZIP */}
            <div className="lg:w-[340px] flex-shrink-0 space-y-4">
              {/* ZIP personalization */}
              <div className="bg-white rounded-xl border-2 border-brand-border p-4" style={{ boxShadow: '3px 3px 0 ' + centerColor + '20' }}>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted block mb-2">
                  Personalize Your View
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-brand-border rounded-lg bg-brand-bg">
                    <MapPin size={14} className="text-brand-muted" />
                    <input
                      type="text"
                      placeholder="Enter your ZIP"
                      value={zipCode}
                      onChange={function (e) { setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                      className="bg-transparent text-sm text-brand-text placeholder:text-brand-muted-light flex-1 outline-none"
                    />
                  </div>
                  <Link
                    href={zipCode.length === 5 ? '/my-area?zip=' + zipCode : '#'}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
                    style={{ backgroundColor: zipCode.length === 5 ? centerColor : '#ccc' }}
                  >
                    Go
                  </Link>
                </div>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-2">
                {config.quickActions.map(function (action) {
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-brand-border hover:border-brand-accent hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <span className="w-1.5 h-6 rounded-sm flex-shrink-0 transition-all group-hover:w-2" style={{ backgroundColor: action.color }} />
                      <span className="text-xs font-semibold text-brand-text">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 pt-5 border-t border-brand-border flex flex-wrap items-center gap-6 sm:gap-10">
            {[
              { value: stats.resources, label: 'Articles' },
              { value: stats.services, label: 'Services' },
              { value: stats.organizations, label: 'Organizations' },
              { value: stats.officials, label: 'Officials' },
              { value: stats.policies, label: 'Policies' },
            ].map(function (stat) {
              return (
                <div key={stat.label} className="text-center">
                  <p className="text-xl sm:text-2xl font-serif font-bold" style={{ color: centerColor }}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mt-0.5">
                    {stat.label}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom color bar */}
        <div className="h-1" style={{ background: 'linear-gradient(90deg, ' + centerColor + ', transparent 60%)' }} />
      </section>

      {/* Content sections */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content — shelves */}
          <div className="flex-1 min-w-0 space-y-2">
            {config.sections.map(function (section) {
              const items = sectionData[section.key] || []
              if (items.length === 0) return null
              return (
                <ContentShelf
                  key={section.key}
                  title={section.title}
                  question={section.question}
                  iconPath={iconPath}
                  color={centerColor}
                  items={items}
                  seeAllHref={section.seeAllHref}
                />
              )
            })}

            {/* Quote widget */}
            {quote && (
              <div className="relative overflow-hidden rounded-xl border-2 border-brand-border p-6 mt-6" style={{ background: centerColor + '06' }}>
                <img
                  src={config.folImage}
                  alt="" aria-hidden="true"
                  className="absolute right-[-20px] top-[-20px] w-[100px] h-[100px] pointer-events-none opacity-[0.06]"
                />
                <blockquote className="relative z-10">
                  <p className="font-serif text-lg italic text-brand-text leading-relaxed">
                    "{quote.quote_text}"
                  </p>
                  {quote.attribution && (
                    <footer className="mt-3 text-sm font-semibold" style={{ color: centerColor }}>
                      — {quote.attribution}
                    </footer>
                  )}
                </blockquote>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-[300px] flex-shrink-0 space-y-5">
            {/* Pathways */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="relative p-4 border-b border-brand-border overflow-hidden">
                <img
                  src={config.folImage}
                  alt="" aria-hidden="true"
                  className="absolute right-[-10px] top-[-10px] w-[60px] h-[60px] pointer-events-none opacity-[0.06]"
                />
                <h3 className="font-serif text-base font-semibold text-brand-text">Explore Pathways</h3>
                <p className="text-[11px] text-brand-muted mt-0.5">Seven dimensions of community life</p>
              </div>
              <div className="p-3 space-y-0.5">
                {pathways.map(function (pw) {
                  return (
                    <Link
                      key={pw.id}
                      href={'/pathways/' + pw.slug}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
                    >
                      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pw.color }} />
                      {pw.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Featured promotion */}
            <FeaturedPromo variant="card" />

            {/* Other journeys */}
            <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
              <div className="p-4 border-b border-brand-border">
                <h3 className="font-serif text-base font-semibold text-brand-text">Other Journeys</h3>
                <p className="text-[11px] text-brand-muted mt-0.5">Not quite your style? Try another path.</p>
              </div>
              <div className="p-3 space-y-1">
                {OTHER_PERSONAS.filter(function (p) { return p.slug !== slug }).map(function (p) {
                  const OtherIcon = ICONS[p.slug]
                  return (
                    <Link
                      key={p.slug}
                      href={'/for/' + p.slug}
                      className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-brand-bg transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: p.color + '15' }}
                      >
                        <OtherIcon size={18} color={p.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-brand-text group-hover:text-brand-accent transition-colors">{p.name}</p>
                        <p className="text-[11px] text-brand-muted">{p.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-brand-muted-light" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Help numbers */}
            <div className="px-4 py-3 bg-brand-bg rounded-xl border border-brand-border">
              <p className="text-[10px] font-mono font-bold text-brand-muted">
                Need help? <span className="text-brand-text">211</span> / <span className="text-brand-text">311</span> / <span className="text-brand-text">988</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
