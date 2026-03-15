'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { scoreAllEntities, enrichEntities, updateEntityField, fetchEntityForEdit } from '@/lib/data/edge-functions'
import { TierBadge } from '@/components/ui/TierBadge'
import {
  ENTITY_TYPE_META,
  TIER_CONFIG,
  type FidelityOverview,
  type EntityCompleteness,
} from '@/lib/types/dashboard'

interface Props {
  overview: FidelityOverview[]
}

const TIERS = ['platinum', 'gold', 'silver', 'bronze'] as const
const PAGE_SIZE = 50
const ENRICHABLE_TYPES = new Set(['organization', 'official', 'content', 'service', 'opportunity', 'event', 'agency', 'benefit', 'policy', 'foundation'])

/**
 * Fields editable per entity type.
 * type = 'lookup:category' means a dropdown from the lookup_values table.
 * type = 'ref:themes' or 'ref:focus_areas' means a dropdown from taxonomy tables.
 */
type FieldInput = {
  label: string
  key: string
  type: 'text' | 'url' | 'tel' | 'email' | 'lookup' | 'ref'
  lookupCategory?: string   // for 'lookup' type — category in lookup_values
  refTable?: string         // for 'ref' type — 'themes' or 'focus_areas'
}

const EDITABLE_FIELDS: Record<string, FieldInput[]> = {
  organization: [
    { label: 'Org Type', key: 'org_type', type: 'lookup', lookupCategory: 'org_type' },
    { label: 'Theme', key: 'theme_id', type: 'ref', refTable: 'themes' },
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Logo URL', key: 'logo_url', type: 'url' },
    { label: 'Hero Image URL', key: 'hero_image_url', type: 'url' },
    { label: 'Hours', key: 'hours_of_operation', type: 'text' },
    { label: 'Year Founded', key: 'year_founded', type: 'text' },
    { label: 'Service Area', key: 'service_area', type: 'lookup', lookupCategory: 'geo_scope' },
    { label: 'App Store URL', key: 'app_store_url', type: 'url' },
    { label: 'Google Play URL', key: 'google_play_url', type: 'url' },
  ],
  official: [
    { label: 'Party', key: 'party', type: 'lookup', lookupCategory: 'party' },
    { label: 'Level', key: 'level', type: 'lookup', lookupCategory: 'gov_level' },
    { label: 'Jurisdiction', key: 'jurisdiction', type: 'lookup', lookupCategory: 'jurisdiction' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Office Phone', key: 'office_phone', type: 'tel' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Photo URL', key: 'photo_url', type: 'url' },
    { label: 'Title', key: 'title', type: 'text' },
    { label: 'Office Address', key: 'office_address', type: 'text' },
    { label: 'Bio', key: 'bio', type: 'text' },
  ],
  service: [
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Eligibility', key: 'eligibility', type: 'text' },
    { label: 'Hours', key: 'hours', type: 'text' },
    { label: 'Fees', key: 'fees', type: 'text' },
    { label: 'Languages', key: 'languages', type: 'text' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  policy: [
    { label: 'Policy Type', key: 'policy_type', type: 'lookup', lookupCategory: 'policy_type' },
    { label: 'Level', key: 'level', type: 'lookup', lookupCategory: 'gov_level' },
    { label: 'Status', key: 'status', type: 'lookup', lookupCategory: 'policy_status' },
    { label: 'Bill Number', key: 'bill_number', type: 'text' },
    { label: 'Source URL', key: 'source_url', type: 'url' },
  ],
  opportunity: [
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Registration URL', key: 'registration_url', type: 'url' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  agency: [
    { label: 'Jurisdiction', key: 'jurisdiction', type: 'lookup', lookupCategory: 'jurisdiction' },
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Website', key: 'website', type: 'url' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Acronym', key: 'agency_acronym', type: 'text' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  benefit: [
    { label: 'Benefit Type', key: 'benefit_type', type: 'lookup', lookupCategory: 'benefit_type' },
    { label: 'Application URL', key: 'application_url', type: 'url' },
    { label: 'Benefit Amount', key: 'benefit_amount', type: 'text' },
    { label: 'Eligibility', key: 'eligibility', type: 'text' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  campaign: [
    { label: 'Campaign Type', key: 'campaign_type', type: 'lookup', lookupCategory: 'campaign_type' },
    { label: 'Status', key: 'status', type: 'lookup', lookupCategory: 'campaign_status' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  event: [
    { label: 'Event Type', key: 'event_type', type: 'lookup', lookupCategory: 'event_type' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Registration URL', key: 'registration_url', type: 'url' },
    { label: 'Cost', key: 'cost', type: 'text' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
  foundation: [
    { label: 'Type', key: 'type', type: 'lookup', lookupCategory: 'foundation_type' },
    { label: 'Geo Level', key: 'geo_level', type: 'lookup', lookupCategory: 'geo_scope' },
    { label: 'Phone', key: 'phone', type: 'tel' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Website', key: 'website_url', type: 'url' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'City', key: 'city', type: 'text' },
    { label: 'State', key: 'state_code', type: 'text' },
    { label: 'ZIP', key: 'zip_code', type: 'text' },
    { label: 'Founded Year', key: 'founded_year', type: 'text' },
  ],
  content: [
    { label: 'Content Type', key: 'content_type', type: 'lookup', lookupCategory: 'content_type' },
    { label: 'Theme', key: 'pathway_primary', type: 'ref', refTable: 'themes' },
    { label: 'Center', key: 'center', type: 'lookup', lookupCategory: 'engagement_level' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
    { label: 'Geographic Scope', key: 'geographic_scope', type: 'lookup', lookupCategory: 'geo_scope' },
    { label: 'Image URL', key: 'image_url', type: 'url' },
    { label: 'Source URL', key: 'source_url', type: 'url' },
  ],
  ballot_item: [
    { label: 'Item Type', key: 'item_type', type: 'lookup', lookupCategory: 'ballot_item_type' },
    { label: 'Jurisdiction', key: 'jurisdiction', type: 'lookup', lookupCategory: 'jurisdiction' },
    { label: 'Engagement', key: 'engagement_level', type: 'lookup', lookupCategory: 'engagement_level' },
  ],
}

export function FidelityClient({ overview }: Props) {
  const [scoring, setScoring] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [tierFilter, setTierFilter] = useState<string | null>(null)
  const [entities, setEntities] = useState<EntityCompleteness[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState<string | null>(null)
  const [enrichResult, setEnrichResult] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Record<string, unknown>>({})
  const [editDraft, setEditDraft] = useState<Record<string, string>>({})
  const [editLoading, setEditLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Dropdown data (fetched once from database)
  const [lookups, setLookups] = useState<Record<string, { value: string; label: string }[]>>({})
  const [themes, setThemes] = useState<{ id: string; name: string }[]>([])
  const [focusAreas, setFocusAreas] = useState<{ id: string; name: string; theme_id: string }[]>([])
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false)

  useEffect(() => {
    if (dropdownsLoaded) return
    const supabase = createClient()
    Promise.all([
      supabase.from('lookup_values' as any).select('category, value, label').eq('is_active', true).order('sort_order', { ascending: true }),
      supabase.from('themes' as any).select('theme_id, theme_name'),
      supabase.from('focus_areas' as any).select('focus_id, focus_area_name, theme_id'),
    ]).then(([lookupRes, themesRes, faRes]) => {
      // Group lookups by category
      const grouped: Record<string, { value: string; label: string }[]> = {}
      for (const row of (lookupRes.data as any[] || [])) {
        if (!grouped[row.category]) grouped[row.category] = []
        grouped[row.category].push({ value: row.value, label: row.label })
      }
      setLookups(grouped)
      setThemes((themesRes.data as any[] || []).map((t: any) => ({ id: t.theme_id, name: t.theme_name })))
      setFocusAreas((faRes.data as any[] || []).map((f: any) => ({ id: f.focus_id, name: f.focus_area_name, theme_id: f.theme_id })))
      setDropdownsLoaded(true)
    })
  }, [dropdownsLoaded])

  async function handleScore() {
    setScoring(true)
    try {
      const result = await scoreAllEntities()
      if (!result.ok) {
        alert('Scoring failed: ' + result.error)
        return
      }
      window.location.reload()
    } catch (err) {
      alert('Scoring failed: ' + (err as Error).message)
    } finally {
      setScoring(false)
    }
  }

  async function handleEnrichBronze(entityType: string, e: React.MouseEvent) {
    e.stopPropagation()
    const key = `bronze-${entityType}`
    setEnriching(key)
    setEnrichResult(null)
    try {
      const supabase = createClient()
      const { data: bronzeRows } = await supabase
        .from('entity_completeness' as any)
        .select('entity_id')
        .eq('entity_type', entityType)
        .eq('completeness_tier', 'bronze')
        .limit(20)
      const ids = (bronzeRows as unknown as { entity_id: string }[] || []).map(r => r.entity_id)
      if (ids.length === 0) {
        setEnrichResult('No bronze entities to enrich.')
        return
      }
      const result = await enrichEntities(entityType, ids)
      if (!result.ok) {
        setEnrichResult(`Enrichment failed: ${result.error}`)
        return
      }
      await scoreAllEntities()
      window.location.reload()
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
    } finally {
      setEnriching(null)
    }
  }

  async function handleEnrichRow(entityType: string, entityId: string) {
    setEnriching(entityId)
    setEnrichResult(null)
    try {
      const result = await enrichEntities(entityType, [entityId])
      if (!result.ok) {
        setEnrichResult(`Enrichment failed: ${result.error}`)
        return
      }
      await scoreAllEntities()
      fetchEntities(entityType, tierFilter, page)
      setEnrichResult('Enriched successfully.')
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
    } finally {
      setEnriching(null)
    }
  }

  async function handleEditRow(entityType: string, entityId: string) {
    if (editingId === entityId) {
      setEditingId(null)
      return
    }
    setEditingId(entityId)
    setEditLoading(true)
    setEditDraft({})
    try {
      const result = await fetchEntityForEdit(entityType, entityId)
      if (!result.ok) {
        setEnrichResult(`Failed to load entity: ${result.error}`)
        setEditingId(null)
        return
      }
      setEditData(result.data)
      // Pre-populate draft with current values
      const fields = EDITABLE_FIELDS[entityType] || []
      const draft: Record<string, string> = {}
      for (const f of fields) {
        const val = result.data[f.key]
        draft[f.key] = val != null ? String(val) : ''
      }
      setEditDraft(draft)
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
      setEditingId(null)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleSaveEdit(entityType: string, entityId: string) {
    setSaving(true)
    try {
      // Only send fields that changed
      const fields = EDITABLE_FIELDS[entityType] || []
      const updates: Record<string, string | null> = {}
      for (const f of fields) {
        const original = editData[f.key] != null ? String(editData[f.key]) : ''
        const current = editDraft[f.key] || ''
        if (current !== original) {
          updates[f.key] = current || null
        }
      }
      if (Object.keys(updates).length === 0) {
        setEnrichResult('No changes to save.')
        setEditingId(null)
        setSaving(false)
        return
      }
      const result = await updateEntityField(entityType, entityId, updates)
      if (!result.ok) {
        setEnrichResult(`Save failed: ${result.error}`)
        return
      }
      // Re-score and refresh
      await scoreAllEntities()
      if (selectedType) fetchEntities(selectedType, tierFilter, page)
      setEnrichResult(`Saved ${Object.keys(updates).length} field(s) successfully.`)
      setEditingId(null)
    } catch (err) {
      setEnrichResult(`Error: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  async function fetchEntities(entityType: string, tier: string | null, pageNum: number) {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('entity_completeness' as any)
        .select('*', { count: 'exact' })
        .eq('entity_type', entityType)
        .order('completeness_score', { ascending: true })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (tier) {
        query = query.eq('completeness_tier', tier)
      }

      const { data, count } = await query
      setEntities((data as unknown as EntityCompleteness[]) || [])
      setTotal(count ?? 0)
    } catch (err) {
      console.error('Failed to fetch entities:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCardClick(entityType: string) {
    setSelectedType(entityType)
    setTierFilter(null)
    setPage(0)
    setEditingId(null)
    fetchEntities(entityType, null, 0)
  }

  function handleTierFilter(tier: string | null) {
    setTierFilter(tier)
    setPage(0)
    setEditingId(null)
    if (selectedType) fetchEntities(selectedType, tier, 0)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    setEditingId(null)
    if (selectedType) fetchEntities(selectedType, tierFilter, newPage)
  }

  function tierColor(score: number): string {
    if (score >= 95) return 'text-purple-600'
    if (score >= 80) return 'text-amber-600'
    if (score >= 50) return 'text-gray-600'
    return 'text-orange-600'
  }

  const totalEntities = overview.reduce((sum, o) => sum + o.count, 0)
  const globalAvg = totalEntities > 0
    ? Math.round(overview.reduce((sum, o) => sum + o.avgScore * o.count, 0) / totalEntities)
    : 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-brand-text">Entity Fidelity</h1>
          <p className="text-sm text-brand-muted mt-1">
            {totalEntities} entities scored — {globalAvg}% average completeness
          </p>
        </div>
        <button
          onClick={handleScore}
          disabled={scoring}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg text-sm font-medium hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
        >
          {scoring ? 'Scoring...' : 'Score Now'}
        </button>
      </div>

      {/* Enrich/Edit status */}
      {enrichResult && (
        <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50 border border-brand-border text-sm text-brand-muted">
          <span>{enrichResult}</span>
          <button onClick={() => setEnrichResult(null)} className="text-xs text-brand-muted hover:text-brand-text ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overview.map((o) => {
          const meta = ENTITY_TYPE_META[o.entityType] || { label: o.entityType, singular: o.entityType }
          const isSelected = selectedType === o.entityType
          return (
            <button
              key={o.entityType}
              onClick={() => handleCardClick(o.entityType)}
              className={`text-left p-5 rounded-xl border transition-all hover:shadow-md ${
                isSelected
                  ? 'border-brand-accent bg-brand-accent/5 shadow-md'
                  : 'border-brand-border bg-white hover:border-brand-accent/30'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-brand-muted">{meta.label}</p>
                  <p className="text-xs text-brand-muted/60">{o.count} entities</p>
                </div>
                <span className={`text-3xl font-bold ${tierColor(o.avgScore)}`}>
                  {o.avgScore}
                </span>
              </div>

              {/* Tier distribution bar */}
              <div className="flex rounded-full overflow-hidden h-2 mb-3">
                {TIERS.map((tier) => {
                  const pct = o.count > 0 ? (o.tiers[tier] / o.count) * 100 : 0
                  if (pct === 0) return null
                  const cfg = TIER_CONFIG[tier]
                  return (
                    <div
                      key={tier}
                      className={cfg.dot}
                      style={{ width: `${pct}%` }}
                      title={`${cfg.label}: ${o.tiers[tier]} (${Math.round(pct)}%)`}
                    />
                  )
                })}
              </div>

              {/* Tier counts */}
              <div className="flex gap-3 text-xs text-brand-muted mb-3">
                {TIERS.map((tier) => (
                  <span key={tier} className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${TIER_CONFIG[tier].dot}`} />
                    {o.tiers[tier]}
                  </span>
                ))}
              </div>

              {/* Top critical missing */}
              {o.topMissing.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-brand-muted/50 font-medium">Critical gaps</p>
                  {o.topMissing.slice(0, 3).map((m) => (
                    <div key={m.field} className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted truncate">{m.field}</span>
                      <span className="text-red-500 font-medium ml-2">{m.pct}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Enrich Bronze button */}
              {ENRICHABLE_TYPES.has(o.entityType) && o.tiers.bronze > 0 && (
                <button
                  onClick={(e) => handleEnrichBronze(o.entityType, e)}
                  disabled={enriching === `bronze-${o.entityType}`}
                  className="mt-3 w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 transition-colors"
                >
                  {enriching === `bronze-${o.entityType}` ? 'Enriching...' : `Enrich ${o.tiers.bronze} Bronze`}
                </button>
              )}
            </button>
          )
        })}
      </div>

      {/* No data state */}
      {overview.length === 0 && (
        <div className="text-center py-16 text-brand-muted">
          <p className="text-lg mb-2">No scores yet</p>
          <p className="text-sm">Click &quot;Score Now&quot; to compute entity completeness scores.</p>
        </div>
      )}

      {/* Drilldown Table */}
      {selectedType && (
        <div className="bg-white rounded-xl border border-brand-border">
          <div className="p-4 border-b border-brand-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-semibold text-brand-text">
                {ENTITY_TYPE_META[selectedType]?.label || selectedType}
              </h2>
              <button
                onClick={() => setSelectedType(null)}
                className="text-xs text-brand-muted hover:text-brand-text"
              >
                Close
              </button>
            </div>
            {/* Tier filter tabs */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleTierFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  !tierFilter ? 'bg-brand-accent text-white' : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {TIERS.map((tier) => (
                <button
                  key={tier}
                  onClick={() => handleTierFilter(tier)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tierFilter === tier
                      ? `${TIER_CONFIG[tier].bg} ${TIER_CONFIG[tier].text}`
                      : 'bg-gray-100 text-brand-muted hover:bg-gray-200'
                  }`}
                >
                  {TIER_CONFIG[tier].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-brand-muted">Loading...</div>
          ) : entities.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm">No entities found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-border bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-brand-muted">Name</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-20">Score</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-24">Tier</th>
                      <th className="text-center px-4 py-3 font-medium text-brand-muted w-24">Filled</th>
                      <th className="text-left px-4 py-3 font-medium text-brand-muted">Critical Missing</th>
                      {selectedType && ENRICHABLE_TYPES.has(selectedType) && (
                        <th className="text-center px-4 py-3 font-medium text-brand-muted w-36">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((e) => (
                      <>
                        <tr key={e.entity_id} className={`border-b border-brand-border/50 hover:bg-gray-50/50 ${editingId === e.entity_id ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 text-brand-text font-medium truncate max-w-[300px]">
                            {e.entity_name || e.entity_id}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${tierColor(e.completeness_score)}`}>
                              {e.completeness_score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <TierBadge tier={e.completeness_tier} />
                          </td>
                          <td className="px-4 py-3 text-center text-brand-muted">
                            {e.filled_fields}/{e.total_fields}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(e.critical_missing || []).map((field) => (
                                <span
                                  key={field}
                                  className="inline-block px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </td>
                          {selectedType && ENRICHABLE_TYPES.has(selectedType) && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => handleEnrichRow(selectedType, e.entity_id)}
                                  disabled={enriching === e.entity_id}
                                  className="px-2 py-1 text-[11px] font-medium rounded border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 disabled:opacity-50 transition-colors"
                                >
                                  {enriching === e.entity_id ? '...' : 'AI'}
                                </button>
                                {EDITABLE_FIELDS[selectedType] && (
                                  <button
                                    onClick={() => handleEditRow(selectedType, e.entity_id)}
                                    className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                                      editingId === e.entity_id
                                        ? 'border-blue-400 text-blue-600 bg-blue-50'
                                        : 'border-blue-300/30 text-blue-600 hover:bg-blue-50'
                                    }`}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                        {/* Inline edit panel */}
                        {editingId === e.entity_id && selectedType && (
                          <tr key={`edit-${e.entity_id}`}>
                            <td colSpan={6} className="px-4 py-4 bg-blue-50/20 border-b border-brand-border">
                              {editLoading ? (
                                <div className="text-center text-sm text-brand-muted py-4">Loading entity data...</div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-brand-muted uppercase tracking-wide">
                                      Edit factual fields — {e.entity_name || e.entity_id}
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="px-3 py-1.5 text-xs border border-brand-border rounded-lg text-brand-muted hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSaveEdit(selectedType, e.entity_id)}
                                        disabled={saving}
                                        className="px-3 py-1.5 text-xs bg-brand-accent text-white rounded-lg font-medium hover:bg-brand-accent/90 disabled:opacity-50"
                                      >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(EDITABLE_FIELDS[selectedType] || []).map((field) => {
                                      const isMissing = (e.critical_missing || []).some(
                                        m => m === field.key || m.includes(field.key)
                                      )
                                      const baseClass = `w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white focus:ring-1 focus:ring-brand-accent focus:border-brand-accent ${
                                        isMissing ? 'border-red-300' : 'border-brand-border'
                                      }`
                                      return (
                                        <div key={field.key}>
                                          <label className={`block text-[11px] font-medium mb-1 ${isMissing ? 'text-red-600' : 'text-brand-muted'}`}>
                                            {field.label}
                                            {isMissing && <span className="ml-1 text-red-400">*</span>}
                                          </label>
                                          {field.type === 'lookup' && field.lookupCategory ? (
                                            <select
                                              value={editDraft[field.key] || ''}
                                              onChange={(ev) => setEditDraft({ ...editDraft, [field.key]: ev.target.value })}
                                              className={baseClass}
                                            >
                                              <option value="">— Select —</option>
                                              {(lookups[field.lookupCategory] || []).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                              ))}
                                            </select>
                                          ) : field.type === 'ref' && field.refTable === 'themes' ? (
                                            <select
                                              value={editDraft[field.key] || ''}
                                              onChange={(ev) => setEditDraft({ ...editDraft, [field.key]: ev.target.value })}
                                              className={baseClass}
                                            >
                                              <option value="">— Select —</option>
                                              {themes.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                              ))}
                                            </select>
                                          ) : field.type === 'ref' && field.refTable === 'focus_areas' ? (
                                            <select
                                              value={editDraft[field.key] || ''}
                                              onChange={(ev) => setEditDraft({ ...editDraft, [field.key]: ev.target.value })}
                                              className={baseClass}
                                            >
                                              <option value="">— Select —</option>
                                              {focusAreas.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                              value={editDraft[field.key] || ''}
                                              onChange={(ev) => setEditDraft({ ...editDraft, [field.key]: ev.target.value })}
                                              placeholder={field.label}
                                              className={`${baseClass} ${isMissing ? 'bg-red-50/30' : ''}`}
                                            />
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
                  <p className="text-xs text-brand-muted">
                    Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 text-xs border rounded disabled:opacity-30 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
