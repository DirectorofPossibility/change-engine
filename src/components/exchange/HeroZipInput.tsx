'use client'

import { useState } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import Link from 'next/link'

export function HeroZipInput() {
  const { zip, address, neighborhood, lookupZip, lookupAddress, clearZip, isLoading } = useNeighborhood()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    if (/^\d{5}$/.test(trimmed)) {
      lookupZip(trimmed)
    } else if (trimmed.length >= 5) {
      lookupAddress(trimmed)
    }
  }

  if (zip && neighborhood) {
    return (
      <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 bg-white border-2 border-brand-text rounded-xl"
       
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
        <Link href="/my-area" className="text-sm font-semibold text-brand-text hover:text-brand-accent transition-colors">
          {address || neighborhood.neighborhood_name || zip}
        </Link>
        <button onClick={clearZip} className="ml-auto text-xs text-brand-accent hover:underline">
          Change
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 bg-white border-2 border-brand-text rounded-xl"
     
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2" className="flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
      <input
        type="text"
        value={input}
        onChange={function (e) { setInput(e.target.value) }}
        placeholder="Enter ZIP code or address"
        aria-label="ZIP code or address"
        disabled={isLoading}
        className="flex-1 min-w-0 text-sm bg-transparent text-brand-text placeholder:text-brand-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={input.trim().length < 5 || isLoading}
        className="px-3 py-1.5 bg-brand-text text-white font-mono text-[11px] font-bold uppercase rounded-lg disabled:opacity-30 hover:bg-brand-accent transition-colors flex-shrink-0"
      >
        Go
      </button>
    </form>
  )
}
