import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { EntityMesh } from '@/components/exchange/EntityMesh'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { ThemePill } from '@/components/ui/ThemePill'
import { getLangId, fetchTranslationsForTable, getPolicyFocusAreas, getPolicyGeography } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import { MapPin } from 'lucide-react'

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600'
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return 'bg-green-100 text-green-700'
  if (s === 'pending' || s === 'introduced' || s === 'in committee' || s === 'active') return 'bg-yellow-100 text-yellow-700'
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return 'bg-red-100 text-red-700'
  return 'bg-blue-100 text-blue-700'
}

/** Format geo_type for display */
function formatGeoType(geoType: string): string {
  const map: Record<string, string> = {
    council_district: 'Council District',
    state_house: 'State House District',
    state_senate: 'State Senate District',
    congressional: 'Congressional District',
    county: 'County',
    zip_code: 'ZIP Code',
    super_neighborhood: 'Super Neighborhood',
    census_tract: 'Census Tract',
    school_district: 'School District',
  }
  return map[geoType] || geoType
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('policies').select('policy_name, title_6th_grade, summary_5th_grade, summary_6th_grade').eq('policy_id', id).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.title_6th_grade || data.policy_name,
    description: data.summary_6th_grade || data.summary_5th_grade || 'Details on The Change Engine.',
  }
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('policy_id', id)
    .single()

  if (!policy) notFound()

  // Fetch all related data in parallel
  const [
    { data: officialJunctions },
    { data: related },
    focusAreas,
    geography,
  ] = await Promise.all([
    supabase.from('policy_officials').select('official_id').eq('policy_id', id),
    supabase.from('policies').select('policy_id, policy_name, title_6th_grade, policy_type, level, status, summary_5th_grade, summary_6th_grade, bill_number, source_url, impact_statement')
      .neq('policy_id', id).eq('level', policy.level || '').eq('is_published', true).limit(4),
    getPolicyFocusAreas(id),
    getPolicyGeography(id),
  ])

  // Fetch officials from junction
  const officialIds = (officialJunctions ?? []).map(j => j.official_id)
  let officials: Array<{ official_id: string; official_name: string; title: string | null; level: string | null; party: string | null; email: string | null; office_phone: string | null; website: string | null }> = []
  if (officialIds.length > 0) {
    const { data: offData } = await supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, email, office_phone, website')
      .in('official_id', officialIds)
    officials = offData || []
  }

  // Fetch translations
  const langId = await getLangId()
  let translatedName: string | undefined
  let translatedSummary: string | undefined
  let officialTranslations: Record<string, { title?: string; summary?: string }> = {}
  let relatedPolicyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const oIds = officials.map(function (o) { return o.official_id })
    const rIds = (related || []).map(function (p) { return p.policy_id })
    const results = await Promise.all([
      fetchTranslationsForTable('policies', [policy.policy_id], langId),
      oIds.length > 0 ? fetchTranslationsForTable('elected_officials', oIds, langId) : {},
      rIds.length > 0 ? fetchTranslationsForTable('policies', rIds, langId) : {},
    ])
    translatedName = results[0][policy.policy_id]?.title
    translatedSummary = results[0][policy.policy_id]?.summary
    officialTranslations = results[1]
    relatedPolicyTranslations = results[2]
  }

  const displayName = translatedName || policy.title_6th_grade || policy.policy_name
  const displaySummary = translatedSummary || policy.summary_6th_grade || policy.summary_5th_grade
  const levelColor_hex = LEVEL_COLORS[policy.level || ''] || DEFAULT_LEVEL_COLOR

  // Extract primary theme from classification
  const classification = policy.classification_v2 as { theme_primary?: string } | null
  const themePrimary = classification?.theme_primary || null

  // Group geography by type for display
  const geoByType: Record<string, string[]> = {}
  for (const g of geography) {
    if (!geoByType[g.geo_type]) geoByType[g.geo_type] = []
    geoByType[g.geo_type].push(g.geo_id)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[
        { label: 'Policies', href: '/policies' },
        { label: displayName }
      ]} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {policy.status && (
          <span className={'text-xs px-3 py-1 rounded-full font-medium ' + statusColor(policy.status)}>{policy.status}</span>
        )}
        {policy.policy_type && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg text-brand-muted">{policy.policy_type}</span>
        )}
        {policy.level && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: levelColor_hex + '20', color: levelColor_hex }}>{policy.level}</span>
        )}
        {themePrimary && <ThemePill themeId={themePrimary} size="sm" />}
      </div>

      <h1 className="text-3xl font-serif font-bold text-brand-text mb-2">{displayName}</h1>
      {policy.bill_number && <p className="text-brand-muted font-mono mb-4">{policy.bill_number}</p>}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Timeline */}
          <div className="bg-white rounded-xl border border-brand-border p-5 mb-8 space-y-2">
            {policy.introduced_date && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-brand-muted w-28">Introduced</span>
                <span className="text-brand-text">{new Date(policy.introduced_date).toLocaleDateString()}</span>
              </div>
            )}
            {policy.last_action && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-brand-muted w-28">Last Action</span>
                <span className="text-brand-text">{policy.last_action}</span>
                {policy.last_action_date && <span className="text-brand-muted">on {new Date(policy.last_action_date).toLocaleDateString()}</span>}
              </div>
            )}
            {policy.source_url && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-brand-muted w-28">Source</span>
                <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">View source &rarr;</a>
              </div>
            )}
          </div>

          {/* Summary */}
          {displaySummary && (
            <section className="mb-8">
              <h2 className="text-xl font-serif font-bold text-brand-text mb-3">Summary</h2>
              <p className="text-brand-muted leading-relaxed">{displaySummary}</p>
            </section>
          )}

          {/* AI Break It Down */}
          <BreakItDown title={displayName} summary={displaySummary} type="policy" />

          {/* Impact Statement */}
          {policy.impact_statement && (
            <section className="mb-8">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h2 className="text-xl font-serif font-bold text-brand-text mb-3">How This Affects Your Life</h2>
                <p className="text-brand-text leading-relaxed">{policy.impact_statement}</p>
              </div>
            </section>
          )}

          {/* Connected Officials */}
          {officials.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-serif font-bold text-brand-text mb-4">Decision Makers on This Policy</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {officials.map(function (o) {
                  const ot = officialTranslations[o.official_id]
                  return (
                    <OfficialCard
                      key={o.official_id}
                      id={o.official_id}
                      name={o.official_name}
                      title={o.title}
                      party={o.party}
                      level={o.level}
                      email={o.email}
                      phone={o.office_phone}
                      website={o.website}
                      translatedTitle={ot?.title}
                    />
                  )
                })}
              </div>
            </section>
          )}

          {/* Related Policies */}
          {related && related.length > 0 && (
            <section>
              <h2 className="text-xl font-serif font-bold text-brand-text mb-4">Related Policies</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map(function (p) {
                  const rpt = relatedPolicyTranslations[p.policy_id]
                  return (
                    <Link key={p.policy_id} href={'/policies/' + p.policy_id}>
                      <PolicyCard
                        name={p.title_6th_grade || p.policy_name}
                        summary={p.summary_6th_grade || p.summary_5th_grade}
                        billNumber={p.bill_number}
                        status={p.status}
                        level={p.level}
                        sourceUrl={p.source_url}
                        translatedName={rpt?.title}
                        translatedSummary={rpt?.summary}
                        impactPreview={p.impact_statement}
                      />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          <EntityMesh entityType="policy" entityId={id} />
        </div>

        {/* Sidebar — focus areas + geography */}
        {(focusAreas.length > 0 || geography.length > 0) && (
          <aside className="lg:w-80 shrink-0 space-y-6">
            {/* Focus areas */}
            {focusAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-semibold text-brand-text mb-3">Focus Areas</h3>
                <FocusAreaPills focusAreas={focusAreas} />
              </div>
            )}

            {/* Geographic impact */}
            {geography.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-semibold text-brand-text mb-3 flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand-muted" />
                  Areas Affected
                </h3>
                <div className="space-y-2">
                  {Object.entries(geoByType).map(function ([geoType, ids]) {
                    return (
                      <div key={geoType}>
                        <span className="text-xs font-medium text-brand-muted uppercase tracking-wide">{formatGeoType(geoType)}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ids.map(function (gid) {
                            return (
                              <span key={gid} className="text-xs bg-brand-bg px-2 py-0.5 rounded-full text-brand-text">
                                {gid}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
