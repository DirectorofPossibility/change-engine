/**
 * @fileoverview Responsive grid of content cards with automatic translation loading.
 *
 * When the active language (from {@link LanguageContext}) is not English, this
 * component automatically fetches translations for each item's `inbox_id` and
 * passes the translated title/summary down to each {@link ContentCard}. While
 * translations are loading, a spinner message is shown across the grid.
 */
'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { useTranslation } from '@/lib/i18n'
import { ContentCard } from './ContentCard'
interface ContentGridItem {
  id: string
  inbox_id?: string | null
  title_6th_grade?: string | null
  summary_6th_grade?: string | null
  pathway_primary?: string | null
  center?: string | null
  source_url?: string | null
  published_at?: string | null
  focus_area_ids?: string[] | null
  image_url?: string | null
}

interface TranslatedContentGridProps {
  items: ContentGridItem[]
  focusAreaMap?: Record<string, string>
}

/**
 * Renders a responsive grid of {@link ContentCard} components with automatic
 * translation support for non-English languages.
 *
 * @param props.items - Array of content items to render as cards.
 * @param props.focusAreaMap - Optional mapping of focus-area IDs to display names,
 *   used to resolve human-readable pills on each card.
 */
export function TranslatedContentGrid({ items, focusAreaMap }: TranslatedContentGridProps) {
  const { language, translations, loadTranslations, isLoading } = useLanguage()
  const { t } = useTranslation()

  useEffect(function () {
    if (language !== 'en' && items.length > 0) {
      const inboxIds = items
        .map(function (item) { return item.inbox_id })
        .filter(function (id): id is string { return id != null })
      if (inboxIds.length > 0) {
        loadTranslations(inboxIds)
      }
    }
  }, [language, items, loadTranslations])

  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading && (
        <div className="col-span-full text-center text-sm text-brand-muted py-4">
          {t('card.loading_translations')}
        </div>
      )}
      {items.map(function (item) {
        const t = item.inbox_id ? translations[item.inbox_id] : undefined
        let focusNames: string[] = []
        if (focusAreaMap && item.focus_area_ids) {
          focusNames = item.focus_area_ids
            .map(function (id) { return focusAreaMap[id] })
            .filter(function (n): n is string { return n != null })
        }
        return (
          <ContentCard
            key={item.id}
            id={item.id}
            title={t?.title || item.title_6th_grade || ''}
            summary={t?.summary || item.summary_6th_grade || ''}
            pathway={item.pathway_primary ?? null}
            center={item.center ?? null}
            sourceUrl={item.source_url || ''}
            publishedAt={item.published_at ?? null}
            focusAreaNames={focusNames}
            imageUrl={item.image_url ?? null}
          />
        )
      })}
    </div>
  )
}
