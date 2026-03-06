'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Heart, ChevronDown, ChevronRight } from 'lucide-react'
import { THEMES, BRAND, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'

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

  return (
    <nav className="hidden lg:flex lg:flex-col w-[220px] flex-shrink-0 overflow-y-auto sticky top-0 h-screen" style={{ backgroundColor: '#2C2418' }}>

      {/* Brand mark */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <FlowerOfLifeIcon size={32} color="#C75B2A" />
          <div>
            <div className="text-sm font-bold text-white leading-tight">{BRAND.name}</div>
            <div className="text-[10px] text-white/40 italic">{BRAND.tagline}</div>
          </div>
        </Link>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-4 pb-1">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
        >
          <Search size={13} />
          Search...
        </Link>
      </div>

      {/* Archetypes — Your Journey */}
      <div className="px-3 pt-4 pb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2 px-2">
          Your Journey
        </div>
        {ARCHETYPES.map((a) => {
          const isActive = activeArchetype === a.id
          const centerObj = a.center ? CENTERS[a.center] : null
          return (
            <button
              key={a.id}
              onClick={function () { selectArchetype(a.id, centerObj?.slug || null) }}
              className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-left mb-0.5 ${
                isActive
                  ? 'bg-brand-accent/20 border-l-2 border-brand-accent'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                <a.Icon size={20} color={isActive ? '#C75B2A' : '#8B8580'} />
              </div>
              <div className="min-w-0">
                <div className={`text-[11px] font-bold leading-tight ${isActive ? 'text-brand-accent' : 'text-white/70'}`}>{a.name}</div>
                <div className="text-[9px] text-white/30 leading-tight truncate">{a.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="h-px bg-white/10 mx-3" />

      {/* Pathways */}
      <div className="px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2 px-2">
          Pathways
        </div>
        {THEME_LIST.map((t) => {
          const href = `/pathways/${t.slug}`
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={t.id}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors mb-0.5 ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span
                className="w-2 h-5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: t.color, opacity: isActive ? 1 : 0.5 }}
              />
              <span className={`text-[12px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {t.name}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="h-px bg-white/10 mx-3" />

      {/* Centers — Engagement */}
      <div className="px-3 py-3">
        <Link
          href="/centers"
          className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2 block hover:text-white/50 transition-colors px-2"
        >
          Engagement
        </Link>
        {CENTER_LIST.map((c) => {
          const href = `/centers/${c.slug}`
          const isActive = pathname === href || pathname?.startsWith(href + '/')
          const color = CENTER_COLORS[c.name] || '#8B7E74'
          return (
            <Link
              key={c.name}
              href={href}
              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors mb-0.5 ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, opacity: isActive ? 1 : 0.5 }}
              />
              <span className={`text-[12px] font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                {c.name}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="h-px bg-white/10 mx-3" />

      {/* Grouped navigation sections */}
      {NAV_SECTIONS.map((section) => {
        const isExpanded = expandedSections[section.label] ?? false
        const hasActiveItem = section.items.some(
          (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
        )
        return (
          <div key={section.label} className="px-3 py-2">
            <button
              onClick={function () { toggleSection(section.label) }}
              className="flex items-center gap-1.5 w-full text-[10px] font-bold uppercase tracking-wider text-white/30 hover:text-white/50 transition-colors px-2 mb-1"
            >
              {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span className={hasActiveItem ? 'text-white/50' : ''}>{section.label}</span>
            </button>
            {isExpanded && (
              <div>
                {section.items.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-2 py-1 rounded-lg text-[12px] font-medium transition-colors mb-0.5 ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/70'
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

      {/* Support + origin */}
      <div className="mt-auto px-3 pt-3 pb-2 border-t border-white/10">
        <a
          href="https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-brand-accent hover:bg-white/5 transition-colors"
        >
          <Heart size={14} className="fill-brand-accent" />
          Support Our Work
        </a>
        <div className="px-3 pt-1 text-[9px] text-white/25 italic leading-relaxed">
          {BRAND.origin || 'Built in Houston, made for everyone'}
        </div>
      </div>
    </nav>
  )
}
