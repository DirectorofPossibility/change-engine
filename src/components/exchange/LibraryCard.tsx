'use client'

import Link from 'next/link'
import { FileText, Tag } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/use-translation'

interface LibraryCardProps {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  page_count: number
  published_at: string | null
}

export function LibraryCard({
  id,
  title,
  summary,
  tags,
  theme_ids,
  page_count,
  published_at,
}: LibraryCardProps) {
  const { t } = useTranslation()

  // Get theme colors for decoration
  const themeColors = theme_ids
    .map(function (tid) {
      const theme = (THEMES as Record<string, { color: string; name: string }>)[tid]
      return theme ? { color: theme.color, name: theme.name } : null
    })
    .filter(Boolean) as { color: string; name: string }[]

  const primaryColor = themeColors[0]?.color || '#E8723A'

  return (
    <Link href={'/library/doc/' + id} className="block group">
      <article className="bg-white border border-brand-border overflow-hidden hover:border-ink transition-colors h-full flex flex-col">
        {/* Color bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}40)` }} />

        <div className="p-5 flex flex-col flex-1">
          {/* Theme indicators */}
          {themeColors.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-3">
              {themeColors.map(function (theme) {
                return (
                  <span
                    key={theme.name}
                    className="inline-flex items-center gap-1.5 text-xs text-brand-muted"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                    {theme.name}
                  </span>
                )
              })}
            </div>
          )}

          {/* Title */}
          <h3 className="font-display text-lg font-bold text-brand-text leading-snug group-hover:text-brand-accent transition-colors line-clamp-2">
            {title}
          </h3>

          {/* Summary */}
          {summary && (
            <p className="text-sm text-brand-muted mt-2 line-clamp-3 leading-relaxed flex-1">
              {summary}
            </p>
          )}

          {/* Meta footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-border">
            <div className="flex items-center gap-1.5 text-xs text-brand-muted">
              <FileText size={13} />
              <span>{page_count} {t('library.pages')}</span>
            </div>

            {tags.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-brand-muted">
                <Tag size={12} />
                <span className="truncate max-w-[120px]">{tags.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
