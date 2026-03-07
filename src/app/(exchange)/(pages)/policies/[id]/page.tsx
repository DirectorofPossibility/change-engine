import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { ThemePill } from '@/components/ui/ThemePill'
import { getLangId, fetchTranslationsForTable, getPolicyFocusAreas, getPolicyGeography, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import { PolicyImpactSection } from '@/components/exchange/PolicyImpactSection'
import { MapPin, ExternalLink, Calendar, Scale, FileText, Users, ArrowRight } from 'lucide-react'
import { PathwayContextBar } from '@/components/exchange/PathwayContextBar'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'

function statusColor(status: string | null): { bg: string; text: string; dot: string } {
  if (!status) return { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
  if (s === 'pending' || s === 'introduced' || s === 'in committee' || s === 'active') return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' }
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' }
  return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' }
}

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
    description: data.summary_6th_grade || data.summary_5th_grade || 'Policy details on the Community Exchange.',
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
      .neq('policy_id', id).eq('level', policy.level || '').limit(4),
    getPolicyFocusAreas(id),
    getPolicyGeography(id),
  ])

  // Fetch officials from junction
  const officialIds = (officialJunctions ?? []).map(j => j.official_id)
  let officials: Array<{ official_id: string; official_name: string; title: string | null; level: string | null; party: string | null; email: string | null; office_phone: string | null; website: string | null; photo_url: string | null }> = []
  if (officialIds.length > 0) {
    const { data: offData } = await supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, email, office_phone, website, photo_url')
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
  const sc = statusColor(policy.status)

  // Extract primary theme from classification
  const classification = policy.classification_v2 as { theme_primary?: string } | null
  const themePrimary = classification?.theme_primary || null

  // Group geography by type for display
  const geoByType: Record<string, string[]> = {}
  for (const g of geography) {
    if (!geoByType[g.geo_type]) geoByType[g.geo_type] = []
    geoByType[g.geo_type].push(g.geo_id)
  }

  const userProfile = await getUserProfile()
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('policy', id, userProfile?.role),
    getRandomQuote(),
  ])

  return (
    <div>
      {/* Hero header */}
      <div className="bg-brand-bg-alt border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb items={[
            { label: 'Policies', href: '/policies' },
            { label: displayName }
          ]} />
          <PathwayContextBar activePathways={themePrimary ? [themePrimary] : []} showLabels />

          {/* Level + status line */}
          <div className="flex items-center gap-3 mt-4 mb-3 flex-wrap">
            {policy.level && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: levelColor_hex }}>
                <Scale size={14} />
                {policy.level}
              </span>
            )}
            {policy.status && (
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-0.5 rounded-lg ${sc.bg} ${sc.text}`}>
                <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                {policy.status}
              </span>
            )}
            {policy.policy_type && (
              <span className="text-sm text-brand-muted">{policy.policy_type}</span>
            )}
            {themePrimary && <ThemePill themeId={themePrimary} size="sm" />}
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text mb-3 max-w-3xl leading-tight">
            {displayName}
          </h1>

          {policy.bill_number && (
            <p className="text-brand-muted font-mono text-sm mb-3">{policy.bill_number}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            <TranslatePageButton isTranslated={!!translatedName} contentType="policies" contentId={policy.policy_id} />
            {policy.source_url && (
              <a
                href={policy.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
              >
                <ExternalLink size={14} />
                Read the full text
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* What this does — the main summary */}
            {displaySummary && (
              <section className="mb-8">
                <h2 className="text-xl font-serif font-bold text-brand-text mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-brand-accent" />
                  What This Does
                </h2>
                <div className="bg-white rounded-xl border border-brand-border p-6">
                  <p className="text-brand-text leading-relaxed text-[15px]">{displaySummary}</p>
                </div>
              </section>
            )}

            {/* Impact — what it means for you */}
            {policy.impact_statement && (
              <PolicyImpactSection impactStatement={policy.impact_statement} />
            )}

            {/* AI Break It Down */}
            <BreakItDown title={displayName} summary={displaySummary} type="policy" />

            {/* Timeline */}
            <section className="mb-8">
              <h2 className="text-xl font-serif font-bold text-brand-text mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-brand-accent" />
                Timeline
              </h2>
              <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
                <div className="divide-y divide-brand-border">
                  {policy.introduced_date && (
                    <div className="flex items-start gap-4 px-5 py-4">
                      <div className="w-3 h-3 rounded-full bg-brand-accent/30 border-2 border-brand-accent mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-brand-text">Introduced</p>
                        <p className="text-sm text-brand-muted">{new Date(policy.introduced_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  {policy.last_action && (
                    <div className="flex items-start gap-4 px-5 py-4">
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${sc.dot}`} />
                      <div>
                        <p className="text-sm font-medium text-brand-text">Latest Action</p>
                        <p className="text-sm text-brand-muted">{policy.last_action}</p>
                        {policy.last_action_date && (
                          <p className="text-xs text-brand-muted mt-0.5">
                            {new Date(policy.last_action_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {policy.source_url && (
                    <div className="flex items-start gap-4 px-5 py-4">
                      <div className="w-3 h-3 rounded-full bg-brand-border mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-brand-text">Source</p>
                        <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent hover:underline inline-flex items-center gap-1">
                          View on {policy.data_source === 'congress_gov' ? 'Congress.gov' : policy.data_source === 'legistar' ? 'Legistar' : 'source'} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Connected Officials */}
            {officials.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-serif font-bold text-brand-text mb-4 flex items-center gap-2">
                  <Users size={18} className="text-brand-accent" />
                  Decision Makers
                </h2>
                <p className="text-sm text-brand-muted mb-4">The elected officials connected to this policy.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        photoUrl={o.photo_url}
                        translatedTitle={ot?.title}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {/* Related Policies */}
            {related && related.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-serif font-bold text-brand-text mb-4">Related Policies</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-6">
            {/* Focus areas */}
            {focusAreas.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-serif font-semibold text-brand-text mb-3">Topics</h3>
                <FocusAreaPills focusAreas={focusAreas} />
              </div>
            )}

            {/* Geographic impact */}
            {geography.length > 0 && (
              <div className="bg-white rounded-xl border border-brand-border p-5">
                <h3 className="text-sm font-serif font-semibold text-brand-text mb-3 flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand-muted" />
                  Where This Applies
                </h3>
                <div className="space-y-3">
                  {Object.entries(geoByType).map(function ([geoType, ids]) {
                    return (
                      <div key={geoType}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{formatGeoType(geoType)}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {ids.map(function (gid) {
                            return (
                              <span key={gid} className="text-xs bg-brand-bg px-2 py-0.5 rounded-lg text-brand-text border border-brand-border">
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

            {/* Quick facts card */}
            <div className="bg-white rounded-xl border border-brand-border p-5">
              <h3 className="text-sm font-serif font-semibold text-brand-text mb-3">Quick Facts</h3>
              <div className="space-y-2.5 text-sm">
                {policy.level && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Level</span>
                    <span className="font-medium" style={{ color: levelColor_hex }}>{policy.level}</span>
                  </div>
                )}
                {policy.status && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Status</span>
                    <span className={`font-medium ${sc.text}`}>{policy.status}</span>
                  </div>
                )}
                {policy.policy_type && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Type</span>
                    <span className="text-brand-text">{policy.policy_type}</span>
                  </div>
                )}
                {policy.bill_number && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Bill</span>
                    <span className="text-brand-text font-mono text-xs">{policy.bill_number}</span>
                  </div>
                )}
                {policy.introduced_date && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Introduced</span>
                    <span className="text-brand-text">{new Date(policy.introduced_date).toLocaleDateString()}</span>
                  </div>
                )}
                {policy.data_source && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Source</span>
                    <span className="text-brand-text capitalize">{policy.data_source.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Wayfinder */}
            <DetailWayfinder data={wayfinderData} currentType="policy" currentId={id} userRole={userProfile?.role} />
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <div className="mt-10">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
          </div>
        )}
      </div>

      <AdminEditPanel
        entityType="policies"
        entityId={policy.policy_id}
        idKey="policy_id"
        data={policy}
        userRole={userProfile?.role}
        fields={[
          { name: 'policy_name', label: 'Policy Name', type: 'text' },
          { name: 'title_6th_grade', label: 'Title (6th Grade)', type: 'text' },
          { name: 'summary_6th_grade', label: 'Summary (6th Grade)', type: 'textarea' },
          { name: 'policy_type', label: 'Policy Type', type: 'text' },
          { name: 'status', label: 'Status', type: 'text' },
          { name: 'government_level', label: 'Government Level', type: 'select', options: ['federal', 'state', 'county', 'city'] },
          { name: 'source_url', label: 'Source URL', type: 'url' },
          { name: 'sponsor', label: 'Sponsor', type: 'text' },
        ] as EditField[]}
      />
    </div>
  )
}
