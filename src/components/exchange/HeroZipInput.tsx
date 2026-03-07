'use client'

import { useState } from 'react'
import { useNeighborhood } from '@/lib/contexts/NeighborhoodContext'
import Link from 'next/link'

export function HeroZipInput() {
  const { zip, neighborhood, lookupZip, clearZip, isLoading } = useNeighborhood()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input.length === 5) {
      lookupZip(input)
    }
  }

  if (zip && neighborhood) {
    return (
      <div className="flex items-center gap-3 max-w-sm px-4 py-3 bg-white border-2 border-brand-text rounded-xl mb-5"
        style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
        <Link href="/my-area" className="text-sm font-semibold text-brand-text hover:text-brand-accent transition-colors">
          {neighborhood.neighborhood_name || zip}
        </Link>
        <button onClick={clearZip} className="ml-auto text-xs text-brand-accent hover:underline">
          Change
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-center gap-3 max-w-sm px-4 py-3 bg-white border-2 border-brand-text rounded-xl mb-5"
      style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C75B2A" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
      <input
        type="text"
        value={input}
        onChange={function (e) { setInput(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
        placeholder="Enter your zip code"
        aria-label="ZIP code"
        maxLength={5}
        disabled={isLoading}
        className="flex-1 text-sm bg-transparent text-brand-text placeholder:text-brand-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={input.length !== 5 || isLoading}
        className="px-3 py-1.5 bg-brand-text text-white font-mono text-[11px] font-bold uppercase rounded-lg disabled:opacity-30 hover:bg-brand-accent transition-colors"
      >
        Go
      </button>
    </form>
  )
}
