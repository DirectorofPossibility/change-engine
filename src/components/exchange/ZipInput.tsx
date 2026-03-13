'use client'

import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import { useTranslation } from '@/lib/use-translation'

export function ZipInput() {
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()
  const { t } = useTranslation()
  const [input, setInput] = useState(zip || '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input.length === 5) {
      lookupZip(input)
    }
  }

  if (zip && neighborhood) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <MapPin size={12} className="text-brand-accent" />
        <span className="text-brand-muted">{zip}</span>
        <button onClick={clearZip} className="text-brand-muted hover:text-brand-text p-2 -m-2" aria-label={t('zip.clear')}>
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <MapPin size={14} className="text-brand-accent" />
      <input
        type="text"
        value={input}
        onChange={function (e) { setInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
        placeholder={t('zip.enter')}
        aria-label="ZIP code"
        className="w-20 text-xs px-2 py-1 border border-brand-accent/30 rounded bg-brand-accent/5 focus:outline-none focus:border-brand-accent focus:bg-white"
        maxLength={5}
        disabled={isLoading}
      />
    </form>
  )
}
