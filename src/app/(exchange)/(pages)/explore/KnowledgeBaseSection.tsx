'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, FileText, ArrowRight } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  summary: string
  tags: string[]
  page_count: number
}

export function KnowledgeBaseSection() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async function () {
    const q = query.trim()
    if (!q) return

    setIsSearching(true)
    setHasSearched(true)
    try {
      const res = await fetch('/api/library/search?q=' + encodeURIComponent(q))
      if (res.ok) {
        const data = await res.json()
        setResults(data.documents || [])
      }
    } catch {
      setResults([])
    }
    setIsSearching(false)
  }, [query])

  return (
    <div className="mb-8">
      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value) }}
          onKeyDown={function (e) { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search the knowledge base..."
          className="w-full pl-11 pr-24 py-3 rounded-xl border border-brand-border bg-white text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search results */}
      {hasSearched && (
        <div className="mb-6">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-brand-muted mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
              {results.map(function (doc) {
                return (
                  <Link
                    key={doc.id}
                    href={'/library/doc/' + doc.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-brand-border hover:shadow-sm transition-shadow group"
                  >
                    <FileText size={16} className="text-brand-muted mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
                        {doc.title}
                      </h4>
                      {doc.summary && (
                        <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">{doc.summary}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-brand-muted mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-brand-muted py-4 text-center">
              No articles found for &ldquo;{query}&rdquo;. Try different keywords or{' '}
              <Link href="/library/chat" className="text-brand-accent hover:underline">ask our AI assistant</Link>.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
