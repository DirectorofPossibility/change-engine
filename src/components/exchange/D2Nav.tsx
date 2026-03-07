'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, ChevronDown } from 'lucide-react'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { InfoBubble } from './InfoBubble'
import { TOOLTIPS } from '@/lib/tooltips'
import { THEMES } from '@/lib/constants'

const CENTERS = [
  {
    label: 'Community',
    color: '#805ad5',
    items: [
      { href: '/neighborhoods', label: 'Neighborhoods' },
      { href: '/organizations', label: 'Organizations' },
      { href: '/foundations', label: 'Foundations' },
      { href: '/calendar', label: 'Events & Calendar' },
    ],
  },
  {
    label: 'Learning',
    color: '#3182ce',
    items: [
      { href: '/library', label: 'Library' },
      { href: '/news', label: 'News' },
      { href: '/pathways', label: 'Pathways' },
      { href: '/chat', label: 'Ask Chance' },
    ],
  },
  {
    label: 'Resources',
    color: '#C75B2A',
    items: [
      { href: '/services', label: 'Services' },
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/help', label: 'Get Help' },
    ],
  },
  {
    label: 'Action',
    color: '#38a169',
    items: [
      { href: '/officials', label: 'Officials' },
      { href: '/policies', label: 'Policies' },
      { href: '/elections', label: 'Elections' },
    ],
  },
]

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: (t as any).name, color: (t as any).color, slug: (t as any).slug }
})

interface D2NavProps {
  election?: {
    election_name: string
    election_date: string
    find_polling_url: string | null
  } | null
}

export function D2Nav({ election }: D2NavProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState<string | null>(null)

  const closeDrawer = useCallback(function () { setDrawerOpen(false) }, [])

  useEffect(function () {
    if (!drawerOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', handleKey)
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [drawerOpen, closeDrawer])

  return (
    <>
      {/* Election banner — links to elections page */}
      {election && (
        <Link href="/elections" className="block text-center font-mono text-[11px] font-bold uppercase tracking-wider py-2 px-4 bg-brand-bg-alt text-brand-accent border-b border-brand-border hover:bg-brand-border/50 transition-colors">
          {election.election_name} — {new Date(election.election_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {election.find_polling_url && (
            <span className="ml-3 underline text-brand-text">
              Find your polling place
            </span>
          )}
        </Link>
      )}

      {/* Spectrum bar */}
      <div className="spectrum-bar">
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
          <Link href="/" className="flex items-center gap-2.5">
            <FlowerOfLifeIcon size={28} color="#C75B2A" />
            <span className="font-serif text-[17px]">Community Exchange</span>
          </Link>

          {/* Desktop center dropdowns */}
          <div className="hidden lg:flex items-center gap-1">
            {CENTERS.map(function (center) {
              const isActive = center.items.some(function (item) { return pathname?.startsWith(item.href) })
              return (
                <div
                  key={center.label}
                  className="relative"
                  onMouseEnter={function () { setOpenDrop(center.label) }}
                  onMouseLeave={function () { setOpenDrop(null) }}
                >
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-md transition-colors hover:bg-brand-bg"
                    aria-haspopup="true"
                    aria-expanded={openDrop === center.label}
                    onKeyDown={function (e) {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setOpenDrop(openDrop === center.label ? null : center.label)
                      } else if (e.key === 'Escape') {
                        setOpenDrop(null)
                      }
                    }}
                  >
                    <span className="w-2 h-2 rounded-sm" style={{ background: center.color, opacity: isActive ? 1 : 0.4 }} />
                    <span style={{ color: isActive ? '#C75B2A' : '#1A1A1A' }}>{center.label}</span>
                    <ChevronDown size={12} className="opacity-40" />
                  </button>
                  {openDrop === center.label && (
                    <div role="menu" className="absolute top-full left-0 mt-1 bg-white border-2 border-brand-border rounded-lg shadow-drop py-1.5 min-w-[180px] z-50">
                      {center.items.map(function (item) {
                        const itemActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className="block px-4 py-2 text-[13px] font-medium transition-colors hover:bg-brand-bg hover:text-brand-accent"
                            style={{ color: itemActive ? '#C75B2A' : '#1A1A1A' }}
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
          <div className="flex items-center gap-2.5">
            <div className="hidden md:block relative">
              <ZipInput />
              <InfoBubble id={TOOLTIPS.zip_input.id} text={TOOLTIPS.zip_input.text} position="bottom" />
            </div>
            <div className="hidden md:block relative">
              <LanguageSwitcher />
              <InfoBubble id={TOOLTIPS.language_switcher.id} text={TOOLTIPS.language_switcher.text} position="bottom" />
            </div>
            <Link
              href="/me"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent text-white text-[11px] font-mono font-bold uppercase tracking-wide hover:bg-brand-accent-hover transition-colors"
            >
              My Account
            </Link>
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-2"
              onClick={function () { setDrawerOpen(true) }}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[200]"
            onClick={function () { setDrawerOpen(false) }}
          />
          <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed top-0 left-0 bottom-0 w-[320px] z-[201] bg-brand-cream overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <FlowerOfLifeIcon size={24} color="#C75B2A" />
                <span className="font-serif text-[15px]">Community Exchange</span>
              </div>
              <button onClick={function () { setDrawerOpen(false) }} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* ZIP + Language */}
              <div className="flex items-center gap-3">
                <ZipInput />
                <LanguageSwitcher />
              </div>

              {/* Archetypes */}
              <div>
                <p className="meta-label mb-2">Your Journey</p>
                <div className="grid grid-cols-2 gap-2">
                  {ARCHETYPES.map(function (a) {
                    return (
                      <button
                        key={a.id}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-lg border-2 border-brand-border hover:border-brand-text transition-colors text-left"
                        onClick={function () { setDrawerOpen(false) }}
                      >
                        <a.Icon size={18} />
                        <span>{a.name.replace('The ', '')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pathways */}
              <div>
                <p className="meta-label mb-2">Pathways</p>
                <div className="space-y-1">
                  {PATHWAY_LIST.map(function (pw) {
                    return (
                      <Link
                        key={pw.id}
                        href={'/pathways/' + pw.slug}
                        className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] font-medium hover:text-brand-accent transition-colors"
                        onClick={function () { setDrawerOpen(false) }}
                      >
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pw.color }} />
                        {pw.name}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Centers */}
              {CENTERS.map(function (center) {
                return (
                  <div key={center.label}>
                    <p className="flex items-center gap-2 meta-label mb-2" style={{ color: center.color }}>
                      <span className="w-2 h-2 rounded-sm" style={{ background: center.color }} />
                      {center.label}
                    </p>
                    <div className="space-y-0.5">
                      {center.items.map(function (item) {
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block pl-4 py-1.5 text-[13px] font-medium text-brand-text hover:text-brand-accent transition-colors"
                            onClick={function () { setDrawerOpen(false) }}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Support */}
              <div className="pt-3 border-t border-brand-border">
                <p className="meta-label mb-2">Support</p>
                <div className="font-mono text-[11px] text-brand-muted-light space-y-1">
                  <p>Crisis: <strong className="text-brand-text">988</strong></p>
                  <p>City Services: <strong className="text-brand-text">311</strong></p>
                  <p>Social Services: <strong className="text-brand-text">211</strong></p>
                  <p>DV Hotline: <strong className="text-brand-text">713-528-2121</strong></p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
