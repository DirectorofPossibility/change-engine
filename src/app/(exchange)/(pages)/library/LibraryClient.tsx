'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, FileText, BookOpen, MessageCircle, Download,
  ChevronRight, Clock, X, Lightbulb, Building2
} from 'lucide-react'
import { THEMES } from '@/lib/constants'

// ── Types ──

interface LibraryDoc {
  id: string
  title: string
  summary: string
  key_points: string[]
  tags: string[]
  theme_ids: string[]
  page_count: number
  file_size: number
  file_path: string
  published_at: string | null
}

interface LibraryClientProps {
  documents: LibraryDoc[]
}

// ── Helpers ──

function readTime(pages: number): string {
  if (pages <= 1) return '1 min read'
  const mins = Math.max(2, Math.round(pages * 2.5))
  if (mins < 60) return mins + ' min read'
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return hrs + 'h' + (rem > 0 ? ' ' + rem + 'm' : '') + ' read'
}

function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function extractOrg(tags: string[]): string | null {
  // First few tags often contain source org name
  if (!tags || tags.length === 0) return null
  // Heuristic: org names are typically the first tag and contain capitals or known patterns
  const first = tags[0]
  if (first && /[A-Z]/.test(first[0]) && first.length > 3 && !first.includes(' ')) return null
  if (first && /[A-Z]/.test(first[0])) return first
  return null
}

