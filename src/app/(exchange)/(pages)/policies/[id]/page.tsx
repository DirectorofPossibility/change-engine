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
import { getRelatedServices } from '@/lib/data/services'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { LEVEL_COLORS, DEFAULT_LEVEL_COLOR } from '@/lib/constants'
import { PolicyImpactSection } from '@/components/exchange/PolicyImpactSection'
import { ExternalLink } from 'lucide-react'
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

  const { data: policy } = await supabase.from('policies').select('*').eq('policy_id', id).single()
  if (!policy) notFound()

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

  const officialIds = (officialJunctions ?? []).map(j => j.official_id)
  let officials: Array<{ official_id: string; official_name: string; title: string | null; level: string | null; party: string | null; email: string | null; office_phone: string | null; website: string | null; photo_url: string | null }> = []
  if (officialIds.length > 0) {
    const { data: offData } = await supabase
      .from('elected_officials')
      .select('official_id, official_name, title, level, party, email, office_phone, website, photo_url')
      .in('official_id', officialIds)
    officials = offData || []
  }

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
  const sc = statusColor(policy.status)

  const geoByType: Record<string, string[]> = {}
  for (const g of geography) {
    if (!geoByType[g.geo_type]) geoByType[g.geo_type] = []
    geoByType[g.geo_type].push(g.geo_id)
  }

  const userProfile = await getUserProfile()
  const focusAreaIds = focusAreas.map(fa => fa.focus_id)
  const [wayfinderData, quote, relatedServices] = await Promise.all([
    getWayfinderContext('policy', id, userProfile?.role),
    getRandomQuote(),
    focusAreaIds.length > 0 ? getRelatedServices(focusAreaIds) : Promise.resolve([]),
  ])

  const displayRelatedServices = relatedServices.slice(0, 4)
  const jsonLd = policyJsonLd(policy as any)

  const levelColor = LEVEL_COLORS[policy.level || ''] || DEFAULT_LEVEL_COLOR

  /* Eyebrow: level pill */
  const eyebrow = policy.level
    ? { text: policy.level, bgColor: levelColor, textColor: '#ffffff' }
    : undefined

  /* Eyebrow meta: type + status */
  const eyebrowMeta = (
    <span className="inline-flex items-center gap-3">
      {policy.policy_type && (
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">{policy.policy_type}</span>
      )}
      {policy.status && (
        <span className="inline-flex items-center gap-1.5" style={{ color: sc.textColor }}>
          <span className="inline-block shrink-0" style={{ width: 7, height: 7, background: sc.dotColor }} />
          <span className="font-mono text-[0.65rem] uppercase tracking-wider">{policy.status}</span>
        </span>
      )}
    </span>
  )

  /* Meta row: bill number + source link */
  const metaRow = (
    <span className="inline-flex items-center gap-4">
      {policy.bill_number && (
        <span className="text-xs text-muted">{policy.bill_number}</span>
      )}
      {policy.source_url && (
        <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline font-mono text-[0.65rem] uppercase tracking-wider text-blue">
          <ExternalLink size={10} /> Source
        </a>
      )}
    </span>
  )

  /* Footer: back link */
  const footerContent = (
    <div className="max-w-[900px] mx-auto px-6 pb-12">
      <div className="mb-6 border-t border-rule" />
      <Link href="/policies" className="italic text-blue text-[0.95rem] hover:underline">
        Back to Policies
      </Link>
    </div>
  )

  return (
    <>
      <DetailPageLayout
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: t('policy.policies'), href: '/policies' },
          { label: displayName },
        ]}
        eyebrow={eyebrow}
        eyebrowMeta={eyebrowMeta}
        title={displayName}
        subtitle={displaySummary}
        metaRow={metaRow}
        themeColor={levelColor}
        wayfinderData={wayfinderData}
        wayfinderType="policy"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        footer={footerContent}
        feedbackType="policy"
        feedbackId={id}
        feedbackName={displayName}
        jsonLd={jsonLd || undefined}
        sidebar={
          <>
            <FeaturedPromo variant="card" />
            {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={levelColor} />}
          </>
        }
      >
        <SpiralTracker action="view_policy" />

        {/* Quick Facts */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-2xl">{t('policy.quick_facts')}</h2>
          </div>
          <div className="border-b border-dotted border-rule mb-4" />
          <div className="space-y-2 text-sm">
            {policy.level && (
              <div className="flex justify-between">
                <span className="text-xs text-muted">{t('policy.level')}</span>
                <span className="font-semibold">{policy.level}</span>
              </div>
            )}
            {policy.status && (
              <div className="flex justify-between">
                <span className="text-xs text-muted">{t('policy.status')}</span>
                <span className="font-semibold" style={{ color: sc.textColor }}>{policy.status}</span>
              </div>
            )}
            {policy.introduced_date && (
              <div className="flex justify-between">
                <span className="text-xs text-muted">{t('policy.introduced')}</span>
                <span>{new Date(policy.introduced_date).toLocaleDateString()}</span>
              </div>
            )}
            {policy.data_source && (
              <div className="flex justify-between">
                <span className="text-xs text-muted">{t('policy.source')}</span>
                <span className="capitalize">{policy.data_source.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        </section>

        {/* What this does */}
        {displaySummary && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('policy.what_it_does')}</h2>
            </div>
            <div className="border-b border-dotted border-rule mb-4" />
            <p className="text-base leading-relaxed">{displaySummary}</p>
          </section>
        )}

        {/* Impact */}
        {policy.impact_statement && (
          <PolicyImpactSection impactStatement={policy.impact_statement} />
        )}

        {/* AI Break It Down */}
        <BreakItDown title={displayName} summary={displaySummary} type="policy" />

        <div className="my-10 h-px bg-rule" />

        {/* Focus areas */}
        {focusAreas.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('policy.topics')}</h2>
              <span className="font-mono text-micro uppercase tracking-wider text-muted">{focusAreas.length}</span>
            </div>
            <div className="border-b border-dotted border-rule mb-4" />
            <FocusAreaPills focusAreas={focusAreas} />
          </section>
        )}

        {/* Geographic impact */}
        {geography.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('policy.where_applies')}</h2>
            </div>
            <div className="border-b border-dotted border-rule mb-4" />
            <div className="space-y-3">
              {Object.entries(geoByType).map(function ([geoType, ids]) {
                return (
                  <div key={geoType}>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted">{formatGeoType(geoType)}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ids.map(function (gid) {
                        return (
                          <span key={gid} className="text-xs bg-faint border border-rule inline-block px-2 py-0.5">
                            {gid}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Timeline */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-2xl">{t('policy.timeline')}</h2>
          </div>
          <div className="border-b border-dotted border-rule mb-4" />
          <div>
            {policy.introduced_date && (
              <div className="flex items-start gap-4 py-4 border-b border-rule">
                <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: '#1b5e8a', marginTop: 5 }} />
                <div>
                  <p className="text-[0.9rem] font-semibold">{t('policy.introduced')}</p>
                  <p className="text-sm text-muted">{new Date(policy.introduced_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )}
            {policy.last_action && (
              <div className="flex items-start gap-4 py-4 border-b border-rule">
                <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: sc.dotColor, marginTop: 5 }} />
                <div>
                  <p className="text-[0.9rem] font-semibold">{t('policy.latest_action')}</p>
                  <p className="text-sm text-muted">{policy.last_action}</p>
                  {policy.last_action_date && (
                    <p className="font-mono text-micro uppercase tracking-wider text-muted mt-1">
                      {new Date(policy.last_action_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}
            {policy.source_url && (
              <div className="flex items-start gap-4 py-4">
                <span className="inline-block shrink-0 bg-rule" style={{ width: 8, height: 8, marginTop: 5 }} />
                <div>
                  <p className="text-[0.9rem] font-semibold">{t('policy.source')}</p>
                  <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline text-sm text-blue">
                    View on {policy.data_source === 'congress_gov' ? 'Congress.gov' : policy.data_source === 'legistar' ? 'Legistar' : 'source'} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="my-10 h-px bg-rule" />

        {/* Decision Makers */}
        {officials.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('policy.leaders_connected')}</h2>
              <span className="font-mono text-micro uppercase tracking-wider text-muted">{officials.length}</span>
            </div>
            <div className="border-b border-dotted border-rule mb-4" />
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

        {/* Related Services */}
        {displayRelatedServices.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Related Services</h2>
              <span className="font-mono text-micro uppercase tracking-wider text-muted">{displayRelatedServices.length}</span>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-4" />
            {displayRelatedServices.map(function (svc: any) {
              return (
                <Link key={svc.service_id} href={'/services/' + svc.service_id} className="block py-3 hover:opacity-80 border-b border-rule">
                  <h4 className="text-[0.9rem] font-semibold line-clamp-2">{svc.service_name}</h4>
                  {svc.description_5th_grade && (
                    <p className="line-clamp-2 mt-0.5 italic text-sm text-muted">{svc.description_5th_grade}</p>
                  )}
                </Link>
              )
            })}
          </section>
        )}

        {/* Related Policies */}
        {related && related.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">{t('policy.related_policies')}</h2>
              <span className="font-mono text-micro uppercase tracking-wider text-muted">{related.length}</span>
            </div>
            <div className="border-b border-dotted border-rule mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 0 }}>
              {related.map(function (p, i) {
                const rpt = relatedPolicyTranslations[p.policy_id]
                return (
                  <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-4 border-b border-rule" style={{ borderRight: i % 2 === 0 ? '1px solid #dde1e8' : 'none' }}>
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
    </>
  )
}
