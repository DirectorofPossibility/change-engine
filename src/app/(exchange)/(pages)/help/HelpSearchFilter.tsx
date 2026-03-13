'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface Situation {
  situation_id: string
  situation_name: string
  situation_slug: string | null
  description_5th_grade: string | null
  urgency_level: string | null
  icon_name: string | null
  [key: string]: unknown
}

interface HelpSearchFilterProps {
  situations: Situation[]
  onFilter: (filtered: Situation[]) => void
}

export function HelpSearchFilter({ situations, onFilter }: HelpSearchFilterProps) {
  const [query, setQuery] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (!q.trim()) {
      onFilter(situations)
      return
    }
    const lower = q.toLowerCase()
    onFilter(situations.filter(function (s) {
      return (
        s.situation_name.toLowerCase().includes(lower) ||
        (s.description_5th_grade || '').toLowerCase().includes(lower)
      )
    }))
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border border-rule bg-white mb-6">
      <Search size={16} className="text-faint flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search by topic — food, housing, jobs, healthcare..."
        className="flex-1 bg-transparent text-sm text-ink placeholder-faint outline-none font-body"
      />
    </div>
  )
}
