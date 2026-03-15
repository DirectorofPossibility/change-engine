import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getUIStrings } from '@/lib/i18n'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { getUserProfile } from '@/lib/auth/roles'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getRelatedOfficials } from '@/lib/data/officials'
import { getSDGMap, getSDOHMap } from '@/lib/data/taxonomy'
import { getLibraryNuggets } from '@/lib/data/library'
import { Globe, ArrowRight } from 'lucide-react'
import { ContentTabs } from '@/components/exchange/ContentTabs'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ContentImage } from '@/components/exchange/ContentImage'
import { articleJsonLd } from '@/lib/jsonld'
import { getLinkableEntities, linkEntities, smartParagraphs } from '@/lib/data/entity-linker'
import { FlowerOfLife } from '@/components/geo/sacred'
import { CollapsibleSidebarSection } from '@/components/exchange/CollapsibleSidebarSection'
import { BookmarkButton } from '@/components/exchange/BookmarkButton'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'


/** Strip scraped page chrome */
function sanitizeBody(raw: string): string {
  return raw
    .replace(/!function\s*\([^)]*\)\s*\{[\s\S]*?\}\s*\([^)]*\)\s*;?/g, '')
    .replace(/fbq\s*\([^)]*\)\s*;?/g, '')
    .replace(/gtag\s*\([^)]*\)\s*;?/g, '')
    .replace(/window\.\w+\s*=\s*[\s\S]*?;/g, '')
    .replace(/Skip to (content|main|navigation)\s*/gi, '')
    .replace(/Go to Top\s*/gi, '')
    .replace(/Back to top\s*/gi, '')
    .replace(/\b\w[\w\s]+\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}\s*/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function resolveThemeSlug(themeId: string | null) {
  if (!themeId) return null
  const entry = Object.entries(THEMES).find(function ([id]) { return id === themeId })
  return entry ? entry[1].slug : null
}

export const revalidate = 86400

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveContent(supabase: any, idOrSlug: string) {
  if (UUID_RE.test(idOrSlug)) {
    const { data } = await supabase.from('content_published').select('*').eq('id', idOrSlug).eq('is_active', true).single()
    return data
  }
  const { data } = await supabase.from('content_published').select('*').eq('slug', idOrSlug).eq('is_active', true).single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const item = await resolveContent(supabase, id)
  if (!item) return { title: 'Not Found' }
  const canonicalSlug = item.slug || id
  return {
    title: item.title_6th_grade,
    description: item.summary_6th_grade || 'Details on the Change Engine.',
    alternates: {
      canonical: 'https://www.changeengine.us/content/' + canonicalSlug,
    },
  }
}

