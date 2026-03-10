'use client'

import { useState, useMemo } from 'react'
import {
  Search, BookOpen, Star, ExternalLink, Clock,
  X, ChevronRight, Tag
} from 'lucide-react'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'

interface BookshelfItem {
  id: string
  title: string
  author: string
  description: string | null
  cover_image_url: string | null
  purchase_url: string | null
  free_url: string | null
  isbn: string | null
  theme_id: string | null
  focus_area_ids: string[]
  tags: string[]
  page_count: number | null
  year_published: number | null
  is_featured: boolean
  display_order: number
}

interface BookshelfClientProps {
  books: BookshelfItem[]
}

function getThemeInfo(themeId: string | null) {
  if (!themeId) return null
  const theme = (THEMES as Record<string, { color: string; name: string; slug: string }>)[themeId]
  return theme ? { id: themeId, color: theme.color, name: theme.name } : null
}

export function BookshelfClient({ books }: BookshelfClientProps) {
  const [query, setQuery] = useState('')
  const [activeTheme, setActiveTheme] = useState<string | null>(null)

  const featured = useMemo(function () {
    return books.filter(function (b) { return b.is_featured })
  }, [books])

  const searchResults = useMemo(function () {
    if (!query.trim() && !activeTheme) return null
    const q = query.trim().toLowerCase()
    return books.filter(function (b) {
      const matchesSearch = !q || b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        b.tags.some(function (t) { return t.toLowerCase().includes(q) })
      const matchesTheme = !activeTheme || b.theme_id === activeTheme
      return matchesSearch && matchesTheme
    })
  }, [books, query, activeTheme])

  // Group books by theme
  const themeGroups = useMemo(function () {
    const groups: Record<string, { theme: { id: string; name: string; color: string }; books: BookshelfItem[] }> = {}
    for (const book of books) {
      const tid = book.theme_id
      if (!tid) continue
      if (!groups[tid]) {
        const theme = (THEMES as Record<string, { color: string; name: string }>)[tid]
        if (!theme) continue
        groups[tid] = { theme: { id: tid, name: theme.name, color: theme.color }, books: [] }
      }
      groups[tid].books.push(book)
    }
    return Object.values(groups).sort(function (a, b) { return b.books.length - a.books.length })
  }, [books])

  const isFiltering = !!query.trim() || !!activeTheme

  function clearFilters() {
    setQuery('')
    setActiveTheme(null)
  }

  return (
    <div>
      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <div className="relative flex-1 max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Search by title, author, or topic..."
            className="w-full pl-12 pr-10 py-3.5 border-2 border-brand-text rounded-xl bg-white text-sm text-brand-text placeholder:text-brand-muted-light focus:outline-none focus:border-brand-accent"
           
          />
          {query && (
            <button onClick={function () { setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-text">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Theme pills */}
        <div className="flex flex-wrap gap-2">
          {themeGroups.map(function (g) {
            const isActive = activeTheme === g.theme.id
            return (
              <button
                key={g.theme.id}
                onClick={function () { setActiveTheme(isActive ? null : g.theme.id) }}
                className={'flex items-center gap-1.5 text-xs font-semibold px-3 py-2 border-2 rounded-lg transition-colors ' + (isActive ? 'border-brand-text bg-white' : 'border-brand-border bg-white hover:border-brand-muted')}
              >
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: g.theme.color }} />
                {g.theme.name}
                <span className="text-brand-muted-light ml-0.5">{g.books.length}</span>
              </button>
            )
          })}
          {isFiltering && (
            <button onClick={clearFilters} className="text-xs font-semibold text-brand-accent hover:underline px-2 py-2">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isFiltering ? (
        /* ── Search / Filter Results ── */
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-4">
            {searchResults!.length} book{searchResults!.length !== 1 ? 's' : ''} found
          </p>
          {searchResults!.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults!.map(function (book) { return <BookCard key={book.id} book={book} /> })}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={40} className="mx-auto text-brand-muted-light mb-4" />
              <p className="text-brand-muted mb-2">No books match your search.</p>
              <button onClick={clearFilters} className="text-sm text-brand-accent hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Staff Picks (Featured) ── */}
          {featured.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <Star size={14} className="text-brand-accent" />
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-accent">Staff Picks</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map(function (book) { return <BookCard key={book.id} book={book} featured /> })}
              </div>
            </section>
          )}

          {/* ── Full Shelf ── */}
          <section className="mb-12">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">
              Full Collection &mdash; {books.length} books
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {books.map(function (book) { return <BookCard key={book.id} book={book} /> })}
            </div>
          </section>

          {/* ── By Pathway ── */}
          {themeGroups.length > 1 && (
            <section>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">By Pathway</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {themeGroups.map(function (g) {
                  return (
                    <div key={g.theme.id} className="border border-brand-border rounded-lg overflow-hidden">
                      <div className="h-1.5" style={{ backgroundColor: g.theme.color }} />
                      <div className="p-5">
                        <p className="font-serif text-sm font-bold text-brand-text mb-3">{g.theme.name}</p>
                        <div className="space-y-2">
                          {g.books.slice(0, 4).map(function (book) {
                            return (
                              <div key={book.id} className="flex items-start gap-2 text-xs text-brand-muted">
                                <BookOpen size={11} className="flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <span className="line-clamp-1 text-brand-text font-medium">{book.title}</span>
                                  <span className="text-brand-muted-light"> by {book.author}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <p className="font-mono text-[9px] text-brand-muted-light mt-3">{g.books.length} book{g.books.length !== 1 ? 's' : ''}</p>
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

// ── Book Card ──

function BookCard({ book, featured }: { book: BookshelfItem; featured?: boolean }) {
  const theme = getThemeInfo(book.theme_id)

  return (
    <article
      className={'flex border-2 rounded-lg overflow-hidden hover:-translate-y-0.5 transition-all ' + (featured ? 'border-brand-text' : 'border-brand-border hover:border-brand-text')}
      style={{ boxShadow: 'none' }}
    >
      {/* Book spine */}
      <div className="w-2 flex-shrink-0" style={{ background: theme?.color || '#805ad5' }} />

      {/* Cover or placeholder */}
      {book.cover_image_url ? (
        <div className="w-20 flex-shrink-0 bg-brand-bg">
          <Image src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover"  width={800} height={400} />
        </div>
      ) : (
        <div className="w-16 flex-shrink-0 flex flex-col items-center justify-center py-4 bg-brand-bg border-r border-brand-border">
          <BookOpen size={20} style={{ color: theme?.color || '#805ad5' }} />
          {book.year_published && (
            <span className="font-mono text-[8px] font-bold mt-1" style={{ color: theme?.color || '#805ad5' }}>{book.year_published}</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 p-4">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {featured && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-brand-accent">
              <Star size={9} /> Pick
            </span>
          )}
          {theme && (
            <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: theme.color }}>
              <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: theme.color }} />
              {theme.name}
            </span>
          )}
          {book.page_count && (
            <span className="ml-auto font-mono text-[9px] text-brand-muted-light">
              {book.page_count}p
            </span>
          )}
        </div>

        {/* Title + Author */}
        <h3 className="font-serif text-sm text-brand-text leading-snug mb-0.5 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-[11px] text-brand-muted font-medium mb-2">
          by {book.author}
        </p>

        {/* Description */}
        {book.description && (
          <p className="text-xs text-brand-muted leading-relaxed line-clamp-2 mb-3">
            {book.description}
          </p>
        )}

        {/* Tags */}
        {book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {book.tags.slice(0, 3).map(function (tag) {
              return (
                <span key={tag} className="inline-flex items-center gap-1 text-[9px] font-medium text-brand-muted bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                  <Tag size={8} /> {tag}
                </span>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {book.purchase_url && (
            <a
              href={book.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-accent hover:underline"
            >
              Get this book <ExternalLink size={10} />
            </a>
          )}
          {book.free_url && (
            <a
              href={book.free_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-text hover:underline"
            >
              Read free <ChevronRight size={10} />
            </a>
          )}
          {!book.purchase_url && !book.free_url && book.isbn && (
            <a
              href={'https://www.worldcat.org/isbn/' + book.isbn}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-accent hover:underline"
            >
              Find at library <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
