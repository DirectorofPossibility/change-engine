'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { THEMES } from '@/lib/constants'

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

  const themeColors = Object.values(THEMES).map(function (t) { return t.color })

  return (
    <section className="relative overflow-hidden">
      {/* Light warm hero */}
      <div className="bg-brand-bg-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          {/* Location label */}
          <p className="text-xs uppercase tracking-[0.3em] text-brand-muted font-semibold mb-6">
            {t('home.location')}
          </p>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-display font-serif font-bold leading-tight mb-4 text-brand-text">
            {t('hero.title_line1')}{' '}
            <span className="text-brand-accent">{t('hero.title_line2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-brand-muted font-serif italic max-w-xl mb-10">
            {t('home.subtitle')}
          </p>

          {/* Search bar — prominent */}
          <form onSubmit={handleSearch} className="relative max-w-lg mb-5">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              value={query}
              onChange={function (e) { setQuery(e.target.value) }}
              placeholder="Search resources, services, officials..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-lg text-sm text-brand-text placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 shadow-card-hover border border-brand-border"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:bg-brand-accent-hover transition-colors"
            >
              Search
            </button>
          </form>

          {/* Suggestions */}
          <p className="text-xs text-brand-muted mb-10">
            Try:{' '}
            {SEARCH_SUGGESTIONS.map(function (term, i) {
              return (
                <span key={term}>
                  {i > 0 && <span className="mx-1 text-brand-muted/40">/</span>}
                  <button
                    onClick={function () { router.push('/search?q=' + encodeURIComponent(term)) }}
                    className="text-brand-text/60 hover:text-brand-accent transition-colors"
                  >
                    {term}
                  </button>
                </span>
              )
            })}
          </p>

          {/* Quick links row */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent-hover transition-colors shadow-sm"
            >
              Available Resources <ArrowRight size={14} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:border-brand-accent/40 hover:shadow-sm transition-all"
            >
              Find Services <ArrowRight size={14} />
            </Link>
            <Link
              href="/officials"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:border-brand-accent/40 hover:shadow-sm transition-all"
            >
              Your Representatives <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 7-color pathway spectrum bar at bottom edge */}
        <div className="flex h-1">
          {themeColors.map(function (color) {
            return <div key={color} className="flex-1" style={{ backgroundColor: color }} />
          })}
        </div>
      </div>
    </section>
  )
}
