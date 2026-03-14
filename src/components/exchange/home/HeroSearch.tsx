'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SUGGESTIONS = [
  { label: 'food assistance', q: 'food+assistance' },
  { label: 'voter registration', q: 'voter+registration' },
  { label: 'mental health', q: 'mental+health' },
  { label: 'job training', q: 'job+training' },
  { label: 'childcare', q: 'childcare' },
  { label: 'legal resources', q: 'legal+resources' },
]

export function HeroSearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) {
      router.push('/search?q=' + encodeURIComponent(q))
    }
  }

  function handleSuggestion(q: string) {
    router.push('/search?q=' + q)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-[520px] mb-4">
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'white' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B6560" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search resources, services, officials..."
            className="flex-1 text-[14px] bg-transparent outline-none text-ink placeholder:text-muted/50"
          />
          {query.trim() && (
            <button
              type="submit"
              className="px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wider text-white bg-ink"
            >
              Go
            </button>
          )}
        </div>
      </form>

      <p className="text-[12px] mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Try:{' '}
        {SUGGESTIONS.map(function (s, i) {
          return (
            <span key={s.label}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 6px' }}>/</span>}
              <button
                onClick={function () { handleSuggestion(s.q) }}
                className="hover:text-white transition-colors"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {s.label}
              </button>
            </span>
          )
        })}
      </p>
    </>
  )
}
