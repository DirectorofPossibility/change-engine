'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface SidebarSearchProps {
  onSearch: (query: string) => void
}

export function SidebarSearch({ onSearch }: SidebarSearchProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      onSearch(trimmed)
      setSearchQuery('')
    }
  }

  return (
    <div className="px-5 py-1">
      <form onSubmit={handleSearch} className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={function (e) { setSearchQuery(e.target.value) }}
          placeholder={t('nav.search_placeholder')}
          aria-label="Search"
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-brand-border bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
        />
      </form>
    </div>
  )
}
