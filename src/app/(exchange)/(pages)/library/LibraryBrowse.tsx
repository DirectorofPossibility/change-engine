'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { LibraryCard } from '@/components/exchange/LibraryCard'
import { useTranslation } from '@/lib/i18n'
import type { KBDocument } from '@/lib/data/library'

interface LibraryBrowseProps {
  initialDocuments: KBDocument[]
  initialTotal: number
}

interface SearchResult {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  page_count: number
  published_at: string | null
}

export function LibraryBrowse({ initialDocuments, initialTotal }: LibraryBrowseProps) {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState(initialDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const themeEntries = Object.entries(THEMES) as [string, (typeof THEMES)[keyof typeof THEMES]][]

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setDocuments(initialDocuments)
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({ q: searchQuery })
      if (activeTheme) params.set('theme', activeTheme)

      const res = await fetch('/api/library/search?' + params.toString())
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)
      const data = await res.json()
      setDocuments(data.documents?.map(function (d: SearchResult) {
        return {
          ...d,
          file_path: '',
          file_size: 0,
          status: 'published',
          uploaded_by: null,
          focus_area_ids: [],
          created_at: d.published_at || '',
          key_points: [],
          search_vector: null,
        }
      }) ?? [])
    } catch {
      // Keep current documents on error
    } finally {
      setIsSearching(false)
    }
  }

  function handleThemeFilter(themeId: string) {
    setActiveTheme(function (prev) { return prev === themeId ? null : themeId })
  }

  // Client-side theme filtering (when not searching)
  const displayDocs = activeTheme && !searchQuery.trim()
    ? documents.filter(function (d) { return d.theme_ids.includes(activeTheme) })
    : documents

  return (
    <>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            placeholder={t('library.search_placeholder')}
            className="w-full pl-11 pr-4 py-3 text-sm border border-brand-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
        </div>
      </form>

      {/* Theme filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {themeEntries.map(function ([id, theme]) {
          const isActive = activeTheme === id
          return (
            <button
              key={id}
              onClick={function () { handleThemeFilter(id) }}
              className={'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ' +
                (isActive
                  ? 'text-white'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text')}
              style={isActive ? { backgroundColor: theme.color } : undefined}
            >
              {theme.name}
            </button>
          )
        })}
      </div>

      {/* Document grid */}
      {isSearching ? (
        <div className="text-center py-12 text-brand-muted">{t('library.searching')}</div>
      ) : displayDocs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayDocs.map(function (doc) {
            return (
              <LibraryCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                summary={doc.summary}
                tags={doc.tags}
                theme_ids={doc.theme_ids}
                page_count={doc.page_count}
                published_at={doc.published_at}
              />
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-brand-muted font-serif italic">{t('library.no_documents')}</p>
        </div>
      )}
    </>
  )
}
