'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { BRAND, THEMES } from '@/lib/constants'

/** Spectrum bar showing all 7 pathway colors */
function SpectrumBar() {
  const colors = Object.values(THEMES).map(function (t) { return t.color })
  return (
    <div className="flex h-1 rounded-full max-w-xs mx-auto overflow-hidden">
      {colors.map(function (color) {
        return <div key={color} className="flex-1" style={{ backgroundColor: color }} />
      })}
    </div>
  )
}

const SEARCH_SUGGESTIONS = [
  'food assistance',
  'voter registration',
  'mental health',
  'job training',
  'childcare',
  'legal help',
]

export function HeroBook() {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push('/search?q=' + encodeURIComponent(query.trim()))
    }
  }

  return (
    <section className="relative flex flex-col items-center justify-center py-14 sm:py-20 px-4 text-center">
      {/* Warm radial gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(199,91,42,0.06) 0%, rgba(61,90,90,0.02) 40%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Brand mark */}
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-brand-muted font-semibold mb-6">
          {t('home.location')}
        </p>

        {/* Main title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-brand-text leading-tight mb-4">
          {t('hero.title_line1')}{' '}
          <span style={{ color: BRAND.accent }}>{t('hero.title_line2')}</span>
        </h1>

        {/* Tagline */}
        <p className="text-lg sm:text-xl font-serif italic text-brand-muted mb-8">
          {BRAND.tagline}
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="What are you looking for?"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-brand-border rounded-xl text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 shadow-sm"
          />
        </form>

        {/* Search suggestions — inline text links, no pills */}
        <p className="text-xs text-brand-muted mb-6">
          Try:{' '}
          {SEARCH_SUGGESTIONS.map(function (term, i) {
            return (
              <span key={term}>
                {i > 0 && <span className="mx-1">&middot;</span>}
                <button
                  onClick={function () { router.push('/search?q=' + encodeURIComponent(term)) }}
                  className="text-brand-accent hover:underline"
                >
                  {term}
                </button>
              </span>
            )
          })}
        </p>

        {/* Spectrum bar — 7 pathway colors */}
        <SpectrumBar />
      </div>
    </section>
  )
}
