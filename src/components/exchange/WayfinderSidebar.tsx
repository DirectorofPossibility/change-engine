'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Home, ChevronDown, ChevronRight, Menu, X,
  Heart, Users, MapPin, Megaphone, Wallet, Leaf, Globe,
  BookOpen, Calendar, Wrench, FlaskConical, Activity,
  Landmark, Compass,
} from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AuthButton } from './AuthButton'

interface WayfinderSidebarProps {
  selectedPathway: string | null
  onSelectPathway: (id: string | null) => void
  totalItems: number
  newThisWeek: number
  pathwayCounts: Record<string, number>
  topics: string[]
  onSelectTopic?: (topic: string) => void
}

const PATHWAY_ICONS: Record<string, typeof Heart> = {
  THEME_01: Heart,
  THEME_02: Users,
  THEME_03: MapPin,
  THEME_04: Megaphone,
  THEME_05: Wallet,
  THEME_06: Leaf,
  THEME_07: Globe,
}

const DISCOVER_LINKS = [
  { label: 'Events', icon: Calendar, href: '/search?q=events' },
  { label: 'Books & Guides', icon: BookOpen, href: '/guides' },
  { label: 'DIY Kits', icon: Wrench, href: '/search?q=diy+kits' },
  { label: 'Research', icon: FlaskConical, href: '/search?q=research' },
  { label: 'Activity Types', icon: Activity, href: '/explore' },
  { label: 'Foundations', icon: Landmark, href: '/foundations' },
]

