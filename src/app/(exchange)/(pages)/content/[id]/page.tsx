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
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { getFocusAreasByIds, getSDGMap, getSDOHMap, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { FileText, Users, ExternalLink } from 'lucide-react'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { TranslatePageButton } from '@/components/exchange/TranslatePageButton'

/** Strip scraped page chrome: inline scripts, tracking pixels, nav boilerplate. */
function sanitizeBody(raw: string): string {
  return raw
    // Remove inline JS blocks (Facebook pixel, gtag, etc.)
    .replace(/!function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\([^)]*\)\s*;?/g, '')
    .replace(/fbq\s*\([^)]*\)\s*;?/g, '')
    .replace(/gtag\s*\([^)]*\)\s*;?/g, '')
    .replace(/window\.\w+\s*=\s*[\s\S]*?;/g, '')
    // Remove common nav chrome
    .replace(/Skip to (content|main|navigation)\s*/gi, '')
    .replace(/Go to Top\s*/gi, '')
    .replace(/Back to top\s*/gi, '')
    // Remove metadata timestamps (e.g. "Author Name 2026-01-27T11:10:19-06:00")
    .replace(/\b\w[\w\s]+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}\s*/g, '')
    // Remove leftover script/noscript tags
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Collapse excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function resolveThemeSlug(themeId: string | null) {
  if (!themeId) return null
  const entry = Object.entries(THEMES).find(function ([id]) { return id === themeId })
  return entry ? entry[1].slug : null
}

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('content_published').select('title_6th_grade, summary_6th_grade').eq('id', id).eq('is_active', true).single()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.title_6th_grade,
    description: data.summary_6th_grade || 'Details on the Community Exchange.',
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
  let translatedTitle: string | null = null
  let translatedSummary: string | null = null
  let translatedBody: string | null = null
  let isTranslated = false
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
        if ((t.field_name === 'body') && t.translated_text) { translatedBody = t.translated_text; isTranslated = true }
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
  const pathwayThemeIds = item.pathway_primary ? [item.pathway_primary] : []
  const [sdgMap, sdohMap, opportunities, policies, libraryNuggets] = await Promise.all([
    item.sdg_ids && item.sdg_ids.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    item.sdoh_domain ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    getLibraryNuggets(pathwayThemeIds, focusAreaIds, 3),
  ])

  // Resolve life situations via junction table
  const { data: sitJunctions } = await supabase
    .from('content_life_situations')
    .select('situation_id')
    .eq('content_id', item.id)
  const situationIds = (sitJunctions ?? []).map(j => j.situation_id)
  let lifeSituationLinks: Array<{ name: string; slug: string }> = []
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
  let crossRefIds: string[] = []
  let keywords: string[] = []
  let extractedOrgs: Array<{ name: string; url: string; description?: string }> = []
  let downloadLinks: Array<{ url: string; anchor_text: string }> = []
  let heroQuote: string | null = null
  let programs: Array<{ name: string; description: string }> = []

  if (item.inbox_id) {
    const { data: queueItem } = await supabase
      .from('content_review_queue')
      .select('ai_classification')
      .eq('inbox_id', item.inbox_id)
      .single()

    if (queueItem?.ai_classification) {
      const c = queueItem.ai_classification as any
      keywords = c._keywords || []
      heroQuote = c.hero_quote || null
      programs = Array.isArray(c.programs) ? c.programs.filter((p: any) => p && p.name) : []
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
  let orgInfo: { org_id: string; org_name: string; website: string | null; description_5th_grade: string | null } | null = null
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

  // Resolve related officials via shared focus areas
  let relatedOfficials: Array<{ official_id: string; official_name: string; title: string | null }> = []
  if (focusAreaIds.length > 0) {
    const { data: officialJunctions } = await supabase
      .from('official_focus_areas')
      .select('official_id')
      .in('focus_id', focusAreaIds)
    const officialIds = Array.from(new Set((officialJunctions ?? []).map(j => j.official_id)))
    if (officialIds.length > 0) {
      const { data: officials } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title')
        .in('official_id', officialIds.slice(0, 3))
      relatedOfficials = officials ?? []
    }
  }

  // Related content: use focus area overlap for better semantic matching
  const relatedQuery = supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at, focus_area_ids, image_url')
    .eq('is_active', true)
    .neq('id', item.id)
    .limit(20)

  const { data: relatedCandidates } = await relatedQuery

  // Score related items by focus area overlap + cross-reference bonus
  const related = (relatedCandidates || [])
    .map(function (r: any) {
      let score = 0
      // Cross-reference bonus (strongest signal)
      if (crossRefIds.includes(r.id)) score += 10
      // Focus area overlap
      if (item.focus_area_ids && r.focus_area_ids) {
        const overlap = item.focus_area_ids.filter(function (fa: string) { return r.focus_area_ids.includes(fa) })
        score += overlap.length * 3
      }
      // Same pathway bonus
      if (r.pathway_primary === item.pathway_primary) score += 1
      return { ...r, _score: score }
    })
    .filter(function (r: any) { return r._score > 0 })
    .sort(function (a: any, b: any) { return b._score - a._score })
    .slice(0, 6)

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('content', id, userProfile?.role)

  const title = translatedTitle || item.title_6th_grade
  const summary = translatedSummary || item.summary_6th_grade
  const themeSlug = resolveThemeSlug(item.pathway_primary)
  const themeEntry = item.pathway_primary ? (THEMES as Record<string, { name: string; color: string; slug: string }>)[item.pathway_primary] : null
  const themeColor = themeEntry?.color || '#E8723A'

  // Parse body into sections for numbered rendering
  const bodyText = sanitizeBody(translatedBody || item.body || '')
  const bodyBlocks = bodyText.split(/\n\n+/).map(function (b) { return b.trim() }).filter(Boolean)
  let sectionNumber = 0

  return (
    <div>
      {/* Hero Section */}
      <PageHero
        variant="content"
        title={title}
        subtitle={summary}
        gradientColor={themeColor}
        imageUrl={item.image_url || undefined}
        sourceDomain={item.source_domain || undefined}
        publishedDate={item.published_at ? new Date(item.published_at).toLocaleDateString() : undefined}
        sourceUrl={item.source_url || undefined}
      >
        <ThemePill themeId={item.pathway_primary} size="sm" />
        <CenterBadge center={item.center} />
        {isTranslated && (
          <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">Machine translated</span>
        )}
        <TranslatePageButton isTranslated={isTranslated} contentType="content_published" contentId={item.inbox_id || id} />
      </PageHero>

      {/* Quote Banner */}
      {heroQuote && (
        <div className="bg-brand-bg border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="flex gap-4">
              <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
              <blockquote className="text-lg sm:text-xl font-serif italic text-brand-text leading-relaxed">
                &ldquo;{heroQuote}&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      )}

      {/* Main content + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Embedded Video — hero position for video-centric content */}
            {(item as any).video_url && (() => {
              const match = (item as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
              const videoId = match ? match[1] : null
              if (!videoId) return null
              return (
                <div className="mb-8">
                  <div className="relative w-full overflow-hidden rounded-xl border border-brand-border shadow-sm" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )
            })()}

            {/* Body Sections — numbered headings */}
            {bodyBlocks.length > 0 && (
              <div className="space-y-6">
                {bodyBlocks.map(function (block, i) {
                  if (!block) return null
                  // Render ## headings with numbered badges
                  if (block.startsWith('## ')) {
                    sectionNumber++
                    return (
                      <div key={i} className="flex items-center gap-3 mt-8 first:mt-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          {sectionNumber}
                        </div>
                        <h2 className="text-xl font-serif font-bold text-brand-text">{block.replace(/^## /, '')}</h2>
                      </div>
                    )
                  }
                  // Render bullet lists
                  if (block.match(/^[-•*] /m)) {
                    const items = block.split(/\n/).filter(function (l) { return l.trim() })
                    return (
                      <ul key={i} className="list-disc list-inside space-y-1.5 text-brand-text leading-relaxed pl-11">
                        {items.map(function (li, j) {
                          return <li key={j}>{li.replace(/^[-•*]\s*/, '').trim()}</li>
                        })}
                      </ul>
                    )
                  }
                  // Bold labels
                  if (block.match(/\*\*[^*]+\*\*/)) {
                    const parts = block.split(/(\*\*[^*]+\*\*)/)
                    return (
                      <p key={i} className="text-brand-text leading-relaxed pl-11">
                        {parts.map(function (part, j) {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                          }
                          return <span key={j}>{part}</span>
                        })}
                      </p>
                    )
                  }
                  return <p key={i} className="text-brand-text leading-relaxed pl-11">{block}</p>
                })}
              </div>
            )}

            {/* AI Break It Down */}
            <BreakItDown title={title} summary={summary} type="content" accentColor={themeColor} />

            {/* Visual separator */}
            {bodyBlocks.length > 0 && (programs.length > 0 || item.classification_reasoning) && (
              <div className="my-8 border-t border-brand-border" />
            )}

            {/* Programs Grid */}
            {programs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-serif font-bold text-brand-text mb-4">Programs &amp; Initiatives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {programs.map(function (prog, i) {
                    return (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-brand-border p-4 flex gap-3"
                      >
                        <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                        <div>
                          <p className="font-semibold text-sm text-brand-text">{prog.name}</p>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed">{prog.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: themeColor }}
              >
                <ExternalLink size={16} />
                View original source
              </Link>
            </div>
          </div>

          {/* Sidebar — consolidated */}
          <div className="space-y-4">
            {/* Wayfinder — contextual discovery */}
            <DetailWayfinder data={wayfinderData} currentType="content" currentId={id} userRole={userProfile?.role} />

            {/* At a Glance — below Wayfinder */}
            <div className="bg-white rounded-xl border border-brand-border p-4">
              <h3 className="text-sm font-serif font-bold text-brand-text mb-3">At a Glance</h3>
              <div className="space-y-2.5">
                {(item.source_org_name || item.source_domain) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-muted">Source</span>
                    <span className="font-medium text-brand-text">{item.source_org_name || item.source_domain}</span>
                  </div>
                )}
                {item.published_at && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-brand-muted">Published</span>
                    <span className="font-medium text-brand-text">{new Date(item.published_at).toLocaleDateString()}</span>
                  </div>
                )}
                {item.confidence != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-brand-muted">Confidence</span>
                      <span className="font-medium text-brand-text">{Math.round(item.confidence * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-bg rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: Math.round(item.confidence * 100) + '%', backgroundColor: themeColor }} />
                    </div>
                  </div>
                )}
                {/* Pathway */}
                {themeSlug && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-brand-muted">Pathway</span>
                    <Link href={'/pathways/' + themeSlug}>
                      <ThemePill themeId={item.pathway_primary} size="sm" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Organization */}
            {orgInfo && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-bold text-brand-text mb-3">Organization</h3>
                <div className="flex gap-3">
                  <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                  <div className="min-w-0">
                    <Link href={'/organizations/' + orgInfo.org_id} className="text-sm font-semibold text-brand-accent hover:underline block">
                      {orgInfo.org_name}
                    </Link>
                    {orgInfo.description_5th_grade && (
                      <p className="text-xs text-brand-muted mt-1 leading-relaxed line-clamp-2">{orgInfo.description_5th_grade}</p>
                    )}
                    {orgInfo.website && (
                      <Link href={orgInfo.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-accent hover:underline mt-2">
                        <ExternalLink size={12} /> Website
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Classification — groups focus areas, audiences, topics, SDGs, SDOH */}
            {(focusAreas.length > 0 || segmentIds.length > 0 || keywords.length > 0 || (item.sdg_ids && item.sdg_ids.length > 0) || item.sdoh_domain) && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-bold text-brand-text mb-3">Classification</h3>
                <div className="space-y-3">
                  {focusAreas.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Focus Areas</div>
                      <FocusAreaPills focusAreas={focusAreas} />
                    </div>
                  )}
                  {segmentIds.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Who This Is For</div>
                      <div className="flex flex-wrap gap-1">
                        {segmentIds.map(function (seg) {
                          const name = segmentNames[seg] || seg.replace('SEG_', '').replace(/_/g, ' ')
                          return <Link key={seg} href={'/search?audience=' + encodeURIComponent(seg)} className="text-xs px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">{name}</Link>
                        })}
                      </div>
                    </div>
                  )}
                  {keywords.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Topics</div>
                      <div className="flex flex-wrap gap-1">
                        {keywords.slice(0, 8).map(function (kw) {
                          return <Link key={kw} href={'/search?q=' + encodeURIComponent(kw)} className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-accent hover:underline">{kw}</Link>
                        })}
                      </div>
                    </div>
                  )}
                  {item.sdg_ids && item.sdg_ids.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Global Goals</div>
                      <div className="flex flex-wrap gap-1">
                        {item.sdg_ids.map(function (sdg) {
                          const info = sdgMap[sdg]
                          if (info) return <SDGBadge key={sdg} sdgNumber={info.sdg_number} sdgName={info.sdg_name} sdgColor={info.sdg_color} linkToExplore />
                          return <span key={sdg} className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700">Goal {sdg.replace('SDG_', '')}</span>
                        })}
                      </div>
                    </div>
                  )}
                  {item.sdoh_domain && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Health &amp; Well-being</div>
                      {sdohMap[item.sdoh_domain] ? (
                        <SDOHBadge sdohCode={item.sdoh_domain} sdohName={sdohMap[item.sdoh_domain].sdoh_name} sdohDescription={sdohMap[item.sdoh_domain].sdoh_description} linkToExplore />
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-green-100 text-green-700">{item.sdoh_domain}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connections — orgs mentioned, officials, life situations */}
            {(extractedOrgs.length > 0 || relatedOfficials.length > 0 || lifeSituationLinks.length > 0) && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-bold text-brand-text mb-3">Connections</h3>
                <div className="space-y-3">
                  {extractedOrgs.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Organizations Mentioned</div>
                      <div className="space-y-1.5">
                        {extractedOrgs.slice(0, 4).map(function (org) {
                          let orgDomain = ''
                          try { orgDomain = new URL(org.url).hostname } catch {}
                          const internalOrgId = orgDomain ? orgProfileMap[orgDomain] : undefined
                          return (
                            <div key={org.name}>
                              {internalOrgId ? (
                                <Link href={'/organizations/' + internalOrgId} className="text-xs font-medium text-brand-accent hover:underline">{org.name}</Link>
                              ) : (
                                <Link href={org.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-accent hover:underline">{org.name}</Link>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {relatedOfficials.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Related Officials</div>
                      <div className="space-y-2">
                        {relatedOfficials.map(function (o) {
                          return (
                            <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-2 group/official">
                              <div className="w-7 h-7 rounded-full bg-brand-bg flex items-center justify-center flex-shrink-0">
                                <Users size={12} className="text-brand-muted" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-brand-accent group-hover/official:underline block truncate">{o.official_name}</span>
                                {o.title && <span className="text-[10px] text-brand-muted block truncate">{o.title}</span>}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {lifeSituationLinks.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Life Situations</div>
                      <div className="flex flex-wrap gap-1">
                        {lifeSituationLinks.map(function (s) {
                          return <Link key={s.slug} href={'/help/' + s.slug} className="text-xs px-2 py-0.5 rounded-lg bg-brand-bg text-brand-accent hover:underline">{s.name}</Link>
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Take Action — opportunities, policies, downloads */}
            {(opportunities.length > 0 || policies.length > 0 || downloadLinks.length > 0) && (
              <div className="bg-white rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-serif font-bold text-brand-text mb-3">Take Action</h3>
                <div className="space-y-3">
                  {opportunities.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Opportunities</div>
                      <div className="space-y-2">
                        {opportunities.slice(0, 3).map(function (o) {
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
                  )}
                  {policies.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Related Policies</div>
                      <div className="space-y-2">
                        {policies.slice(0, 3).map(function (p) {
                          return (
                            <PolicyCard
                              key={p.policy_id}
                              name={p.title_6th_grade || p.policy_name}
                              summary={p.summary_6th_grade || p.summary_5th_grade}
                              billNumber={p.bill_number}
                              status={p.status}
                              level={p.level}
                              sourceUrl={p.source_url}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {downloadLinks.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">Downloads</div>
                      <div className="space-y-1">
                        {downloadLinks.map(function (dl: any) {
                          return (
                            <Link key={dl.url} href={dl.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-brand-accent hover:underline">
                              <FileText size={14} /> {dl.anchor_text || 'Download'}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggest an Edit */}
            <div className="bg-white rounded-xl border border-brand-border p-4 text-center">
              <Link
                href={'/dashboard/submit?ref=' + encodeURIComponent(id)}
                className="text-sm text-brand-accent hover:underline font-medium"
              >
                Suggest an edit to this content
              </Link>
              <p className="text-xs text-brand-muted mt-1">Help us keep information accurate and up to date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Library nuggets — go deeper */}
      {libraryNuggets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LibraryNugget
            nuggets={libraryNuggets}
            variant="section"
            color={themeColor}
          />
        </div>
      )}

      {/* Related content */}
      {related && related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <RelatedContent items={related} />
        </div>
      )}

      {/* Wayfinder is now in the sidebar */}
    </div>
  )
}
