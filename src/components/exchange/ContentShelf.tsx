'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ContentCard } from './ContentCard'
import type { ContentPublished, TranslationMap } from '@/lib/types/exchange'

/** A single item in the shelf — can be a content article or a mixed entity */
export interface ShelfItem {
  /** Entity type determines card rendering */
  type: 'content' | 'service' | 'official' | 'policy' | 'opportunity'
  id: string
  title: string
  summary?: string | null
  /** For content items — maps to ContentCard props */
  pathway?: string | null
  center?: string | null
  sourceUrl?: string
  publishedAt?: string | null
  imageUrl?: string | null
  /** For entity items — extra metadata */
  subtitle?: string | null
  href?: string
  color?: string
}

interface ContentShelfProps {
  /** Shelf heading */
  title: string
  /** Italic subheading (e.g. center question) */
  question?: string
  /** SVG icon path for the heading */
  iconPath?: string
  /** Accent color for icon bg, rule, and "see all" link */
  color: string
  /** Items to display in the horizontal scroll */
  items: ShelfItem[]
  /** Translations for content items */
  translations?: TranslationMap
  /** "See all" destination */
  seeAllHref?: string
  /** If no items, hide the entire shelf */
  hideIfEmpty?: boolean
}

/** Compact entity card for non-content items (services, officials, policies) */
function EntityCard({ item }: { item: ShelfItem }) {
  const href = item.href || '#'
  const typeLabel = item.type === 'service' ? 'Service'
    : item.type === 'official' ? 'Official'
    : item.type === 'policy' ? 'Policy'
    : item.type === 'opportunity' ? 'Opportunity'
    : ''

  return (
    <Link
      href={href}
      className="group flex-shrink-0 w-[260px] sm:w-[280px] bg-white border border-brand-border hover:border-ink hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Color top bar */}
      <div className="h-1 transition-all group-hover:h-1.5" style={{ backgroundColor: item.color || '#8B7E74' }} />
      <div className="p-4">
        <span className="text-xs uppercase tracking-wider text-brand-muted font-semibold">{typeLabel}</span>
        <h4 className="text-sm font-semibold text-brand-text mt-1 leading-snug line-clamp-2">{item.title}</h4>
        {item.subtitle && (
          <p className="text-xs text-brand-muted mt-1 italic">{item.subtitle}</p>
        )}
        {item.summary && (
          <p className="text-xs text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">{item.summary}</p>
        )}
      </div>
    </Link>
  )
}

export function ContentShelf({
  title,
  question,
  iconPath,
  color,
  items,
  translations = {},
  seeAllHref,
  hideIfEmpty = true,
}: ContentShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 8)
    check()
    el.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
  }, [items.length])

  if (hideIfEmpty && items.length === 0) return null

  return (
    <section className="py-4">
      {/* Shelf header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {iconPath && (
            <div className="w-9 h-9 flex items-center justify-center" style={{ backgroundColor: color + '14' }}>
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={color}>
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
          )}
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-bold text-brand-text">{title}</h3>
              <span className="text-xs text-brand-muted tabular-nums">{items.length}</span>
            </div>
            {question && (
              <p className="text-xs font-body italic text-brand-muted mt-0.5">{question}</p>
            )}
          </div>
        </div>
        {seeAllHref && items.length > 3 && (
          <Link
            href={seeAllHref}
            className="text-xs font-semibold transition-colors hover:underline"
            style={{ color }}
          >
            See all &rarr;
          </Link>
        )}
      </div>

      {/* Colored rule */}
      <div className="h-0.5 w-12 rounded-full mb-4" style={{ backgroundColor: color }} />

      {/* Horizontal scroll container */}
      <div className="relative">
        <div
          ref={scrollRef}
          role="region"
          aria-label={`${title} shelf`}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {items.map((item) => {
            if (item.type === 'content') {
              const t = translations[item.id]
              return (
                <div key={item.id} className="flex-shrink-0 w-[260px] sm:w-[280px]" style={{ scrollSnapAlign: 'start' }}>
                  <ContentCard
                    id={item.id}
                    title={item.title}
                    summary={item.summary || ''}
                    pathway={item.pathway ?? null}
                    center={item.center ?? null}
                    sourceUrl={item.sourceUrl || ''}
                    publishedAt={item.publishedAt || null}
                    imageUrl={item.imageUrl || null}
                    href={item.href}
                    translatedTitle={t?.title}
                    translatedSummary={t?.summary}
                  />
                </div>
              )
            }
            return (
              <div key={`${item.type}-${item.id}`} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                <EntityCard item={item} />
              </div>
            )
          })}
        </div>

        {/* Scroll fade hint */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-brand-bg to-transparent pointer-events-none" />
        )}
      </div>
    </section>
  )
}