function getThemeInfo(themeIds: string[]) {
  return themeIds
    .map(function (tid) {
      const theme = (THEMES as Record<string, { color: string; name: string; slug: string }>)[tid]
      return theme ? { id: tid, color: theme.color, name: theme.name, slug: theme.slug } : null
    })
    .filter(Boolean) as { id: string; color: string; name: string; slug: string }[]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// ── Main Component ──

export function LibraryClient({ documents }: LibraryClientProps) {
  const [query, setQuery] = useState('')

  // Filter out test/dummy docs
  const docs = useMemo(function () {
    return documents.filter(function (d) {
      return d.title.toLowerCase().indexOf('dummy') === -1 && d.title.toLowerCase().indexOf('test') === -1
    })
  }, [documents])

  // Search results
  const searchResults = useMemo(function () {
    if (!query.trim()) return null
    const q = query.trim().toLowerCase()
    return docs.filter(function (d) {
      return d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.tags.some(function (t) { return t.toLowerCase().includes(q) }) ||
        d.key_points.some(function (kp) { return kp.toLowerCase().includes(q) })
    })
  }, [docs, query])

  // Featured = most recent
  const featured = docs[0] || null
  const rest = docs.slice(1)

  // Group remaining by primary theme for "collections"
  const collections = useMemo(function () {
    const groups: Record<string, { theme: { id: string; name: string; color: string }; docs: LibraryDoc[] }> = {}
    for (const doc of rest) {
      const tid = doc.theme_ids[0]
      if (!tid) continue
      if (!groups[tid]) {
        const theme = (THEMES as Record<string, { color: string; name: string }>)[tid]
        if (!theme) continue
        groups[tid] = { theme: { id: tid, name: theme.name, color: theme.color }, docs: [] }
      }
      groups[tid].docs.push(doc)
    }
    return Object.values(groups).sort(function (a, b) { return b.docs.length - a.docs.length })
  }, [rest])

  const isSearching = !!query.trim()

  return (
    <div>
      {/* ── Search ── */}
      <div className="relative max-w-xl mx-auto mb-12">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
        <input
          type="text"
          value={query}
          onChange={function (e) { setQuery(e.target.value) }}
          placeholder="Search research documents..."
          className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent shadow-sm"
        />
        {query && (
          <button onClick={function () { setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-text">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Search Results ── */}
      {isSearching ? (
        <div>
          <p className="text-sm text-brand-muted mb-6">
            {searchResults!.length} result{searchResults!.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
          {searchResults!.length > 0 ? (
            <div className="space-y-4">
              {searchResults!.map(function (doc) { return <SearchResultCard key={doc.id} doc={doc} /> })}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-brand-muted/40 mb-4" />
              <p className="text-brand-muted mb-2">No documents match your search.</p>
              <p className="text-sm text-brand-muted">Try different keywords, or</p>
              <Link href="/library/chat" className="text-sm text-brand-accent hover:underline inline-flex items-center gap-1 mt-1">
                <MessageCircle size={13} /> ask Chance to help find what you need
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Featured Document ── */}
          {featured && <FeaturedCard doc={featured} />}

          {/* ── Research Assistant CTA ── */}
          <section className="my-12">
            <Link
              href="/library/chat"
              className="group relative flex items-center gap-6 bg-gradient-to-r from-brand-dark to-brand-dark/90 rounded-2xl p-6 sm:p-8 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #C75B2A 0%, transparent 50%)' }} />
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={28} className="text-white" />
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="font-serif font-bold text-white text-lg mb-1">
                  Chat with Chance
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Ask questions about any document. Chance can summarize research, compare findings across studies, and help you find connections.
                </p>
              </div>
              <ChevronRight size={20} className="text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />
            </Link>
          </section>

          {/* ── Full Collection ── */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-0.5 bg-brand-accent rounded-full" />
              <h2 className="font-serif text-xl font-bold text-brand-text">Full Collection</h2>
              <span className="text-xs text-brand-muted">{docs.length} document{docs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-4">
              {rest.map(function (doc) { return <DocumentRow key={doc.id} doc={doc} /> })}
            </div>
          </section>

          {/* ── By Pathway ── */}
          {collections.length > 1 && (
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-0.5 bg-brand-accent rounded-full" />
                <h2 className="font-serif text-xl font-bold text-brand-text">By Pathway</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map(function (col) {
                  return (
                    <div key={col.theme.id} className="bg-white rounded-xl border border-brand-border overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: col.theme.color }} />
                      <div className="p-4">
                        <h3 className="font-serif font-bold text-brand-text text-sm mb-2">{col.theme.name}</h3>
                        <div className="space-y-1.5">
                          {col.docs.slice(0, 3).map(function (doc) {
                            return (
                              <Link
                                key={doc.id}
                                href={'/library/doc/' + doc.id}
                                className="block text-xs text-brand-muted hover:text-brand-accent transition-colors line-clamp-1"
                              >
                                {doc.title}
                              </Link>
                            )
                          })}
                        </div>
                        <p className="text-[10px] text-brand-muted/60 mt-2">{col.docs.length} document{col.docs.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

// ── Featured Card ──

function FeaturedCard({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={14} className="text-brand-accent" />
        <span className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Latest Research</span>
      </div>

      <Link href={'/library/doc/' + doc.id} className="group block">
        <article className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-shadow">
          {/* Gradient header */}
          <div className="h-2" style={{ background: themes.length > 1
            ? 'linear-gradient(90deg, ' + themes.map(function (t) { return t.color }).join(', ') + ')'
            : (primary?.color || '#C75B2A')
          }} />

          <div className="p-6 sm:p-8">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {org && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-text">
                  <Building2 size={12} className="text-brand-muted" />
                  {org}
                </span>
              )}
              {themes.map(function (t) {
                return (
                  <span key={t.id} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: t.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                )
              })}
              <span className="text-xs text-brand-muted flex items-center gap-1 ml-auto">
                <Clock size={11} />
                {readTime(doc.page_count)}
              </span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-text group-hover:text-brand-accent transition-colors leading-tight mb-4">
              {doc.title}
            </h2>

            {/* Summary */}
            <p className="text-brand-muted leading-relaxed mb-6 max-w-3xl">
              {doc.summary}
            </p>

            {/* Key takeaways preview */}
            {doc.key_points.length > 0 && (
              <div className="bg-brand-bg/60 rounded-xl p-5 mb-5">
                <h3 className="text-xs font-semibold text-brand-text uppercase tracking-wide mb-3">Key Takeaways</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {doc.key_points.slice(0, 4).map(function (point, i) {
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: primary?.color || '#C75B2A' }}
                        >
                          {i + 1}
                        </span>
                        <p className="text-xs text-brand-text leading-relaxed line-clamp-2">{point}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-brand-accent font-medium group-hover:underline flex items-center gap-1">
                Read full document <ChevronRight size={13} />
              </span>
              <span className="text-xs text-brand-muted">{doc.page_count} pages</span>
              <span className="text-xs text-brand-muted">{fileSizeLabel(doc.file_size)}</span>
            </div>
          </div>
        </article>
      </Link>
    </section>
  )
}

// ── Document Row ──

function DocumentRow({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block">
      <article className="flex gap-5 bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
        {/* Color accent + page count */}
        <div className="flex-shrink-0 w-16 flex flex-col items-center justify-center">
          <div className="w-12 h-14 rounded-lg flex flex-col items-center justify-center" style={{ backgroundColor: (primary?.color || '#C75B2A') + '12' }}>
            <FileText size={18} style={{ color: primary?.color || '#C75B2A' }} />
            <span className="text-[9px] font-bold mt-0.5" style={{ color: primary?.color || '#C75B2A' }}>{doc.page_count}p</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {org && (
              <span className="text-[11px] font-medium text-brand-text">{org}</span>
            )}
            {themes.slice(0, 2).map(function (t) {
              return (
                <span key={t.id} className="inline-flex items-center gap-1 text-[10px]" style={{ color: t.color }}>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              )
            })}
            <span className="text-[10px] text-brand-muted/60 ml-auto flex items-center gap-0.5">
              <Clock size={9} /> {readTime(doc.page_count)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug mb-1.5">
            {doc.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed mb-2">
            {doc.summary}
          </p>

          {/* Takeaway teaser */}
          {doc.key_points.length > 0 && (
            <p className="text-[11px] text-brand-text/70 italic line-clamp-1">
              &ldquo;{doc.key_points[0]}&rdquo;
            </p>
          )}
        </div>

        {/* Actions (desktop) */}
        <div className="hidden sm:flex flex-col items-center justify-center gap-2 flex-shrink-0">
          <span className="text-xs text-brand-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Read
          </span>
        </div>
      </article>
    </Link>
  )
}

// ── Search Result Card ──

function SearchResultCard({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block">
      <article className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-10 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (primary?.color || '#C75B2A') + '12' }}>
            <FileText size={18} style={{ color: primary?.color || '#C75B2A' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {org && <span className="text-[11px] font-medium text-brand-text">{org}</span>}
              {themes.slice(0, 2).map(function (t) {
                return (
                  <span key={t.id} className="inline-flex items-center gap-1 text-[10px]" style={{ color: t.color }}>
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                )
              })}
            </div>
            <h3 className="font-serif text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 mb-1">
              {doc.title}
            </h3>
            <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed mb-2">{doc.summary}</p>
            <div className="flex items-center gap-3 text-[10px] text-brand-muted">
              <span>{doc.page_count} pages</span>
              <span>{readTime(doc.page_count)}</span>
              <span>{fileSizeLabel(doc.file_size)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
