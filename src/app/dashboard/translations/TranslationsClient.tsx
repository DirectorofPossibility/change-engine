'use client'

import { useState } from 'react'
import { translateAll } from '@/lib/data/edge-functions'

interface EntityBreakdown {
  entity: string
  total: number
  es: number
  vi: number
}

interface TranslationStats {
  esCount: number
  viCount: number
  totalPublished: number
  breakdown?: EntityBreakdown[]
}

const ENTITY_LABELS: Record<string, string> = {
  content_published: 'Published Content',
  elected_officials: 'Elected Officials',
  services_211: 'Services',
  policies: 'Policies',
  organizations: 'Organizations',
  opportunities: 'Opportunities',
  foundations: 'Foundations',
  events: 'Events',
  guides: 'Guides',
  campaigns: 'Campaigns',
  benefit_programs: 'Benefits',
  learning_paths: 'Learning Paths',
  life_situations: 'Life Situations',
}

export function TranslationsClient({
  stats,
  published,
  translations,
}: {
  stats: TranslationStats
  published: any[]
  translations: any[]
}) {
  const [translating, setTranslating] = useState(false)
  const [langFilter, setLangFilter] = useState<'all' | 'es' | 'vi'>('all')

  // Build lookup: content_id → { es?: string, vi?: string }
  const translationMap: Record<string, { es?: string; vi?: string }> = {}
  for (const t of translations) {
    const key = t.content_id || t.record_id
    if (!translationMap[key]) translationMap[key] = {}
    if (t.language_id === 'LANG-ES') translationMap[key].es = t.translated_text
    if (t.language_id === 'LANG-VI') translationMap[key].vi = t.translated_text
  }

  const esPct = stats.totalPublished > 0 ? Math.round((stats.esCount / stats.totalPublished) * 100) : 0
  const viPct = stats.totalPublished > 0 ? Math.round((stats.viCount / stats.totalPublished) * 100) : 0

  const getTranslation = (p: any) => translationMap[p.inbox_id] || translationMap[p.id]

  const filteredPublished = published.filter((p) => {
    const t = getTranslation(p)
    if (langFilter === 'es') return !t?.es
    if (langFilter === 'vi') return !t?.vi
    return true
  })

  async function handleTranslateAll() {
    setTranslating(true)
    try {
      const result = await translateAll()
      if (!result.ok) {
        console.warn('Translation issue:', result.error)
      }
    } catch {
      // Edge function may timeout on large batches — that's ok
    }
    setTranslating(false)
    window.location.reload()
  }

  const breakdown = stats.breakdown || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Translations</h1>
        <button
          onClick={handleTranslateAll}
          disabled={translating}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {translating ? 'Translating...' : 'Translate All Missing'}
        </button>
      </div>

      {/* Overall Coverage Meters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Spanish (ES)</span>
            <span className="text-sm text-brand-muted">{stats.esCount.toLocaleString()} / {stats.totalPublished.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-brand-accent h-3 rounded-full transition-all"
              style={{ width: `${Math.min(esPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-1">{esPct}% coverage</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-brand-border p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Vietnamese (VI)</span>
            <span className="text-sm text-brand-muted">{stats.viCount.toLocaleString()} / {stats.totalPublished.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-theme-voice h-3 rounded-full transition-all"
              style={{ width: `${Math.min(viPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-1">{viPct}% coverage</p>
        </div>
      </div>

      {/* Per-entity breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border bg-brand-bg/50">
            <h2 className="text-sm font-semibold text-brand-text">Coverage by Entity Type</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-brand-muted">
                <th className="px-4 py-2 font-medium">Entity</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
                <th className="px-4 py-2 font-medium">Spanish</th>
                <th className="px-4 py-2 font-medium">Vietnamese</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => {
                const esBPct = b.total > 0 ? Math.round((b.es / b.total) * 100) : 0
                const viBPct = b.total > 0 ? Math.round((b.vi / b.total) * 100) : 0
                return (
                  <tr key={b.entity} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                    <td className="px-4 py-2.5 font-medium">{ENTITY_LABELS[b.entity] || b.entity}</td>
                    <td className="px-4 py-2.5 text-right text-brand-muted">{b.total.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                          <div className="bg-brand-accent h-2 rounded-full" style={{ width: `${Math.min(esBPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-brand-muted w-16 text-right">{b.es} ({esBPct}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[120px]">
                          <div className="bg-theme-voice h-2 rounded-full" style={{ width: `${Math.min(viBPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-brand-muted w-16 text-right">{b.vi} ({viBPct}%)</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value as any)}
          className="border border-brand-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Content</option>
          <option value="es">Missing Spanish</option>
          <option value="vi">Missing Vietnamese</option>
        </select>
        <span className="text-sm text-brand-muted">{filteredPublished.length} items</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-brand-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-brand-muted bg-brand-bg/50">
              <th className="px-4 py-3 font-medium">English Title</th>
              <th className="px-4 py-3 font-medium">Spanish</th>
              <th className="px-4 py-3 font-medium">Vietnamese</th>
            </tr>
          </thead>
          <tbody>
            {filteredPublished.map((p: any) => {
              const t = getTranslation(p)
              return (
                <tr key={p.id} className="border-b border-brand-border/50 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{p.title_6th_grade}</td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate">
                    {t?.es ? (
                      <span className="text-green-700">{t.es}</span>
                    ) : (
                      <span className="text-red-400">Missing</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-xs truncate">
                    {t?.vi ? (
                      <span className="text-green-700">{t.vi}</span>
                    ) : (
                      <span className="text-red-400">Missing</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredPublished.length === 0 && (
          <div className="text-center py-12 text-brand-muted">No items found.</div>
        )}
      </div>
    </div>
  )
}
