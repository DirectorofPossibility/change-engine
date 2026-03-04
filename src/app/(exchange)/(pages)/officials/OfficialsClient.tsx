'use client'

import { useState, useMemo } from 'react'
import { SearchBar } from '@/components/exchange/SearchBar'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import type { ElectedOfficial, GovernmentLevel, TranslationMap } from '@/lib/types/exchange'

interface OfficialsClientProps {
  officials: ElectedOfficial[]
  levels: GovernmentLevel[]
  translations?: TranslationMap
  linkedinProfiles?: Record<string, string>
}

export function OfficialsClient({ officials, levels, translations = {}, linkedinProfiles = {} }: OfficialsClientProps) {
  const [search, setSearch] = useState('')
  const [activeLevel, setActiveLevel] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return officials.filter((o) => {
      if (search && !o.official_name.toLowerCase().includes(search.toLowerCase())) return false
      if (activeLevel && o.gov_level_id !== activeLevel) return false
      return true
    })
  }, [officials, search, activeLevel])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="w-full sm:w-72">
          <SearchBar placeholder="Search officials..." onSearch={setSearch} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveLevel(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              !activeLevel ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
            }`}
          >
            All ({officials.length})
          </button>
          {levels.map((level) => {
            const count = officials.filter(o => o.gov_level_id === level.gov_level_id).length
            return (
              <button
                key={level.gov_level_id}
                onClick={() => setActiveLevel(level.gov_level_id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeLevel === level.gov_level_id ? 'bg-brand-accent text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text'
                }`}
              >
                {level.gov_level_name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((o) => {
          const t = translations[o.official_id]
          return (
            <OfficialCard
              key={o.official_id}
              id={o.official_id}
              name={o.official_name}
              title={o.title}
              party={o.party}
              level={o.level}
              email={o.email}
              phone={o.office_phone}
              website={o.website}
              photoUrl={(o as any).photo_url}
              linkedinUrl={linkedinProfiles[o.official_id]}
              translatedTitle={t?.title}
            />
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-brand-muted py-12">No officials found matching your search.</p>
      )}
    </div>
  )
}
