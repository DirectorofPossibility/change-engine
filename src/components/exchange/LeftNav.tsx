'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
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
  emoji: c.emoji,
}))

const QUICK_LINKS = [
  { href: '/news', label: 'News' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/services', label: 'Services' },
  { href: '/elections', label: 'Elections' },
  { href: '/library', label: 'Library' },
]

export function LeftNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeArchetype, setActiveArchetype] = useState<string | null>(null)

  // Read archetype cookie on mount
  useEffect(function () {
    const match = document.cookie.match(/(?:^|; )archetype=([^;]+)/)
    if (match) setActiveArchetype(match[1])
  }, [])

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

  return (
    <nav className="hidden lg:flex lg:flex-col w-[220px] flex-shrink-0 bg-[#FDFBF8] border-r border-brand-border overflow-y-auto sticky top-0 h-screen">

      {/* Brand mark */}
      <div className="px-4 pt-4 pb-3 border-b border-brand-border">
        <Link href="/" className="flex items-center gap-3">
          <FlowerOfLifeIcon size={36} />
          <div>
            <div className="text-sm font-bold text-brand-text leading-tight">{BRAND.name}</div>
            <div className="text-[10px] text-brand-muted italic">{BRAND.tagline}</div>
          </div>
        </Link>
      </div>

      {/* Search shortcut */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/search"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-border rounded-lg text-xs text-brand-muted hover:border-brand-accent/40 transition-colors"
        >
          <Search size={14} />
          Search resources...
        </Link>
      </div>

      {/* Archetypes — functional, set cookie + navigate */}
      <div className="px-3 pt-3 pb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">
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
                  ? 'bg-brand-accent/10 border-l-2 border-brand-accent'
                  : 'hover:bg-brand-accent/5 border-l-2 border-transparent'
              }`}
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                <a.Icon size={22} />
              </div>
              <div>
                <div className={`text-[11px] font-bold leading-tight ${isActive ? 'text-brand-accent' : 'text-brand-text'}`}>{a.name}</div>
                <div className="text-[9px] text-brand-muted leading-tight">{a.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="h-px bg-brand-border mx-3" />

      {/* Pathways */}
      <div className="px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">
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
                isActive
                  ? 'bg-brand-accent/10 font-bold'
                  : 'hover:bg-brand-accent/5'
              }`}
            >
              <span
                className="w-2 h-6 rounded-sm flex-shrink-0"
                style={{ backgroundColor: t.color, opacity: isActive ? 1 : 0.6 }}
              />
              <span className={`text-[12px] font-medium ${isActive ? 'text-brand-accent' : 'text-brand-text'}`}>
                {t.name}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="h-px bg-brand-border mx-3" />

      {/* Engagement Layers */}
      <div className="px-3 py-3">
        <Link
          href="/centers"
          className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2 block hover:text-brand-accent transition-colors"
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
                isActive
                  ? 'bg-brand-accent/10 font-bold'
                  : 'hover:bg-brand-accent/5'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color, opacity: isActive ? 1 : 0.6 }}
              />
              <span className={`text-[12px] font-medium ${isActive ? 'text-brand-accent' : 'text-brand-text'}`}>
                {c.name}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="h-px bg-brand-border mx-3" />

      {/* Explore links */}
      <div className="px-3 py-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">
          Explore
        </div>
        <Link
          href="/personas"
          className={`flex items-center gap-2 px-2 py-1 rounded-lg text-[12px] font-medium transition-colors mb-0.5 ${
            pathname === '/personas'
              ? 'bg-brand-accent/10 text-brand-accent font-bold'
              : 'text-brand-text hover:bg-brand-accent/5'
          }`}
        >
          <FlowerOfLifeIcon size={14} /> Your Journey
        </Link>
        {QUICK_LINKS.map((link) => {
          const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-2 py-1 rounded-lg text-[12px] font-medium transition-colors mb-0.5 ${
                isActive
                  ? 'bg-brand-accent/10 text-brand-accent font-bold'
                  : 'text-brand-text hover:bg-brand-accent/5'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Origin line — pushed to bottom */}
      <div className="mt-auto px-4 py-3 border-t border-brand-border">
        <div className="text-[9px] text-brand-muted italic leading-relaxed">
          {BRAND.origin || 'Built in Houston, made for everyone'}
        </div>
      </div>
    </nav>
  )
}
