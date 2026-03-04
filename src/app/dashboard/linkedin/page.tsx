'use client'

import { useState, useEffect, useCallback } from 'react'
import { Linkedin, Check, X, ExternalLink, Search, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface LinkedInCandidate {
  id: string
  name: string
  role: string
  organization: string
  linkedin_url: string
  type: 'foundation' | 'official'
}

export default function LinkedInReviewPage() {
  const [candidates, setCandidates] = useState<LinkedInCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'foundation' | 'official'>('all')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    const results: LinkedInCandidate[] = []

    // Fetch foundation people with candidate status
    const { data: fpData } = await (supabase as any)
      .from('foundation_people')
      .select('id, name, role, foundation_id, linkedin_url, linkedin_status')
      .eq('linkedin_status', 'candidate')
      .not('linkedin_url', 'is', null)

    if (fpData && fpData.length > 0) {
      // Get foundation names
      const foundationIds = Array.from(new Set(fpData.map((p: any) => p.foundation_id)))
      const { data: foundations } = await (supabase as any)
        .from('foundations')
        .select('id, name')
        .in('id', foundationIds)
      const nameMap: Record<string, string> = {}
      if (foundations) {
        for (const f of foundations) nameMap[f.id] = f.name
      }

      for (const p of fpData) {
        results.push({
          id: `fp_${p.id}`,
          name: p.name,
          role: p.role || '',
          organization: nameMap[p.foundation_id] || 'Unknown Foundation',
          linkedin_url: p.linkedin_url!,
          type: 'foundation',
        })
      }
    }

    // Fetch officials with candidate status
    const { data: opData } = await (supabase as any)
      .from('official_profiles')
      .select('id, name, title, level, social_linkedin, linkedin_status')
      .eq('linkedin_status', 'candidate')
      .not('social_linkedin', 'is', null)

    if (opData) {
      for (const o of opData) {
        results.push({
          id: `op_${o.id}`,
          name: o.name,
          role: o.title || '',
          organization: o.level ? `${o.level} Government` : 'Government Official',
          linkedin_url: o.social_linkedin!,
          type: 'official',
        })
      }
    }

    setCandidates(results)
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadCandidates() }, [loadCandidates])

  async function handleAction(candidate: LinkedInCandidate, action: 'verified' | 'rejected') {
    setProcessing(prev => new Set(prev).add(candidate.id))

    const isFoundation = candidate.type === 'foundation'
    const realId = candidate.id.replace(/^(fp_|op_)/, '')

    if (isFoundation) {
      await (supabase as any)
        .from('foundation_people')
        .update({ linkedin_status: action })
        .eq('id', realId)
    } else {
      const update: Record<string, string | null> = { linkedin_status: action }
      if (action === 'rejected') update.social_linkedin = null
      await (supabase as any)
        .from('official_profiles')
        .update(update)
        .eq('id', realId)
    }

    setCandidates(prev => prev.filter(c => c.id !== candidate.id))
    setProcessing(prev => {
      const next = new Set(prev)
      next.delete(candidate.id)
      return next
    })
  }

  const filtered = candidates.filter(c => {
    if (filter !== 'all' && c.type !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return c.name.toLowerCase().includes(s) || c.organization.toLowerCase().includes(s) || c.role.toLowerCase().includes(s)
    }
    return true
  })

  const foundationCount = candidates.filter(c => c.type === 'foundation').length
  const officialCount = candidates.filter(c => c.type === 'official').length

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Linkedin className="text-brand-accent" size={24} />
          <h1 className="text-2xl font-bold font-heading">LinkedIn Review Queue</h1>
          <span className="bg-brand-accent/10 text-brand-accent text-sm font-semibold px-3 py-1 rounded-full">
            {candidates.length} pending
          </span>
        </div>
        <p className="text-brand-muted text-sm">
          Review candidate LinkedIn profiles found by automated search. Verify each match before publishing.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by name, role, or organization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-brand-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
          />
        </div>
        <div className="flex items-center gap-1 bg-brand-bg rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            onClick={() => setFilter('foundation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'foundation' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Foundation ({foundationCount})
          </button>
          <button
            onClick={() => setFilter('official')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'official' ? 'bg-white text-brand-text shadow-sm' : 'text-brand-muted hover:text-brand-text'
            }`}
          >
            Official ({officialCount})
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-brand-muted">Loading candidates...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Linkedin size={40} className="mx-auto text-brand-muted/30 mb-3" />
          <p className="text-brand-muted">
            {candidates.length === 0 ? 'No LinkedIn candidates to review.' : 'No matches for your filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border bg-brand-bg/50">
                <th className="text-left px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">Organization</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">LinkedIn Profile</th>
                <th className="text-right px-4 py-3 font-semibold text-brand-muted text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isProcessing = processing.has(c.id)
                return (
                  <tr key={c.id} className="border-b border-brand-border last:border-b-0 hover:bg-brand-bg/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-text">{c.name}</td>
                    <td className="px-4 py-3 text-brand-muted">{c.role || '—'}</td>
                    <td className="px-4 py-3 text-brand-muted">{c.organization}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.type === 'foundation'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.type === 'foundation' ? 'Foundation' : 'Official'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={c.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-brand-accent hover:underline text-xs"
                      >
                        <Linkedin size={14} />
                        {c.linkedin_url.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAction(c, 'verified')}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Check size={14} /> Verify
                        </button>
                        <button
                          onClick={() => handleAction(c, 'rejected')}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
