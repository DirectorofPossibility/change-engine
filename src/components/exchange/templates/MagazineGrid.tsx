/**
 * @fileoverview Magazine-style content grid — featured + stacked sidebar.
 *
 * Inspired by Greater Good Magazine's "What's New" section:
 *   - Large featured card on the left (3fr)
 *   - Stacked smaller cards on the right (2fr)
 *   - Responsive: stacks vertically on mobile
 *
 * Use this for homepage content sections, news pages, and topic pages.
 */

import Link from 'next/link'
import Image from 'next/image'
import { FolFallback } from '@/components/ui/FolFallback'

interface MagazineItem {
  id: string
  title: string
  summary?: string | null
  imageUrl?: string | null
  pathway?: string | null
  pathwayName?: string | null
  pathwayColor?: string | null
  sourceDomain?: string | null
  publishedAt?: string | null
  href: string
}

interface MagazineGridProps {
  items: MagazineItem[]
  accentColor?: string
}

export function MagazineGrid({ items, accentColor = '#C75B2A' }: MagazineGridProps) {
  if (!items.length) return null

  const featured = items[0]
  const sideItems = items.slice(1, 4)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
      {/* Featured card */}
      <Link
        href={featured.href}
        className="bg-white border border-rule overflow-hidden transition-all hover:shadow-md hover:translate-y-[-2px] group"
      >
        {featured.imageUrl ? (
          <div className="h-[240px] overflow-hidden">
            <Image
              src={featured.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
              width={800}
              height={400}
            />
          </div>
        ) : (
          <FolFallback pathway={featured.pathway} size="hero" />
        )}
        <div className="p-5">
          {featured.pathwayName && (
            <p className="text-[11px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: featured.pathwayColor || accentColor }}>
              {featured.pathwayName}
            </p>
          )}
          <h3 className="font-display text-lg font-bold leading-snug text-ink group-hover:text-blue transition-colors mb-2">
            {featured.title}
          </h3>
          {featured.summary && (
            <p className="text-[14px] text-muted leading-relaxed line-clamp-3">{featured.summary}</p>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-rule">
            <span className="text-[12px] text-faint">{featured.sourceDomain || ''}</span>
            <span className="text-[12px] font-semibold" style={{ color: accentColor }}>Read more &rsaquo;</span>
          </div>
        </div>
      </Link>

      {/* Stacked side cards */}
      <div className="flex flex-col gap-4">
        {sideItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex bg-white border border-rule overflow-hidden transition-all hover:shadow-sm group flex-1"
          >
            {item.imageUrl ? (
              <div className="w-[120px] flex-shrink-0 overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  width={240}
                  height={160}
                />
              </div>
            ) : (
              <div className="w-[120px] flex-shrink-0 overflow-hidden">
                <FolFallback pathway={item.pathway} height="h-full" />
              </div>
            )}
            <div className="flex-1 p-3.5 min-w-0">
              {item.pathwayName && (
                <p className="text-[11px] uppercase tracking-wider font-semibold mb-1" style={{ color: item.pathwayColor || accentColor }}>
                  {item.pathwayName}
                </p>
              )}
              <h4 className="text-[14px] font-bold leading-snug text-ink line-clamp-2 group-hover:text-blue transition-colors">
                {item.title}
              </h4>
              {item.summary && (
                <p className="text-[13px] text-muted mt-1 line-clamp-2">{item.summary}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-faint">{item.sourceDomain || ''}</span>
                <span className="text-[12px] font-semibold" style={{ color: accentColor }}>Open &rsaquo;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
