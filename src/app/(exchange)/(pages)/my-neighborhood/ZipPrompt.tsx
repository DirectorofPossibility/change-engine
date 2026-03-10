'use client'

/**
 * @fileoverview ZIP code entry prompt for the my-neighborhood page.
 * Sets the ZIP cookie and navigates to reload with the new ZIP.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight } from 'lucide-react'

export function ZipPrompt() {
  const [zip, setZip] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = zip.trim()
    if (!/^\d{5}$/.test(trimmed)) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setError('')
    // Set cookie and navigate
    document.cookie = 'zip=' + trimmed + ';path=/;max-age=31536000'
    router.push('/my-neighborhood?zip=' + trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 max-w-sm mx-auto">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Enter your ZIP code"
            value={zip}
            onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-brand-border bg-white text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-brand-accent"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go <ArrowRight size={14} />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
