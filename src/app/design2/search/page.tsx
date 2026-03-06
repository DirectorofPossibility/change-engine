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
    <div>
      {/* Dark editorial hero */}
      <section style={{ background: '#2C2418' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>Search</span>
          </div>
          <div className="h-[2px] w-10 mb-5" style={{ background: '#C75B2A' }} />
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)]" style={{ color: 'white' }}>Search</h1>
          <p className="font-serif text-[18px] italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Find what you need</p>
          <p className="text-[16px] mt-4 max-w-[720px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Search across all resources, services, organizations, officials, and policies.
          </p>
        </div>
      </section>

      <div className="max-w-[800px] mx-auto px-8 py-12" style={{ background: '#FAF8F5' }}>
        <form onSubmit={doSearch} className="relative mb-8">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9B9590' }} />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Search resources, services, officials..."
            className="w-full py-4 pl-12 pr-24 rounded-lg text-[14px] outline-none"
            style={{ border: 'none', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-md text-[13px] font-semibold text-white" style={{ background: '#C75B2A' }}>
            Search
          </button>
        </form>

        {loading && <p className="text-center" style={{ color: '#6B6560' }}>Searching...</p>}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map(function (r: any, i: number) {
              return (
                <a key={i} href={r.url || '#'} className="block bg-white rounded-xl border p-4 transition-all hover:shadow-md" style={{ borderColor: '#E2DDD5' }}>
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
