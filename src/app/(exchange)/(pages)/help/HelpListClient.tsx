'use client'

import { useState } from 'react'
import { LifeSituationCard } from '@/components/exchange/LifeSituationCard'
import { HelpSearchFilter } from './HelpSearchFilter'
import { HelpUrgencyHeader } from './HelpUrgencyHeader'
import { URGENCY_LEVELS } from '@/lib/constants'

interface Situation {
  situation_id: string
  situation_name: string
  situation_slug: string | null
  description_5th_grade: string | null
  urgency_level: string | null
  icon_name: string | null
  [key: string]: unknown
}

interface HelpListClientProps {
  situations: Situation[]
  translations: Record<string, { title?: string; summary?: string }>
}

export function HelpListClient({ situations, translations }: HelpListClientProps) {
  const [filtered, setFiltered] = useState(situations)

  const grouped: Record<string, typeof situations> = {}
  filtered.forEach(function (s) {
    const level = s.urgency_level || 'Low'
    if (!grouped[level]) grouped[level] = []
    grouped[level].push(s)
  })

  return (
    <>
      <HelpSearchFilter situations={situations} onFilter={setFiltered} />

      {filtered.length === 0 && (
        <div className="text-center py-12 border border-dashed border-rule">
          <p className="font-body text-muted">No resources match your search.</p>
          <p className="font-body text-sm text-faint mt-1">Try a different term, or call <a href="tel:211" className="text-blue font-semibold hover:underline">211</a> for help.</p>
        </div>
      )}

      <div className="space-y-8">
        {URGENCY_LEVELS.map(function (level) {
          const items = grouped[level]
          if (!items || items.length === 0) return null

          return (
            <section key={level}>
              <HelpUrgencyHeader level={level} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(function (s) {
                  return (
                    <LifeSituationCard
                      key={s.situation_id}
                      name={s.situation_name}
                      slug={s.situation_slug}
                      description={s.description_5th_grade}
                      urgency={s.urgency_level}
                      iconName={s.icon_name}
                      translatedName={translations[s.situation_id]?.title}
                      translatedDescription={translations[s.situation_id]?.summary}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
