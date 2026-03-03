/**
 * @fileoverview Persistent left sidebar for the Community Exchange wayfinder.
 *
 * Renders a fixed-width (280 px) sidebar that stays pinned to the left edge of
 * the viewport. It contains the full wayfinder navigation surface:
 *
 *   - Brand lockup (logo / subtitle)
 *   - ZIP-code personalization input
 *   - Site search
 *   - Home shortcut + live indicator
 *   - 4 Centers filter buttons
 *   - 7 Pathways navigation buttons (with resource counts)
 *   - Collapsible topics pill cloud
 *   - Language switcher, auth, and footer links
 *
 * All user-facing strings are resolved through {@link useTranslation} so the
 * sidebar renders correctly in English, Spanish, and Vietnamese.
 *
 * On mobile (< md), the sidebar is hidden by default and toggled via a
 * hamburger button that renders a slide-in overlay with backdrop.
 *
 * @example
 * ```tsx
 * <WayfinderSidebar
 *   selectedPathway={activePathway}
 *   onSelectPathway={setActivePathway}
 *   activeCenter={activeCenter}
 *   onSelectCenter={setActiveCenter}
 *   totalItems={1247}
 *   newThisWeek={23}
 *   pathwayCounts={{ THEME_01: 184, THEME_02: 201, ... }}
 *   topics={['Housing', 'Transit', 'Food Access']}
 * />
 * ```
 */

'use client'

// -- Imports --

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Home, ChevronDown, ChevronRight, Menu, X } from 'lucide-react'
import { THEMES, CENTERS, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AuthButton } from './AuthButton'

// -- Types --

/**
 * Props accepted by {@link WayfinderSidebar}.
 *
 * The parent page is responsible for managing selection state and fetching
 * server-side counts; the sidebar is a pure presentation + input surface.
 */
interface WayfinderSidebarProps {
  /** Currently selected pathway ID (e.g. `'THEME_01'`), or `null` for home. */
  selectedPathway: string | null
  /** Callback fired when the user selects a pathway (or `null` to go home). */
  onSelectPathway: (id: string | null) => void
  /** Currently active center filter key (e.g. `'Learning'`), or `null`. */
  activeCenter: string | null
  /** Callback fired when the user selects a center (or `null` to clear). */
  onSelectCenter: (center: string | null) => void
  /** Total published resource / content items across the platform. */
  totalItems: number
  /** Number of items added in the current week (displayed next to live dot). */
  newThisWeek: number
  /** Map of pathway IDs to their published item counts. */
  pathwayCounts: Record<string, number>
  /** Focus-area topic labels rendered as small pills. */
  topics: string[]
}

// -- Constants --

/** Static color assignments for the 4 Centers (no color in the CENTERS const). */
const CENTER_COLORS: Record<string, string> = {
  Learning: '#3182ce',
  Action: '#38a169',
  Resource: '#d69e2e',
  Accountability: '#805ad5',
}

// -- Component --

/**
 * Persistent left-hand wayfinder sidebar for the Community Exchange.
 *
 * Renders a vertically-scrollable, fixed-width column with every navigation
 * control the user needs: ZIP personalization, search, pathway/center
 * filtering, topic browsing, language toggle, and auth.
 *
 * On screens narrower than `md` (768 px), the sidebar is hidden behind a
 * hamburger toggle and slides in as a full-height overlay with a translucent
 * backdrop.
 *
 * @param props - See {@link WayfinderSidebarProps}.
 * @returns The sidebar `aside` element plus a mobile hamburger trigger.
 */
