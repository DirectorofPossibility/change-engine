'use client'

import { useState } from 'react'
import { THEMES } from '@/lib/constants'
import { ContentCard } from '@/components/exchange/ContentCard'
import type { ContentPublished } from '@/lib/types/exchange'

interface CenterFilterClientProps {
  items: ContentPublished[]
  pathwayCounts: Record<string, number>
}

export function CenterFilterClient({ items, pathwayCounts }: CenterFilterClientProps) {
  const [activePathway, setActivePathway] = useState<string | null>(null)

  const filtered = activePathway
    ? items.filter((item) => item.pathway_primary === activePathway)
    : items

  return (
    <div>
      {/* Pathway filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap justify-center">
        <button
          onClick={() => setActivePathway(null)}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            !activePathway ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
          }`}
        >
          All ({items.length})
        </button>
        {Object.entries(THEMES).map(([id, theme]) => {
          const count = pathwayCounts[id] || 0
          if (count === 0) return null
          return (
            <button
              key={id}
              onClick={() => setActivePathway(id)}
              className="px-3 py-1.5 rounded-full text-sm text-white transition-opacity hover:opacity-90"
              style={{
                backgroundColor: activePathway === id ? theme.color : `${theme.color}80`,
              }}
            >
              {theme.emoji} {theme.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <ContentCard
            key={item.id}
            id={item.id}
            title={item.title_6th_grade}
            summary={item.summary_6th_grade}
            pathway={item.pathway_primary}
            center={item.center}
            sourceUrl={item.source_url}
            publishedAt={item.published_at}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-brand-muted py-12">No content found for this filter.</p>
      )}
    </div>
  )
}
