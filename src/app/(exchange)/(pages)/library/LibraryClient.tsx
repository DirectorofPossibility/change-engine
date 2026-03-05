'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, FileText, BookOpen, Video, Wrench, Calendar as CalendarIcon,
  GraduationCap, Map, Megaphone, HandHeart, Newspaper, ArrowRight,
  MessageCircle, Clock, TrendingUp, Filter, X
} from 'lucide-react'

// ── Types ──

interface LibraryItem {
  id: string
  title: string
  summary: string
  tags: string[]
  theme_ids: string[]
  content_type: string
  source: 'kb_document' | 'content'
  image_url: string | null
  published_at: string | null
  page_count: number
}

interface ThemeInfo {
  id: string
  name: string
  color: string
  slug: string
  description: string
}

interface LibraryClientProps {
  items: LibraryItem[]
  themes: ThemeInfo[]
  featured: LibraryItem[]
}

// ── Content type config ──

const TYPE_CONFIG: Record<string, { label: string; plural: string; icon: typeof FileText; color: string }> = {
  article:     { label: 'Article',     plural: 'Articles',      icon: Newspaper,     color: '#38a169' },
  report:      { label: 'Report',      plural: 'Reports',       icon: BookOpen,      color: '#3182ce' },
  document:    { label: 'Document',    plural: 'Documents',     icon: FileText,      color: '#718096' },
  video:       { label: 'Video',       plural: 'Videos',        icon: Video,         color: '#e53e3e' },
  tool:        { label: 'Tool',        plural: 'Tools',         icon: Wrench,        color: '#d69e2e' },
  event:       { label: 'Event',       plural: 'Events',        icon: CalendarIcon,  color: '#dd6b20' },
  course:      { label: 'Course',      plural: 'Courses',       icon: GraduationCap, color: '#805ad5' },
  guide:       { label: 'Guide',       plural: 'Guides',        icon: Map,           color: '#319795' },
  campaign:    { label: 'Campaign',    plural: 'Campaigns',     icon: Megaphone,     color: '#e53e3e' },
  opportunity: { label: 'Opportunity', plural: 'Opportunities', icon: HandHeart,     color: '#38a169' },
}

function getItemHref(item: LibraryItem) {
  if (item.source === 'kb_document') return '/library/doc/' + item.id
  return '/content/' + item.id
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return days + ' days ago'
  if (days < 30) return Math.floor(days / 7) + 'w ago'
  if (days < 365) return Math.floor(days / 30) + 'mo ago'
  return Math.floor(days / 365) + 'y ago'
}

// ── Main Component ──

