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
import { ExternalLink, ArrowRight } from 'lucide-react'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { policyJsonLd } from '@/lib/jsonld'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'
import { FlowerOfLife } from '@/components/geo/sacred'

/* ── Design Tokens ── */
const RULE = '#e5e7eb'
const DIM = '#6b7280'
const INK = '#1a1a1a'
const SIDEBAR_BG = '#f9fafb'

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

  return (
    <>
      <SpiralTracker action="view_policy" />

      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${levelColor} 0%, ${levelColor}dd 40%, ${levelColor}55 100%)` }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 6L6 0M-1 1L1-1M5 7L7 5\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")', backgroundSize: '6px 6px' }} />
        <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent" />

        <div className="max-w-[1080px] mx-auto px-6 py-6 sm:py-10 relative z-10">
          {/* Breadcrumb + type in one line */}
          <nav className="text-sm uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>&rsaquo;</span>
            <Link href="/policies" className="hover:text-white transition-colors">{t('policy.policies')}</Link>
            {policy.level && (
              <>
                <span>&rsaquo;</span>
                <span className="text-white/40">{policy.level}</span>
              </>
            )}
            {policy.status && (
              <>
                <span>&rsaquo;</span>
                <span className="text-white/40">{policy.status}</span>
              </>
            )}
            {policy.policy_type && (
              <>
                <span>&rsaquo;</span>
                <span className="text-white/40">{policy.policy_type}</span>
              </>
            )}
          </nav>

          {/* Title */}
          <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
            style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
          >
            {displayName}
          </h1>

          {/* Summary */}
          {displaySummary && (
            <p className="text-white/90 leading-relaxed mb-5 max-w-[560px]" style={{ fontSize: '1.05rem' }}>
              {displaySummary.length > 200 ? displaySummary.slice(0, 200) + '...' : displaySummary}
            </p>
          )}

          {/* Bookmark + meta inline */}
          <div className="flex items-center gap-4">
            <BookmarkButton
              contentType="policy"
              contentId={id}
              title={displayName}
            />
            <span className="text-sm text-white/60">
              {[policy.bill_number, policy.introduced_date ? `Introduced ${new Date(policy.introduced_date).toLocaleDateString()}` : null, policy.data_source?.replace(/_/g, ' ')].filter(Boolean).join(' \u00b7 ')}
            </span>
          </div>

          {policy.source_url && (
            <div className="text-sm uppercase tracking-[0.1em] text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
              <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white transition-colors">
                <ExternalLink size={10} /> Source
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Main Content ── */}
            <div className="flex-1 min-w-0">

              {/* Quick Facts */}
              <section className="mb-10">
                <h2 className="font-display text-2xl font-bold mb-2" style={{ color: INK }}>{t('policy.quick_facts')}</h2>
                <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                <div className="space-y-2 text-sm">
                  {policy.level && (
                    <div className="flex justify-between py-1" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="text-sm" style={{ color: DIM }}>{t('policy.level')}</span>
                      <span className="font-semibold" style={{ color: INK }}>{policy.level}</span>
                    </div>
                  )}
                  {policy.status && (
                    <div className="flex justify-between py-1" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="text-sm" style={{ color: DIM }}>{t('policy.status')}</span>
                      <span className="font-semibold" style={{ color: sc.textColor }}>{policy.status}</span>
                    </div>
                  )}
                  {policy.introduced_date && (
                    <div className="flex justify-between py-1" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="text-sm" style={{ color: DIM }}>{t('policy.introduced')}</span>
                      <span style={{ color: INK }}>{new Date(policy.introduced_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {policy.data_source && (
                    <div className="flex justify-between py-1" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="text-sm" style={{ color: DIM }}>{t('policy.source')}</span>
                      <span className="capitalize" style={{ color: INK }}>{policy.data_source.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* What this does */}
              {displaySummary && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-2" style={{ color: INK }}>{t('policy.what_it_does')}</h2>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                  <p className="text-base leading-relaxed" style={{ color: DIM }}>{displaySummary}</p>
                </section>
              )}

              {/* Impact */}
              {policy.impact_statement && (
                <PolicyImpactSection impactStatement={policy.impact_statement} />
              )}

              {/* AI Break It Down */}
              <BreakItDown title={displayName} summary={displaySummary} type="policy" />

              <div className="my-8 h-[3px]" style={{ background: RULE }} />

              {/* Focus areas */}
              {focusAreas.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>{t('policy.topics')}</h2>
                    <span className="text-sm font-medium" style={{ color: DIM }}>{focusAreas.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                  <FocusAreaPills focusAreas={focusAreas} />
                </section>
              )}

              {/* Geographic impact */}
              {geography.length > 0 && (
                <section className="mb-10">
                  <h2 className="font-display text-2xl font-bold mb-2" style={{ color: INK }}>{t('policy.where_applies')}</h2>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                  <div className="space-y-3">
                    {Object.entries(geoByType).map(function ([geoType, ids]) {
                      return (
                        <div key={geoType}>
                          <span className="text-sm font-medium" style={{ color: DIM }}>{formatGeoType(geoType)}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {ids.map(function (gid) {
                              return (
                                <span key={gid} className="text-sm inline-block px-2 py-0.5" style={{ background: SIDEBAR_BG, border: `1px solid ${RULE}` }}>
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
                <h2 className="font-display text-2xl font-bold mb-2" style={{ color: INK }}>{t('policy.timeline')}</h2>
                <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                <div>
                  {policy.introduced_date && (
                    <div className="flex items-start gap-4 py-4" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: '#1b5e8a', marginTop: 5 }} />
                      <div>
                        <p className="text-base font-semibold" style={{ color: INK }}>{t('policy.introduced')}</p>
                        <p className="text-sm" style={{ color: DIM }}>{new Date(policy.introduced_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  {policy.last_action && (
                    <div className="flex items-start gap-4 py-4" style={{ borderBottom: `3px solid ${RULE}` }}>
                      <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: sc.dotColor, marginTop: 5 }} />
                      <div>
                        <p className="text-base font-semibold" style={{ color: INK }}>{t('policy.latest_action')}</p>
                        <p className="text-sm" style={{ color: DIM }}>{policy.last_action}</p>
                        {policy.last_action_date && (
                          <p className="text-sm font-medium mt-1" style={{ color: DIM }}>
                            {new Date(policy.last_action_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {policy.source_url && (
                    <div className="flex items-start gap-4 py-4">
                      <span className="inline-block shrink-0" style={{ width: 8, height: 8, background: RULE, marginTop: 5 }} />
                      <div>
                        <p className="text-base font-semibold" style={{ color: INK }}>{t('policy.source')}</p>
                        <a href={policy.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline text-sm" style={{ color: levelColor }}>
                          View on {policy.data_source === 'congress_gov' ? 'Congress.gov' : policy.data_source === 'legistar' ? 'Legistar' : 'source'} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <div className="my-8 h-[3px]" style={{ background: RULE }} />

              {/* Decision Makers */}
              {officials.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>{t('policy.leaders_connected')}</h2>
                    <span className="text-sm font-medium" style={{ color: DIM }}>{officials.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
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
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>Related Services</h2>
                    <span className="text-sm font-medium" style={{ color: DIM }}>{displayRelatedServices.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayRelatedServices.map(function (svc: any) {
                      return (
                        <Link key={svc.service_id} href={'/services/' + svc.service_id}
                          className="block p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                          style={{ borderColor: `${levelColor}25`, background: `${levelColor}05` }}>
                          <span className="block font-bold text-base mb-1" style={{ color: INK }}>{svc.service_name}</span>
                          {svc.description_5th_grade && <span className="block text-sm line-clamp-2" style={{ color: DIM }}>{svc.description_5th_grade}</span>}
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Related Policies */}
              {related && related.length > 0 && (
                <section className="mb-10">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-bold" style={{ color: INK }}>{t('policy.related_policies')}</h2>
                    <span className="text-sm font-medium" style={{ color: DIM }}>{related.length}</span>
                  </div>
                  <div className="h-[3px] mb-3" style={{ background: `${levelColor}30` }} />
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 0 }}>
                    {related.map(function (p, i) {
                      const rpt = relatedPolicyTranslations[p.policy_id]
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block p-4" style={{ borderBottom: `1px solid ${RULE}`, borderRight: i % 2 === 0 ? `1px solid ${RULE}` : 'none' }}>
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

              {/* Sidebar extras — below main content on mobile */}
              <div className="lg:hidden space-y-6 mt-8 pt-8" style={{ borderTop: `3px solid ${RULE}` }}>
                <FeaturedPromo variant="card" />
                {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={levelColor} />}
              </div>
            </div>

            {/* ── RIGHT: WAYFINDER SIDEBAR ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <DetailWayfinder
                  data={wayfinderData}
                  currentType="policy"
                  currentId={id}
                  userRole={userProfile?.role ?? undefined}
                />

                <div className="hidden lg:block space-y-4">
                  <FeaturedPromo variant="card" />
                  {quote && <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={levelColor} />}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `3px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/policies"
            className="text-sm font-semibold inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to Policies
          </Link>
        </div>
      </section>

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
