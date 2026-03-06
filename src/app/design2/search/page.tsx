'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function doSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(query))
      const data = await res.json()
      setResults(data.results || [])
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <div style={{ background: '#F0EAE0' }}>
      <div className="max-w-[800px] mx-auto px-8 py-8">
        <Link href="/design2" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>← Home</Link>
        <div className="mb-8">
          <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>Search</h1>
          <p className="text-[15px]" style={{ color: '#6B6560' }}>Search across all resources, services, organizations, officials, and policies.</p>
          <div className="h-1 w-16 rounded-full mt-4" style={{ background: '#C75B2A' }} />
        </div>

        <form onSubmit={doSearch} className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9B9590' }} />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="What are you looking for?"
            className="w-full py-4 pl-12 pr-24 rounded-xl border-2 text-[15px] outline-none"
            style={{ borderColor: '#1a1a1a', background: 'white' }}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg text-[12px] font-bold uppercase text-white" style={{ background: '#1a1a1a' }}>
            Go
          </button>
        </form>

        {loading && <p className="text-center" style={{ color: '#6B6560' }}>Searching...</p>}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map(function (r: any, i: number) {
              return (
                <a key={i} href={r.url || '#'} className="block bg-white rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: '#D4CCBE' }}>
                  <h3 className="font-serif text-[15px] font-semibold" style={{ color: '#1a1a1a' }}>{r.title}</h3>
                  {r.summary && <p className="text-[12px] mt-1 line-clamp-2" style={{ color: '#6B6560' }}>{r.summary}</p>}
                  <span className="text-[10px] uppercase tracking-wider mt-2 inline-block" style={{ color: '#9B9590' }}>{r.type}</span>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
