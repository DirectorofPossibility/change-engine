'use client'

import { useState } from 'react'
import { CENTERS } from '@/lib/constants'
import { ContentCard } from '@/components/exchange/ContentCard'
import type { ContentPublished, TranslationMap } from '@/lib/types/exchange'

interface PathwayFilterClientProps {
  themeId: string
  centerCounts: Record<string, number>
  initialContent: ContentPublished[]
  translations?: TranslationMap
}

export function PathwayFilterClient({ centerCounts, initialContent, translations = {} }: PathwayFilterClientProps) {
  const [activeCenter, setActiveCenter] = useState<string | null>(null)

  const filtered = activeCenter
    ? initialContent.filter((item) => item.center === activeCenter)
    : initialContent

  return (
    <div>
      {/* Center filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveCenter(null)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            !activeCenter ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
          }`}
        >
          All ({initialContent.length})
        </button>
        {Object.entries(CENTERS).map(([name, config]) => {
          const count = centerCounts[name] || 0
          if (count === 0) return null
          return (
            <button
              key={name}
              onClick={() => setActiveCenter(name)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                activeCenter === name ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
              }`}
            >
              {config.emoji} {name} ({count})
            </button>
          )
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const t = item.inbox_id ? translations[item.inbox_id] : undefined
          return (
            <ContentCard
              key={item.id}
              id={item.id}
              title={item.title_6th_grade}
              summary={item.summary_6th_grade}
              pathway={item.pathway_primary}
              center={item.center}
              sourceUrl={item.source_url}
              publishedAt={item.published_at}
              translatedTitle={t?.title}
              translatedSummary={t?.summary}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-brand-muted py-12">No content found for this filter.</p>
      )}
    </div>
  )
}