export function WayfinderSidebar({
  selectedPathway,
  onSelectPathway,
  totalItems,
  newThisWeek,
  pathwayCounts,
  topics,
  onSelectTopic,
}: WayfinderSidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()

  const [searchQuery, setSearchQuery] = useState('')
  const [zipInput, setZipInput] = useState('')
  const [topicsOpen, setTopicsOpen] = useState(false)
  const [discoverOpen, setDiscoverOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push('/search?q=' + encodeURIComponent(trimmed))
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      lookupZip(zipInput)
      setZipInput('')
    }
  }

  function handleTopicClick(topic: string) {
    if (onSelectTopic) {
      onSelectTopic(topic)
    } else {
      router.push('/search?q=' + encodeURIComponent(topic))
    }
    setMobileOpen(false)
  }

  const closeMobile = useCallback(function () {
    setMobileOpen(false)
  }, [])

  useEffect(function () {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return function () { document.body.style.overflow = '' }
  }, [mobileOpen])

  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]
  const isHome = selectedPathway === null

  const sidebarContent = (
    <>
      {/* Brand lockup */}
      <div className="px-5 pt-5 pb-2">
        <Link href="/" className="block group" onClick={function () { onSelectPathway(null); closeMobile() }}>
          <span className="block font-serif text-xl font-bold leading-tight text-brand-text group-hover:text-brand-accent transition-colors">
            The Change Engine
          </span>
          <span className="block font-serif italic text-base leading-tight transition-colors mt-0.5" style={{ color: BRAND.accent }}>
            Community Exchange
          </span>
          <span className="block text-xs tracking-[0.12em] uppercase text-brand-muted mt-1">
            Houston, Texas
          </span>
        </Link>
      </div>

      {/* Language + Auth — at top per user request */}
      <div className="px-5 py-1.5 flex items-center justify-between">
        <LanguageSwitcher />
        <AuthButton />
      </div>

      {/* Thin divider */}
      <div className="h-px bg-brand-border mx-5 my-1" />

      {/* ZIP personalization */}
      <div className="px-5 py-2">
        {zip && neighborhood ? (
          <div className="text-sm leading-snug">
            <span className="font-bold text-brand-text">
              {neighborhood.neighborhood_name ?? 'Your'} Edition
            </span>
            <span className="text-brand-muted ml-1.5 text-xs">{zip}</span>
            <button onClick={clearZip} className="text-brand-accent hover:underline ml-1.5 text-xs">
              change
            </button>
          </div>
        ) : (
          <form onSubmit={handleZipSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={zipInput}
              onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
              placeholder={t('zip.enter')}
              aria-label="ZIP code"
              maxLength={5}
              disabled={isLoading}
              className="flex-1 text-sm px-3 py-1.5 border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
            />
            <button type="submit" disabled={zipInput.length !== 5 || isLoading}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity">
              Go
            </button>
          </form>
        )}
      </div>

      {/* Search */}
      <div className="px-5 py-1">
        <form onSubmit={handleSearch} className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            placeholder={t('nav.search_placeholder')}
            aria-label="Search"
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
        </form>
      </div>

      {/* Home button + live indicator */}
      <div className="px-4 pt-2">
        <button
          onClick={function () { onSelectPathway(null); closeMobile() }}
          className={'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
            (isHome
              ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
              : 'text-brand-muted font-semibold hover:text-brand-text hover:bg-brand-accent/[0.04]')}
        >
          <Home size={16} />
          Home
          <span className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-xs text-brand-muted tabular-nums">{totalItems.toLocaleString()}</span>
            {newThisWeek > 0 && (
              <span className="text-xs text-brand-accent font-semibold">+{newThisWeek}</span>
            )}
          </span>
        </button>
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* 7 Pathways */}
      <div className="px-5">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 font-serif">
          Explore Houston
        </p>
        <div className="space-y-0.5">
          {themeEntries.map(function ([id, theme]) {
            const isActive = selectedPathway === id
            const count = pathwayCounts[id] ?? 0
            const Icon = PATHWAY_ICONS[id] || Globe
            return (
              <button
                key={id}
                onClick={function () { onSelectPathway(isActive ? null : id); closeMobile() }}
                className={'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ' +
                  (isActive
                    ? 'bg-white shadow-sm font-bold text-brand-text ring-1 ring-brand-border'
                    : 'text-brand-muted font-medium hover:text-brand-text hover:bg-white/60')}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                  style={{
                    backgroundColor: isActive ? theme.color + '20' : theme.color + '0C',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <Icon size={16} style={{ color: theme.color }} />
                </div>
                <span className="flex-1 text-left truncate">{theme.name}</span>
                {count > 0 && (
                  <span
                    className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
                    style={isActive ? { backgroundColor: theme.color + '15', color: theme.color } : {}}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* Discover */}
      <div className="px-5">
        <button
          onClick={function () { setDiscoverOpen(!discoverOpen) }}
          className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-serif"
        >
          {discoverOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Discover
        </button>
        {discoverOpen && (
          <div className="space-y-0.5">
            {DISCOVER_LINKS.map(function (item) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobile}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04] transition-colors"
                >
                  <item.icon size={15} style={{ color: BRAND.accent }} />
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/help"
              onClick={closeMobile}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-brand-accent font-semibold hover:bg-brand-accent/[0.06] transition-colors"
            >
              <Compass size={15} />
              Quick Resources
            </Link>
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* Topics — wired up */}
      <div className="px-5">
        <button
          onClick={function () { setTopicsOpen(!topicsOpen) }}
          className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-serif"
        >
          {topicsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          Topics ({topics.length})
        </button>
        {topicsOpen && topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {topics.map(function (topic) {
              return (
                <button
                  key={topic}
                  onClick={function () { handleTopicClick(topic) }}
                  className="text-xs leading-none px-2.5 py-1.5 rounded-full bg-brand-border/40 text-brand-muted hover:text-brand-text hover:bg-brand-accent/10 hover:ring-1 hover:ring-brand-accent/20 cursor-pointer transition-all duration-150"
                >
                  {topic}
                </button>
              )
            })}
          </div>
        )}
        {topicsOpen && topics.length === 0 && (
          <p className="text-xs text-brand-muted italic">No topics available</p>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Bottom padding */}
      <div className="pb-4" />
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={function () { setMobileOpen(true) }}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white shadow-md border border-brand-border text-brand-text hover:bg-gray-50 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in */}
      <aside
        className={'md:hidden fixed top-0 left-0 z-50 w-[280px] h-screen bg-white border-r border-brand-border flex flex-col overflow-y-auto scrollbar-thin transition-transform duration-300 ease-in-out ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')}
        aria-label="Wayfinder sidebar"
      >
        <div className="flex justify-end px-3 pt-3">
          <button type="button" onClick={closeMobile}
            className="p-1.5 rounded-md text-brand-muted hover:text-brand-text hover:bg-gray-100 transition-colors"
            aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop sticky sidebar */}
      <aside
        className="hidden md:flex w-[280px] min-w-[280px] h-screen sticky top-0 bg-white border-r border-brand-border flex-col overflow-y-auto scrollbar-thin"
        aria-label="Wayfinder sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
