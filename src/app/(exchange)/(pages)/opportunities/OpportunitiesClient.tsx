'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Opportunity {
  opportunity_id: string
  opportunity_name: string
  description_5th_grade: string | null
  org_id: string | null
  zip_code: string | null
  is_virtual: boolean | null
}

interface OpportunitiesClientProps {
  opportunities: Opportunity[]
  userZip: string
}

export function OpportunitiesClient({ opportunities, userZip }: OpportunitiesClientProps) {
  const [query, setQuery] = useState('')
  const [showVirtual, setShowVirtual] = useState<'all' | 'virtual' | 'local'>('all')

  const filtered = opportunities.filter(function (opp) {
    if (query.trim()) {
      const lower = query.toLowerCase()
      const nameMatch = opp.opportunity_name.toLowerCase().includes(lower)
      const descMatch = (opp.description_5th_grade || '').toLowerCase().includes(lower)
      if (!nameMatch && !descMatch) return false
    }
    if (showVirtual === 'virtual' && !opp.is_virtual) return false
    if (showVirtual === 'local' && opp.is_virtual) return false
    return true
  })

  return (
    <>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 border border-rule bg-white flex-1">
          <Search size={16} className="text-faint flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={function (e) { setQuery(e.target.value) }}
            placeholder="Search opportunities..."
            className="flex-1 bg-transparent text-sm text-ink placeholder-faint outline-none font-body"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'local', 'virtual'] as const).map(function (opt) {
            return (
              <button
                key={opt}
                onClick={function () { setShowVirtual(opt) }}
                className={'px-3 py-2 font-mono text-micro uppercase tracking-wider transition-colors ' + (
                  showVirtual === opt
                    ? 'bg-ink text-white'
                    : 'border border-rule text-muted hover:border-ink'
                )}
              >
                {opt === 'all' ? 'All' : opt === 'local' ? 'In-Person' : 'Virtual'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Count */}
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="font-display text-xl">{query || showVirtual !== 'all' ? 'Results' : 'All Opportunities'}</h2>
        <span className="font-mono text-micro text-muted">{filtered.length}</span>
      </div>
      <div className="h-px border-b border-dotted border-rule mb-6" />

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-rule">
          <p className="font-body text-muted">No opportunities match your search.</p>
          <p className="font-body text-sm text-faint mt-1">Try different keywords or clear your filters.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map(function (opp) {
            return (
              <Link
                key={opp.opportunity_id}
                href={'/opportunities/' + opp.opportunity_id}
                className="block py-4 border-b border-rule hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-body font-semibold text-ink">{opp.opportunity_name}</h3>
                    {opp.description_5th_grade && (
                      <p className="line-clamp-2 mt-1 font-body text-sm text-muted">{opp.description_5th_grade}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opp.is_virtual && (
                      <span className="font-mono text-micro uppercase tracking-wider text-blue bg-blue/5 px-2 py-0.5">Virtual</span>
                    )}
                    {userZip && opp.zip_code === userZip && (
                      <span className="font-mono text-micro uppercase tracking-wider text-blue">Near you</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
