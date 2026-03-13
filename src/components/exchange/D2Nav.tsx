'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, Search } from 'lucide-react'
import { HeaderSearch } from './HeaderSearch'
import { ArchetypeSelector } from './ArchetypeSelector'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { SeedOfLife, FlowerOfLife } from '@/components/geo/sacred'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems, isSectionVisible } from '@/lib/feature-flags'

function useCenters(t: (key: string) => string) {
  return [
    {
      label: t('d2nav.community'),
      href: '/community',
      items: [
        { href: '/neighborhoods', label: t('d2nav.neighborhoods') },
        { href: '/organizations', label: t('d2nav.organizations') },
        { href: '/foundations', label: t('d2nav.foundations') },
        { href: '/calendar', label: t('d2nav.events_calendar') },
        { href: '/adventures', label: t('ui.community_adventures') },
        { href: '/goodthings', label: t('d2nav.three_good_things') },
        { href: '/teens', label: t('d2nav.teen_hub') },
      ],
    },
    {
      label: t('d2nav.learning'),
      href: '/learning',
      items: [
        { href: '/library', label: t('d2nav.library') },
        { href: '/news', label: t('d2nav.news') },
        { href: '/pathways', label: t('d2nav.topics') },
        { href: '/chat', label: t('d2nav.ask_chance') },
        { href: '/knowledge-graph', label: t('d2nav.knowledge_graph') },
        { href: '/compass', label: t('d2nav.civic_compass') },
      ],
    },
    {
      label: t('d2nav.resources'),
      href: '/resources',
      items: [
        { href: '/services', label: t('d2nav.services') },
        { href: '/opportunities', label: t('d2nav.opportunities') },
        { href: '/help', label: t('d2nav.available_resources') },
        { href: '/geography', label: t('discover.geography') },
      ],
    },
    {
      label: t('d2nav.action'),
      href: '/action',
      items: [
        { href: '/governance', label: t('d2nav.governance') },
        { href: '/officials', label: t('d2nav.officials') },
        { href: '/policies', label: t('d2nav.policies') },
        { href: '/elections', label: t('d2nav.elections') },
        { href: '/tirz', label: t('d2nav.tirz_zones') },
        { href: '/call-your-senators', label: t('d2nav.call_senators') },
        { href: '/polling-places', label: t('d2nav.polling_places') },
        { href: '/dashboard-live', label: t('d2nav.live_dashboard') },
      ],
    },
    {
      label: t('d2nav.about'),
      href: '/about',
      items: [
        { href: '/about', label: t('d2nav.about_us') },
        { href: '/contact', label: t('d2nav.contact') },
      ],
    },
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

  const centers = rawCenters
    .map(c => ({ ...c, items: filterNavItems(c.items) }))
    .filter(c => isSectionVisible(c.items))

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
    const closeBtn = drawerRef.current?.querySelector<HTMLElement>('button[aria-label="Close menu"]')
    closeBtn?.focus()
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [drawerOpen, closeDrawer])

  useEffect(function () {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <>
      {/* Site nav — matches page-system.html .site-nav */}
      <nav
        className="sticky top-0 z-50 bg-white border-b-2 border-ink"
        style={{ height: 54 }}
      >
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between h-full">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <SeedOfLife color="#1b5e8a" size={28} />
            <span className="font-display text-[1rem] font-bold tracking-[-0.01em] text-ink">
              {t('nav.change_engine')}
            </span>
            <span
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim border border-rule px-1.5 py-0.5"
            >
              {t('nav.edition')}
            </span>
          </Link>

          {/* Right side — desktop links */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-5">
              <Link
                href="/help"
                className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
              >
                Help
              </Link>
              <Link
                href="/officials"
                className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
              >
                Officials
              </Link>
              <Link
                href="/services"
                className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
              >
                Services
              </Link>
            </div>
            <Link
              href="/compass"
              className="hidden md:block font-mono text-[0.7rem] font-semibold uppercase tracking-wider bg-ink text-white px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              {t('nav.find_my_way')}
            </Link>
            {/* Language (desktop) */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            {/* Hamburger */}
            <button
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-paper transition-colors"
              onClick={function () { setDrawerOpen(true) }}
              aria-label="Open menu"
            >
              <Menu size={22} className="text-ink" />
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/70"
            onClick={function () { setDrawerOpen(false) }}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[90vw] z-[201] bg-white overflow-y-auto border-l-2 border-ink"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
              <div className="flex items-center gap-2.5">
                <SeedOfLife color="#1b5e8a" size={24} />
                <span className="font-display text-[15px] font-bold text-ink">{t('nav.change_engine')}</span>
              </div>
              <button
                onClick={function () { setDrawerOpen(false) }}
                aria-label="Close menu"
                className="p-1 font-mono text-dim hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-1">
              {/* ZIP + Language + Search (mobile) */}
              <div className="flex items-center gap-3 pb-3 border-b border-rule">
                <ZipInput />
                <LanguageSwitcher />
                <Link
                  href="/search"
                  className="p-2 hover:bg-paper transition-colors md:hidden"
                  aria-label={t('nav.search_placeholder')}
                  onClick={closeDrawer}
                >
                  <Search size={18} className="text-dim" />
                </Link>
              </div>

              {/* Desktop search */}
              <div className="hidden md:block pb-3 border-b border-rule">
                <HeaderSearch />
              </div>

              {/* Your Journey */}
              <details className="group border-b border-rule">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-faint transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.your_journey')}
                  </span>
                </summary>
                <div className="pb-3">
                  <p className="pl-5 pb-2 font-body text-[.75rem] text-dim">{t('d2nav.choose_explore')}</p>
                  <ArchetypeSelector compact />
                </div>
              </details>

              {/* Centers */}
              {centers.map(function (center) {
                const isActive = pathname === center.href || center.items.some(function (item) { return pathname?.startsWith(item.href) })
                return (
                  <details key={center.label} className="group border-b border-rule">
                    <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <svg width="10" height="10" viewBox="0 0 10 10" className="text-faint transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                      <span
                        className="font-mono text-[11px] uppercase tracking-[0.08em] group-open:text-blue transition-colors"
                        style={{ color: isActive ? '#1b5e8a' : '#8a929e' }}
                      >
                        {center.label}
                      </span>
                    </summary>
                    <div className="pb-3 space-y-0.5">
                      <Link
                        href={center.href}
                        className="block pl-5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-dim hover:text-blue transition-colors"
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
                            className="block pl-5 py-1.5 font-body text-[.82rem] transition-colors hover:text-blue"
                            style={{ color: itemActive ? '#1b5e8a' : '#0d1117' }}
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

              {/* Centers = what you can do · Topics = what it's about */}
              <div className="py-2 px-1">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.06em] text-faint leading-relaxed">
                  Centers organize by action. Topics organize by theme.
                </p>
              </div>

              {/* Topics (Pathways) */}
              <details open className="group border-b border-rule">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-faint transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.topics')}
                  </span>
                </summary>
                <div className="pb-3 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {PATHWAY_LIST.map(function (pw) {
                    return (
                      <Link
                        key={pw.id}
                        href={'/pathways/' + pw.slug}
                        className="flex items-center gap-2 px-2 py-1.5 font-body text-[.78rem] hover:text-blue transition-colors"
                        onClick={closeDrawer}
                      >
                        <FlowerOfLife color={pw.color} size={18} className="flex-shrink-0" />
                        {pw.name}
                      </Link>
                    )
                  })}
                </div>
              </details>

              {/* Account */}
              <div className="pt-3">
                <Link
                  href="/me"
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-ink text-white font-mono text-[0.7rem] font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                  onClick={closeDrawer}
                >
                  {t('d2nav.my_account')}
                </Link>
              </div>

              {/* Support — open by default so crisis numbers are always visible */}
              <details open className="group">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-faint transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.support')}
                  </span>
                </summary>
                <div className="pb-3 font-mono text-[11px] text-dim space-y-1 pl-5">
                  <p>{t('d2nav.crisis')}: <strong className="text-ink">988</strong></p>
                  <p>{t('d2nav.city_services')}: <strong className="text-ink">311</strong></p>
                  <p>{t('d2nav.social_services')}: <strong className="text-ink">211</strong></p>
                  <p>{t('d2nav.dv_hotline')}: <strong className="text-ink">713-528-2121</strong></p>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </>
  )
}