export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrSlug } = await params
  const supabase = await createClient()

  const item = await resolveContent(supabase, idOrSlug)
  if (!item) notFound()

  // Redirect UUID URLs to slug for clean URLs
  if (UUID_RE.test(idOrSlug) && item.slug) {
    redirect('/content/' + item.slug)
  }

  const id = item.id

  // Language + translations
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(langCode)
  const langConfig = LANGUAGES.find(function (l) { return l.code === langCode })

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
      translations.forEach(function (tr: any) {
        if ((tr.field_name === 'title' || tr.field_name === 'title_6th_grade') && tr.translated_text) { translatedTitle = tr.translated_text; isTranslated = true }
        if ((tr.field_name === 'summary' || tr.field_name === 'summary_6th_grade') && tr.translated_text) { translatedSummary = tr.translated_text; isTranslated = true }
        if ((tr.field_name === 'body') && tr.translated_text) { translatedBody = tr.translated_text; isTranslated = true }
      })
    }
  }

  // Focus areas
  const { data: focusJunctions } = await supabase
    .from('content_focus_areas')
    .select('focus_id')
    .eq('content_id', item.id)
  const focusAreaIds = (focusJunctions ?? []).map((j: any) => j.focus_id)
  const focusAreas = focusAreaIds.length > 0 ? await getFocusAreasByIds(focusAreaIds) : []

  // Taxonomy lookups
  const sdgIds: string[] = (item as any).sdg_ids || []
  const audienceIds: string[] = (item as any).audience_segments || []
  const actionTypeIds: string[] = (item as any).action_type_ids || []
  const timeCommitmentId: string | null = (item as any).time_commitment_id || null
  const geoScope: string | null = (item as any).geographic_scope || null
  const govLevel: string | null = (item as any).gov_level_id || null
  const contentType: string | null = (item as any).content_type || null

  // Parallel fetches
  const pathwayThemeIds = item.pathway_primary ? [item.pathway_primary] : []
  const [opportunities, policies, libraryNuggets, sdgMap, sdohMap, orgData, audienceData, actionTypeData, timeData, govData] = await Promise.all([
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    getLibraryNuggets(pathwayThemeIds, focusAreaIds, 3),
    getSDGMap(),
    getSDOHMap(),
    item.org_id ? supabase.from('organizations').select('org_id, org_name, website, description_5th_grade, logo_url, mission_statement').eq('org_id', item.org_id).single().then((r: any) => r.data) : Promise.resolve(null),
    audienceIds.length > 0 ? supabase.from('audience_segments').select('segment_id, segment_name').in('segment_id', audienceIds).then((r: any) => r.data) : Promise.resolve([]),
    actionTypeIds.length > 0 ? supabase.from('action_types').select('action_type_id, action_type_name').in('action_type_id', actionTypeIds).then((r: any) => r.data) : Promise.resolve([]),
    timeCommitmentId ? supabase.from('time_commitments').select('time_id, time_name').eq('time_id', timeCommitmentId).single().then((r: any) => r.data) : Promise.resolve(null),
    govLevel ? supabase.from('government_levels').select('gov_level_id, gov_level_name').eq('gov_level_id', govLevel).single().then((r: any) => r.data) : Promise.resolve(null),
  ])

  // Related policies via focus areas (for sidebar + action cards)
  let relatedPolicies: any[] = []
  if (focusAreaIds.length > 0) {
    const { data: policyJunctions } = await supabase
      .from('policy_focus_areas')
      .select('policy_id')
      .in('focus_id', focusAreaIds)
      .limit(10)
    if (policyJunctions && policyJunctions.length > 0) {
      const pIds = Array.from(new Set(policyJunctions.map((j: any) => j.policy_id)))
      const { data: pols } = await supabase
        .from('policies')
        .select('policy_id, policy_name, title_6th_grade, level, status')
        .in('policy_id', pIds)
        .eq('is_published', true)
        .limit(4)
      relatedPolicies = pols || []
    }
  }

  // Related services via focus areas (211-style community resources)
  let relatedServices: any[] = []
  if (focusAreaIds.length > 0) {
    const { data: svcJunctions } = await supabase
      .from('service_focus_areas')
      .select('service_id')
      .in('focus_id', focusAreaIds)
      .limit(10)
    if (svcJunctions && svcJunctions.length > 0) {
      const sIds = Array.from(new Set(svcJunctions.map((j: any) => j.service_id)))
      const { data: svcs } = await supabase
        .from('services_211')
        .select('service_id, service_name, org_id, phone, address, city')
        .in('service_id', sIds)
        .eq('is_active', 'Yes')
        .limit(4)
      relatedServices = svcs || []
    }
  }

  // Officials via focus areas (primary) + policy connection (supplement)
  const focusOfficials = focusAreaIds.length > 0 ? await getRelatedOfficials(focusAreaIds) : []
  let responsibleOfficials: any[] = focusOfficials.map((o: any) => ({
    ...o, photo_url: o.photo_url || null
  }))
  // Supplement with policy-connected officials if we don't have enough
  if (responsibleOfficials.length < 5 && (policies.length > 0 || relatedPolicies.length > 0)) {
    const policyIds = [...policies.map((p: any) => p.policy_id), ...relatedPolicies.map((p: any) => p.policy_id)]
    const { data: officialJunctions } = await supabase
      .from('policy_officials')
      .select('official_id')
      .in('policy_id', policyIds)
    if (officialJunctions && officialJunctions.length > 0) {
      const existingIds = new Set(responsibleOfficials.map((o: any) => o.official_id))
      const newIds = Array.from(new Set(officialJunctions.map((j: any) => j.official_id))).filter(id => !existingIds.has(id))
      if (newIds.length > 0) {
        const { data: moreOfficials } = await supabase
          .from('elected_officials')
          .select('official_id, official_name, title, party, level, photo_url')
          .in('official_id', newIds)
          .limit(5 - responsibleOfficials.length)
        responsibleOfficials = [...responsibleOfficials, ...(moreOfficials || [])]
      }
    }
  }

  // Related books from bookshelf by theme or focus areas
  let relatedBooks: any[] = []
  {
    const bookFilters: any[] = []
    if (item.pathway_primary) bookFilters.push({ col: 'theme_id', val: item.pathway_primary })
    const { data: books } = await supabase
      .from('bookshelf' as any)
      .select('id, title, author, cover_image_url, description, purchase_url, free_url')
      .eq('is_active', true)
      .limit(6)
    // Filter by theme or overlapping focus areas
    relatedBooks = ((books || []) as any[]).filter(function (b: any) {
      if (b.theme_id === item.pathway_primary) return true
      if (b.focus_area_ids && focusAreaIds.length > 0) {
        return b.focus_area_ids.some((fa: string) => focusAreaIds.includes(fa))
      }
      return false
    }).slice(0, 4)
  }

  // Related content by type (DIY kits, videos, guides, tools, courses along same focus areas)
  let typedContent: any[] = []
  if (focusAreaIds.length > 0) {
    const { data: typed } = await supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, content_type, image_url, pathway_primary')
      .eq('is_active', true)
      .neq('id', item.id)
      .in('content_type', ['diy_kit', 'video', 'guide', 'tool', 'course', 'event'])
      .overlaps('focus_area_ids', focusAreaIds)
      .limit(8)
    typedContent = typed || []
  }

  // AI classification data
  let crossRefIds: string[] = []
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
      heroQuote = c.hero_quote || null
      programs = Array.isArray(c.programs) ? c.programs.filter((p: any) => p && p.name) : []
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

  // Related content scored by focus area overlap
  const { data: relatedCandidates } = await supabase
    .from('content_published')
    .select('id, title_6th_grade, summary_6th_grade, pathway_primary, center, source_url, published_at, focus_area_ids, image_url')
    .eq('is_active', true)
    .neq('id', item.id)
    .limit(20)

  const related = (relatedCandidates || [])
    .map(function (r: any) {
      let score = 0
      if (crossRefIds.includes(r.id)) score += 10
      if (item.focus_area_ids && r.focus_area_ids) {
        const overlap = item.focus_area_ids.filter(function (fa: string) { return r.focus_area_ids.includes(fa) })
        score += overlap.length * 3
      }
      if (r.pathway_primary === item.pathway_primary) score += 1
      return { ...r, _score: score }
    })
    .filter(function (r: any) { return r._score > 0 })
    .sort(function (a: any, b: any) { return b._score - a._score })
    .slice(0, 6)

  const userProfile = await getUserProfile()

  const title = translatedTitle || item.title_6th_grade
  const summary = translatedSummary || item.summary_6th_grade
  const themeSlug = resolveThemeSlug(item.pathway_primary)
  const themeEntry = item.pathway_primary ? (THEMES as Record<string, { name: string; color: string; slug: string }>)[item.pathway_primary] : null
  const themeColor = themeEntry?.color || '#1b5e8a'

  const bodyText = sanitizeBody(translatedBody || item.body || '')
  const bodyBlocks = smartParagraphs(bodyText)

  // Fetch linkable entities for auto-linking org names, officials, neighborhoods
  const linkableEntities = await getLinkableEntities()

  // Build body HTML for ContentTabs
  const bodyHtml = bodyBlocks.map(function (block) {
    if (block.startsWith('## ')) {
      return '<h2 class="font-display text-xl font-bold text-ink mt-8 mb-3">' + block.replace(/^## /, '') + '</h2>'
    }
    if (block.startsWith('> ')) {
      return '<blockquote class="pl-5 py-4 pr-6 my-4 border-l-4 border-amber-400 bg-amber-50"><p class="text-amber-900 leading-relaxed">' + block.replace(/^> /gm, '').trim() + '</p></blockquote>'
    }
    if (block.match(/^[-\u2022*] /m)) {
      const items = block.split(/\n/).filter(function (l) { return l.trim() })
      return '<ul class="space-y-2 my-4 list-disc list-inside">' + items.map(function (li) {
        return '<li class="text-ink leading-relaxed">' + linkEntities(li.replace(/^[-\u2022*]\s*/, '').trim(), linkableEntities) + '</li>'
      }).join('') + '</ul>'
    }
    // Bold parsing then entity linking
    let processed = block.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Only apply entity linking to blocks that don't already contain HTML tags (from bold)
    if (!processed.includes('<strong>')) {
      processed = linkEntities(processed, linkableEntities)
    } else {
      // For blocks with bold, link entities in the non-bold parts
      const parts = processed.split(/(<strong>[^<]+<\/strong>)/)
      processed = parts.map(function (part) {
        if (part.startsWith('<strong>')) return part
        return linkEntities(part, linkableEntities)
      }).join('')
    }
    return '<p class="text-ink leading-relaxed mb-4" style="font-size:1.0625rem;line-height:1.85">' + processed + '</p>'
  }).join('\n')

  const jsonLd = articleJsonLd(item as any)
  const sourceDomain = item.source_url ? (() => { try { return new URL(item.source_url).hostname } catch { return 'the source' } })() : null

  const sdohCode = (item as any).sdoh_domain
  const sdohEntry = sdohCode ? sdohMap[sdohCode] : null
  const matchedSDGs = sdgIds.map(sid => sdgMap[sid]).filter(Boolean)

  const actionItems = (item as any).action_items || {}
  return (
    <>
      <SpiralTracker action="read_article" pathway={item.pathway_primary || undefined} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          GRADIENT HERO
         ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 40%, ${themeColor}55 100%)` }}
      >
        {/* Texture layers */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-5%] opacity-[0.06] pointer-events-none" aria-hidden="true">
          <FlowerOfLife color="#ffffff" size={400} />
        </div>

        <div className="max-w-[1080px] mx-auto px-6 py-10 sm:py-14 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb + type in one line */}
              <nav className="text-xs uppercase tracking-wider text-white/60 mb-4 flex items-center gap-2">
                <Link href="/guide" className="hover:text-white transition-colors">Guide</Link>
                {themeEntry && (
                  <>
                    <span>&rsaquo;</span>
                    <Link href={'/pathways/' + (themeSlug || '')} className="hover:text-white transition-colors">{themeEntry.name}</Link>
                  </>
                )}
                {contentType && (
                  <>
                    <span>&rsaquo;</span>
                    <span className="text-white/40">{contentType}</span>
                  </>
                )}
                {isTranslated && (
                  <span className="inline-flex items-center gap-1 text-white/50 ml-2">
                    <Globe size={11} /> {t('content.translated')}
                  </span>
                )}
              </nav>

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 40px)' }}
              >
                {title}
              </h1>

              {/* Summary + meta on one line */}
              {summary && (
                <p className="text-white/80 leading-relaxed mb-5 max-w-[560px] text-base">
                  {summary.length > 180 ? summary.slice(0, 180) + '...' : summary}
                </p>
              )}

              <div className="flex items-center gap-4">
                <BookmarkButton
                  contentType="content"
                  contentId={item.id}
                  title={item.title_6th_grade || item.title}
                  imageUrl={item.image_url}
                />
                <span className="text-xs text-white/40">
                  {[
                    item.published_at ? new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
                    orgData?.org_name,
                  ].filter(Boolean).join(' \u00b7 ')}
                </span>
              </div>
            </div>

            {/* Hero image */}
            {item.image_url && (
              <div className="w-full lg:w-[340px] flex-shrink-0 overflow-hidden shadow-xl border-2 border-white/20">
                <ContentImage src={item.image_url} alt={title || ''} themeColor={themeColor} pathway={item.pathway_primary} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Tabs + Taxonomy Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Content Tabs ── */}
            <div className="flex-1 min-w-0">
              <ContentTabs
                themeColor={themeColor}
                bodyHtml={bodyHtml}
                title={title}
                summary={summary}
                videoUrl={(item as any).video_url || null}
                heroQuote={heroQuote}
                orgData={orgData}
                relatedServices={relatedServices}
                relatedContent={related}
                opportunities={opportunities}
                actionItems={actionItems}
                relatedPolicies={relatedPolicies}
                libraryNuggets={libraryNuggets}
                programs={programs}
                responsibleOfficials={responsibleOfficials}
                relatedBooks={relatedBooks}
                typedContent={typedContent}
              />
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: TAXONOMY WAYFINDER SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[280px] flex-shrink-0">
              <div className="lg:sticky lg:top-[72px] overflow-hidden" style={{ border: `1px solid ${RULE}`, background: 'white' }}>

                {/* Wayfinder — collapsible on mobile */}
                <details className="lg:open group" open>
                  <summary className="px-5 py-4 cursor-pointer lg:cursor-default list-none flex items-center justify-between" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Wayfinder</h2>
                    <span className="lg:hidden text-muted group-open:rotate-180 transition-transform">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </summary>

                {/* Source link */}
                {item.source_url && (
                  <div className="px-5 py-3" style={{ background: SIDEBAR_BG, borderBottom: `3px solid ${RULE}` }}>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline flex items-center gap-1.5" style={{ color: themeColor }}
                    >
                      {item.source_org_name || sourceDomain}
                      <ArrowRight size={12} />
                    </a>
                  </div>
                )}

                {/* Topic */}
                {themeEntry && (
                  <div className="px-5 py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <Link href={'/pathways/' + (themeSlug || '')} className="flex items-center gap-2 group">
                      <FlowerOfLife size={16} color={themeColor} opacity={0.7} />
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: themeColor }}>{themeEntry.name}</span>
                    </Link>
                  </div>
                )}

                {/* Focus Areas */}
                {focusAreas.length > 0 && (
                  <div className="px-5 py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {focusAreas.map(function (fa: any) {
                        return (
                          <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id}
                            className="text-xs px-2.5 py-1 hover:opacity-80 transition-opacity"
                            style={{ background: themeColor + '12', color: themeColor }}
                          >
                            {fa.focus_area_name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Details row — compact single-value items */}
                {(audienceData && (audienceData as any[]).length > 0 || timeData || geoScope || contentType) && (
                  <div className="px-5 py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
                    <div className="space-y-1.5 text-xs">
                      {audienceData && (audienceData as any[]).length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-muted font-semibold shrink-0">For:</span>
                          <span style={{ color: themeColor }}>{(audienceData as any[]).map((s: any) => s.segment_name).join(', ')}</span>
                        </div>
                      )}
                      {timeData && (
                        <div className="flex gap-2">
                          <span className="text-muted font-semibold shrink-0">Time:</span>
                          <span style={{ color: themeColor }}>{(timeData as any).time_name}</span>
                        </div>
                      )}
                      {geoScope && (
                        <div className="flex gap-2">
                          <span className="text-muted font-semibold shrink-0">Where:</span>
                          <span style={{ color: themeColor }}>{geoScope}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Taxonomy — collapsed by default */}
                {(matchedSDGs.length > 0 || sdohEntry || govData || (actionTypeData && (actionTypeData as any[]).length > 0)) && (
                  <CollapsibleSidebarSection title="Taxonomy">
                    <div className="space-y-3">
                      {matchedSDGs.length > 0 && (
                        <div>
                          <p className="text-xs text-muted mb-1">UN SDGs</p>
                          <div className="flex flex-wrap gap-1">
                            {matchedSDGs.map(function (sdg) {
                              return (
                                <Link key={sdg.sdg_number} href={'/explore?sdg=SDG-' + String(sdg.sdg_number).padStart(2, '0')}
                                  className="w-6 h-6 flex items-center justify-center text-white text-[0.55rem] font-bold hover:opacity-80"
                                  style={{ background: sdg.sdg_color || themeColor }}
                                  title={sdg.sdg_name}
                                >
                                  {sdg.sdg_number}
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {sdohEntry && (
                        <div>
                          <p className="text-xs text-muted mb-1">SDOH</p>
                          <span className="text-xs font-medium" style={{ color: themeColor }}>{sdohEntry.sdoh_name}</span>
                        </div>
                      )}
                      {govData && (
                        <div>
                          <p className="text-xs text-muted mb-1">Government Level</p>
                          <span className="text-xs font-medium" style={{ color: themeColor }}>{(govData as any).gov_level_name}</span>
                        </div>
                      )}
                      {actionTypeData && (actionTypeData as any[]).length > 0 && (
                        <div>
                          <p className="text-xs text-muted mb-1">Action Types</p>
                          <div className="flex flex-wrap gap-1">
                            {(actionTypeData as any[]).map(function (at: any) {
                              return (
                                <span key={at.action_type_id} className="text-xs px-2 py-0.5"
                                  style={{ background: themeColor + '12', color: themeColor }}
                                >
                                  {at.action_type_name}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleSidebarSection>
                )}

                <div className="h-2" />
                </details>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `3px solid ${RULE}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#1b5e8a]"
            style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}
          >
            <ArrowRight size={14} className="rotate-180" /> Back to the Exchange
          </Link>
        </div>
      </section>

      <AdminEditPanel
        entityType="content_published"
        entityId={id}
        userRole={userProfile?.role}
        fields={[
          { key: 'title_6th_grade', label: 'Title', type: 'text', value: item.title_6th_grade },
          { key: 'summary_6th_grade', label: 'Summary', type: 'textarea', value: item.summary_6th_grade },
          { key: 'body', label: 'Body', type: 'textarea', value: item.body },
          { key: 'source_url', label: 'Source URL', type: 'url', value: item.source_url },
          { key: 'source_org_name', label: 'Source Org', type: 'text', value: (item as any).source_org_name },
          { key: 'image_url', label: 'Image URL', type: 'url', value: item.image_url },
          { key: 'pathway_primary', label: 'Primary Pathway', type: 'select', value: item.pathway_primary, options: Object.keys(THEMES) },
          { key: 'content_type', label: 'Content Type', type: 'select', value: (item as any).content_type, options: ['article', 'campaign', 'course', 'event', 'guide', 'news', 'opportunity', 'report', 'resource', 'story', 'tool', 'video'] },
          { key: 'is_active', label: 'Active', type: 'select', value: String((item as any).is_active), options: ['true', 'false'] },
        ] as EditField[]}
      />
    </>
  )
}

/* ── Sidebar Section Component (unused, kept for reference) ── */
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-3" style={{ borderBottom: `3px solid ${RULE}` }}>
      <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{title}</h4>
      <div>{children}</div>
    </div>
  )
}

