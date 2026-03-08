'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, FileText, ChevronDown, ChevronRight, MessageCircle,
  BookOpen, Video, Wrench, Calendar, GraduationCap, Map, Newspaper,
  Megaphone, HandHeart, LayoutGrid, List, FolderOpen
} from 'lucide-react'
import Image from 'next/image'

// ── Types ──

interface KBItem {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  focus_area_ids: string[]
  content_type: string
  center: string | null
  source: 'kb_document' | 'content'
  image_url: string | null
  source_url: string | null
  published_at: string | null
}

interface KBTheme {
  id: string
  name: string
  color: string
  emoji: string
}

interface KBFocusArea {
  focus_id: string
  focus_area_name: string
  theme_id: string | null
}

interface KnowledgeBaseClientProps {
  items: KBItem[]
  themes: KBTheme[]
  focusAreas: KBFocusArea[]
}

// ── Content type config ──

const CONTENT_TYPES: Record<string, { label: string; icon: typeof FileText }> = {
  article: { label: 'Articles', icon: Newspaper },
  report: { label: 'Reports', icon: BookOpen },
  document: { label: 'Documents', icon: FileText },
  video: { label: 'Videos', icon: Video },
  tool: { label: 'Tools', icon: Wrench },
  event: { label: 'Events', icon: Calendar },
  course: { label: 'Courses', icon: GraduationCap },
  guide: { label: 'Guides', icon: Map },
  campaign: { label: 'Campaigns', icon: Megaphone },
  opportunity: { label: 'Opportunities', icon: HandHeart },
}

function getIcon(contentType: string) {
  return CONTENT_TYPES[contentType]?.icon || FileText
}

function getItemHref(item: KBItem) {
  if (item.source === 'kb_document') return '/library/doc/' + item.id
  return '/content/' + item.id
}

// ── Main Component ──

type ViewMode = 'browse' | 'az' | 'search'

