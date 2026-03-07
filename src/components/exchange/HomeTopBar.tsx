'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AuthButton } from './AuthButton'
import { LiveIndicator } from './LiveIndicator'

export function HomeTopBar({ liveCount }: { liveCount?: number }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()

  const [searchQuery, setSearchQuery] = useState('')
  const [zipInput, setZipInput] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push('/search?q=' + encodeURIComponent(trimmed))
      setSearchQuery('')
    }
  }

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      lookupZip(zipInput)
      setZipInput('')
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-3 flex items-center gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: Location anchor */}
        <Link href="/" className="shrink-0 group">
          <span className="font-serif text-sm tracking-[0.08em] text-brand-muted hover:text-brand-text transition-colors" style={{ fontVariant: 'small-caps' }}>
            {t('home.location')}
          </span>
        </Link>

        {/* Center: Search */}
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[180px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={function (e) { setSearchQuery(e.target.value) }}
            placeholder={t('nav.search_placeholder')}
            aria-label="Search"
            className="w-full pl-9 pr-3 py-1.5 text-sm border-2 border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
        </form>

        {/* Right: Language + Auth + ZIP */}
        <div className="flex items-center gap-3 shrink-0">
          {liveCount != null && liveCount > 0 && <LiveIndicator count={liveCount} />}
          <LanguageSwitcher />
          <AuthButton />

          <div className="h-5 w-px bg-brand-border" />

          {zip && neighborhood ? (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-brand-text truncate max-w-[120px]">
                {neighborhood.neighborhood_name ?? zip}
              </span>
              <button onClick={clearZip} className="text-brand-accent hover:underline text-xs">
                {t('sidebar.change')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleZipSubmit} className="flex items-center gap-1.5">
              <input
                type="text"
                value={zipInput}
                onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                placeholder={t('zip.enter')}
                aria-label="ZIP code"
                maxLength={5}
                disabled={isLoading}
                className="w-20 text-sm px-2 py-1 border-2 border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
              />
              <button type="submit" disabled={zipInput.length !== 5 || isLoading}
                className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity">
                {t('sidebar.go')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
