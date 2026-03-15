'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Search, ChevronRight } from 'lucide-react'
import { HeaderSearch } from './HeaderSearch'
import { ArchetypeSelector } from './ArchetypeSelector'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { useSiteConfig } from '@/lib/contexts/SiteConfigContext'
import { FlowerOfLife } from '@/components/geo/sacred'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems, isSectionVisible } from '@/lib/feature-flags'

function useCenters(t: (key: string) => string) {
  return [
    {
      label: t('d2nav.community'),
      href: '/community',
      icon: '🏘',
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
      icon: '📚',
      items: [
        { href: '/library', label: t('d2nav.library') },
        { href: '/bookshelf', label: 'Bookshelf' },
        { href: '/news', label: t('d2nav.news') },
        { href: '/pathways', label: t('d2nav.topics') },
        { href: '/chat', label: t('d2nav.ask_chance') },
        { href: '/knowledge-graph', label: t('d2nav.knowledge_graph') },
        { href: '/compass', label: t('d2nav.civic_compass') },
        { href: '/sdgs', label: 'UN SDGs' },
      ],
    },
    {
      label: t('d2nav.resources'),
      href: '/resources',
      icon: '🔗',
      items: [
        { href: '/help', label: t('d2nav.available_resources') },
        { href: '/opportunities', label: t('d2nav.opportunities') },
        { href: '/geography', label: t('discover.geography') },
      ],
    },
    {
      label: t('d2nav.action'),
      href: '/action',
      icon: '⚡',
      items: [
        { href: '/governance', label: t('d2nav.governance') },
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
      icon: '✦',
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
  const showLangSwitcher = useSiteConfig('nav_language_switcher')

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
      {/* ── TOP BAR — Pathway wayfinder dots ── */}
      <div className="hidden md:block bg-ink">
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between h-8">
          {/* Pathway dots */}
          <div className="flex items-center gap-1">
            {PATHWAY_LIST.map(function (pw) {
              return (
                <Link
                  key={pw.id}
                  href={'/pathways/' + pw.slug}
                  className="group relative flex items-center gap-1 px-1.5 py-1"
                  title={pw.name}
                >
                  <span
                    className="w-2 h-2 transition-transform group-hover:scale-150"
                    style={{ background: pw.color }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 group-hover:text-white/80 transition-colors hidden lg:inline">
                    {pw.name}
                  </span>
                </Link>
              )
            })}
          </div>
          {/* Right: quick links */}
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider text-white/40">
            <Link href="/compass" className="hover:text-white/80 transition-colors">Compass</Link>
            <Link href="/search" className="hover:text-white/80 transition-colors">Search</Link>
            {showLangSwitcher && <LanguageSwitcher />}
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav
        className="sticky top-0 z-50 bg-white border-b-2 border-ink"
        style={{ height: 54 }}
      >
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between h-full">
          {/* Brand — Community Exchange logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo mark — Flower of Life in a square container */}
            <div className="relative w-8 h-8 flex items-center justify-center bg-ink group-hover:bg-blue transition-colors">
              <FlowerOfLife color="#ffffff" size={22} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-ink">
                Community Exchange
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-faint">
                Powered by The Change Lab
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/pathways"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/news"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
            >
              News
            </Link>
            <Link
              href="/help"
              className="font-mono text-[12px] uppercase tracking-[0.08em] text-dim hover:text-ink transition-colors"
            >
              Resources
            </Link>
            <Link
              href="/compass"
              className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider bg-ink text-white px-5 py-2.5 hover:bg-blue transition-colors"
            >
              {t('nav.find_my_way')}
            </Link>
          </div>

          {/* Hamburger — custom three-line with texture */}
          <button
            className="p-2 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-[5px] hover:bg-paper transition-colors group"
            onClick={function () { setDrawerOpen(true) }}
            aria-label="Open menu"
          >
            <span className="block w-5 h-[2px] bg-ink group-hover:bg-blue transition-colors" />
            <span className="block w-5 h-[2px] bg-ink group-hover:bg-blue transition-colors" />
            <span className="block w-3.5 h-[2px] bg-ink group-hover:bg-blue transition-colors" />
          </button>
        </div>
      </nav>

      {/* ── DRAWER ── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-ink/80 backdrop-blur-sm"
            onClick={function () { setDrawerOpen(false) }}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 bottom-0 w-[360px] max-w-[90vw] z-[201] bg-white overflow-y-auto border-l-2 border-ink"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 bg-ink text-white">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 flex items-center justify-center">
                  <FlowerOfLife color="#ffffff" size={20} />
                </div>
                <span className="font-display text-[15px] font-bold">Community Exchange</span>
              </div>
              <button
                onClick={function () { setDrawerOpen(false) }}
                aria-label="Close menu"
                className="p-1 text-white/60 hover:text-white transition-colors"
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
                  <ChevronRight size={12} className="text-faint transition-transform group-open:rotate-90" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.your_journey')}
                  </span>
                </summary>
                <div className="pb-3">
                  <p className="pl-5 pb-2 font-body text-[.75rem] text-dim">{t('d2nav.choose_explore')}</p>
                  <ArchetypeSelector compact />
                </div>
              </details>

              {/* Centers — with icons and better visual hierarchy */}
              {centers.map(function (center) {
                const isActive = pathname === center.href || center.items.some(function (item) { return pathname?.startsWith(item.href) })
                return (
                  <details key={center.label} className="group border-b border-rule">
                    <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <ChevronRight size={12} className="text-faint transition-transform group-open:rotate-90" />
                      <span className="text-sm mr-1">{(center as any).icon}</span>
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
                        className="block pl-7 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-dim hover:text-blue transition-colors"
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
                            className="block pl-7 py-1.5 font-body text-[.82rem] transition-colors hover:text-blue"
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

              {/* Wayfinder — Pathway dots in drawer */}
              <details open className="group border-b border-rule">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={12} className="text-faint transition-transform group-open:rotate-90" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.topics')}
                  </span>
                </summary>
                <div className="pb-3 space-y-0.5">
                  {PATHWAY_LIST.map(function (pw) {
                    return (
                      <Link
                        key={pw.id}
                        href={'/pathways/' + pw.slug}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-paper transition-colors"
                        onClick={closeDrawer}
                      >
                        <FlowerOfLife color={pw.color} size={20} className="flex-shrink-0" />
                        <span className="font-body text-[.82rem] text-ink">{pw.name}</span>
                        <span className="ml-auto w-1.5 h-1.5" style={{ background: pw.color }} />
                      </Link>
                    )
                  })}
                </div>
              </details>

              {/* Account */}
              <div className="pt-3">
                <Link
                  href="/me"
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-ink text-white font-mono text-[0.7rem] font-semibold uppercase tracking-wider hover:bg-blue transition-colors"
                  onClick={closeDrawer}
                >
                  {t('d2nav.my_account')}
                </Link>
              </div>

              {/* Support — crisis numbers always visible */}
              <details open className="group">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <ChevronRight size={12} className="text-faint transition-transform group-open:rotate-90" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-faint group-open:text-blue transition-colors">
                    {t('d2nav.support')}
                  </span>
                </summary>
                <div className="pb-3 font-mono text-[11px] text-dim space-y-1 pl-7">
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
