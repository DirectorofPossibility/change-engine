'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, Scale } from 'lucide-react'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { useTranslation } from '@/lib/i18n'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'

interface Policy {
  policy_id: string
  policy_name: string
  title_6th_grade: string | null
  summary_5th_grade: string | null
  summary_6th_grade: string | null
  bill_number: string | null
  status: string | null
  level: string | null
  source_url: string | null
  impact_statement: string | null
  policy_type: string | null
  classification_v2: any | null
}

interface PoliciesPageClientProps {
  policies: Policy[]
  translations: Record<string, { title?: string; summary?: string }>
}

const LEVELS = ['All', 'Federal', 'State', 'County', 'City']
const STATUSES = ['All', 'Enacted', 'Passed', 'Introduced', 'Pending', 'Failed']

export function PoliciesPageClient({ policies, translations }: PoliciesPageClientProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = useMemo(function () {
    return policies.filter(function (p) {
      if (levelFilter !== 'All' && p.level !== levelFilter) return false
      if (statusFilter !== 'All' && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const name = (p.title_6th_grade || p.policy_name || '').toLowerCase()
        const bill = (p.bill_number || '').toLowerCase()
        const summary = (p.summary_6th_grade || p.summary_5th_grade || '').toLowerCase()
        if (!name.includes(q) && !bill.includes(q) && !summary.includes(q)) return false
      }
      return true
    })
  }, [policies, search, levelFilter, statusFilter])

  // Group by level
  const grouped = useMemo(function () {
    if (levelFilter !== 'All') return null
    const groups: Record<string, Policy[]> = {}
    for (const p of filtered) {
      const lvl = p.level || 'Other'
      if (!groups[lvl]) groups[lvl] = []
      groups[lvl].push(p)
    }
    return groups
  }, [filtered, levelFilter])

  const levelOrder = ['Federal', 'State', 'County', 'City', 'Other']

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="text"
            value={search}
            onChange={function (e) { setSearch(e.target.value) }}
            placeholder="Search policies..."
            className="w-full pl-9 pr-4 py-2.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={levelFilter}
            onChange={function (e) { setLevelFilter(e.target.value) }}
            className="px-3 py-2.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            {LEVELS.map(function (l) { return <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option> })}
          </select>
          <select
            value={statusFilter}
            onChange={function (e) { setStatusFilter(e.target.value) }}
            className="px-3 py-2.5 border border-brand-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          >
            {STATUSES.map(function (s) { return <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option> })}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-brand-muted mb-4">{filtered.length} {filtered.length === 1 ? 'policy' : 'policies'} found</p>

      {filtered.length === 0 && (
        <p className="text-brand-muted text-center py-12">No policies match your filters.</p>
      )}

      {/* Grouped display when showing all levels */}
      {grouped && levelOrder.map(function (level) {
        const items = grouped[level]
        if (!items || items.length === 0) return null
        const color = LEVEL_COLORS[level] || DEFAULT_LEVEL_COLOR
        return (
          <section key={level} className="mb-10">
            <h2 className="text-lg font-serif font-bold text-brand-text mb-4 flex items-center gap-2">
              <Scale size={18} style={{ color }} />
              <span style={{ color }}>{level}</span>
              <span className="text-xs text-brand-muted font-normal">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(function (p) {
                const tr = translations[p.policy_id]
                return (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                    <PolicyCard
                      name={p.title_6th_grade || p.policy_name}
                      summary={p.summary_6th_grade || p.summary_5th_grade}
                      billNumber={p.bill_number}
                      status={p.status}
                      level={p.level}
                      sourceUrl={p.source_url}
                      translatedName={tr?.title}
                      translatedSummary={tr?.summary}
                      impactPreview={p.impact_statement}
                    />
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Flat display when filtering by specific level */}
      {!grouped && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(function (p) {
            const tr = translations[p.policy_id]
            return (
              <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                <PolicyCard
                  name={p.title_6th_grade || p.policy_name}
                  summary={p.summary_6th_grade || p.summary_5th_grade}
                  billNumber={p.bill_number}
                  status={p.status}
                  level={p.level}
                  sourceUrl={p.source_url}
                  translatedName={tr?.title}
                  translatedSummary={tr?.summary}
                  impactPreview={p.impact_statement}
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
