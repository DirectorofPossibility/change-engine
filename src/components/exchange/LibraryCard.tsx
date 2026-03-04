'use client'

import Link from 'next/link'
import { FileText, Tag } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'

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

  const primaryColor = themeColors[0]?.color || '#C75B2A'

  return (
    <Link href={'/library/' + id} className="block group">
      <article className="bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Color bar */}
        <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${primaryColor}40)` }} />

        <div className="p-5 flex flex-col flex-1">
          {/* Theme pills */}
          {themeColors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {themeColors.map(function (theme) {
                return (
                  <span
                    key={theme.name}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: theme.color + '15', color: theme.color }}
                  >
                    {theme.name}
                  </span>
                )
              })}
            </div>
          )}

          {/* Title */}
          <h3 className="font-serif text-lg font-bold text-brand-text leading-snug group-hover:text-brand-accent transition-colors line-clamp-2">
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
