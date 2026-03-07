'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  'aria-label'?: string
  onSearch: (query: string) => void
}

export function SearchBar({ placeholder = 'Search...', 'aria-label': ariaLabel = 'Search', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')

  function handleChange(value: string) {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full pl-9 pr-4 py-2 border-2 border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
      />
    </div>
  )
}
