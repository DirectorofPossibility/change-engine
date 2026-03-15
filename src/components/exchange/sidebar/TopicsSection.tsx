'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface TopicsSectionProps {
  topics: string[]
  topicsOpen: boolean
  onToggle: () => void
  onTopicClick: (topic: string) => void
}

export function TopicsSection({ topics, topicsOpen, onToggle, onTopicClick }: TopicsSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="px-5">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 w-full text-xs font-bold tracking-[0.14em] uppercase text-brand-muted mb-2 hover:text-brand-text transition-colors font-display"
      >
        {topicsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {t('sidebar.topics')} ({topics.length})
      </button>
      {topicsOpen && topics.length > 0 && (
        <div className="max-h-48 overflow-y-auto px-3 py-1">
          <span className="text-sm italic text-brand-muted leading-relaxed">
            {topics.map(function (topic, i) {
              return (
                <span key={topic}>
                  {i > 0 && <span className="mx-1">&middot;</span>}
                  <button
                    onClick={function () { onTopicClick(topic) }}
                    className="hover:text-brand-accent transition-colors"
                  >
                    {topic}
                  </button>
                </span>
              )
            })}
          </span>
        </div>
      )}
      {topicsOpen && topics.length === 0 && (
        <p className="text-sm text-brand-muted italic">{t('sidebar.no_topics')}</p>
      )}
    </div>
  )
}
