'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, Search } from 'lucide-react'
import { FlowerOfLifeIcon } from './FlowerIcons'
import { ArchetypeSelector } from './ArchetypeSelector'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { SpiralProgress } from './SpiralProgress'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems, isSectionVisible } from '@/lib/feature-flags'

function useCenters(t: (key: string) => string) {
  return [
    {
      label: t('d2nav.community'),
      href: '/community',
      color: '#805ad5',
      items: [
        { href: '/neighborhoods', label: t('d2nav.neighborhoods') },
        { href: '/organizations', label: t('d2nav.organizations') },
        { href: '/foundations', label: t('d2nav.foundations') },
        { href: '/calendar', label: t('d2nav.events_calendar') },
      ],
    },
    {
      label: t('d2nav.learning'),
      href: '/learning',
      color: '#3182ce',
      items: [
        { href: '/library', label: t('d2nav.library') },
        { href: '/news', label: t('d2nav.news') },
        { href: '/pathways', label: t('d2nav.topics') },
        { href: '/chat', label: t('d2nav.ask_chance') },
      ],
    },
    {
      label: t('d2nav.resources'),
      href: '/resources',
      color: '#C75B2A',
      items: [
        { href: '/services', label: t('d2nav.services') },
        { href: '/opportunities', label: t('d2nav.opportunities') },
        { href: '/help', label: t('d2nav.available_resources') },
      ],
    },
    {
      label: t('d2nav.action'),
      href: '/action',
      color: '#38a169',
      items: [
        { href: '/governance', label: t('d2nav.governance') },
        { href: '/officials', label: t('d2nav.officials') },
        { href: '/policies', label: t('d2nav.policies') },
        { href: '/elections', label: t('d2nav.elections') },
        { href: '/tirz', label: t('d2nav.tirz_zones') },
      ],
    },
    {
      label: t('d2nav.about'),
      href: '/about',
      color: '#6B6560',
      items: [
        { href: '/about', label: t('d2nav.about_us') },
        { href: '/contact', label: t('d2nav.contact') },
      ],
    },
  ]
}

function useDiscoverLinks(t: (key: string) => string) {
  return [
    { href: '/compass', label: t('d2nav.civic_compass') },
    { href: '/dashboard-live', label: t('d2nav.live_dashboard') },
    { href: '/knowledge-graph', label: t('d2nav.knowledge_graph') },
    { href: '/adventures', label: 'Community Adventures' },
    { href: '/goodthings', label: t('d2nav.three_good_things') },
    { href: '/teens', label: t('d2nav.teen_hub') },
    { href: '/call-your-senators', label: t('d2nav.call_senators') },
    { href: '/polling-places', label: t('d2nav.polling_places') },
  ]
}

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: (t as any).name, color: (t as any).color, slug: (t as any).slug }
})

