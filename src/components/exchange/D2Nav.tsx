'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu, Search } from 'lucide-react'
import { FlowerOfLifeIcon, ARCHETYPES } from './FlowerIcons'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ZipInput } from './ZipInput'
import { SpiralProgress } from './SpiralProgress'
import { THEMES } from '@/lib/constants'

const CENTERS = [
  {
    label: 'Community',
    href: '/community',
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
    href: '/learning',
    color: '#3182ce',
    items: [
      { href: '/library', label: 'Library' },
      { href: '/news', label: 'News' },
      { href: '/pathways', label: 'Topics' },
      { href: '/chat', label: 'Ask Chance' },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    color: '#C75B2A',
    items: [
      { href: '/services', label: 'Services' },
      { href: '/opportunities', label: 'Opportunities' },
      { href: '/help', label: 'Available Resources' },
    ],
  },
  {
    label: 'Action',
    href: '/action',
    color: '#38a169',
    items: [
      { href: '/governance', label: 'Governance' },
      { href: '/officials', label: 'Officials' },
      { href: '/policies', label: 'Policies' },
      { href: '/elections', label: 'Elections' },
    ],
  },
  {
    label: 'About',
    href: '/about',
    color: '#6B6560',
    items: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
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

  const closeDrawer = useCallback(function () { setDrawerOpen(false) }, [])

  useEffect(function () {
    if (!drawerOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', handleKey)
    return function () { document.removeEventListener('keydown', handleKey) }
  }, [drawerOpen, closeDrawer])

  // Close drawer on route change
  useEffect(function () {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <>
      {/* Election banner */}
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
              <span className="block font-serif text-[18px] font-bold text-brand-text">Community Exchange</span>
              <span className="block font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-brand-muted-light">The Change Lab</span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:block">
              <Link href="/search" className="p-2 rounded-md hover:bg-brand-bg transition-colors" aria-label="Search">
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
              My Account
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
          <div role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed top-0 right-0 bottom-0 w-[340px] max-w-[90vw] z-[201] bg-brand-cream overflow-y-auto shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <FlowerOfLifeIcon size={24} color="#C75B2A" />
                <span className="font-serif text-[15px] font-bold">Community Exchange</span>
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
                <Link href="/search" className="p-2 rounded-md hover:bg-brand-bg transition-colors md:hidden" aria-label="Search" onClick={closeDrawer}>
                  <Search size={18} className="text-brand-muted" />
                </Link>
              </div>

              {/* Journey */}
              <details className="group border-b border-brand-border">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">Your Journey</span>
                </summary>
                <div className="pb-3 space-y-0.5">
                  {[
                    { href: '/compass', label: 'Chart Your Course' },
                    { href: '/for/seeker', label: 'Find Help' },
                    { href: '/for/learner', label: 'Learn Something' },
                    { href: '/for/builder', label: 'Take Action' },
                    { href: '/for/watchdog', label: 'Hold Accountable' },
                  ].map(function (item) {
                    const itemActive = pathname === item.href
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

              {/* Centers — collapsible sections */}
              {CENTERS.map(function (center) {
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
                        View all &rarr;
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

              {/* Topics (formerly Pathways) */}
              <details className="group border-b border-brand-border">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">Topics</span>
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
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">Discover</span>
                </summary>
                <div className="pb-3 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {[
                    { href: '/compass', label: 'Civic Compass' },
                    { href: '/dashboard-live', label: 'Live Dashboard' },
                    { href: '/knowledge-graph', label: 'Knowledge Graph' },
                    { href: '/goodthings', label: 'Three Good Things' },
                    { href: '/call-your-senators', label: 'Call Your Senators' },
                    { href: '/polling-places', label: 'Polling Places' },
                  ].map(function (item) {
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
                  My Account
                </Link>
              </div>

              {/* Support */}
              <details className="group">
                <summary className="flex items-center gap-2 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-brand-muted-light transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 1l4 4-4 4" /></svg>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted-light group-open:text-brand-accent transition-colors">Support</span>
                </summary>
                <div className="pb-3 font-mono text-[11px] text-brand-muted-light space-y-1 pl-5">
                  <p>Crisis: <strong className="text-brand-text">988</strong></p>
                  <p>City Services: <strong className="text-brand-text">311</strong></p>
                  <p>Social Services: <strong className="text-brand-text">211</strong></p>
                  <p>DV Hotline: <strong className="text-brand-text">713-528-2121</strong></p>
                </div>
              </details>
            </div>
          </div>
        </>
      )}
    </>
  )
}
