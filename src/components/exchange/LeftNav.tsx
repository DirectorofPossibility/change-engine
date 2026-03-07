'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Heart, ChevronDown, ChevronRight } from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { NeighborhoodWidget } from './NeighborhoodBanner'

const THEME_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id,
  name: t.name,
  color: t.color,
  slug: t.slug,
}))

// 5 intent-based navigation groups — every href resolves to an existing page.tsx
const NAV_SECTIONS = [
  {
    label: 'My Area',
    items: [
      { href: '/my-area', label: 'Civic Profile' },
      { href: '/officials', label: 'My Representatives' },
      { href: '/geography', label: 'My Neighborhood' },
      { href: '/polling-places', label: 'My Polling Place' },
    ],
  },
  {
    label: 'Get Informed',
    items: [
      { href: '/news', label: 'News' },
      { href: '/policies', label: 'Policies' },
      { href: '/elections', label: 'Elections' },
      { href: '/library', label: 'Library' },
      { href: '/explore/knowledge-base', label: 'Knowledge Base' },
    ],
  },
  {
    label: 'Find Help',
    items: [
      { href: '/help', label: 'Available Resources' },
      { href: '/services', label: 'Services' },
      { href: '/organizations', label: 'Organizations' },
      { href: '/guides', label: 'Guides' },
    ],
  },
  {
    label: 'What You Can Do',
    items: [
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/calendar', label: 'Events' },
      { href: '/foundations', label: 'Foundations' },
      { href: '/super-neighborhoods', label: 'Neighborhoods' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/compass', label: 'Compass' },
      { href: '/search', label: 'Search' },
      { href: '/learn', label: 'Learning Paths' },
      { href: '/chat', label: 'Ask Chance' },
      { href: '/about', label: 'About' },
    ],
  },
]

export function LeftNav() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'My Area': true,
    'Get Informed': true,
  })

  // Auto-expand the section containing the current page
  useEffect(function () {
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
    }
  }, [pathname])

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

      {/* Neighborhood / ZIP / Address */}
      <NeighborhoodWidget />

      {/* Navigation sections */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">

        {/* Intent-based navigation groups */}
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

        {/* Pathways — collapsed color bar links */}
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
