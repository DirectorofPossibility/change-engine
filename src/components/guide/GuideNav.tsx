'use client'

/**
 * @fileoverview Field Guide top navigation.
 *
 * Simplified from 5-dropdown mega-nav to:
 *   [Logo]  [Pathways ▾]  [Orgs]  [Map]  [Search]  [ZIP]  [My Plan]  [≡]
 *
 * Mobile: hamburger menu with full pathway list.
 */

import Link from 'next/link'
import { useState } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { THEMES } from '@/lib/constants'

const PATHWAY_LIST = Object.values(THEMES).map((t) => ({
  name: t.name,
  slug: t.slug,
  color: t.color,
}))

export function GuideNav() {
  const [pathwaysOpen, setPathwaysOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { zip } = useNeighborhood()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#dde1e8]">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="w-7 h-7 rounded-full bg-[#1b5e8a] flex items-center justify-center">
            <span className="text-white text-xs font-bold">CE</span>
          </span>
          <span className="hidden sm:inline text-sm font-semibold text-[#0d1117]">
            Change Engine
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {/* Pathways dropdown */}
          <div className="relative">
            <button
              onClick={() => setPathwaysOpen(!pathwaysOpen)}
              onBlur={() => setTimeout(() => setPathwaysOpen(false), 150)}
              className="px-3 py-2 text-sm text-[#0d1117] hover:bg-[#f4f5f7] rounded transition-colors"
            >
              Pathways
              <span className="ml-1 text-[10px] text-[#8a929e]">&#9662;</span>
            </button>
            {pathwaysOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#dde1e8] rounded shadow-lg py-1 z-50">
                {PATHWAY_LIST.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/${p.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#f4f5f7] transition-colors"
                    onClick={() => setPathwaysOpen(false)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    {p.name}
                  </Link>
                ))}
                <div className="border-t border-[#dde1e8] mt-1 pt-1">
                  <Link
                    href="/start"
                    className="block px-4 py-2.5 text-sm text-[#1b5e8a] hover:bg-[#f4f5f7] transition-colors"
                    onClick={() => setPathwaysOpen(false)}
                  >
                    Find what you need &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/orgs"
            className="px-3 py-2 text-sm text-[#0d1117] hover:bg-[#f4f5f7] rounded transition-colors"
          >
            Organizations
          </Link>

          <Link
            href="/map"
            className="px-3 py-2 text-sm text-[#0d1117] hover:bg-[#f4f5f7] rounded transition-colors"
          >
            Map
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <Link
            href="/search"
            className="w-8 h-8 flex items-center justify-center text-[#8a929e] hover:text-[#0d1117] transition-colors"
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* ZIP */}
          <Link
            href="/my-plan/settings"
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-[#5c6474] bg-[#f4f5f7] rounded hover:bg-[#eaecf0] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {zip || 'Set ZIP'}
          </Link>

          {/* My Plan */}
          <Link
            href="/my-plan"
            className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-[#1b5e8a] border border-[#1b5e8a] rounded hover:bg-[#1b5e8a] hover:text-white transition-colors"
          >
            My Plan
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center text-[#0d1117]"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#dde1e8] bg-white">
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[#8a929e] mb-2">Pathways</p>
            {PATHWAY_LIST.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                className="flex items-center gap-3 py-2.5 text-sm"
                onClick={() => setMobileOpen(false)}
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
                {p.name}
              </Link>
            ))}
          </div>
          <div className="border-t border-[#dde1e8] px-4 py-3 flex flex-col gap-2">
            <Link href="/orgs" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Organizations</Link>
            <Link href="/map" className="text-sm py-2" onClick={() => setMobileOpen(false)}>Map</Link>
            <Link href="/start" className="text-sm py-2 text-[#1b5e8a]" onClick={() => setMobileOpen(false)}>Find what you need</Link>
            <Link href="/my-plan" className="text-sm py-2" onClick={() => setMobileOpen(false)}>My Plan</Link>
          </div>
          <div className="border-t border-[#dde1e8] px-4 py-3">
            <Link
              href="/my-plan/settings"
              className="flex items-center gap-2 text-sm text-[#5c6474]"
              onClick={() => setMobileOpen(false)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {zip ? `ZIP: ${zip}` : 'Set your ZIP code'}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
