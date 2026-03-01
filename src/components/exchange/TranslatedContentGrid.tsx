'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { ContentCard } from './ContentCard'
import type { ContentPublished } from '@/lib/types/exchange'

interface TranslatedContentGridProps {
  items: ContentPublished[]
  focusAreaMap?: Record<string, string>
}

export function TranslatedContentGrid({ items, focusAreaMap }: TranslatedContentGridProps) {
  const { language, translations, loadTranslations, isLoading } = useLanguage()

  useEffect(function () {
    if (language !== 'en' && items.length > 0) {
      var inboxIds = items
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
          Loading translations...
        </div>
      )}
      {items.map(function (item) {
        var t = item.inbox_id ? translations[item.inbox_id] : undefined
        var focusNames: string[] = []
        if (focusAreaMap && item.focus_area_ids) {
          focusNames = item.focus_area_ids
            .map(function (id) { return focusAreaMap[id] })
            .filter(function (n): n is string { return n != null })
        }
        return (
          <ContentCard
            key={item.id}
            id={item.id}
            title={t?.title || item.title_6th_grade}
            summary={t?.summary || item.summary_6th_grade}
            pathway={item.pathway_primary}
            center={item.center}
            sourceUrl={item.source_url}
            publishedAt={item.published_at}
            focusAreaNames={focusNames}
            imageUrl={item.image_url}
          />
        )
      })}
    </div>
  )
}
