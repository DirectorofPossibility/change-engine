import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { ActionBar } from '@/components/exchange/ActionBar'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { getFocusAreasByIds, getSDGMap, getSDOHMap, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'

function resolveThemeSlug(themeId: string | null) {
  if (!themeId) return null
  var entry = Object.entries(THEMES).find(function ([id]) { return id === themeId })
  return entry ? entry[1].slug : null
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  var { id } = await params
  var supabase = await createClient()
  var { data } = await supabase.from('content_published').select('title_6th_grade, summary_6th_grade').eq('id', id).eq('is_active', true).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.title_6th_grade,
    description: data.summary_6th_grade || 'Details on The Change Engine.',
  }
}

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('content_published')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!item) notFound()

  // Get language preference
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })

  // Fetch translations if non-English
  var translatedTitle: string | null = null
  var translatedSummary: string | null = null
  var isTranslated = false
  if (langConfig && langConfig.langId && item.inbox_id) {
    const { data: translations } = await supabase
      .from('translations')
      .select('field_name, translated_text, language_id')
      .eq('content_id', item.inbox_id)
      .eq('language_id', langConfig.langId)
    if (translations) {
      translations.forEach(function (t) {
        if ((t.field_name === 'title' || t.field_name === 'title_6th_grade') && t.translated_text) { translatedTitle = t.translated_text; isTranslated = true }
        if ((t.field_name === 'summary' || t.field_name === 'summary_6th_grade') && t.translated_text) { translatedSummary = t.translated_text; isTranslated = true }
      })
    }
  }

  // Resolve focus areas via junction table
  const { data: focusJunctions } = await supabase
    .from('content_focus_areas')
    .select('focus_id')
    .eq('content_id', item.id)
  const focusAreaIds = (focusJunctions ?? []).map(j => j.focus_id)
  const focusAreas = focusAreaIds.length > 0
    ? await getFocusAreasByIds(focusAreaIds)
    : []

  // Fetch SDG map, SDOH map, and related opportunities/policies in parallel
  const [sdgMap, sdohMap, opportunities, policies] = await Promise.all([
    item.sdg_ids && item.sdg_ids.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    item.sdoh_domain ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
  ])

  // Resolve life situations via junction table
  const { data: sitJunctions } = await supabase
    .from('content_life_situations')
    .select('situation_id')
    .eq('content_id', item.id)
  const situationIds = (sitJunctions ?? []).map(j => j.situation_id)
  var lifeSituationLinks: Array<{ name: string; slug: string }> = []
  if (situationIds.length > 0) {
    const { data: sits } = await supabase
      .from('life_situations')
      .select('situation_id, situation_name, situation_slug')
      .in('situation_id', situationIds)
    if (sits) {
      lifeSituationLinks = sits
        .filter(function (s) { return s.situation_slug != null })
        .map(function (s) { return { name: s.situation_name, slug: s.situation_slug! } })
    }
  }

  // Fetch cross-references from AI classification (v3 enrichment)
  var crossRefIds: string[] = []
  var keywords: string[] = []
  var extractedOrgs: Array<{ name: string; url: string; description?: string }> = []
  var downloadLinks: Array<{ url: string; anchor_text: string }> = []

  if (item.inbox_id) {
    const { data: queueItem } = await supabase
      .from('content_review_queue')
      .select('ai_classification')
      .eq('inbox_id', item.inbox_id)
      .single()

    if (queueItem?.ai_classification) {
      const c = queueItem.ai_classification as any
      keywords = c._keywords || []
      const rawOrgs = (c._external_orgs || c.organizations || []).filter((o: any) => o && o.name)
      extractedOrgs = rawOrgs.map((o: any) => ({ name: o.name, url: o.url || '', description: o.description }))
      downloadLinks = c._download_links || []

      // Resolve internal cross-references to content_published IDs
      const internalRefs = c._internal_refs || []
      if (internalRefs.length > 0) {
        const refInboxIds = internalRefs.map((r: any) => r.inbox_id).filter(Boolean)
        if (refInboxIds.length > 0) {
          const { data: refContent } = await supabase
            .from('content_published')
            .select('id')
            .in('inbox_id', refInboxIds)
            .eq('is_active', true)
          crossRefIds = (refContent || []).map((r: any) => r.id)
        }
      }
    }
  }

  // Resolve extracted org names to internal org profiles via org_domains
  let orgProfileMap: Record<string, string> = {}
  if (extractedOrgs.length > 0) {
    const orgDomains = extractedOrgs
      .map(function (o) { try { return new URL(o.url).hostname } catch { return '' } })
      .filter(Boolean)
    if (orgDomains.length > 0) {
      const { data: domainMatches } = await supabase
        .from('org_domains')
        .select('domain, org_id')
        .in('domain', orgDomains)
      if (domainMatches) {
        for (const d of domainMatches) {
          orgProfileMap[d.domain] = d.org_id
        }
      }
    }
  }

  // Fetch org info if linked
  var orgInfo: { org_id: string; org_name: string; website: string | null; description_5th_grade: string | null } | null = null
  if (item.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('org_id, org_name, website, description_5th_grade')
      .eq('org_id', item.org_id)
      .single()
    orgInfo = org
  }

  // Resolve audience segment IDs to human-readable names
  const segmentIds = item.audience_segments || []
  let segmentNames: Record<string, string> = {}
  if (segmentIds.length > 0) {
    const { data: segments } = await supabase
      .from('audience_segments')
      .select('segment_id, segment_name')
      .in('segment_id', segmentIds)
    if (segments) {
      for (const s of segments) {
        segmentNames[s.segment_id] = s.segment_name
      }
    }
  }

  // Related content: use focus area overlap for better semantic matching
  var relatedQuery = supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at, focus_area_ids')
    .eq('is_active', true)
    .neq('id', item.id)
    .limit(20)

  const { data: relatedCandidates } = await relatedQuery

  // Score related items by focus area overlap + cross-reference bonus
  var related = (relatedCandidates || [])
    .map(function (r: any) {
      var score = 0
      // Cross-reference bonus (strongest signal)
      if (crossRefIds.includes(r.id)) score += 10
      // Focus area overlap
      if (item.focus_area_ids && r.focus_area_ids) {
        var overlap = item.focus_area_ids.filter(function (fa: string) { return r.focus_area_ids.includes(fa) })
        score += overlap.length * 3
      }
      // Same pathway bonus
      if (r.pathway_primary === item.pathway_primary) score += 1
      return { ...r, _score: score }
    })
    .filter(function (r: any) { return r._score > 0 })
    .sort(function (a: any, b: any) { return b._score - a._score })
    .slice(0, 6)

  var title = translatedTitle || item.title_6th_grade
  var summary = translatedSummary || item.summary_6th_grade
  var themeSlug = resolveThemeSlug(item.pathway_primary)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Hero image */}
          {item.image_url && (
            <div className="w-full mb-6 rounded-xl overflow-hidden">
              <img
                src={item.image_url}
                alt=""
                className="w-full h-64 sm:h-80 object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <ThemePill themeId={item.pathway_primary} size="sm" />
            <CenterBadge center={item.center} />
            {isTranslated && (
              <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">Machine translated</span>
            )}
          </div>

          <h1 className="text-3xl font-bold text-brand-text mb-3">{title}</h1>

          <div className="flex items-center gap-3 text-sm text-brand-muted mb-6">
            {item.source_domain && <span>{item.source_domain}</span>}
            {item.published_at && <span>{new Date(item.published_at).toLocaleDateString()}</span>}
            {item.confidence != null && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-bg">{Math.round(item.confidence * 100)}% confidence</span>
            )}
          </div>

          {/* Summary */}
          <div className="prose max-w-none mb-8">
            <p className="text-brand-text leading-relaxed">{summary}</p>
          </div>

          {/* Classification reasoning */}
          {item.classification_reasoning && (
            <details className="mb-8 bg-brand-bg rounded-xl p-4">
              <summary className="cursor-pointer text-sm font-medium text-brand-muted">Why was this classified here?</summary>
              <p className="text-sm text-brand-muted mt-2">{item.classification_reasoning}</p>
            </details>
          )}

          {/* Action bar */}
          <div className="mb-8">
            <ActionBar
              actionDonate={item.action_donate}
              actionVolunteer={item.action_volunteer}
              actionSignup={item.action_signup}
              actionRegister={item.action_register}
              actionApply={item.action_apply}
              actionCall={item.action_call}
              actionAttend={item.action_attend}
            />
          </div>

          {/* Source link */}
          <div className="mb-8">
            <Link
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-brand-border rounded-lg text-sm text-brand-accent hover:bg-brand-bg transition-colors"
            >
              View original source &rarr;
            </Link>
          </div>
        </div>

        {/* Sidebar — Wayfinder (collapsible sections) */}
        <div className="space-y-3">
          {/* Pathway — open by default */}
          {themeSlug && (
            <details open className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Pathway
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <Link href={'/pathways/' + themeSlug}>
                  <ThemePill themeId={item.pathway_primary} size="sm" />
                </Link>
              </div>
            </details>
          )}

          {/* Focus Areas — open by default */}
          {focusAreas.length > 0 && (
            <details open className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Focus Areas
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <FocusAreaPills focusAreas={focusAreas} />
              </div>
            </details>
          )}

          {/* Organization — open by default, links to internal profile */}
          {orgInfo && (
            <details open className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Organization
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <Link href={'/organizations/' + orgInfo.org_id} className="text-sm font-medium text-brand-accent hover:underline">
                  {orgInfo.org_name}
                </Link>
                {orgInfo.description_5th_grade && (
                  <p className="text-xs text-brand-muted mt-1">{orgInfo.description_5th_grade}</p>
                )}
              </div>
            </details>
          )}

          {/* Global Goals — collapsed by default */}
          {item.sdg_ids && item.sdg_ids.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Global Goals
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {item.sdg_ids.map(function (sdg) {
                    var info = sdgMap[sdg]
                    if (info) {
                      return <SDGBadge key={sdg} sdgNumber={info.sdg_number} sdgName={info.sdg_name} sdgColor={info.sdg_color} linkToExplore />
                    }
                    return <span key={sdg} className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700">Goal {sdg.replace('SDG_', '')}</span>
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Health & Well-being — collapsed by default */}
          {item.sdoh_domain && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Health &amp; Well-being
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                {sdohMap[item.sdoh_domain] ? (
                  <SDOHBadge
                    sdohCode={item.sdoh_domain}
                    sdohName={sdohMap[item.sdoh_domain].sdoh_name}
                    sdohDescription={sdohMap[item.sdoh_domain].sdoh_description}
                    linkToExplore
                  />
                ) : (
                  <span className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700">{item.sdoh_domain}</span>
                )}
              </div>
            </details>
          )}

          {/* Who This Is For — collapsed by default, shows human-readable names */}
          {segmentIds.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Who This Is For
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {segmentIds.map(function (seg) {
                    const name = segmentNames[seg] || seg.replace('SEG_', '').replace(/_/g, ' ')
                    return <span key={seg} className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700">{name}</span>
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Topics — collapsed by default */}
          {keywords.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Topics
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {keywords.slice(0, 10).map(function (kw) {
                    return <span key={kw} className="text-xs px-2 py-1 rounded-lg bg-brand-bg text-brand-muted">{kw}</span>
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Organizations Mentioned — links to internal profiles when available */}
          {extractedOrgs.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Organizations Mentioned
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {extractedOrgs.slice(0, 6).map(function (org) {
                    let orgDomain = ''
                    try { orgDomain = new URL(org.url).hostname } catch {}
                    const internalOrgId = orgDomain ? orgProfileMap[orgDomain] : undefined
                    return (
                      <div key={org.name}>
                        {internalOrgId ? (
                          <Link href={'/organizations/' + internalOrgId} className="text-xs font-medium text-brand-accent hover:underline">
                            {org.name}
                          </Link>
                        ) : (
                          <Link href={org.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-accent hover:underline">
                            {org.name}
                          </Link>
                        )}
                        {org.description && <p className="text-xs text-brand-muted">{org.description}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Downloads — collapsed by default */}
          {downloadLinks.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Downloads
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="space-y-1">
                  {downloadLinks.map(function (dl: any) {
                    return (
                      <Link key={dl.url} href={dl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
                        <span>&#128196;</span> {dl.anchor_text || 'Download'}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Life Situations — collapsed by default */}
          {lifeSituationLinks.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Life Situations
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {lifeSituationLinks.map(function (s) {
                    return (
                      <Link key={s.slug} href={'/help/' + s.slug} className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-accent hover:underline">
                        {s.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Opportunities — collapsed by default */}
          {opportunities.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Opportunities
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="space-y-3">
                  {opportunities.slice(0, 5).map(function (o) {
                    return (
                      <OpportunityCard
                        key={o.opportunity_id}
                        name={o.opportunity_name}
                        description={o.description_5th_grade}
                        startDate={o.start_date}
                        endDate={o.end_date}
                        address={o.address}
                        city={o.city}
                        isVirtual={o.is_virtual}
                        registrationUrl={o.registration_url}
                        spotsAvailable={o.spots_available}
                      />
                    )
                  })}
                </div>
              </div>
            </details>
          )}

          {/* Policies — collapsed by default */}
          {policies.length > 0 && (
            <details className="bg-white rounded-xl border border-brand-border group">
              <summary className="flex items-center justify-between cursor-pointer p-4 text-sm font-semibold text-brand-muted select-none">
                Related Policies
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4">
                <div className="space-y-3">
                  {policies.slice(0, 5).map(function (p) {
                    return (
                      <PolicyCard
                        key={p.policy_id}
                        name={p.policy_name}
                        summary={p.summary_5th_grade}
                        billNumber={p.bill_number}
                        status={p.status}
                        level={p.level}
                        sourceUrl={p.source_url}
                      />
                    )
                  })}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Related content — scored by focus area overlap + explicit cross-references */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <RelatedContent items={related} />
        </div>
      )

      }
    </div>
  )
}
