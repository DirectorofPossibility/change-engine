'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Search, BookOpen, MessageCircle, Library,
  Grid, List, BookMarked, Bookmark,
  X, FileText
} from 'lucide-react'
import { THEMES } from '@/lib/constants'
import { GradientFOL } from '@/components/exchange/GradientFOL'

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

type ViewMode = 'bookshelf' | 'catalog' | 'list'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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

function getSpineWidth(pageCount: number): number {
  if (pageCount <= 5) return 32
  if (pageCount <= 15) return 40
  if (pageCount <= 30) return 48
  if (pageCount <= 60) return 56
  return 64
}

export function LibraryClient({ documents }: LibraryClientProps) {
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('bookshelf')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [hoveredBook, setHoveredBook] = useState<string | null>(null)

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

  const collections = useMemo(function () {
    const groups: Record<string, { theme: { id: string; name: string; color: string }; docs: LibraryDoc[] }> = {}
    for (const doc of docs) {
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
  }, [docs])

  // Group docs by first letter for A-Z index
  const docsByLetter = useMemo(function () {
    const groups: Record<string, LibraryDoc[]> = {}
    const sorted = [...docs].sort(function (a, b) { return a.title.localeCompare(b.title) })
    for (const doc of sorted) {
      const firstChar = doc.title.charAt(0).toUpperCase()
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#'
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(doc)
    }
    return groups
  }, [docs])

  const lettersWithDocs = useMemo(function () {
    return new Set(Object.keys(docsByLetter))
  }, [docsByLetter])

  const totalPages = useMemo(function () {
    return docs.reduce(function (sum, d) { return sum + d.page_count }, 0)
  }, [docs])

  const filteredDocs = useMemo(function () {
    if (activeLetter) {
      return docsByLetter[activeLetter] || []
    }
    return null
  }, [activeLetter, docsByLetter])

  const handleLetterClick = useCallback(function (letter: string) {
    if (!lettersWithDocs.has(letter)) return
    setActiveLetter(function (prev) { return prev === letter ? null : letter })
    setQuery('')
  }, [lettersWithDocs])

  const isSearching = !!query.trim()
  const displayDocs = isSearching ? searchResults! : (filteredDocs || docs)

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: '#F5F1EB' }}>

      {/* Animated gradient FOL background watermark */}
      <div className="absolute top-8 right-4 w-[200px] h-[200px] opacity-[0.06] pointer-events-none">
        <GradientFOL variant="seed" spinDur={120} colorDur={16} />
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 py-4 mb-6 border-b-2" style={{ borderColor: '#5D3A1A' }}>
        <div className="flex items-center gap-2">
          <BookOpen size={16} style={{ color: '#5D3A1A' }} />
          <span className="font-mono text-xs font-bold tracking-wide" style={{ color: '#5D3A1A' }}>
            {docs.length} Volumes
          </span>
        </div>
        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#B8860B' }} />
        <div className="flex items-center gap-2">
          <Library size={16} style={{ color: '#5D3A1A' }} />
          <span className="font-mono text-xs font-bold tracking-wide" style={{ color: '#5D3A1A' }}>
            {collections.length} Collections
          </span>
        </div>
        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#B8860B' }} />
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: '#5D3A1A' }} />
          <span className="font-mono text-xs font-bold tracking-wide" style={{ color: '#5D3A1A' }}>
            {totalPages.toLocaleString()} Pages
          </span>
        </div>
      </div>

      {/* ── Search Bar — library terminal style ── */}
      <div className="max-w-2xl mx-auto mb-8 px-4">
        <div className="relative border-2 shadow-lg" style={{ borderColor: '#5D3A1A', backgroundColor: '#FFFEF7' }}>
          <div className="flex items-center gap-2 px-4 py-1.5 border-b" style={{ backgroundColor: '#5D3A1A' }}>
            <Search size={12} className="text-amber-200" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-200">Library Search Terminal</span>
          </div>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#8B7355' }} />
            <input
              type="text"
              value={query}
              onChange={function (e) { setQuery(e.target.value); setActiveLetter(null) }}
              placeholder="Search by title, topic, or keyword..."
              className="w-full pl-12 pr-10 py-3.5 bg-transparent text-sm focus:outline-none font-mono"
              style={{ color: '#5D3A1A' }}
            />
            {query && (
              <button onClick={function () { setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70" style={{ color: '#8B7355' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="text-center mt-3">
          <Link href="/library/chat" className="inline-flex items-center gap-1.5 text-sm hover:underline transition-colors" style={{ color: '#B8860B' }}>
            <MessageCircle size={14} />
            <span className="font-display italic">Ask the Librarian (Chance)</span>
          </Link>
        </div>
      </div>

      {/* ── A-Z Card Catalog ── */}
      <div className="max-w-4xl mx-auto mb-8 px-4">
        <div className="text-center mb-3">
          <span className="font-display text-sm font-bold" style={{ color: '#5D3A1A' }}>Card Catalog</span>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {ALPHABET.map(function (letter) {
            const hasItems = lettersWithDocs.has(letter)
            const isActive = activeLetter === letter
            return (
              <button
                key={letter}
                onClick={function () { handleLetterClick(letter) }}
                disabled={!hasItems}
                className="relative group flex flex-col items-center transition-all duration-150"
                style={{ opacity: hasItems ? 1 : 0.35 }}
              >
                {/* Drawer */}
                <div
                  className="w-9 h-11 sm:w-10 sm:h-12 rounded-sm flex flex-col items-center justify-center border transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? '#5D3A1A' : '#FFFEF7',
                    borderColor: isActive ? '#5D3A1A' : '#C4A882',
                    boxShadow: isActive
                      ? 'inset 0 1px 3px rgba(0,0,0,0.3)'
                      : '0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                    cursor: hasItems ? 'pointer' : 'default',
                    transform: isActive ? 'translateY(1px)' : 'none',
                  }}
                >
                  {/* Brass label holder */}
                  <div
                    className="w-5 h-3.5 sm:w-6 sm:h-4 rounded-sm border flex items-center justify-center mb-0.5"
                    style={{
                      borderColor: isActive ? '#B8860B' : '#C4A882',
                      backgroundColor: isActive ? '#B8860B' : 'rgba(184, 134, 11, 0.1)',
                    }}
                  >
                    <span
                      className="font-display text-[10px] sm:text-xs font-bold leading-none"
                      style={{ color: isActive ? '#FFFEF7' : '#5D3A1A' }}
                    >
                      {letter}
                    </span>
                  </div>
                  {/* Brass handle */}
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-0.5"
                    style={{
                      backgroundColor: '#B8860B',
                      boxShadow: '0 0.5px 1px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
        {activeLetter && (
          <div className="text-center mt-3">
            <button
              onClick={function () { setActiveLetter(null) }}
              className="font-mono text-xs underline hover:opacity-70"
              style={{ color: '#5D3A1A' }}
            >
              Clear filter — show all
            </button>
          </div>
        )}
      </div>

      {/* ── View Mode Toggle ── */}
      <div className="flex items-center justify-center gap-1 mb-8">
        <button
          onClick={function () { setViewMode('bookshelf') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-md text-xs font-mono font-bold border transition-colors"
          style={{
            backgroundColor: viewMode === 'bookshelf' ? '#5D3A1A' : '#FFFEF7',
            color: viewMode === 'bookshelf' ? '#FFFEF7' : '#5D3A1A',
            borderColor: '#5D3A1A',
          }}
        >
          <BookMarked size={13} /> Bookshelf
        </button>
        <button
          onClick={function () { setViewMode('catalog') }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold border-y transition-colors"
          style={{
            backgroundColor: viewMode === 'catalog' ? '#5D3A1A' : '#FFFEF7',
            color: viewMode === 'catalog' ? '#FFFEF7' : '#5D3A1A',
            borderColor: '#5D3A1A',
          }}
        >
          <Grid size={13} /> Card Catalog
        </button>
        <button
          onClick={function () { setViewMode('list') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-r-md text-xs font-mono font-bold border transition-colors"
          style={{
            backgroundColor: viewMode === 'list' ? '#5D3A1A' : '#FFFEF7',
            color: viewMode === 'list' ? '#FFFEF7' : '#5D3A1A',
            borderColor: '#5D3A1A',
          }}
        >
          <List size={13} /> List
        </button>
      </div>

      {/* ── Search Results Header ── */}
      {isSearching && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <p className="font-mono text-xs font-bold tracking-wide" style={{ color: '#5D3A1A' }}>
            {searchResults!.length} result{searchResults!.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
      {activeLetter && !isSearching && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <p className="font-mono text-xs font-bold tracking-wide" style={{ color: '#5D3A1A' }}>
            {filteredDocs!.length} volume{filteredDocs!.length !== 1 ? 's' : ''} under &ldquo;{activeLetter}&rdquo;
          </p>
        </div>
      )}

      {/* ── Empty State ── */}
      {isSearching && searchResults!.length === 0 && (
        <div className="text-center py-16 px-4">
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: '#C4A882' }} />
          <p className="font-display text-lg mb-3" style={{ color: '#5D3A1A' }}>No volumes match your search.</p>
          <Link href="/library/chat" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: '#B8860B' }}>
            <MessageCircle size={14} /> Ask Chance to help find what you need
          </Link>
        </div>
      )}

      {/* ── BOOKSHELF VIEW ── */}
      {viewMode === 'bookshelf' && !(isSearching && searchResults!.length === 0) && (
        <div className="max-w-5xl mx-auto px-4">
          {(isSearching || activeLetter) ? (
            <BookshelfRow
              docs={displayDocs}
              hoveredBook={hoveredBook}
              setHoveredBook={setHoveredBook}
            />
          ) : (
            <>
              {collections.map(function (col) {
                return (
                  <div key={col.theme.id} className="mb-2">
                    {/* Collection / shelf label */}
                    <div className="flex items-center gap-3 mb-3 mt-6">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: col.theme.color }} />
                      <span className="font-display text-base font-bold" style={{ color: '#5D3A1A' }}>
                        {col.theme.name}
                      </span>
                      <span className="font-mono text-[10px] tracking-wide" style={{ color: '#8B7355' }}>
                        {col.docs.length} volume{col.docs.length !== 1 ? 's' : ''}
                      </span>
                      <div className="flex-1 border-b" style={{ borderColor: '#C4A882' }} />
                    </div>
                    <BookshelfRow
                      docs={col.docs}
                      hoveredBook={hoveredBook}
                      setHoveredBook={setHoveredBook}
                    />
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* ── CARD CATALOG VIEW ── */}
      {viewMode === 'catalog' && !(isSearching && searchResults!.length === 0) && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayDocs.map(function (doc) {
              return <CatalogCard key={doc.id} doc={doc} />
            })}
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {viewMode === 'list' && !(isSearching && searchResults!.length === 0) && (
        <div className="max-w-4xl mx-auto px-4">
          <div className=" border overflow-hidden" style={{ borderColor: '#C4A882', backgroundColor: '#FFFEF7' }}>
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b font-mono text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: '#C4A882', color: '#8B7355', backgroundColor: '#F5F1EB' }}>
              <div className="col-span-6 sm:col-span-5">Title</div>
              <div className="col-span-3 sm:col-span-3 hidden sm:block">Collection</div>
              <div className="col-span-3 sm:col-span-2 text-right">Pages</div>
              <div className="col-span-3 sm:col-span-2 text-right hidden sm:block">Size</div>
            </div>
            {displayDocs.map(function (doc, i) {
              return <ListRow key={doc.id} doc={doc} isEven={i % 2 === 0} />
            })}
          </div>
        </div>
      )}

      {/* ── Bottom Spacer ── */}
      <div className="h-16" />
    </div>
  )
}


// ── Bookshelf Row — books standing on a wooden shelf ──

function BookshelfRow({
  docs,
  hoveredBook,
  setHoveredBook,
}: {
  docs: LibraryDoc[]
  hoveredBook: string | null
  setHoveredBook: (id: string | null) => void
}) {
  return (
    <div>
      {/* Books */}
      <div className="flex flex-wrap items-end gap-1.5 sm:gap-2 pb-0 min-h-[160px] sm:min-h-[200px] px-2">
        {docs.map(function (doc) {
          return (
            <BookSpine
              key={doc.id}
              doc={doc}
              isHovered={hoveredBook === doc.id}
              onHover={function () { setHoveredBook(doc.id) }}
              onLeave={function () { setHoveredBook(null) }}
            />
          )
        })}
      </div>
      {/* Wooden shelf */}
      <div
        className="h-4 rounded-b-sm"
        style={{
          background: 'linear-gradient(180deg, #8B6914 0%, #6B4E12 40%, #5D3A1A 100%)',
          boxShadow: '0 4px 8px rgba(93, 58, 26, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        }}
      />
      {/* Shelf bracket shadow */}
      <div
        className="h-1.5 mx-4 rounded-b"
        style={{
          background: 'linear-gradient(180deg, rgba(93,58,26,0.2) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}


// ── Book Spine — a single book standing upright ──

function BookSpine({
  doc,
  isHovered,
  onHover,
  onLeave,
}: {
  doc: LibraryDoc
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const themes = getThemeInfo(doc.theme_ids)
  const primary = themes[0]
  const spineColor = primary?.color || '#3182ce'
  const spineWidth = getSpineWidth(doc.page_count)

  // Lighten or darken spine color for gradient
  const lightenColor = function (hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + amount)
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount)
    const b = Math.min(255, (num & 0x0000FF) + amount)
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  return (
    <div className="relative group" onMouseEnter={onHover} onMouseLeave={onLeave}>
      <Link href={'/library/doc/' + doc.id}>
        <div
          className="flex flex-col items-center justify-end rounded-t-sm cursor-pointer transition-all duration-200"
          style={{
            width: spineWidth + 'px',
            height: '140px',
            background: 'linear-gradient(90deg, ' + lightenColor(spineColor, 30) + ' 0%, ' + spineColor + ' 30%, ' + spineColor + ' 70%, ' + lightenColor(spineColor, -20) + ' 100%)',
            boxShadow: isHovered
              ? '0 -8px 16px rgba(0,0,0,0.25), 2px 0 4px rgba(0,0,0,0.15)'
              : '2px 0 3px rgba(0,0,0,0.1), -1px 0 2px rgba(0,0,0,0.05)',
            transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0)',
            borderTop: '2px solid ' + lightenColor(spineColor, 40),
            borderLeft: '1px solid ' + lightenColor(spineColor, 20),
            borderRight: '1px solid ' + lightenColor(spineColor, -30),
          }}
        >
          {/* Title on spine — vertical text */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden px-0.5"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <span
              className="font-display text-[9px] sm:text-[10px] font-bold text-white leading-tight text-center"
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                maxHeight: '110px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {doc.title.length > 40 ? doc.title.slice(0, 37) + '...' : doc.title}
            </span>
          </div>

          {/* Bottom decoration — small gold line */}
          <div className="w-3/4 h-px mb-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <div className="w-1/2 h-px mb-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }} />
        </div>
      </Link>

      {/* ── Hover tooltip / card ── */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 sm:w-72 border-2 shadow-xl p-4 z-50 pointer-events-none"
          style={{
            backgroundColor: '#FFFEF7',
            borderColor: '#5D3A1A',
          }}
        >
          {/* Small triangle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rotate-45 border-r-2 border-b-2"
            style={{ backgroundColor: '#FFFEF7', borderColor: '#5D3A1A' }}
          />
          <div className="flex items-center gap-2 mb-2">
            {themes.map(function (t) {
              return (
                <span key={t.id} className="flex items-center gap-1 text-[10px] font-mono font-bold" style={{ color: t.color }}>
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              )
            })}
          </div>
          <h4 className="font-display text-sm font-bold leading-snug mb-1.5" style={{ color: '#5D3A1A' }}>
            {doc.title}
          </h4>
          <p className="text-xs leading-relaxed line-clamp-3 mb-2" style={{ color: '#6B5B4E' }}>
            {doc.summary}
          </p>
          {doc.key_points.length > 0 && (
            <div className="border-t pt-2 mt-2" style={{ borderColor: '#E8DFD4' }}>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: '#B8860B' }}>Key Points</p>
              {doc.key_points.slice(0, 2).map(function (point, i) {
                return (
                  <p key={i} className="text-[10px] leading-relaxed line-clamp-1 mb-0.5" style={{ color: '#6B5B4E' }}>
                    &bull; {point}
                  </p>
                )
              })}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: '#E8DFD4' }}>
            <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{doc.page_count} pages</span>
            <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{readTime(doc.page_count)}</span>
            <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{fileSizeLabel(doc.file_size)}</span>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Catalog Card — looks like a typed library index card ──

function CatalogCard({ doc }: { doc: LibraryDoc }) {
  const themes = getThemeInfo(doc.theme_ids)
  const org = extractOrg(doc.tags)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block">
      <article
        className="relative rounded-sm border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
        style={{
          backgroundColor: '#FFFDE8',
          borderColor: '#D4C5A0',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.08)',
        }}
      >
        {/* Red top line — like a real index card */}
        <div className="h-0.5" style={{ backgroundColor: '#CC4444' }} />

        {/* Horizontal ruled lines — decorative */}
        <div className="absolute inset-0 top-6 pointer-events-none" style={{ opacity: 0.15 }}>
          {Array.from({ length: 10 }).map(function (_, i) {
            return (
              <div
                key={i}
                className="w-full h-px"
                style={{ backgroundColor: '#4A90A4', marginTop: i === 0 ? '0' : '20px' }}
              />
            )
          })}
        </div>

        <div className="relative p-4">
          {/* Theme color bar on left */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: primary?.color || '#3182ce' }}
          />

          {/* Card content */}
          <div className="pl-3">
            {/* Subject line */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: '#CC4444' }}>
                TITLE
              </span>
            </div>
            <h3
              className="font-display text-sm font-bold leading-snug mb-2 group-hover:underline line-clamp-2"
              style={{ color: '#2C1810' }}
            >
              {doc.title}
            </h3>

            {/* Author / org */}
            {org && (
              <div className="flex items-center gap-1 mb-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: '#888' }}>
                  SOURCE
                </span>
                <span className="font-mono text-[11px]" style={{ color: '#2C1810' }}>{org}</span>
              </div>
            )}

            {/* Collection */}
            <div className="flex items-center gap-1 mb-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest" style={{ color: '#888' }}>
                COLL.
              </span>
              {themes.map(function (t) {
                return (
                  <span key={t.id} className="font-mono text-[11px]" style={{ color: t.color }}>
                    {t.name}
                  </span>
                )
              })}
            </div>

            {/* Summary */}
            <p className="text-xs leading-relaxed line-clamp-3 mb-2" style={{ color: '#4A3C2E', fontFamily: 'monospace' }}>
              {doc.summary}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: '#D4C5A0' }}>
              <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{doc.page_count}pp.</span>
              <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{fileSizeLabel(doc.file_size)}</span>
              <span className="font-mono text-[9px]" style={{ color: '#8B7355' }}>{readTime(doc.page_count)}</span>
              <Bookmark size={10} className="ml-auto" style={{ color: '#B8860B' }} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}


// ── List View Row ──

function ListRow({ doc, isEven }: { doc: LibraryDoc; isEven: boolean }) {
  const themes = getThemeInfo(doc.theme_ids)
  const primary = themes[0]

  return (
    <Link href={'/library/doc/' + doc.id} className="group block">
      <div
        className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b items-center transition-colors hover:bg-amber-50/50"
        style={{
          borderColor: '#E8DFD4',
          backgroundColor: isEven ? '#FFFEF7' : '#FAF5ED',
        }}
      >
        <div className="col-span-9 sm:col-span-5 flex items-center gap-2 min-w-0">
          <div className="w-1 h-6 rounded-sm flex-shrink-0" style={{ backgroundColor: primary?.color || '#3182ce' }} />
          <span className="font-display text-sm truncate group-hover:underline" style={{ color: '#2C1810' }}>
            {doc.title}
          </span>
        </div>
        <div className="col-span-3 hidden sm:flex items-center gap-1">
          {themes.slice(0, 1).map(function (t) {
            return (
              <span key={t.id} className="font-mono text-[11px]" style={{ color: t.color }}>
                {t.name}
              </span>
            )
          })}
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">
          <span className="font-mono text-[11px]" style={{ color: '#8B7355' }}>{doc.page_count} pp.</span>
        </div>
        <div className="col-span-2 text-right hidden sm:block">
          <span className="font-mono text-[11px]" style={{ color: '#8B7355' }}>{fileSizeLabel(doc.file_size)}</span>
        </div>
      </div>
    </Link>
  )
}
