'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Home, ChevronDown, ChevronRight, Menu, X,
  Heart, Users, MapPin, Megaphone, Wallet, Leaf, Globe,
  Phone, Scale, Map, Compass, MessageCircle, Layers,
  Landmark, PanelLeftClose, PanelLeftOpen, Vote, BookOpen, Sparkles,
  CalendarDays,
} from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AuthButton } from './AuthButton'
import { isRouteEnabled } from '@/lib/feature-flags'

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
  { label: 'discover.local_resources', icon: Phone, href: '/services' },
  { label: 'discover.officials', icon: Users, href: '/officials' },
  { label: 'discover.policy', icon: Scale, href: '/policies' },
  { label: 'discover.map_view', icon: Map, href: '/geography' },
  { label: 'discover.foundations', icon: Landmark, href: '/foundations' },
]

/**
 * Persistent navigation sidebar for all sub-pages.
 *
 * Same visual design as WayfinderSidebar but uses links for pathway navigation
 * (no dynamic counts or selection state). Highlights the active pathway based
 * on the current URL pathname.
 *
 * Collapsible on desktop via a toggle button. Mobile uses the same
 * hamburger/slide-in pattern as the homepage sidebar.
 */
export function NavigationSidebar({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()

  const [searchQuery, setSearchQuery] = useState('')
  const [zipInput, setZipInput] = useState('')
  const [discoverOpen, setDiscoverOpen] = useState(true)
  const [learnOpen, setLearnOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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

  // Close mobile sidebar on route change
  useEffect(function () {
    setMobileOpen(false)
  }, [pathname])

  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

  // Determine which pathway is active based on the current URL
  function getActivePathway(): string | null {
    for (const [id, theme] of themeEntries) {
      if (pathname.startsWith('/pathways/' + theme.slug)) return id
    }
    return null
  }
  const activePathway = getActivePathway()

  const sidebarContent = (
    <>
      {/* Location anchor */}
      <div className="px-5 pt-5 pb-2">
        <Link href="/" className="block group" onClick={closeMobile}>
          <span className="block font-serif text-sm tracking-[0.08em] text-brand-muted" style={{ fontVariant: 'small-caps' }}>
            {t('home.location')}
          </span>
        </Link>
      </div>

      {/* Language + Auth */}
      <div className="px-5 py-1.5 flex items-center justify-between">
        <LanguageSwitcher />
        <AuthButton />
      </div>

      <div className="h-px bg-brand-border mx-5 my-1" />

      {/* ZIP personalization */}
      <div className="px-5 py-2">
        {zip && neighborhood ? (
          <div className="text-sm leading-snug">
            <span className="font-bold text-brand-text">
              {neighborhood.neighborhood_name ?? 'Your'} {t('sidebar.edition')}
            </span>
            <span className="text-brand-muted ml-1.5 text-xs">{zip}</span>
            <button onClick={clearZip} className="text-brand-accent hover:underline ml-1.5 text-xs">
              {t('sidebar.change')}
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
              {t('sidebar.go')}
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

      {/* Home link */}
      <div className="px-4 pt-2">
        <Link
          href="/"
          className={'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
            (pathname === '/'
              ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
              : 'text-brand-muted font-semibold hover:text-brand-text hover:bg-brand-accent/[0.04]')}
        >
          <Home size={16} />
          {t('sidebar.home')}
        </Link>
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* ── Your Journey — 7 Pathways (always open, NOT collapsible) ── */}
      <div className="px-5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 font-serif">
          {t('sidebar.your_journey')}
        </span>
        <div className="space-y-0.5">
          {themeEntries.map(function ([id, theme]) {
            const isActive = activePathway === id
            const Icon = PATHWAY_ICONS[id] || Globe
            return (
              <Link
                key={id}
                href={'/pathways/' + theme.slug}
                onClick={closeMobile}
                className={'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-200 ' +
                  (isActive
                    ? 'bg-white shadow-sm font-bold text-brand-text ring-1 ring-brand-border'
                    : 'text-brand-muted font-medium hover:text-brand-text hover:bg-white/60')}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isActive ? theme.color + '20' : theme.color + '0C' }}
                >
                  <Icon size={14} style={{ color: theme.color }} />
                </div>
                <span className="flex-1 text-left truncate">{theme.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* ── Discover (collapsible) — civic resources ── */}
      <div className="px-5">
        <button
          onClick={function () { setDiscoverOpen(!discoverOpen) }}
          className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-serif"
        >
          {discoverOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {t('sidebar.discover')}
        </button>
        {discoverOpen && (
          <div className="space-y-0.5">
            {DISCOVER_LINKS.filter(function (item) { return isRouteEnabled(item.href) }).map(function (item) {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobile}
                  className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                    (isActive
                      ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                      : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
                >
                  <item.icon size={15} style={{ color: BRAND.accent }} />
                  {t(item.label)}
                </Link>
              )
            })}
            <Link
              href="/elections"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/elections')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <Vote size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.elections')}
            </Link>
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* ── Learn (collapsible) — knowledge & research ── */}
      <div className="px-5">
        <button
          onClick={function () { setLearnOpen(!learnOpen) }}
          className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-serif"
        >
          {learnOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {t('sidebar.learn')}
        </button>
        {learnOpen && (
          <div className="space-y-0.5">
            <Link
              href="/explore/knowledge-base"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/explore/knowledge-base')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <Layers size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.knowledge_base')}
            </Link>
            <Link
              href="/library"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/library')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <BookOpen size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.library')}
            </Link>
            <Link
              href="/knowledge-graph"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/knowledge-graph')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <Sparkles size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.knowledge_galaxy')}
            </Link>
            <Link
              href="/explore"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname === '/explore'
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <Search size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.topics')}
            </Link>
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* ── Connect (collapsible) — engagement ── */}
      <div className="px-5">
        <button
          onClick={function () { setConnectOpen(!connectOpen) }}
          className="flex items-center gap-1.5 w-full text-[10px] font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-serif"
        >
          {connectOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {t('sidebar.connect')}
        </button>
        {connectOpen && (
          <div className="space-y-0.5">
            <Link
              href="/compass"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/compass')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <Compass size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.compass')}
            </Link>
            <Link
              href="/calendar"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname.startsWith('/calendar')
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <CalendarDays size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.calendar')}
            </Link>
            <Link
              href="/chat"
              onClick={closeMobile}
              className={'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ' +
                (pathname === '/chat'
                  ? 'bg-brand-accent/[0.08] font-bold text-brand-text'
                  : 'text-brand-muted font-medium hover:text-brand-text hover:bg-brand-accent/[0.04]')}
            >
              <MessageCircle size={15} style={{ color: BRAND.accent }} />
              {t('sidebar.chat')}
            </Link>
          </div>
        )}
      </div>

      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* Support link */}
      <div className="px-4 py-1">
        <a
          href="https://app.betterunite.com/thechangelab#bnte_p_bwThbDPG"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-semibold text-brand-accent hover:text-brand-text hover:bg-brand-accent/[0.04] transition-colors"
        >
          <Heart size={16} />
          {t('support.button')}
        </a>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4" />
      <div className="pb-4" />
    </>
  )

  return (
    <div className="flex min-h-screen">
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
        aria-label="Navigation sidebar"
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

      {/* Desktop sidebar — collapsible */}
      <aside
        className={'hidden md:flex h-screen sticky top-0 bg-white border-r border-brand-border flex-col overflow-y-auto scrollbar-thin transition-all duration-300 ease-in-out ' +
          (collapsed ? 'w-0 min-w-0 overflow-hidden border-r-0' : 'w-[280px] min-w-[280px]')}
        aria-label="Navigation sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Desktop collapse toggle */}
      <button
        type="button"
        onClick={function () { setCollapsed(!collapsed) }}
        className="hidden md:flex fixed bottom-4 z-40 p-2 rounded-lg bg-white shadow-md border border-brand-border text-brand-muted hover:text-brand-text hover:bg-gray-50 transition-all duration-300"
        style={{ left: collapsed ? '12px' : '248px' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* Main content area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
