'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Search, MapPin } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { AuthButton } from './AuthButton'

const NAV_LINKS = [
  { href: '/pathways', key: 'nav.pathways' },
  { href: '/news', key: 'nav.news' },
  { href: '/calendar', key: 'nav.calendar' },
  { href: '/services', key: 'nav.services' },
  { href: '/elections', key: 'nav.elections' },
  { href: '/library', key: 'nav.library' },
  { href: '/explore/knowledge-base', key: 'nav.knowledge_base' },
  { href: '/knowledge-graph', key: 'nav.knowledge_galaxy' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { t } = useTranslation()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
      setSearchQuery('')
      setMenuOpen(false)
    }
  }

  return (
    <header className="bg-white border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: BRAND.accent }}>
              {BRAND.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-brand-text hover:text-brand-accent transition-colors"
                >
                  {t(link.key)}
                </Link>
              )
            })}
          </nav>

          {/* Desktop tools */}
          <div className="hidden md:flex items-center gap-3">
            <div className="border-l-2 border-brand-accent pl-3">
              <ZipInput />
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={function (e) { setSearchQuery(e.target.value) }}
                placeholder={t('nav.search_placeholder')}
                aria-label="Search the site"
                className="w-36 pl-7 pr-2 py-1 text-xs border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-accent"
              />
            </form>
            <LanguageSwitcher />
            <AuthButton />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={function () { setMenuOpen(!menuOpen) }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-brand-border pt-4 space-y-3">
            <div className="pb-3 border-b border-brand-border">
              <p className="text-xs text-brand-muted mb-2 flex items-center gap-1">
                <MapPin size={12} className="text-brand-accent" />
                {t('nav.zip_prompt')}
              </p>
              <ZipInput />
            </div>
            {NAV_LINKS.map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-brand-text hover:text-brand-accent"
                  onClick={function () { setMenuOpen(false) }}
                >
                  {t(link.key)}
                </Link>
              )
            })}
            <div className="pt-3 border-t border-brand-border space-y-3">
              <form onSubmit={handleSearch} className="relative">
                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={function (e) { setSearchQuery(e.target.value) }}
                  placeholder={t('nav.search_placeholder')}
                  aria-label="Search the site"
                  className="w-full pl-7 pr-2 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-accent"
                />
              </form>
              <div className="flex items-center justify-between">
                <LanguageSwitcher />
                <AuthButton />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
