'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowRight, MapPin, Check } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { THEMES } from '@/lib/constants'

export function HeroBook() {
  const { t } = useTranslation()
  const router = useRouter()
  const { zip, neighborhood, councilDistrict, districtOfficials, lookupZip, isLoading } = useNeighborhood()
  const [zipInput, setZipInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      lookupZip(zipInput)
      setZipInput('')
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push('/search?q=' + encodeURIComponent(searchQuery.trim()))
    }
  }

  const themeColors = Object.values(THEMES).map(function (th) { return th.color })
  const hasZip = !!zip

  return (
    <section className="relative overflow-hidden">
      <div className="bg-brand-bg-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-14 sm:py-20">

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

          {/* ── Primary action: ZIP or personalized welcome ── */}
          {!hasZip ? (
            <div className="mb-8">
              <form onSubmit={handleZipSubmit} className="max-w-md">
                <label className="block text-sm font-semibold text-brand-text mb-2">
                  {t('nav.zip_prompt')}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={zipInput}
                      onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                      placeholder="Enter your ZIP code"
                      maxLength={5}
                      className="w-full pl-10 pr-4 py-3.5 bg-white rounded-lg text-base text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 shadow-card-hover border border-brand-border"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={zipInput.length !== 5}
                    className="px-6 py-3.5 bg-brand-accent text-white font-semibold rounded-lg hover:bg-brand-accent-hover disabled:opacity-40 transition-colors shadow-sm"
                  >
                    Go
                  </button>
                </div>
                <p className="text-xs text-brand-muted mt-2">
                  See your representatives, local services, and neighborhood resources
                </p>
              </form>
            </div>
          ) : (
            <div className="mb-8">
              <div className="max-w-lg bg-white rounded-xl border border-brand-border shadow-card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={20} className="text-brand-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-serif font-bold text-brand-text text-lg">
                        {isLoading ? 'Finding your area...' : (neighborhood?.neighborhood_name || 'Houston Area')}
                      </h2>
                      {!isLoading && (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-success font-medium">
                          <Check size={12} /> ZIP {zip}
                        </span>
                      )}
                    </div>
                    {councilDistrict && (
                      <p className="text-sm text-brand-muted mb-2">Council District {councilDistrict}</p>
                    )}
                    {districtOfficials.length > 0 && (
                      <p className="text-sm text-brand-muted">
                        {districtOfficials.length} representative{districtOfficials.length > 1 ? 's' : ''} in your area
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link
                        href="/officials"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent text-white text-xs font-semibold rounded-lg hover:bg-brand-accent-hover transition-colors"
                      >
                        Your Representatives <ArrowRight size={12} />
                      </Link>
                      <Link
                        href="/services"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg-alt border border-brand-border text-xs font-semibold text-brand-text rounded-lg hover:bg-white transition-colors"
                      >
                        Nearby Services <ArrowRight size={12} />
                      </Link>
                      <Link
                        href="/geography"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg-alt border border-brand-border text-xs font-semibold text-brand-text rounded-lg hover:bg-white transition-colors"
                      >
                        My Neighborhood <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Secondary: search + quick links ── */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {showSearch ? (
              <form onSubmit={handleSearch} className="relative max-w-md flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={function (e) { setSearchQuery(e.target.value) }}
                  placeholder="Search resources, services, officials..."
                  autoFocus
                  className="w-full pl-10 pr-20 py-3 bg-white rounded-lg text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 border border-brand-border"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-accent text-white text-xs font-semibold rounded-md hover:bg-brand-accent-hover transition-colors"
                >
                  Search
                </button>
              </form>
            ) : (
              <button
                onClick={function () { setShowSearch(true) }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-border rounded-lg text-sm text-brand-muted hover:text-brand-text hover:border-brand-accent/40 hover:shadow-sm transition-all"
              >
                <Search size={15} />
                Search for something specific
              </button>
            )}

            <div className="flex flex-wrap gap-2">
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:border-brand-accent/40 hover:shadow-sm transition-all"
              >
                Available Resources <ArrowRight size={13} />
              </Link>
              {!hasZip && (
                <Link
                  href="/officials"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-brand-border rounded-lg text-sm font-medium text-brand-text hover:border-brand-accent/40 hover:shadow-sm transition-all"
                >
                  Find Officials <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 7-color pathway spectrum bar */}
        <div className="flex h-1">
          {themeColors.map(function (color) {
            return <div key={color} className="flex-1" style={{ backgroundColor: color }} />
          })}
        </div>
      </div>
    </section>
  )
}
