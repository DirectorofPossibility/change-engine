'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Heart, ChevronDown, ChevronRight } from 'lucide-react'
import { THEMES, BRAND, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'
import { NeighborhoodWidget } from './NeighborhoodBanner'

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id,
  name: t.name,
  color: t.color,
  slug: t.slug,
}))

const CENTER_LIST = Object.entries(CENTERS).map(([name, c]) => ({
  name,
  slug: c.slug,
}))

// Grouped navigation items — every href must resolve to an existing page.tsx
const NAV_SECTIONS = [
  {
    label: 'Discover',
    items: [
      { href: '/my-area', label: 'My Area' },
      { href: '/compass', label: 'Compass' },
      { href: '/search', label: 'Search' },
      { href: '/news', label: 'News' },
      { href: '/calendar', label: 'Calendar' },
      { href: '/geography', label: 'Map' },
    ],
  },
  {
    label: 'Civic',
    items: [
      { href: '/officials', label: 'Officials' },
      { href: '/policies', label: 'Policies' },
      { href: '/elections', label: 'Elections' },
      { href: '/polling-places', label: 'Polling Places' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { href: '/services', label: 'Services' },
      { href: '/organizations', label: 'Organizations' },
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/guides', label: 'Guides' },
      { href: '/help', label: 'Get Help' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/library', label: 'Library' },
      { href: '/explore/knowledge-base', label: 'Knowledge Base' },
      { href: '/learn', label: 'Learning Paths' },
      { href: '/chat', label: 'Ask Chance' },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/super-neighborhoods', label: 'Neighborhoods' },
      { href: '/foundations', label: 'Foundations' },
      { href: '/about', label: 'About' },
    ],
  },
]

export function LeftNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeArchetype, setActiveArchetype] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Discover: true,
    Civic: true,
  })

  useEffect(function () {
    const match = document.cookie.match(/(?:^|; )archetype=([^;]+)/)
    if (match) setActiveArchetype(match[1])
  }, [])

  // Auto-expand the section containing the current page
  useEffect(function () {
    // Check nav sections
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (pathname === item.href || pathname?.startsWith(item.href + '/')) {
          setExpandedSections(function (prev) {
            if (prev[section.label]) return prev
            return { ...prev, [section.label]: true }
          })
          return
        }
      }
    }
    // Check pathways
    if (pathname?.startsWith('/pathways/')) {
      setExpandedSections(function (prev) {
        if (prev.Pathways) return prev
        return { ...prev, Pathways: true }
      })
      return
    }
    // Check centers
    if (pathname?.startsWith('/centers/') || pathname === '/centers') {
      setExpandedSections(function (prev) {
        if (prev.Engagement) return prev
        return { ...prev, Engagement: true }
      })
    }
  }, [pathname])

  function selectArchetype(id: string, centerSlug: string | null) {
    const isDeselect = activeArchetype === id
    if (isDeselect) {
      document.cookie = 'archetype=;path=/;max-age=0'
      setActiveArchetype(null)
    } else {
      document.cookie = 'archetype=' + id + ';path=/;max-age=31536000'
      setActiveArchetype(id)
      if (centerSlug) {
        router.push('/centers/' + centerSlug)
      }
    }
  }

  function toggleSection(label: string) {
    setExpandedSections(function (prev) {
      return { ...prev, [label]: !prev[label] }
    })
  }

  const sectionHeaderClass = 'flex items-center gap-1.5 w-full text-xs font-bold uppercase tracking-wider text-brand-muted/60 hover:text-brand-muted transition-colors px-2 py-2'

  return (
    <nav className="hidden lg:flex lg:flex-col w-[220px] flex-shrink-0 overflow-y-auto sticky top-0 h-screen bg-brand-sidebar border-r border-brand-border">

      {/* Brand mark */}
      <div className="px-4 pt-5 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <FlowerOfLifeIcon size={32} color="#E8723A" />
          <div>
            <div className="text-sm font-bold text-brand-text leading-tight">{BRAND.name}</div>
            <div className="text-xs text-brand-muted italic">{BRAND.tagline}</div>
          </div>
        </Link>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pb-2">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 bg-white/60 border border-brand-border rounded-lg text-xs text-brand-muted hover:bg-white hover:text-brand-text transition-colors"
        >
          <Search size={13} />
          Search...
        </Link>
      </div>

      {/* Neighborhood / ZIP */}
      <NeighborhoodWidget />

      {/* All sections in one flowing list */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">

        {/* Your Journey (Archetypes) */}
        <div className="mb-1">
          <button onClick={function () { toggleSection('Journey') }} className={sectionHeaderClass} aria-expanded={!!expandedSections.Journey}>
            {expandedSections.Journey ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Your Journey</span>
          </button>
          {expandedSections.Journey && (
            <div className="pb-1">
              {ARCHETYPES.map(function (a) {
                const isActive = activeArchetype === a.id
                const centerObj = a.center ? CENTERS[a.center] : null
                return (
                  <button
                    key={a.id}
                    onClick={function () { selectArchetype(a.id, centerObj?.slug || null) }}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-left mb-0.5 ${
                      isActive
                        ? 'bg-brand-accent/10 border-l-2 border-brand-accent'
                        : 'hover:bg-white/60 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                      <a.Icon size={20} color={isActive ? '#E8723A' : '#9CA3AF'} />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold leading-tight ${isActive ? 'text-brand-accent' : 'text-brand-text/80'}`}>{a.name}</div>
                      <div className="text-xs text-brand-muted leading-tight truncate">{a.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pathways */}
        <div className="mb-1">
          <button onClick={function () { toggleSection('Pathways') }} className={sectionHeaderClass} aria-expanded={!!expandedSections.Pathways}>
            {expandedSections.Pathways ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Pathways</span>
          </button>
          {expandedSections.Pathways && (
            <div className="pb-1">
              {THEME_LIST.map(function (t) {
                const href = `/pathways/${t.slug}`
                const isActive = pathname === href || pathname?.startsWith(href + '/')
                return (
                  <Link
                    key={t.id}
                    href={href}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors mb-0.5 ${
                      isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                    }`}
                  >
                    <span
                      className="w-2 h-5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: t.color, opacity: isActive ? 1 : 0.6 }}
                    />
                    <span className={`text-xs font-medium ${isActive ? 'text-brand-text font-semibold' : 'text-brand-text/70'}`}>
                      {t.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Centers — Engagement */}
        <div className="mb-1">
          <button onClick={function () { toggleSection('Engagement') }} className={sectionHeaderClass} aria-expanded={!!expandedSections.Engagement}>
            {expandedSections.Engagement ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            <span>Engagement</span>
          </button>
          {expandedSections.Engagement && (
            <div className="pb-1">
              {CENTER_LIST.map(function (c) {
                const href = `/centers/${c.slug}`
                const isActive = pathname === href || pathname?.startsWith(href + '/')
                const color = CENTER_COLORS[c.name] || '#8B7E74'
                return (
                  <Link
                    key={c.name}
                    href={href}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors mb-0.5 ${
                      isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color, opacity: isActive ? 1 : 0.6 }}
                    />
                    <span className={`text-xs font-medium ${isActive ? 'text-brand-text font-semibold' : 'text-brand-text/70'}`}>
                      {c.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Grouped navigation sections */}
        {NAV_SECTIONS.map(function (section) {
          const isExpanded = expandedSections[section.label] ?? false
          const hasActiveItem = section.items.some(
            function (item) { return pathname === item.href || pathname?.startsWith(item.href + '/') }
          )
          return (
            <div key={section.label} className="mb-1">
              <button
                onClick={function () { toggleSection(section.label) }}
                className={sectionHeaderClass}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span className={hasActiveItem ? 'text-brand-muted' : ''}>{section.label}</span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {section.items.map(function (link) {
                    const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block px-2 py-1 rounded-lg text-xs font-medium transition-colors mb-0.5 ${
                          isActive
                            ? 'bg-white shadow-sm text-brand-text font-semibold'
                            : 'text-brand-text/60 hover:bg-white/60 hover:text-brand-text/80'
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Support + origin */}
      <div className="px-3 pt-3 pb-2 border-t border-brand-border">
        <a
          href="https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-accent hover:bg-white/60 transition-colors"
        >
          <Heart size={14} className="fill-brand-accent" />
          Support Our Work
        </a>
        <div className="px-3 pt-1 text-xs text-brand-muted italic leading-relaxed">
          {BRAND.origin || 'Built in Houston, made for everyone'}
        </div>
      </div>
    </nav>
  )
}
