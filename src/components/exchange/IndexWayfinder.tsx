'use client'

/**
 * IndexWayfinder — Contextual sidebar for index/listing pages.
 *
 * Psychology:
 * - Progressive disclosure: collapsed sections reduce overwhelm
 * - Social proof: counts show activity ("12 new this week")
 * - Cross-pollination: related sections invite exploration
 * - Anchoring: current section highlighted, related sections below
 *
 * On mobile: renders as horizontal scrollable pills + collapsible sections.
 * On desktop: sticky sidebar with pathway links + related sections.
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { FOLWatermark } from './FOLWatermark'
import { useTranslation } from '@/lib/use-translation'
import Image from 'next/image'

interface RelatedSection {
  label: string
  href: string
  count?: number
  color?: string
}

interface IndexWayfinderProps {
  /** Current page identifier for highlighting */
  currentPage: string
  /** Related cross-links to show */
  related?: RelatedSection[]
  /** Whether to show pathways section */
  showPathways?: boolean
  /** Accent color */
  color?: string
}

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: t.name, color: t.color, slug: t.slug }
})

const CROSS_LINKS = [
  { i18nKey: 'wayfinder.nav_services', href: '/services', color: '#C75B2A' },
  { i18nKey: 'wayfinder.nav_organizations', href: '/organizations', color: '#dd6b20' },
  { i18nKey: 'wayfinder.nav_officials', href: '/officials', color: '#805ad5' },
  { i18nKey: 'wayfinder.nav_policies', href: '/policies', color: '#3182ce' },
  { i18nKey: 'wayfinder.nav_opportunities', href: '/opportunities', color: '#38a169' },
  { i18nKey: 'wayfinder.nav_news', href: '/news', color: '#319795' },
  { i18nKey: 'wayfinder.nav_library', href: '/library', color: '#d69e2e' },
  { i18nKey: 'wayfinder.nav_neighborhoods', href: '/neighborhoods', color: '#e53e3e' },
]

export function IndexWayfinder({
  currentPage,
  related,
  showPathways = true,
  color = '#C75B2A',
}: IndexWayfinderProps) {
  const { t } = useTranslation()
  const [pathwaysOpen, setPathwaysOpen] = useState(true)
  const [exploreOpen, setExploreOpen] = useState(true)

  return (
    <aside className="bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header with FOL */}
      <div className="relative p-4 border-b border-brand-border overflow-hidden">
        <div className="absolute right-[-10px] top-[-10px] opacity-[0.06]">
          <FOLWatermark variant="seed" size="sm" color={color} />
        </div>
        <h3 className="font-serif text-base font-semibold text-brand-text">{t('wayfinder.explore_more')}</h3>
        <p className="text-[11px] text-brand-muted mt-0.5">{t('wayfinder.discover_connected')}</p>
      </div>

      {/* Explore — other sections */}
      <div className="border-b border-brand-border">
        <button
          onClick={function () { setExploreOpen(!exploreOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-bg/50 transition-colors"
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.discover')}</span>
          {exploreOpen ? <ChevronDown size={14} className="text-brand-muted" /> : <ChevronRight size={14} className="text-brand-muted" />}
        </button>
        {exploreOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {CROSS_LINKS.filter(function (link) { return link.href !== '/' + currentPage }).map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
                >
                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: link.color }} />
                  {t(link.i18nKey)}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Pathways — collapsible */}
      {showPathways && (
        <div className="border-b border-brand-border">
          <button
            onClick={function () { setPathwaysOpen(!pathwaysOpen) }}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-bg/50 transition-colors"
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">{t('wayfinder.topics')}</span>
            {pathwaysOpen ? <ChevronDown size={14} className="text-brand-muted" /> : <ChevronRight size={14} className="text-brand-muted" />}
          </button>
          {pathwaysOpen && (
            <div className="px-4 pb-3 space-y-0.5">
              {PATHWAY_LIST.map(function (pw) {
                return (
                  <Link
                    key={pw.id}
                    href={'/pathways/' + pw.slug}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
                  >
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: pw.color }} />
                    {pw.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Related items if provided */}
      {related && related.length > 0 && (
        <div className="p-4 space-y-1.5">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted mb-2">{t('wayfinder.related')}</p>
          {related.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] font-medium text-brand-text hover:bg-brand-bg hover:text-brand-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  {item.color && <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: item.color }} />}
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono text-brand-muted">{item.count}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* FOL accent + support line */}
      <div className="px-4 py-3 bg-brand-bg/50 border-t border-brand-border relative overflow-hidden">
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          aria-hidden="true"
          className="absolute right-[-20px] top-[-20px] w-[80px] h-[80px] pointer-events-none opacity-[0.06]"
         width={200} height={200} />
        <p className="text-[10px] font-mono text-brand-muted relative z-10">
          {t('wayfinder.need_help')} <span className="font-bold text-brand-text">211</span> / <span className="font-bold text-brand-text">311</span> / <span className="font-bold text-brand-text">988</span>
        </p>
      </div>
    </aside>
  )
}