export function WayfinderSidebar({
  selectedPathway,
  onSelectPathway,
  activeCenter,
  onSelectCenter,
  totalItems,
  newThisWeek,
  pathwayCounts,
  topics,
}: WayfinderSidebarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()

  // -- Local state --

  const [searchQuery, setSearchQuery] = useState('')
  const [zipInput, setZipInput] = useState('')
  const [centersOpen, setCentersOpen] = useState(true)
  const [topicsOpen, setTopicsOpen] = useState(false)
  /** Whether the mobile overlay sidebar is open. */
  const [mobileOpen, setMobileOpen] = useState(false)

  // -- Handlers --

  /** Submit the search form and navigate to the search results page. */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push('/search?q=' + encodeURIComponent(trimmed))
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  /** Submit the ZIP input and trigger neighborhood lookup. */
  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      lookupZip(zipInput)
      setZipInput('')
    }
  }

  /** Close the mobile sidebar when the user navigates. */
  const closeMobile = useCallback(function () {
    setMobileOpen(false)
  }, [])

  /** Lock body scroll when mobile overlay is open. */
  useEffect(function () {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return function () {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // -- Derived values --

  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]
  const centerEntries = Object.entries(CENTERS)
  const isHome = selectedPathway === null && activeCenter === null

  // -- Sidebar content (shared between desktop & mobile) --

  /**
   * Inner content rendered inside the `<aside>`. Extracted so it can be
   * rendered identically in both the desktop sticky sidebar and the mobile
   * slide-in overlay.
   */
  const sidebarContent = (
    <>
      {/* -- Brand lockup -- */}
      <div className="px-5 pt-5 pb-3">
        <Link href="/" className="block group" onClick={function () { onSelectPathway(null); closeMobile() }}>
          <span className="block font-serif text-xl font-bold leading-tight text-brand-text group-hover:text-brand-accent transition-colors">
            The Change Engine
          </span>
          <span
            className="block font-serif italic text-base leading-tight transition-colors mt-0.5"
            style={{ color: BRAND.accent }}
          >
            Community Exchange
          </span>
          <span className="block text-xs tracking-[0.12em] uppercase text-brand-muted mt-1">
            Houston, Texas
          </span>
        </Link>
      </div>

      {/* -- ZIP personalization -- */}
      <div className="px-5 py-2">
        {zip && neighborhood ? (
          <div className="text-sm leading-snug">
            <span className="font-bold text-brand-text">
              {neighborhood.neighborhood_name ?? 'Your'} Edition
            </span>
            <span className="text-brand-muted ml-1.5 text-xs">{zip}</span>
            <button
              onClick={clearZip}
              className="text-brand-accent hover:underline ml-1.5 text-xs"
            >
              {t('zip.clear').toLowerCase() === t('zip.clear') ? 'change' : t('zip.clear')}
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
              className="flex-1 text-sm px-3 py-2 border border-brand-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
            />
            <button
              type="submit"
              disabled={zipInput.length !== 5 || isLoading}
              className="text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-md bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Go
            </button>
          </form>
        )}
      </div>

      {/* -- Search -- */}
      <div className="px-5 py-1.5">
        <form onSubmit={handleSearch} className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            placeholder={t('nav.search_placeholder')}
            aria-label="Search resources, officials..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-brand-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
        </form>
      </div>

      {/* -- Home button -- */}
      <div className="px-4 pt-3">
        <button
          onClick={function () { onSelectPathway(null); onSelectCenter(null); closeMobile() }}
          className={
            'flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors ' +
            (isHome
              ? 'bg-[#3D5A5A]/[0.07] font-bold text-brand-text'
              : 'text-brand-muted font-semibold hover:text-brand-text hover:bg-[#3D5A5A]/[0.04]')
          }
        >
          <Home size={16} />
          Home
        </button>
      </div>

      {/* -- Live indicator -- */}
      <div className="px-6 py-2 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-bold tracking-wider text-green-700 uppercase">
          Live
        </span>
        <span className="text-xs text-brand-muted">
          {totalItems.toLocaleString()} items
        </span>
        {newThisWeek > 0 && (
          <span className="text-xs text-brand-accent font-semibold">
            +{newThisWeek}
          </span>
        )}
      </div>

      {/* -- Divider -- */}
      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* -- 4 Centers -- */}
      <div className="px-5">
        <button
          onClick={function () { setCentersOpen(!centersOpen) }}
          className="flex items-center gap-1.5 w-full text-xs font-bold tracking-[0.12em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors"
        >
          {centersOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {t('home.four_centers')}
        </button>
        {centersOpen && (
          <div className="space-y-0.5">
            {centerEntries.map(function ([key, center]) {
              const isActive = activeCenter === key
              return (
                <button
                  key={key}
                  onClick={function () { onSelectCenter(isActive ? null : key); closeMobile() }}
                  className={
                    'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors ' +
                    (isActive
                      ? 'bg-[#3D5A5A]/[0.07] font-bold text-brand-text'
                      : 'text-brand-muted font-semibold hover:text-brand-text hover:bg-[#3D5A5A]/[0.04]')
                  }
                  title={center.question}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CENTER_COLORS[key] ?? BRAND.muted }}
                  />
                  {key}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* -- Divider -- */}
      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* -- 7 Pathways -- */}
      <div className="px-5">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-brand-muted mb-2">
          Explore Houston
        </p>
        <div className="space-y-0.5">
          {themeEntries.map(function ([id, theme]) {
            const isActive = selectedPathway === id
            const count = pathwayCounts[id] ?? 0
            return (
              <button
                key={id}
                onClick={function () { onSelectPathway(isActive ? null : id); closeMobile() }}
                className={
                  'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors ' +
                  (isActive
                    ? 'bg-[#3D5A5A]/[0.07] font-bold text-brand-text'
                    : 'text-brand-muted font-semibold hover:text-brand-text hover:bg-[#3D5A5A]/[0.04]')
                }
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="flex-1 text-left truncate">{theme.name}</span>
                {count > 0 && (
                  <span className="text-xs text-brand-muted tabular-nums">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* -- Divider -- */}
      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* -- Topics -- */}
      <div className="px-5">
        <button
          onClick={function () { setTopicsOpen(!topicsOpen) }}
          className="flex items-center gap-1.5 w-full text-xs font-bold tracking-[0.12em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors"
        >
          {topicsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Topics
        </button>
        {topicsOpen && topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topics.map(function (topic) {
              return (
                <span
                  key={topic}
                  className="text-xs leading-none px-2 py-1 rounded-full bg-brand-border/60 text-brand-muted hover:text-brand-text hover:bg-brand-border cursor-default transition-colors"
                >
                  {topic}
                </span>
              )
            })}
          </div>
        )}
        {topicsOpen && topics.length === 0 && (
          <p className="text-xs text-brand-muted italic">No topics available</p>
        )}
      </div>

      {/* -- Spacer to push footer controls to bottom -- */}
      <div className="flex-1 min-h-4" />

      {/* -- Divider -- */}
      <div className="h-px bg-brand-border mx-5 my-2" />

      {/* -- Language switcher -- */}
      <div className="px-5 py-1.5 flex justify-center">
        <LanguageSwitcher />
      </div>

      {/* -- Auth button -- */}
      <div className="px-5 py-1.5 flex justify-center">
        <AuthButton />
      </div>

      {/* -- Bottom padding -- */}
      <div className="pb-4" />
    </>
  )

  // -- Render --

  return (
    <>
      {/* ---- Mobile hamburger trigger (visible < md) ---- */}
      <button
        type="button"
        onClick={function () { setMobileOpen(true) }}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-white shadow-md border border-brand-border text-brand-text hover:bg-gray-50 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* ---- Mobile overlay backdrop (visible < md when open) ---- */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* ---- Mobile slide-in sidebar (visible < md when open) ---- */}
      <aside
        className={
          'md:hidden fixed top-0 left-0 z-50 w-[280px] h-screen bg-white border-r border-brand-border flex flex-col overflow-y-auto scrollbar-thin transition-transform duration-300 ease-in-out ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
        aria-label="Wayfinder sidebar"
      >
        {/* Close button for mobile overlay */}
        <div className="flex justify-end px-3 pt-3">
          <button
            type="button"
            onClick={closeMobile}
            className="p-1.5 rounded-md text-brand-muted hover:text-brand-text hover:bg-gray-100 transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* ---- Desktop sticky sidebar (visible >= md) ---- */}
      <aside
        className="hidden md:flex w-[280px] min-w-[280px] h-screen sticky top-0 bg-white border-r border-brand-border flex-col overflow-y-auto scrollbar-thin"
        aria-label="Wayfinder sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  )
}
