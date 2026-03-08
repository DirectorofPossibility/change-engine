'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/use-translation'

interface ZipPersonalizationProps {
  zip: string | null
  neighborhood: { neighborhood_name?: string | null } | null
  clearZip: () => void
  isLoading: boolean
  onLookupZip: (zip: string) => void
}

export function ZipPersonalization({ zip, neighborhood, clearZip, isLoading, onLookupZip }: ZipPersonalizationProps) {
  const { t } = useTranslation()
  const [zipInput, setZipInput] = useState('')

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (zipInput.length === 5) {
      onLookupZip(zipInput)
      setZipInput('')
    }
  }

  return (
    <div className="px-5 py-2">
      {zip && neighborhood ? (
        <div className="text-sm leading-snug">
          <span className="font-bold text-brand-text">
            {neighborhood.neighborhood_name ?? 'Your'} {t('sidebar.edition')}
          </span>
          <span className="text-brand-muted ml-1.5 text-xs">{zip}</span>
          <button onClick={clearZip} className="text-brand-accent hover:underline ml-1.5 text-xs">
            {t('sidebar.change')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleZipSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={zipInput}
            onChange={function (e) { setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
            placeholder={t('zip.enter')}
            aria-label="ZIP code"
            maxLength={5}
            disabled={isLoading}
            className="flex-1 text-sm px-3 py-1.5 border-2 border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
          <button type="submit" disabled={zipInput.length !== 5 || isLoading}
            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity">
            {t('sidebar.go')}
          </button>
        </form>
      )}
    </div>
  )
}
