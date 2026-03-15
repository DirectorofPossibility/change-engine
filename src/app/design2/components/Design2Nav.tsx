'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Menu, X, ChevronDown } from 'lucide-react'
import { FlowerOfLifeIcon } from '@/components/exchange/FlowerIcons'
import { LanguageSwitcher } from '@/components/exchange/LanguageSwitcher'
import { ZipInput } from '@/components/exchange/ZipInput'

const NAV_CENTERS = [
  {
    label: 'Community',
    color: '#805ad5',
    items: [
      { href: '/design2/neighborhoods', label: 'Neighborhoods' },
      { href: '/design2/organizations', label: 'Organizations' },
      { href: '/design2/foundations', label: 'Foundations' },
      { href: '/design2/events', label: 'Events & Calendar' },
    ],
  },
  {
    label: 'Learning',
    color: '#3182ce',
    items: [
      { href: '/design2/library', label: 'Library' },
      { href: '/design2/news', label: 'News' },
      { href: '/design2/pathways', label: 'Pathways' },
      { href: '/design2/chat', label: 'Ask Chance' },
    ],
  },
  {
    label: 'Resources',
    color: '#C75B2A',
    items: [
      { href: '/design2/services', label: 'Services' },
      { href: '/design2/opportunities', label: 'Opportunities' },
      { href: '/design2/search', label: 'Search' },
    ],
  },
  {
    label: 'Action',
    color: '#38a169',
    items: [
      { href: '/design2/officials', label: 'Officials' },
      { href: '/design2/policies', label: 'Policies' },
      { href: '/design2/explore', label: 'Explore' },
    ],
  },
]

interface Design2NavProps {
  election?: {
    election_name: string
    election_date: string
    find_polling_url: string | null
    register_url: string | null
  } | null
}

export function Design2Nav({ election }: Design2NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  return (
    <>
      {/* Election banner */}
      {election && (
        <div className="text-center text-sm py-2 px-4 font-semibold" style={{ background: '#1a1a2e', color: '#C75B2A' }}>
          {election.election_name} — {new Date(election.election_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {election.find_polling_url && (
            <a href={election.find_polling_url} target="_blank" rel="noopener noreferrer" className="ml-3 underline" style={{ color: 'white' }}>Find your polling place</a>
          )}
        </div>
      )}

      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(247,242,234,0.95)', backdropFilter: 'blur(12px)', borderColor: '#E2DDD5' }}>
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between" style={{ height: 56 }}>
          {/* Brand */}
          <Link href="/design2" className="flex items-center gap-2.5">
            <FlowerOfLifeIcon size={28} color="#C75B2A" />
            <span className="font-serif text-[17px] font-semibold" style={{ color: '#1a1a1a' }}>Community Exchange</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_CENTERS.map(function (center) {
              const isActive = center.items.some(function (i) { return pathname?.startsWith(i.href) })
              return (
                <div
                  key={center.label}
                  className="relative group"
                  onMouseEnter={function () { setOpenDropdown(center.label) }}
                  onMouseLeave={function () { setOpenDropdown(null) }}
                >
                  <button
                    className="flex items-center gap-1 px-3 py-1.5 text-[13px] font-semibold rounded-md transition-colors"
                    style={{ color: isActive ? '#C75B2A' : '#D5D0C8' }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: center.color, opacity: isActive ? 1 : 0.4 }} />
                    {center.label}
                    <ChevronDown size={12} className="opacity-40" />
                  </button>
                  {openDropdown === center.label && (
                    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1.5 min-w-[180px] z-50" style={{ borderColor: '#E2DDD5' }}>
                      {center.items.map(function (item) {
                        const itemActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-2 text-[13px] font-medium transition-colors"
                            style={{ color: itemActive ? '#C75B2A' : '#D5D0C8', background: itemActive ? '#FAF8F5' : undefined }}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ZipInput />
            </div>
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              href="/design2/search"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: '#E2DDD5', color: '#9B9590' }}
            >
              <Search size={13} />
              Search
            </Link>
            <button
              className="lg:hidden p-2"
              onClick={function () { setMenuOpen(!menuOpen) }}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t px-6 py-4" style={{ borderColor: '#E2DDD5', background: '#F8F9FC' }}>
            <div className="flex items-center gap-3 mb-4 md:hidden">
              <ZipInput />
              <LanguageSwitcher />
            </div>
            {NAV_CENTERS.map(function (center) {
              return (
                <div key={center.label} className="mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1" style={{ color: center.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: center.color }} />
                    {center.label}
                  </div>
                  {center.items.map(function (item) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block py-1.5 pl-4 text-[13px] font-medium"
                        style={{ color: '#D5D0C8' }}
                        onClick={function () { setMenuOpen(false) }}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </nav>
    </>
  )
}
