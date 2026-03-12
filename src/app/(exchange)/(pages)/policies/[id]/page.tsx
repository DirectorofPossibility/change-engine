import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUIStrings } from '@/lib/i18n'
import { OfficialCard } from '@/components/exchange/OfficialCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { getLangId, fetchTranslationsForTable, getPolicyFocusAreas, getPolicyGeography, getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import { PolicyImpactSection } from '@/components/exchange/PolicyImpactSection'
import { MapPin, ExternalLink, Calendar, Scale, FileText, Users, ArrowRight } from 'lucide-react'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { policyJsonLd } from '@/lib/jsonld'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'

function statusColor(status: string | null): { dotColor: string; textColor: string } {
  if (!status) return { dotColor: '#1b5e8a', textColor: '#1b5e8a' }
  const s = status.toLowerCase()
  if (s === 'passed' || s === 'enacted' || s === 'signed') return { dotColor: '#2d5a27', textColor: '#2d5a27' }
  if (s === 'pending' || s === 'introduced' || s === 'in committee' || s === 'active') return { dotColor: '#8b6914', textColor: '#8b6914' }
  if (s === 'failed' || s === 'vetoed' || s === 'dead') return { dotColor: '#a12323', textColor: '#a12323' }
  return { dotColor: '#1b5e8a', textColor: '#1b5e8a' }
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
    description: data.summary_6th_grade || data.summary_5th_grade || 'Policy details on the Change Engine.',
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
    supabase.from('policies').select('policy_id, policy_name, title_6th_grade, policy_type, level, status, summary_5th_grade, summary_6th_grade, bill_number, source_url, impact_statement, last_action_date')
      .neq('policy_id', id).eq('level', policy.level || '').order('last_action_date', { ascending: false }).limit(4),
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
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)
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

  const jsonLd = policyJsonLd(policy as any)

  return (
    <div style={{ background: '#f4f5f7' }}>
      <SpiralTracker action="view_policy" />

      <DetailPageLayout
        breadcrumbs={[
          { label: t('policy.policies'), href: '/policies' },
          { label: displayName }
        ]}
        eyebrow={policy.level ? { text: policy.level } : undefined}
        eyebrowMeta={
          <>
            {policy.policy_type && (
              <span
                className="font-mono uppercase"
                style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474' }}
              >
                {policy.policy_type}
              </span>
            )}
            {policy.status && (
              <span className="inline-flex items-center gap-1.5" style={{ color: sc.textColor }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dotColor, display: 'inline-block', flexShrink: 0 }} />
                <span className="font-mono uppercase" style={{ fontSize: '0.58rem', letterSpacing: '0.2em' }}>
                  {policy.status}
                </span>
              </span>
            )}
          </>
        }
        title={displayName}
        subtitle={displaySummary}
        mastheadBorderTop={`3px solid ${levelColor_hex}`}
        mastheadBorderLeft={['pending', 'introduced', 'in committee', 'active'].includes((policy.status || '').toLowerCase()) ? '4px solid #b03a2a' : undefined}
        metaRow={
          <>
            {policy.bill_number && (
              <span className="font-mono" style={{ fontSize: '0.8rem', color: '#5c6474' }}>{policy.bill_number}</span>
            )}
            {policy.source_url && (
              <a
                href={policy.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.2em] text-[0.58rem] hover:underline"
                style={{ color: '#5c6474' }}
              >
                <ExternalLink size={10} />
                Source: {policy.data_source === 'congress_gov' ? 'Congress.gov' : policy.data_source === 'legistar' ? 'Legistar' : 'Official record'}
              </a>
            )}
          </>
        }
        actions={{
          translate: { isTranslated: !!translatedName, contentType: 'policies', contentId: policy.policy_id },
          share: { title: displayName || undefined, via: policy.level || undefined, url: 'https://www.changeengine.us/policies/' + id },
        }}
        themeColor={levelColor_hex}
        wayfinderData={wayfinderData}
        wayfinderType="policy"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="policies"
        feedbackId={policy.policy_id}
        feedbackName={policy.title_6th_grade || policy.policy_name || ''}
        jsonLd={jsonLd}
        sidebar={
          <>
            {/* Quick Facts */}
            <div>
              <h3
                className="font-mono uppercase pb-2 mb-3"
                style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
              >
                {t('policy.quick_facts')}
              </h3>
              <div className="space-y-2.5" style={{ fontSize: '0.875rem' }}>
                {policy.level && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.level')}</span>
                    <span style={{ fontWeight: 600, color: levelColor_hex }}>{policy.level}</span>
                  </div>
                )}
                {policy.status && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.status')}</span>
                    <span style={{ fontWeight: 600, color: sc.textColor }}>{policy.status}</span>
                  </div>
                )}
                {policy.policy_type && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.type')}</span>
                    <span style={{ color: '#0d1117' }}>{policy.policy_type}</span>
                  </div>
                )}
                {policy.bill_number && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.bill')}</span>
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#0d1117' }}>{policy.bill_number}</span>
                  </div>
                )}
                {policy.introduced_date && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.introduced')}</span>
                    <span style={{ color: '#0d1117' }}>{new Date(policy.introduced_date).toLocaleDateString()}</span>
                  </div>
                )}
                {policy.data_source && (
                  <div className="flex justify-between">
                    <span className="font-mono" style={{ fontSize: '0.75rem', color: '#5c6474' }}>{t('policy.source')}</span>
                    <span style={{ color: '#0d1117', textTransform: 'capitalize' }}>{policy.data_source.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Focus areas */}
            {focusAreas.length > 0 && (
              <div>
                <h3
                  className="font-mono uppercase pb-2 mb-3"
                  style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
                >
                  {t('policy.topics')}
                </h3>
                <FocusAreaPills focusAreas={focusAreas} />
              </div>
            )}

            {/* Geographic impact */}
            {geography.length > 0 && (
              <div>
                <h3
                  className="font-mono uppercase pb-2 mb-3"
                  style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474', borderBottom: '1px solid #dde1e8' }}
                >
                  {t('policy.where_applies')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(geoByType).map(function ([geoType, ids]) {
                    return (
                      <div key={geoType}>
                        <span className="font-mono uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#8a929e' }}>{formatGeoType(geoType)}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {ids.map(function (gid) {
                            return (
                              <span
                                key={gid}
                                className="font-mono"
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#0d1117',
                                  background: '#f4f5f7',
                                  padding: '2px 8px',
                                  border: '1px solid #dde1e8',
                                  display: 'inline-block',
                                }}
                              >
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
          </>
        }
      >
        {/* What this does */}
        {displaySummary && (
          <section className="mb-8">
            <h2
              className="font-mono uppercase mb-4"
              style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474' }}
            >
              {t('policy.what_it_does')}
            </h2>
            <p className="font-body leading-relaxed" style={{ fontSize: '1rem', color: '#0d1117' }}>
              {displaySummary}
            </p>
          </section>
        )}

        {/* Impact */}
        {policy.impact_statement && (
          <PolicyImpactSection impactStatement={policy.impact_statement} />
        )}

        {/* AI Break It Down */}
        <BreakItDown title={displayName} summary={displaySummary} type="policy" />

        {/* Timeline */}
        <section className="mb-8">
          <h2
            className="font-mono uppercase mb-4"
            style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474' }}
          >
            {t('policy.timeline')}
          </h2>
          <div>
            {policy.introduced_date && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1b5e8a', marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
                <div>
                  <p className="font-body" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d1117' }}>{t('policy.introduced')}</p>
                  <p className="font-body" style={{ fontSize: '0.85rem', color: '#5c6474' }}>{new Date(policy.introduced_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )}
            {policy.last_action && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dotColor, marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
                <div>
                  <p className="font-body" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d1117' }}>{t('policy.latest_action')}</p>
                  <p className="font-body" style={{ fontSize: '0.85rem', color: '#5c6474' }}>{policy.last_action}</p>
                  {policy.last_action_date && (
                    <p className="font-mono mt-0.5" style={{ fontSize: '0.7rem', color: '#8a929e' }}>
                      {new Date(policy.last_action_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}
            {policy.source_url && (
              <div className="flex items-start gap-4 py-4" style={{ borderBottom: '1px solid #dde1e8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dde1e8', marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
                <div>
                  <p className="font-body" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0d1117' }}>{t('policy.source')}</p>
                  <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline" style={{ fontSize: '0.85rem', color: '#1b5e8a' }}>
                    View on {policy.data_source === 'congress_gov' ? 'Congress.gov' : policy.data_source === 'legistar' ? 'Legistar' : 'source'} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Decision Makers */}
        {officials.length > 0 && (
          <section className="mb-8">
            <h2
              className="font-mono uppercase mb-4"
              style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474' }}
            >
              {t('policy.leaders_connected')}
            </h2>
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
            <h2
              className="font-mono uppercase mb-4"
              style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: '#5c6474' }}
            >
              {t('policy.related_policies')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 0 }}>
              {related.map(function (p, i) {
                const rpt = relatedPolicyTranslations[p.policy_id]
                return (
                  <Link
                    key={p.policy_id}
                    href={'/policies/' + p.policy_id}
                    style={{
                      display: 'block',
                      padding: '1rem',
                      borderBottom: '1px solid #dde1e8',
                      borderRight: i % 2 === 0 ? '1px solid #dde1e8' : 'none',
                    }}
                  >
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
                      lastActionDate={(p as any).last_action_date}
                    />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Quote */}
        {quote && (
          <div className="mt-6 mb-8">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} />
          </div>
        )}
      </DetailPageLayout>

      <AdminEditPanel
        entityType="policies"
        entityId={policy.policy_id}
        userRole={userProfile?.role}
        fields={[
          { key: 'policy_name', label: 'Policy Name', type: 'text', value: policy.policy_name },
          { key: 'title_6th_grade', label: 'Title (6th Grade)', type: 'text', value: policy.title_6th_grade },
          { key: 'summary_6th_grade', label: 'Summary (6th Grade)', type: 'textarea', value: policy.summary_6th_grade },
          { key: 'policy_type', label: 'Policy Type', type: 'text', value: (policy as any).policy_type },
          { key: 'status', label: 'Status', type: 'text', value: (policy as any).status },
          { key: 'government_level', label: 'Government Level', type: 'select', value: (policy as any).government_level, options: ['federal', 'state', 'county', 'city'] },
          { key: 'source_url', label: 'Source URL', type: 'url', value: policy.source_url },
          { key: 'sponsor', label: 'Sponsor', type: 'text', value: (policy as any).sponsor },
        ] as EditField[]}
      />
    </div>
  )
}
