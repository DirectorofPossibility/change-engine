/**
 * @fileoverview Compact wayfinder navigation bar for sub-pages.
 *
 * Provides a thin top bar with the site logo, pathway dots for quick
 * navigation, ZIP input, search link, language switcher, and auth.
 * Used on all pages except the homepage (which has the full wayfinder sidebar).
 *
 * @route Client component used in (pages)/layout.tsx
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ChevronLeft } from 'lucide-react'
import { THEMES, BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { AuthButton } from './AuthButton'

const PATHWAYS = Object.entries(THEMES).map(function ([id, theme]) {
  return { id, name: theme.name, color: theme.color }
})

/**
 * Compact wayfinder navigation bar for sub-pages.
 *
 * Renders a thin header with pathway dots, search, and ZIP input.
 * Clicking a pathway dot navigates to that pathway's page.
 */
export function WayfinderNav() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()
  const { t } = useTranslation()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 gap-4">
          {/* Home link */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <ChevronLeft size={16} className="text-brand-muted group-hover:text-brand-accent transition-colors" />
            <span className="font-serif text-lg font-semibold tracking-tight" style={{ color: BRAND.accent }}>
              CE
            </span>
          </Link>

          {/* Pathway dots */}
          <nav className="hidden sm:flex items-center gap-1.5 mx-2" aria-label="Pathways">
            {PATHWAYS.map(function (p) {
              return (
                <Link
                  key={p.id}
                  href={'/pathways/' + p.id.replace('THEME_', '').toLowerCase()}
                  className="group relative"
                  title={p.name}
                >
                  <span
                    className="block w-3 h-3 rounded-full transition-transform group-hover:scale-150"
                    style={{ backgroundColor: p.color }}
                  />
                </Link>
              )
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-1">
              <input
                type="text"
                value={searchQuery}
                onChange={function (e) { setSearchQuery(e.target.value) }}
                placeholder={t('nav.search_placeholder')}
                autoFocus
                className="w-40 sm:w-56 pl-3 pr-2 py-1 text-xs border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-accent"
              />
              <button
                type="button"
                onClick={function () { setSearchOpen(false); setSearchQuery('') }}
                className="text-brand-muted text-xs hover:text-brand-text"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={function () { setSearchOpen(true) }}
              className="p-1.5 text-brand-muted hover:text-brand-accent transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          )}

          {/* ZIP */}
          <div className="hidden sm:block border-l border-brand-border pl-3">
            <ZipInput />
          </div>

          {/* Language */}
          <LanguageSwitcher />

          {/* Auth */}
          <AuthButton />
        </div>
      </div>
    </header>
  )
}