export function KnowledgeBaseClient({ items, themes, focusAreas }: KnowledgeBaseClientProps) {
  const [view, setView] = useState<ViewMode>('browse')
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set())
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set())

  // Theme map for lookups
  const themeMap = useMemo(function () {
    const map: Record<string, KBTheme> = {}
    themes.forEach(function (t) { map[t.id] = t })
    return map
  }, [themes])

  // Focus area map
  const faMap = useMemo(function () {
    const map: Record<string, KBFocusArea> = {}
    focusAreas.forEach(function (fa) { map[fa.focus_id] = fa })
    return map
  }, [focusAreas])

  // Content type counts
  const typeCounts = useMemo(function () {
    const counts: Record<string, number> = {}
    items.forEach(function (item) {
      const t = item.content_type || 'article'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [items])

  // Filtered items (query + type + theme)
  const filtered = useMemo(function () {
    let result = items
    if (activeType) {
      result = result.filter(function (item) { return item.content_type === activeType })
    }
    if (activeTheme) {
      result = result.filter(function (item) { return item.theme_ids.includes(activeTheme) })
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(function (item) {
        return item.title.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q)) ||
          (item.tags && item.tags.some(function (t) { return t.toLowerCase().includes(q) }))
      })
    }
    return result
  }, [items, activeType, activeTheme, query])

  // A-Z grouping
  const letterGroups = useMemo(function () {
    const groups: Record<string, KBItem[]> = {}
    for (const item of filtered) {
      const firstChar = (item.title[0] || '').toUpperCase()
      const letter = /^[A-Z]/.test(firstChar) ? firstChar : '#'
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(item)
    }
    return groups
  }, [filtered])

  const letters = useMemo(function () {
    return Object.keys(letterGroups).sort(function (a, b) {
      if (a === '#') return 1
      if (b === '#') return -1
      return a.localeCompare(b)
    })
  }, [letterGroups])

  // Browse: group by theme > focus area
  const themeGroups = useMemo(function () {
    return themes.map(function (theme) {
      const themeItems = filtered.filter(function (item) {
        return item.theme_ids.includes(theme.id)
      })
      // Group by focus area within theme
      const faGroups: { fa: KBFocusArea; items: KBItem[] }[] = []
      const usedIds = new Set<string>()
      const themeFAs = focusAreas.filter(function (fa) { return fa.theme_id === theme.id })

      for (const fa of themeFAs) {
        const faItems = themeItems.filter(function (item) {
          return item.focus_area_ids.includes(fa.focus_id)
        })
        if (faItems.length > 0) {
          faGroups.push({ fa, items: faItems })
          faItems.forEach(function (item) { usedIds.add(item.id) })
        }
      }

      // Items in this theme but not assigned to a focus area
      const ungrouped = themeItems.filter(function (item) { return !usedIds.has(item.id) })

      return { theme, faGroups, ungrouped, total: themeItems.length }
    }).filter(function (g) { return g.total > 0 })
  }, [filtered, themes, focusAreas])

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

  function toggleLetter(letter: string) {
    setExpandedLetters(function (prev) {
      const next = new Set(prev)
      if (next.has(letter)) { next.delete(letter) } else { next.add(letter) }
      return next
    })
  }

  function toggleTheme(themeId: string) {
    setExpandedThemes(function (prev) {
      const next = new Set(prev)
      if (next.has(themeId)) { next.delete(themeId) } else { next.add(themeId) }
      return next
    })
  }

  const effectiveExpandedLetters = query.trim() ? new Set(letters) : expandedLetters

  // Sorted content types for filter chips
  const sortedTypes = Object.entries(typeCounts).sort(function (a, b) { return b[1] - a[1] })

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value) }}
          placeholder="Search the knowledge base..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent transition-colors"
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

      {/* View toggle + counts */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 bg-brand-bg rounded-lg p-1">
          <button
            onClick={function () { setView('browse') }}
            className={'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' +
              (view === 'browse' ? 'bg-white shadow-sm text-brand-text' : 'text-brand-muted hover:text-brand-text')}
          >
            <FolderOpen size={13} />
            Browse
          </button>
          <button
            onClick={function () { setView('az') }}
            className={'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' +
              (view === 'az' ? 'bg-white shadow-sm text-brand-text' : 'text-brand-muted hover:text-brand-text')}
          >
            <List size={13} />
            A-Z
          </button>
          <button
            onClick={function () { setView('search') }}
            className={'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ' +
              (view === 'search' ? 'bg-white shadow-sm text-brand-text' : 'text-brand-muted hover:text-brand-text')}
          >
            <LayoutGrid size={13} />
            All
          </button>
        </div>
        <span className="text-xs text-brand-muted">
          {filtered.length} of {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content type filter chips */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={function () { setActiveType(null) }}
          className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
            (!activeType ? 'bg-brand-accent text-white' : 'bg-white border-2 border-brand-border text-brand-muted hover:text-brand-text')}
        >
          All Types
        </button>
        {sortedTypes.map(function ([type, count]) {
          const cfg = CONTENT_TYPES[type]
          if (!cfg) return null
          const Icon = cfg.icon
          const isActive = activeType === type
          return (
            <button
              key={type}
              onClick={function () { setActiveType(isActive ? null : type) }}
              className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
                (isActive ? 'bg-brand-accent text-white' : 'bg-white border-2 border-brand-border text-brand-muted hover:text-brand-text')}
            >
              <Icon size={12} />
              {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Theme filter (for browse/all) */}
      {view !== 'az' && (
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={function () { setActiveTheme(null) }}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' +
              (!activeTheme ? 'bg-brand-text text-white' : 'bg-white border-2 border-brand-border text-brand-muted hover:text-brand-text')}
          >
            All Pathways
          </button>
          {themes.map(function (theme) {
            const isActive = activeTheme === theme.id
            return (
              <button
                key={theme.id}
                onClick={function () { setActiveTheme(isActive ? null : theme.id) }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                style={isActive
                  ? { backgroundColor: theme.color, color: 'white', borderColor: theme.color }
                  : { borderColor: theme.color, color: theme.color }}
              >
                {theme.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Results count when searching */}
      {query.trim() && (
        <p className="text-xs text-brand-muted mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* ── Browse View ── */}
      {view === 'browse' && (
        <div className="space-y-3">
          {themeGroups.length > 0 ? (
            themeGroups.map(function (group) {
              const isExpanded = expandedThemes.has(group.theme.id)
              return (
                <div key={group.theme.id} className="bg-white rounded-xl border-2 border-brand-border overflow-hidden">
                  <button
                    onClick={function () { toggleTheme(group.theme.id) }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-brand-bg/50 transition-colors"
                  >
                    <div
                      className="w-2 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.theme.color }}
                    />
                    {isExpanded
                      ? <ChevronDown size={16} className="text-brand-muted" />
                      : <ChevronRight size={16} className="text-brand-muted" />
                    }
                    <span className="font-serif font-bold text-brand-text">{group.theme.name}</span>
                    <span className="text-xs text-brand-muted ml-auto">{group.total} item{group.total !== 1 ? 's' : ''}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {group.faGroups.map(function (fg) {
                        return (
                          <div key={fg.fa.focus_id} className="mb-4 last:mb-0">
                            <Link
                              href={'/explore/focus/' + fg.fa.focus_id}
                              className="text-xs font-semibold text-brand-accent hover:underline mb-2 block"
                            >
                              {fg.fa.focus_area_name} ({fg.items.length})
                            </Link>
                            <div className="space-y-0.5 ml-3 border-l-2 pl-3" style={{ borderColor: group.theme.color + '40' }}>
                              {fg.items.map(function (item) { return renderItem(item, themeMap) })}
                            </div>
                          </div>
                        )
                      })}
                      {group.ungrouped.length > 0 && (
                        <div className={group.faGroups.length > 0 ? 'mt-4' : ''}>
                          {group.faGroups.length > 0 && (
                            <span className="text-xs font-semibold text-brand-muted mb-2 block">General</span>
                          )}
                          <div className="space-y-0.5 ml-3 border-l-2 pl-3" style={{ borderColor: group.theme.color + '40' }}>
                            {group.ungrouped.map(function (item) { return renderItem(item, themeMap) })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      )}

      {/* ── A-Z View ── */}
      {view === 'az' && (
        <div>
          {/* Jump bar */}
          <div className="flex flex-wrap gap-1 mb-5">
            {alphabet.map(function (letter) {
              const has = letterGroups[letter] && letterGroups[letter].length > 0
              return (
                <button
                  key={letter}
                  onClick={function () {
                    if (has) {
                      const el = document.getElementById('kb-letter-' + letter)
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setExpandedLetters(function (prev) {
                        const next = new Set(prev); next.add(letter); return next
                      })
                    }
                  }}
                  disabled={!has}
                  className={'w-8 h-8 rounded text-xs font-semibold transition-colors ' +
                    (has
                      ? 'bg-white border-2 border-brand-border text-brand-text hover:bg-brand-accent hover:text-white hover:border-brand-accent'
                      : 'bg-brand-bg text-brand-muted/40 cursor-default')}
                >
                  {letter}
                </button>
              )
            })}
          </div>

          {/* Expand/collapse controls */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={function () { setExpandedLetters(new Set(letters)) }} className="text-xs text-brand-accent hover:underline">Expand all</button>
            <span className="text-brand-border">|</span>
            <button onClick={function () { setExpandedLetters(new Set()) }} className="text-xs text-brand-accent hover:underline">Collapse all</button>
          </div>

          {letters.length > 0 ? (
            <div className="space-y-1">
              {letters.map(function (letter) {
                const group = letterGroups[letter]
                const isExpanded = effectiveExpandedLetters.has(letter)
                return (
                  <div key={letter} id={'kb-letter-' + letter} className="scroll-mt-20">
                    <button
                      onClick={function () { toggleLetter(letter) }}
                      className="w-full flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-brand-bg transition-colors"
                    >
                      {isExpanded
                        ? <ChevronDown size={14} className="text-brand-muted" />
                        : <ChevronRight size={14} className="text-brand-muted" />
                      }
                      <span className="text-lg font-serif font-bold text-brand-text">{letter}</span>
                      <span className="text-xs text-brand-muted">({group.length})</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-6 border-l-2 border-brand-border/50 pl-4 pb-2 space-y-0.5">
                        {group.map(function (item) { return renderItem(item, themeMap) })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      )}

      {/* ── All/Grid View ── */}
      {view === 'search' && (
        <div>
          {filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(function (item) {
                const Icon = getIcon(item.content_type)
                const primaryTheme = item.theme_ids.map(function (tid) { return themeMap[tid] }).filter(Boolean)[0]
                return (
                  <Link
                    key={item.id}
                    href={getItemHref(item)}
                    className="group bg-white rounded-xl border-2 border-brand-border p-4 hover:shadow-md transition-shadow"
                  >
                    {item.image_url && (
                      <div className="w-full h-28 rounded-lg overflow-hidden mb-3 bg-brand-bg">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover"  width={800} height={400} />
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Icon size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {primaryTheme && (
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: primaryTheme.color }}
                            />
                          )}
                          <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                            {item.title}
                          </span>
                        </div>
                        {item.summary && (
                          <p className="text-xs text-brand-muted line-clamp-2">{item.summary}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted capitalize">
                            {item.content_type}
                          </span>
                          {item.tags && item.tags.slice(0, 2).map(function (tag) {
                            return (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">
                                {tag}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <EmptyState query={query} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared item row (for browse + A-Z) ──

function renderItem(item: KBItem, themeMap: Record<string, KBTheme>) {
  const Icon = getIcon(item.content_type)
  const primaryTheme = item.theme_ids.map(function (tid) { return themeMap[tid] }).filter(Boolean)[0]

  return (
    <Link
      key={item.id}
      href={getItemHref(item)}
      className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group/item"
    >
      <Icon size={14} className="text-brand-muted mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {primaryTheme && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: primaryTheme.color }}
            />
          )}
          <span className="text-sm text-brand-text group-hover/item:text-brand-accent transition-colors line-clamp-1">
            {item.title}
          </span>
        </div>
        {item.summary && (
          <p className="text-xs text-brand-muted line-clamp-1 mt-0.5 ml-3.5">{item.summary}</p>
        )}
      </div>
      <div className="hidden sm:flex gap-1 flex-shrink-0 items-center">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted capitalize">
          {item.content_type}
        </span>
        {item.tags && item.tags.slice(0, 1).map(function (tag) {
          return (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">
              {tag}
            </span>
          )
        })}
      </div>
    </Link>
  )
}

// ── Empty state ──

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-12">
      <BookOpen size={36} className="mx-auto text-brand-muted mb-4" />
      <p className="text-sm text-brand-muted">
        No items found{query.trim() ? ' matching your search' : ''}. Try different keywords or{' '}
        <Link href="/library/chat" className="text-brand-accent hover:underline inline-flex items-center gap-1">
          <MessageCircle size={12} /> ask our AI assistant
        </Link>.
      </p>
    </div>
  )
}

// ── Legacy export for backwards compat (old KB page) ──
export { KnowledgeBaseClient as KnowledgeBaseTree }