export function D2Nav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { t } = useTranslation()

  const rawCenters = useCenters(t)
  const rawDiscoverLinks = useDiscoverLinks(t)

  // Filter nav items based on launch phase
  const centers = rawCenters
    .map(c => ({ ...c, items: filterNavItems(c.items) }))
    .filter(c => isSectionVisible(c.items))
  const discoverLinks = filterNavItems(rawDiscoverLinks)

  const closeDrawer = useCallback(function () { setDrawerOpen(false) }, [])

  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(function () {
    if (!drawerOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { closeDrawer(); return }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    // Focus the close button on open
    const closeBtn = drawerRef.current?.querySelector<HTMLElement>('button[aria-label="Close menu"]')
    closeBtn?.focus()
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [drawerOpen, closeDrawer])

  // Close drawer on route change
  useEffect(function () {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <>
      {/* Spectrum bar */}
      <div className="spectrum-bar relative">
        <div style={{ background: '#e53e3e' }} />
        <div style={{ background: '#dd6b20' }} />
        <div style={{ background: '#d69e2e' }} />
        <div style={{ background: '#38a169' }} />
        <div style={{ background: '#3182ce' }} />
        <div style={{ background: '#319795' }} />
        <div style={{ background: '#805ad5' }} />
      </div>

      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-brand-border" style={{ background: 'rgba(237,232,224,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <FlowerOfLifeIcon size={36} color="#C75B2A" className="group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 20px rgba(199,91,42,0.25)' }} />
            </div>
            <div className="leading-none">
              <span className="block font-serif text-[18px] font-bold text-brand-text">{t('brand.name')}</span>
              <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-brand-muted-light">{t('brand.the_change_lab')}</span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:block">
              <Link href="/search" className="p-2 rounded-md hover:bg-brand-bg transition-colors" aria-label={t('nav.search_placeholder')}>
                <Search size={18} className="text-brand-muted" />
              </Link>
            </div>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden md:block">
              <SpiralProgress variant="compact" />
            </div>
            <Link
              href="/me"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[11px] font-mono font-bold uppercase tracking-wide hover:bg-brand-accent-hover transition-colors"
            >
              {t('d2nav.my_account')}
            </Link>
            {/* Hamburger — all screens */}
            <button
              className="p-2 rounded-md hover:bg-brand-bg transition-colors"
              onClick={function () { setDrawerOpen(true) }}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[200]"
            onClick={function () { setDrawerOpen(false) }}
          />
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[90vw] z-[201] bg-brand-cream overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <FlowerOfLifeIcon size={24} color="#C75B2A" />
                <span className="font-serif text-[15px] font-bold">{t('brand.name')}</span>
              </div>
              <button onClick={function () { setDrawerOpen(false) }} aria-label="Close menu" className="p-1 rounded-md hover:bg-brand-bg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-1">
              {/* ZIP + Language + Search (mobile) */}
              <div className="flex items-center gap-3 pb-3 border-b border-brand-border">
                <ZipInput />
                <LanguageSwitcher />
                <Link href="/search" className="p-2 rounded-md hover:bg-brand-bg transition-colors md:hidden" aria-label={t('nav.search_placeholder')} onClick={closeDrawer}>
                  <Search size={18} className="text-brand-muted" />
                </Link>
              </div>

              {/* Your Journey — archetype selector */}
              <details className="group border-b border-brand-border">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">{t('d2nav.your_journey')}</span>
                </summary>
                <div className="pb-3">
                  <p className="pl-5 pb-2 text-[11px] text-brand-muted">{t('d2nav.choose_explore')}</p>
                  <ArchetypeSelector compact />
                </div>
              </details>

              {/* Centers — collapsible sections */}
              {centers.map(function (center) {
                const isActive = pathname === center.href || center.items.some(function (item) { return pathname?.startsWith(item.href) })
                return (
                  <details key={center.label} className="group border-b border-brand-border">
                    <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: center.color }} />
                      <span
                        className="font-mono text-[11px] font-bold uppercase tracking-wider group-open:text-brand-accent transition-colors"
                        style={{ color: isActive ? center.color : '#9B9590' }}
                      >
                        {center.label}
                      </span>
                    </summary>
                    <div className="pb-3 space-y-0.5">
                      <Link
                        href={center.href}
                        className="block pl-5 py-1.5 text-[12px] font-medium text-brand-muted hover:text-brand-accent transition-colors"
                        onClick={closeDrawer}
                      >
                        {t('d2nav.view_all')} &rarr;
                      </Link>
                      {center.items.map(function (item) {
                        const itemActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block pl-5 py-1.5 text-[13px] font-medium transition-colors hover:text-brand-accent"
                            style={{ color: itemActive ? '#C75B2A' : '#1A1A1A' }}
                            onClick={closeDrawer}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </details>
                )
              })}

              {/* Topics (formerly Pathways) — open by default */}
              <details open className="group border-b border-brand-border">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">{t('d2nav.topics')}</span>
                </summary>
                <div className="pb-3 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {PATHWAY_LIST.map(function (pw) {
                    return (
                      <Link
                        key={pw.id}
                        href={'/pathways/' + pw.slug}
                        className="flex items-center gap-2 px-2 py-1.5 text-[12px] font-medium hover:text-brand-accent transition-colors"
                        onClick={closeDrawer}
                      >
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pw.color }} />
                        {pw.name}
                      </Link>
                    )
                  })}
                </div>
              </details>

              {/* Discover */}
              <details className="group border-b border-brand-border">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">{t('d2nav.discover')}</span>
                </summary>
                <div className="pb-3 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {discoverLinks.map(function (item) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-2 py-1.5 text-[12px] font-medium text-brand-muted hover:text-brand-accent transition-colors"
                        onClick={closeDrawer}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </details>

              {/* Account */}
              <div className="pt-3">
                <Link
                  href="/me"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-accent text-white text-[11px] font-mono font-bold uppercase tracking-wide hover:bg-brand-accent-hover transition-colors"
                  onClick={closeDrawer}
                >
                  {t('d2nav.my_account')}
                </Link>
              </div>

              {/* Support */}
              <details className="group">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">{t('d2nav.support')}</span>
                </summary>
                <div className="pb-3 font-mono text-[11px] text-brand-muted-light space-y-1 pl-5">
                  <p>{t('d2nav.crisis')}: <strong className="text-brand-text">988</strong></p>
                  <p>{t('d2nav.city_services')}: <strong className="text-brand-text">311</strong></p>
                  <p>{t('d2nav.social_services')}: <strong className="text-brand-text">211</strong></p>
                  <p>{t('d2nav.dv_hotline')}: <strong className="text-brand-text">713-528-2121</strong></p>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </>
  )
}
