'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, FileText, BookOpen, MessageCircle,
  ChevronRight, Clock, X, Lightbulb, Building2
} from 'lucide-react'
import { THEMES } from '@/lib/constants'

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
  if (!tags || tags.length === 0) return null
  const first = tags[0]
  if (first && /[A-Z]/.test(first[0]) && first.length > 3) return first
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

export function LibraryClient({ documents }: LibraryClientProps) {
  const [query, setQuery] = useState('')

  const docs = useMemo(function () {
    return documents.filter(function (d) {
      return d.title.toLowerCase().indexOf('dummy') === -1 && d.title.toLowerCase().indexOf('test') === -1
    })
  }, [documents])

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

  const featured = docs[0] || null
  const rest = docs.slice(1)

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
          placeholder="Search the collection..."
          className="w-full pl-12 pr-10 py-3.5 border-2 border-brand-text rounded-xl bg-white text-sm text-brand-text placeholder:text-brand-muted-light focus:outline-none focus:border-brand-accent"
          style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
        />
        {query && (
          <button onClick={function () { setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-text">
            <X size={14} />
          </button>
        )}
      </div>

      {isSearching ? (
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-4">
            {searchResults!.length} result{searchResults!.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
          {searchResults!.length > 0 ? (
            <div className="space-y-3">
              {searchResults!.map(function (doc) { return <BookCard key={doc.id} doc={doc} /> })}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-brand-muted-light mb-4" />
              <p className="text-brand-muted mb-3">No documents match your search.</p>
              <Link href="/library/chat" className="text-sm text-brand-accent hover:underline inline-flex items-center gap-1">
                <MessageCircle size={13} /> Ask Chance to help find what you need
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Featured ── */}
          {featured && <FeaturedBook doc={featured} />}

          {/* ── Ask Chance ── */}
          <Link
            href="/library/chat"
            className="group flex items-center gap-5 my-10 p-6 border-2 border-brand-border rounded-xl bg-brand-bg-alt text-brand-text hover:-translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0 #E2DDD5' }}
          >
            <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={24} className="text-brand-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg mb-0.5 text-brand-text">Chat with Chance</h3>
              <p className="text-brand-muted text-sm">Ask questions about any document. Summarize, compare, and explore connections.</p>
            </div>
            <ChevronRight size={20} className="text-white/30 group-hover:text-white/70 transition-colors flex-shrink-0" />
          </Link>

          {/* ── Full Collection — bookshelf style ── */}
          <section className="mb-10">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-4">
              Full Collection — {docs.length} documents
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rest.map(function (doc) { return <BookCard key={doc.id} doc={doc} /> })}
            </div>
          </section>

          {/* ── By Pathway — shelf sections ── */}
          {collections.length > 1 && (
            <section>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-4">By Pathway</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map(function (col) {
                  return (
                    <div key={col.theme.id} className="border-2 border-brand-border rounded-lg overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
                      <div className="h-1.5" style={{ backgroundColor: col.theme.color }} />
                      <div className="p-4">
                        <p className="font-serif text-sm font-bold text-brand-text mb-2">{col.theme.name}</p>
                        <div className="space-y-1.5">
                          {col.docs.slice(0, 4).map(function (doc) {
                            return (
                              <Link
                                key={doc.id}
                                href={'/library/doc/' + doc.id}
                                className="flex items-center gap-2 text-xs text-brand-muted hover:text-brand-accent transition-colors"
                              >
                                <FileText size={11} className="flex-shrink-0" />
                                <span className="line-clamp-1">{doc.title}</span>
                              </Link>
                            )
                          })}
                        </div>
                        <p className="font-mono text-[9px] text-brand-muted-light mt-2">{col.docs.length} document{col.docs.length !== 1 ? 's' : ''}</p>
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

// ── Featured Book Card ──

function FeaturedBook({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block mb-8">
      <article className="border-2 border-brand-text rounded-xl overflow-hidden hover:-translate-y-1 transition-all" style={{ boxShadow: '4px 4px 0 #D5D0C8' }}>
        {/* Spine color */}
        <div className="flex">
          <div className="w-2 flex-shrink-0" style={{ background: primary?.color || '#3182ce' }} />
          <div className="flex-1 p-6 sm:p-8 bg-white">
            {/* Meta */}
            <div className="flex items-center gap-3 mb-3">
              <Lightbulb size={13} className="text-brand-accent" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-accent">Latest Research</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              {org && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">
                  <Building2 size={12} className="text-brand-muted" />
                  {org}
                </span>
              )}
              {themes.map(function (t) {
                return (
                  <span key={t.id} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: t.color }}>
                    <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </span>
                )
              })}
              <span className="ml-auto font-mono text-[10px] text-brand-muted-light flex items-center gap-1">
                <Clock size={10} />
                {readTime(doc.page_count)}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl text-brand-text group-hover:text-brand-accent transition-colors leading-tight mb-3">
              {doc.title}
            </h2>

            <p className="text-brand-muted leading-relaxed mb-5 max-w-3xl">{doc.summary}</p>

            {/* Key takeaways */}
            {doc.key_points.length > 0 && (
              <div className="bg-brand-bg rounded-lg p-5 mb-5 border-2 border-brand-border">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-3">Key Takeaways</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {doc.key_points.slice(0, 4).map(function (point, i) {
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <span
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: primary?.color || '#3182ce' }}
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

            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-accent group-hover:underline flex items-center gap-1">
                Read full document <ChevronRight size={13} />
              </span>
              <span className="font-mono text-[10px] text-brand-muted-light">{doc.page_count} pages</span>
              <span className="font-mono text-[10px] text-brand-muted-light">{fileSizeLabel(doc.file_size)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ── Book Card ──

function BookCard({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block">
      <article className="flex border-2 border-brand-border rounded-lg overflow-hidden hover:-translate-y-0.5 hover:border-brand-text hover:shadow-md transition-all" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
        {/* Book spine */}
        <div className="w-1.5 flex-shrink-0" style={{ background: primary?.color || '#3182ce' }} />

        {/* Page count visual — like a book's edge */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center justify-center bg-brand-bg border-r border-brand-border">
          <FileText size={16} style={{ color: primary?.color || '#3182ce' }} />
          <span className="font-mono text-[8px] font-bold mt-0.5" style={{ color: primary?.color || '#3182ce' }}>{doc.page_count}p</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {org && <span className="text-[11px] font-semibold text-brand-text">{org}</span>}
            {themes.slice(0, 2).map(function (t) {
              return (
                <span key={t.id} className="flex items-center gap-1 text-[10px] font-medium" style={{ color: t.color }}>
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              )
            })}
            <span className="ml-auto font-mono text-[9px] text-brand-muted-light flex items-center gap-0.5">
              <Clock size={9} /> {readTime(doc.page_count)}
            </span>
          </div>

          <h3 className="font-serif text-sm text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug mb-1">
            {doc.title}
          </h3>

          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
            {doc.summary}
          </p>
        </div>
      </article>
    </Link>
  )
}
