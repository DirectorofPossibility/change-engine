'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { FlowerOfLife } from '@/components/geo/sacred'
import { useTranslation } from '@/lib/use-translation'

interface RelatedSection {
  label: string
  href: string
  count?: number
  color?: string
}

interface IndexWayfinderProps {
  currentPage: string
  related?: RelatedSection[]
  showPathways?: boolean
  color?: string
}

const PATHWAY_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, name: t.name, color: t.color, slug: t.slug }
})

const CROSS_LINKS = [
  { i18nKey: 'wayfinder.nav_services', href: '/services', color: '#1b5e8a' },
  { i18nKey: 'wayfinder.nav_organizations', href: '/organizations', color: '#1a6b56' },
  { i18nKey: 'wayfinder.nav_officials', href: '/officials', color: '#4a2870' },
  { i18nKey: 'wayfinder.nav_policies', href: '/policies', color: '#7a2018' },
  { i18nKey: 'wayfinder.nav_opportunities', href: '/opportunities', color: '#1a5030' },
  { i18nKey: 'wayfinder.nav_news', href: '/news', color: '#6a4e10' },
  { i18nKey: 'wayfinder.nav_library', href: '/library', color: '#1e4d7a' },
  { i18nKey: 'wayfinder.nav_neighborhoods', href: '/neighborhoods', color: '#1b5e8a' },
]

export function IndexWayfinder({
  currentPage,
  related,
  showPathways = true,
  color = '#1b5e8a',
}: IndexWayfinderProps) {
  const { t } = useTranslation()
  const [pathwaysOpen, setPathwaysOpen] = useState(true)
  const [exploreOpen, setExploreOpen] = useState(true)

  return (
    <aside style={{ border: '1.5px solid #dde1e8' }}>
      {/* Header */}
      <div className="relative p-4 overflow-hidden" style={{ borderBottom: '1px solid #dde1e8' }}>
        <div className="absolute right-2 top-2 opacity-[0.06] pointer-events-none">
          <FlowerOfLife color={color} size={60} />
        </div>
        <h3 className="font-display text-base font-bold" style={{ color: '#0d1117' }}>{t('wayfinder.explore_more')}</h3>
        <p className="font-mono text-xs uppercase tracking-[0.08em] mt-1" style={{ color: '#8a929e' }}>{t('wayfinder.discover_connected')}</p>
      </div>

      {/* Explore — other sections */}
      <div style={{ borderBottom: '1px solid #dde1e8' }}>
        <button
          onClick={function () { setExploreOpen(!exploreOpen) }}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
        >
          <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>{t('wayfinder.discover')}</span>
          {exploreOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
        </button>
        {exploreOpen && (
          <div className="px-4 pb-3 space-y-0.5">
            {CROSS_LINKS.filter(function (link) { return link.href !== '/' + currentPage }).map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                  style={{ color: '#0d1117' }}
                >
                  <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: link.color }} />
                  {t(link.i18nKey)}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Pathways */}
      {showPathways && (
        <div style={{ borderBottom: '1px solid #dde1e8' }}>
          <button
            onClick={function () { setPathwaysOpen(!pathwaysOpen) }}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-paper transition-colors"
          >
            <span className="font-mono text-xs uppercase tracking-[0.08em]" style={{ color: '#8a929e' }}>{t('wayfinder.topics')}</span>
            {pathwaysOpen ? <ChevronDown size={14} style={{ color: '#8a929e' }} /> : <ChevronRight size={14} style={{ color: '#8a929e' }} />}
          </button>
          {pathwaysOpen && (
            <div className="px-4 pb-3 space-y-0.5">
              {PATHWAY_LIST.map(function (pw) {
                return (
                  <Link
                    key={pw.id}
                    href={'/pathways/' + pw.slug}
                    className="flex items-center gap-2.5 px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                    style={{ color: '#0d1117' }}
                  >
                    <FlowerOfLife color={pw.color} size={16} className="flex-shrink-0" />
                    {pw.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Related items */}
      {related && related.length > 0 && (
        <div className="p-4 space-y-1.5">
          <p className="font-mono text-xs uppercase tracking-[0.08em] mb-2" style={{ color: '#8a929e' }}>{t('wayfinder.related')}</p>
          {related.map(function (item) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-2 py-1.5 font-body text-[0.82rem] transition-colors hover:text-blue"
                style={{ color: '#0d1117' }}
              >
                <span className="flex items-center gap-2">
                  {item.color && <span className="w-1.5 h-1.5 flex-shrink-0" style={{ background: item.color }} />}
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span className="font-mono text-xs" style={{ color: '#8a929e' }}>{item.count}</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Support line */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #dde1e8', background: '#f4f5f7' }}>
        <p className="font-mono text-xs" style={{ color: '#8a929e' }}>
          {t('wayfinder.need_help')} <strong style={{ color: '#0d1117' }}>211</strong> / <strong style={{ color: '#0d1117' }}>311</strong> / <strong style={{ color: '#0d1117' }}>988</strong>
        </p>
      </div>
    </aside>
  )
}
