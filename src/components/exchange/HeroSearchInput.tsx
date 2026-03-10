'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function HeroSearchInput() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push('/search?q=' + encodeURIComponent(trimmed))
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 bg-white border-2 border-brand-text rounded-xl"
     
    >
      <Search size={18} className="text-brand-accent flex-shrink-0" />
      <input
        type="text"
        value={query}
        onChange={function (e) { setQuery(e.target.value) }}
        placeholder="Search resources, services, news..."
        aria-label="Search the Exchange"
        className="flex-1 text-sm bg-transparent text-brand-text placeholder:text-brand-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={query.trim().length < 2}
        className="px-3 py-1.5 bg-brand-text text-white font-mono text-[11px] font-bold uppercase rounded-lg disabled:opacity-30 hover:bg-brand-accent transition-colors"
      >
        Search
      </button>
    </form>
  )
}
