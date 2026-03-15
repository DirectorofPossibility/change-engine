/**
 * @fileoverview Sidebar related content — links to related articles, quizzes, videos.
 *
 * Inspired by Greater Good Magazine's sidebar blocks showing related quizzes,
 * featured videos, and podcast episodes alongside article content.
 */

import Link from 'next/link'
import Image from 'next/image'

interface RelatedItem {
  title: string
  href: string
  imageUrl?: string | null
  type?: string // 'article' | 'quiz' | 'video' | 'podcast'
  meta?: string // e.g. date, duration
}

interface SidebarRelatedBoxProps {
  title: string
  items: RelatedItem[]
  accentColor?: string
  seeAllHref?: string
  seeAllLabel?: string
}

export function SidebarRelatedBox({
  title,
  items,
  accentColor = '#1b5e8a',
  seeAllHref,
  seeAllLabel = 'See all',
}: SidebarRelatedBoxProps) {
  if (!items.length) return null

  return (
    <div className="border border-rule bg-white overflow-hidden">
      <div className="h-1" style={{ background: accentColor }} />

      <div className="p-5">
        <h3 className="font-display text-base font-bold text-ink mb-4">{title}</h3>

        <div className="space-y-3">
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="flex gap-3 group"
            >
              {item.imageUrl && (
                <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden bg-paper">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {item.type && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accentColor }}>
                    {item.type}
                  </span>
                )}
                <h4 className="text-[13px] font-bold text-ink leading-snug line-clamp-2 group-hover:text-blue transition-colors">
                  {item.title}
                </h4>
                {item.meta && (
                  <span className="text-[11px] text-faint mt-0.5 block">{item.meta}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-block mt-4 text-xs font-semibold transition-colors"
            style={{ color: accentColor }}
          >
            {seeAllLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
