'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Search } from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { AuthButton } from './AuthButton'

const NAV_LINKS = [
  { href: '/pathways', label: 'Pathways' },
  { href: '/help', label: 'I Need Help' },
  { href: '/officials', label: 'Officials' },
  { href: '/officials/lookup', label: 'Find Your Reps' },
  { href: '/services', label: 'Services' },
  { href: '/elections', label: 'Elections' },
  { href: '/learn', label: 'Learn' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop tools */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={function (e) { setSearchQuery(e.target.value) }}
                placeholder="Search..."
                aria-label="Search the site"
                className="w-36 pl-7 pr-2 py-1 text-xs border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-accent"
              />
            </form>
            <ZipInput />
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
            {NAV_LINKS.map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-brand-text hover:text-brand-accent"
                  onClick={function () { setMenuOpen(false) }}
                >
                  {link.label}
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
                  placeholder="Search..."
                  className="w-full pl-7 pr-2 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:border-brand-accent"
                />
              </form>
              <div className="flex items-center justify-between">
                <ZipInput />
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
