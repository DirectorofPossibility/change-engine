'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, FileText, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react'

interface KBArticle {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  page_count: number
  published_at: string | null
}

interface KBTheme {
  id: string
  name: string
  color: string
  emoji: string
}

interface KnowledgeBaseTreeProps {
  articles: KBArticle[]
  themes: KBTheme[]
}

export function KnowledgeBaseTree({ articles, themes }: KnowledgeBaseTreeProps) {
  const [query, setQuery] = useState('')
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set())

  const themeMap = useMemo(function () {
    const map: Record<string, KBTheme> = {}
    themes.forEach(function (t) { map[t.id] = t })
    return map
  }, [themes])

  // Filter articles by search query
  const filtered = useMemo(function () {
    const q = query.trim().toLowerCase()
    if (!q) return articles
    return articles.filter(function (a) {
      return a.title.toLowerCase().includes(q) ||
        (a.summary && a.summary.toLowerCase().includes(q)) ||
        (a.tags && a.tags.some(function (t) { return t.toLowerCase().includes(q) }))
    })
  }, [articles, query])

  // Group by first letter A-Z, # for non-alpha
  const letterGroups = useMemo(function () {
    const groups: Record<string, KBArticle[]> = {}
    const sorted = [...filtered].sort(function (a, b) {
      return a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
    })
    for (const article of sorted) {
      const firstChar = (article.title[0] || '').toUpperCase()
      const letter = /^[A-Z]/.test(firstChar) ? firstChar : '#'
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(article)
    }
    return groups
  }, [filtered])

  const letters = useMemo(function () {
    const all = Object.keys(letterGroups).sort(function (a, b) {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })
    return all
  }, [letterGroups])

  // All letters in the alphabet for the index bar
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

  function toggleLetter(letter: string) {
    setExpandedLetters(function (prev) {
      const next = new Set(prev)
      if (next.has(letter)) { next.delete(letter) } else { next.add(letter) }
      return next
    })
  }

  function expandAll() {
    setExpandedLetters(new Set(letters))
  }

  function collapseAll() {
    setExpandedLetters(new Set())
  }

  // Auto-expand all when searching
  const effectiveExpanded = query.trim() ? new Set(letters) : expandedLetters

  return (
    <div>
      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Filter articles..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
          />
          {query && (
            <button
              onClick={function () { setQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="text-xs text-brand-accent hover:underline">Expand all</button>
          <span className="text-brand-border">|</span>
          <button onClick={collapseAll} className="text-xs text-brand-accent hover:underline">Collapse all</button>
        </div>
      </div>

      {/* A-Z jump bar */}
      <div className="flex flex-wrap gap-1 mb-6">
        {alphabet.map(function (letter) {
          const hasArticles = letterGroups[letter] && letterGroups[letter].length > 0
          return (
            <button
              key={letter}
              onClick={function () {
                if (hasArticles) {
                  const el = document.getElementById('kb-letter-' + letter)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setExpandedLetters(function (prev) {
                    const next = new Set(prev)
                    next.add(letter)
                    return next
                  })
                }
              }}
              disabled={!hasArticles}
              className={
                'w-8 h-8 rounded text-xs font-semibold transition-colors ' +
                (hasArticles
                  ? 'bg-white border border-brand-border text-brand-text hover:bg-brand-accent hover:text-white hover:border-brand-accent'
                  : 'bg-brand-bg text-brand-muted/40 cursor-default')
              }
            >
              {letter}
            </button>
          )
        })}
      </div>

      {/* Results count */}
      {query.trim() && (
        <p className="text-xs text-brand-muted mb-4">
          {filtered.length} article{filtered.length !== 1 ? 's' : ''} matching &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Tree */}
      {letters.length > 0 ? (
        <div className="space-y-1">
          {letters.map(function (letter) {
            const group = letterGroups[letter]
            const isExpanded = effectiveExpanded.has(letter)
            return (
              <div key={letter} id={'kb-letter-' + letter} className="scroll-mt-20">
                {/* Letter header */}
                <button
                  onClick={function () { toggleLetter(letter) }}
                  className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-brand-bg transition-colors group"
                >
                  {isExpanded
                    ? <ChevronDown size={14} className="text-brand-muted" />
                    : <ChevronRight size={14} className="text-brand-muted" />
                  }
                  <span className="text-lg font-serif font-bold text-brand-text">{letter}</span>
                  <span className="text-xs text-brand-muted">({group.length})</span>
                </button>

                {/* Articles under this letter */}
                {isExpanded && (
                  <div className="ml-6 border-l-2 border-brand-border/50 pl-4 pb-2 space-y-0.5">
                    {group.map(function (article) {
                      const primaryTheme = (article.theme_ids || [])
                        .map(function (tid) { return themeMap[tid] })
                        .filter(Boolean)[0]
                      return (
                        <Link
                          key={article.id}
                          href={'/library/doc/' + article.id}
                          className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/item"
                        >
                          <FileText size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {primaryTheme && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: primaryTheme.color }}
                                />
                              )}
                              <span className="text-sm text-brand-text group-hover/item:text-brand-accent transition-colors line-clamp-1">
                                {article.title}
                              </span>
                            </div>
                            {article.summary && (
                              <p className="text-xs text-brand-muted line-clamp-1 mt-0.5 ml-3.5">{article.summary}</p>
                            )}
                          </div>
                          {article.tags && article.tags.length > 0 && (
                            <div className="hidden sm:flex gap-1 flex-shrink-0">
                              {article.tags.slice(0, 2).map(function (tag) {
                                return (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">
                                    {tag}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-brand-muted">
            No articles found{query.trim() ? ' matching your search' : ''}. Try different keywords or{' '}
            <Link href="/library/chat" className="text-brand-accent hover:underline inline-flex items-center gap-1">
              <MessageCircle size={12} /> ask our AI assistant
            </Link>.
          </p>
        </div>
      )}
    </div>
  )
}
