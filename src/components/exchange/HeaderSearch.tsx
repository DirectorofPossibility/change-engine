'use client'

/**
 * @fileoverview Inline search bar for the D2Nav header.
 *
 * Expands on click, submits to /search?q=..., shows quick results
 * dropdown with live preview from the search API.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Link from 'next/link'
import { FOLBullet } from './FOLElements'

interface QuickResult {
  type: string
  id: string
  name: string
  href: string
  color: string
}

export function HeaderSearch() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuickResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(function () {
    setExpanded(false)
    setQuery('')
    setResults([])
  }, [])

  // Close on click outside
  useEffect(function () {
    if (!expanded) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return function () {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [expanded, close])

  // Focus input when expanded
  useEffect(function () {
    if (expanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [expanded])

  // Live search with debounce
  useEffect(function () {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async function () {
      setLoading(true)
      try {
        const res = await fetch('/api/search-quick?q=' + encodeURIComponent(query))
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        }
      } catch { /* ignore */ }
      setLoading(false)
    }, 300)

    return function () {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push('/search?q=' + encodeURIComponent(query.trim()))
      close()
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={function () { setExpanded(true) }}
        className="flex items-center gap-2 px-3 py-1.5 border border-brand-border bg-white/60 hover:bg-white text-brand-muted text-xs transition-all hover:border-brand-accent/30"
        aria-label="Search"
      >
        <Search size={14} />
        <span className="hidden lg:inline">Search everything...</span>
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-brand-accent/40 bg-white shadow-sm" style={{ minWidth: '280px' }}>
          <Search size={14} className="text-brand-accent flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Search services, officials, organizations..."
            className="flex-1 bg-transparent text-sm text-brand-text placeholder-brand-muted-light outline-none"
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={function () { setQuery(''); inputRef.current?.focus() }} className="text-muted hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Quick results dropdown */}
      {(results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-brand-border shadow-lg z-50 overflow-hidden" style={{ backdropFilter: 'blur(12px)' }}>
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-brand-muted">Searching...</div>
          )}
          {results.map(function (r) {
            return (
              <Link
                key={r.type + r.id}
                href={r.href}
                onClick={close}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg transition-colors border-b border-brand-border/50 last:border-0"
              >
                <FOLBullet size={14} color={r.color} />
                <div className="flex-1 min-w-0">
                  <span className="block text-sm text-brand-text truncate">{r.name}</span>
                  <span className="block text-[10px] text-brand-muted uppercase tracking-wider">{r.type}</span>
                </div>
              </Link>
            )
          })}
          {query.trim() && (
            <Link
              href={'/search?q=' + encodeURIComponent(query.trim())}
              onClick={close}
              className="block px-4 py-2.5 text-xs text-brand-accent font-semibold hover:bg-brand-bg transition-colors text-center"
            >
              See all results for &ldquo;{query}&rdquo; &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
