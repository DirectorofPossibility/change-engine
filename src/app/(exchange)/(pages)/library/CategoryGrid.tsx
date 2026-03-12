'use client'

import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface CategoryGridProps {
  counts: Record<string, number>
}

export function CategoryGrid({ counts }: CategoryGridProps) {
  const { t } = useTranslation()
  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {themeEntries.map(function ([id, theme]) {
        const count = counts[id] || 0
        return (
          <Link
            key={id}
            href={'/library/category/' + theme.slug}
            className="group block"
          >
            <article className="bg-white border border-brand-border overflow-hidden hover:shadow-md transition-shadow h-full flex">
              {/* Left color bar */}
              <div
                className="w-1.5 group-hover:w-2 transition-all duration-200 flex-shrink-0"
                style={{ backgroundColor: theme.color }}
              />
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-lg font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                  {theme.name}
                </h3>
                <p className="text-sm text-brand-muted mt-1.5 line-clamp-2 leading-relaxed flex-1">
                  {theme.description}
                </p>
                <div className="mt-3 pt-3 border-t border-brand-border">
                  <span className="text-xs text-brand-muted">
                    {count} {t('library.category_documents')}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )
      })}
    </div>
  )
}