export function LibraryClient({ items, themes, featured }: LibraryClientProps) {
  const [query, setQuery] = useState('')
  const [activeType, setActiveType] = useState<string | null>(null)
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const isFiltering = !!query.trim() || !!activeType || !!activeTheme

  // Type counts
  const typeCounts = useMemo(function () {
    const counts: Record<string, number> = {}
    items.forEach(function (item) {
      const t = item.content_type || 'article'
      counts[t] = (counts[t] || 0) + 1
    })
    return counts
  }, [items])

  // Theme counts
  const themeCounts = useMemo(function () {
    const counts: Record<string, number> = {}
    items.forEach(function (item) {
      item.theme_ids.forEach(function (tid) {
        counts[tid] = (counts[tid] || 0) + 1
      })
    })
    return counts
  }, [items])

  // Filtered results
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

  // Recent items (for non-filtered view)
  const recent = useMemo(function () {
    return [...items]
      .sort(function (a, b) {
        if (!a.published_at) return 1
        if (!b.published_at) return -1
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      })
      .slice(0, 12)
  }, [items])

  // Top content types sorted by count
  const sortedTypes = Object.entries(typeCounts).sort(function (a, b) { return b[1] - a[1] })

  function clearFilters() {
    setQuery('')
    setActiveType(null)
    setActiveTheme(null)
  }

  return (
    <div>
      {/* ── Search Bar ── */}
      <div className="relative max-w-2xl mx-auto mb-8">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value) }}
          placeholder="Search articles, reports, guides, videos..."
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent shadow-sm transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button onClick={function () { setQuery('') }} className="p-1 text-brand-muted hover:text-brand-text">
              <X size={14} />
            </button>
          )}
          <button
            onClick={function () { setShowFilters(!showFilters) }}
            className={'p-1.5 rounded-lg transition-colors ' + (showFilters || activeType || activeTheme ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-muted hover:text-brand-text')}
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {(showFilters || isFiltering) && (
        <div className="max-w-2xl mx-auto mb-6 space-y-3">
          {/* Content type chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={function () { setActiveType(null) }}
              className={'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ' +
                (!activeType ? 'bg-brand-text text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text')}
            >
              All Types
            </button>
            {sortedTypes.map(function ([type, count]) {
              const cfg = TYPE_CONFIG[type]
              if (!cfg) return null
              const Icon = cfg.icon
              const active = activeType === type
              return (
                <button
                  key={type}
                  onClick={function () { setActiveType(active ? null : type) }}
                  className={'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ' +
                    (active ? 'text-white border-transparent' : 'bg-white text-brand-muted border-brand-border hover:text-brand-text')}
                  style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                >
                  <Icon size={11} />
                  {cfg.plural} ({count})
                </button>
              )
            })}
          </div>

          {/* Pathway chips */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={function () { setActiveTheme(null) }}
              className={'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ' +
                (!activeTheme ? 'bg-brand-text text-white' : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text')}
            >
              All Pathways
            </button>
            {themes.map(function (theme) {
              const active = activeTheme === theme.id
              const count = themeCounts[theme.id] || 0
              return (
                <button
                  key={theme.id}
                  onClick={function () { setActiveTheme(active ? null : theme.id) }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border"
                  style={active
                    ? { backgroundColor: theme.color, color: 'white', borderColor: theme.color }
                    : { borderColor: theme.color, color: theme.color }}
                >
                  {theme.name} ({count})
                </button>
              )
            })}
          </div>

          {isFiltering && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-brand-muted">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {query.trim() ? ' for "' + query + '"' : ''}
              </p>
              <button onClick={clearFilters} className="text-xs text-brand-accent hover:underline">Clear all filters</button>
            </div>
          )}
        </div>
      )}

      {/* ── Filtered Results ── */}
      {isFiltering ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map(function (item) { return renderCard(item, themes) })
          ) : (
            <div className="col-span-full text-center py-16">
              <Search size={36} className="mx-auto text-brand-muted mb-4" />
              <p className="text-brand-muted">No results found. Try different keywords or filters.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Featured Section ── */}
          {featured.length > 0 && (
            <section className="mb-12">
              <div className="grid gap-5 lg:grid-cols-2">
                {/* Main featured */}
                {featured[0] && (
                  <Link href={getItemHref(featured[0])} className="group">
                    <article className="bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-lg transition-shadow h-full">
                      {featured[0].image_url ? (
                        <div className="w-full h-48 bg-brand-bg overflow-hidden">
                          <img src={featured[0].image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      ) : (
                        <div className="w-full h-3" style={{ background: getThemeGradient(featured[0].theme_ids, themes) }} />
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <TypeBadge type={featured[0].content_type} />
                          <ThemeDots themeIds={featured[0].theme_ids} themes={themes} />
                          {featured[0].published_at && (
                            <span className="text-[10px] text-brand-muted ml-auto">{timeAgo(featured[0].published_at)}</span>
                          )}
                        </div>
                        <h3 className="font-serif text-xl font-bold text-brand-text group-hover:text-brand-accent transition-colors mb-2 line-clamp-2">
                          {featured[0].title}
                        </h3>
                        <p className="text-sm text-brand-muted leading-relaxed line-clamp-3">{featured[0].summary}</p>
                        {featured[0].tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {featured[0].tags.slice(0, 4).map(function (tag) {
                              return <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{tag}</span>
                            })}
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                )}
                {/* Secondary featured */}
                <div className="space-y-3">
                  {featured.slice(1, 4).map(function (item) {
                    return (
                      <Link key={item.id} href={getItemHref(item)} className="group flex gap-4 bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow">
                        {item.image_url ? (
                          <div className="w-24 h-20 rounded-lg overflow-hidden bg-brand-bg flex-shrink-0">
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-24 h-20 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: getThemeColor(item.theme_ids, themes) + '15' }}>
                            {(() => { const cfg = TYPE_CONFIG[item.content_type]; const Icon = cfg ? cfg.icon : FileText; return <Icon size={24} style={{ color: getThemeColor(item.theme_ids, themes) }} /> })()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeBadge type={item.content_type} />
                            {item.published_at && (
                              <span className="text-[10px] text-brand-muted">{timeAgo(item.published_at)}</span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-xs text-brand-muted line-clamp-1 mt-1">{item.summary}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── Browse by Type ── */}
          <section className="mb-12">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-4">Browse by Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {sortedTypes.slice(0, 10).map(function ([type, count]) {
                const cfg = TYPE_CONFIG[type]
                if (!cfg) return null
                const Icon = cfg.icon
                return (
                  <button
                    key={type}
                    onClick={function () { setActiveType(type); setShowFilters(true) }}
                    className="group bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow text-left"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: cfg.color + '15' }}>
                      <Icon size={20} style={{ color: cfg.color }} />
                    </div>
                    <p className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors">{cfg.plural}</p>
                    <p className="text-xs text-brand-muted">{count} item{count !== 1 ? 's' : ''}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Browse by Pathway ── */}
          <section className="mb-12">
            <h2 className="font-serif text-xl font-bold text-brand-text mb-4">Browse by Pathway</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themes.map(function (theme) {
                const count = themeCounts[theme.id] || 0
                if (count === 0) return null
                return (
                  <button
                    key={theme.id}
                    onClick={function () { setActiveTheme(theme.id); setShowFilters(true) }}
                    className="group bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow text-left flex"
                  >
                    <div className="w-1.5 group-hover:w-2 transition-all flex-shrink-0" style={{ backgroundColor: theme.color }} />
                    <div className="p-4 flex-1">
                      <h3 className="font-serif text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors">{theme.name}</h3>
                      <p className="text-xs text-brand-muted line-clamp-2 mt-1 leading-relaxed">{theme.description}</p>
                      <p className="text-xs text-brand-muted mt-2">{count} item{count !== 1 ? 's' : ''}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Recently Added ── */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-brand-text">Recently Added</h2>
              <Link href="/explore/knowledge-base" className="text-xs text-brand-accent hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.slice(0, 9).map(function (item) { return renderCard(item, themes) })}
            </div>
          </section>

          {/* ── AI Chat CTA ── */}
          <section>
            <Link
              href="/library/chat"
              className="group flex items-center gap-4 bg-white rounded-xl border border-brand-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-xl bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={26} className="text-brand-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-brand-text group-hover:text-brand-accent transition-colors text-lg">
                  Chat with Chance
                </h3>
                <p className="text-sm text-brand-muted">
                  Ask questions about any document in the library. Chance can summarize, compare, and find connections across research.
                </p>
              </div>
              <ArrowRight size={20} className="text-brand-muted group-hover:text-brand-accent transition-colors flex-shrink-0" />
            </Link>
          </section>
        </>
      )}
    </div>
  )
}

// ── Shared Components ──

function renderCard(item: LibraryItem, themes: ThemeInfo[]) {
  const cfg = TYPE_CONFIG[item.content_type] || TYPE_CONFIG.article
  const Icon = cfg?.icon || FileText
  const themeColor = getThemeColor(item.theme_ids, themes)

  return (
    <Link key={item.id} href={getItemHref(item)} className="group">
      <article className="bg-white rounded-xl border border-brand-border overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {item.image_url ? (
          <div className="w-full h-36 bg-brand-bg overflow-hidden">
            <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="h-1.5" style={{ background: 'linear-gradient(90deg, ' + themeColor + ', ' + themeColor + '40)' }} />
        )}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TypeBadge type={item.content_type} />
            <ThemeDots themeIds={item.theme_ids} themes={themes} />
            {item.published_at && (
              <span className="text-[10px] text-brand-muted ml-auto">{timeAgo(item.published_at)}</span>
            )}
          </div>
          <h3 className="font-serif text-sm font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 mb-1">
            {item.title}
          </h3>
          {item.summary && (
            <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed flex-1">{item.summary}</p>
          )}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {item.tags.slice(0, 3).map(function (tag) {
                return <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">{tag}</span>
              })}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type]
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: cfg.color + '15', color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

function ThemeDots({ themeIds, themes }: { themeIds: string[]; themes: ThemeInfo[] }) {
  if (themeIds.length === 0) return null
  return (
    <div className="flex gap-0.5">
      {themeIds.slice(0, 3).map(function (tid) {
        const theme = themes.find(function (t) { return t.id === tid })
        if (!theme) return null
        return <span key={tid} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} title={theme.name} />
      })}
    </div>
  )
}

function getThemeColor(themeIds: string[], themes: ThemeInfo[]): string {
  for (const tid of themeIds) {
    const theme = themes.find(function (t) { return t.id === tid })
    if (theme) return theme.color
  }
  return '#C75B2A'
}

function getThemeGradient(themeIds: string[], themes: ThemeInfo[]): string {
  const colors = themeIds
    .map(function (tid) { return themes.find(function (t) { return t.id === tid }) })
    .filter(Boolean)
    .map(function (t) { return t!.color })
  if (colors.length === 0) return '#C75B2A'
  if (colors.length === 1) return 'linear-gradient(90deg, ' + colors[0] + ', ' + colors[0] + '60)'
  return 'linear-gradient(90deg, ' + colors.join(', ') + ')'
}
