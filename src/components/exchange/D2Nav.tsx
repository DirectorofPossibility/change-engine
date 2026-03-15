'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Search } from 'lucide-react'
import { HeaderSearch } from './HeaderSearch'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { FlowerOfLife } from '@/components/geo/sacred'
import { useTranslation } from '@/lib/use-translation'
import { filterNavItems } from '@/lib/feature-flags'

const DRAWER_LINKS = [
  { href: '/news', label: 'News' },
  { href: '/library', label: 'Library' },
  { href: '/elections', label: 'Elections' },
  { href: '/goodthings', label: 'Three Good Things' },
  { href: '/opportunities', label: 'Volunteer' },
]

export function D2Nav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { t } = useTranslation()

  const visibleLinks = filterNavItems(DRAWER_LINKS)

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
      {/* ── MAIN NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-rule h-14">
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between h-full">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center bg-ink group-hover:bg-blue transition-colors">
              <FlowerOfLife color="#ffffff" size={24} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg font-bold text-ink">
                Community Exchange
              </span>
              <span className="text-xs text-muted">
                Powered by The Change Lab
              </span>
            </div>
          </Link>

          {/* Hamburger */}
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
            className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[85vw] z-[201] bg-white overflow-y-auto border-l border-rule"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
              <span className="font-display text-base font-bold text-ink">Menu</span>
              <button
                onClick={function () { setDrawerOpen(false) }}
                aria-label="Close menu"
                className="p-1 text-muted hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4">
              {/* Search */}
              <div className="pb-4 border-b border-rule">
                <div className="flex items-center gap-3">
                  <ZipInput />
                  <LanguageSwitcher />
                  <Link
                    href="/search"
                    className="p-2 hover:bg-paper transition-colors"
                    aria-label={t('nav.search_placeholder')}
                    onClick={closeDrawer}
                  >
                    <Search size={18} className="text-muted" />
                  </Link>
                </div>
                <div className="hidden md:block mt-3">
                  <HeaderSearch />
                </div>
              </div>

              {/* Main links */}
              <div className="py-4 space-y-1">
                {visibleLinks.map(function (link) {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block py-2.5 text-base transition-colors hover:text-blue"
                      style={{ color: isActive ? '#1b5e8a' : undefined }}
                      onClick={closeDrawer}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>

              {/* Account */}
              <div className="pt-4 border-t border-rule">
                <Link
                  href="/me"
                  className="flex items-center justify-center py-2.5 bg-ink text-white text-sm font-semibold hover:bg-blue transition-colors"
                  onClick={closeDrawer}
                >
                  {t('d2nav.my_account')}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
