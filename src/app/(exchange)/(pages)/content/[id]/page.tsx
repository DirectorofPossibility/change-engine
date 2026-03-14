import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getUIStrings } from '@/lib/i18n'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getSDGMap, getSDOHMap } from '@/lib/data/taxonomy'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { ExternalLink, Globe, ArrowRight, BookOpen, Users, Megaphone, GraduationCap, Rocket } from 'lucide-react'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ContentImage } from '@/components/exchange/ContentImage'
import { articleJsonLd } from '@/lib/jsonld'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { CollapsibleSidebarSection } from '@/components/exchange/CollapsibleSidebarSection'

/* ── Design Tokens ── */
const RULE = '#dde1e8'
const DIM = '#5c6474'
const INK = '#0d1117'
const SIDEBAR_BG = '#f4f5f7'

const TRAIL_LEVELS = [
  { name: 'Get Curious', subtitle: 'Learn', color: '#1b5e8a', icon: BookOpen },
  { name: 'Find Your People', subtitle: 'Connect', color: '#1a6b56', icon: Users },
  { name: 'Show Up', subtitle: 'Participate', color: '#4a2870', icon: Megaphone },
  { name: 'Go Deeper', subtitle: 'Build skills & capacity', color: '#7a2018', icon: GraduationCap },
  { name: 'Make Your Move', subtitle: 'Take action in whatever form fits you', color: '#0d1117', icon: Rocket },
]

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

  // Officials connected to related policies
  let responsibleOfficials: any[] = []
  if (policies.length > 0 || relatedPolicies.length > 0) {
    const policyIds = [...policies.map((p: any) => p.policy_id), ...relatedPolicies.map((p: any) => p.policy_id)]
    const { data: officialJunctions } = await supabase
      .from('policy_officials')
      .select('official_id')
      .in('policy_id', policyIds)
    if (officialJunctions && officialJunctions.length > 0) {
      const officialIds = Array.from(new Set(officialJunctions.map((j: any) => j.official_id)))
      const { data: officials } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url')
        .in('official_id', officialIds)
        .limit(5)
      responsibleOfficials = officials || []
    }
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
  const bodyBlocks = bodyText.split(/\n\n+/).map(function (b) { return b.trim() }).filter(Boolean)
  let sectionNumber = 0

  const jsonLd = articleJsonLd(item as any)
  const sourceDomain = item.source_url ? (() => { try { return new URL(item.source_url).hostname } catch { return 'the source' } })() : null

  const sdohCode = (item as any).sdoh_domain
  const sdohEntry = sdohCode ? sdohMap[sdohCode] : null
  const matchedSDGs = sdgIds.map(sid => sdgMap[sid]).filter(Boolean)

  const currentLevel = (item as any).trail_level || 1
  const actionItems = (item as any).action_items || {}
  const hasActions = Object.values(actionItems).some(Boolean)

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
        <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

        <div className="max-w-[1080px] mx-auto px-6 py-12 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-white/70 mb-4">
                <Link href="/guide" className="hover:text-white transition-colors">Guide</Link>
                {themeEntry && (
                  <>
                    <span className="mx-1.5">&rsaquo;</span>
                    <Link href={'/pathways/' + (themeSlug || '')} className="hover:text-white transition-colors">{themeEntry.name}</Link>
                  </>
                )}
              </nav>

              {/* Badge row */}
              <div className="flex items-center gap-3 mb-5">
                {contentType && (
                  <span className="inline-block px-4 py-1.5 rounded-full text-white font-mono text-[0.65rem] uppercase tracking-[0.14em] font-bold"
                    style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
                  >
                    {contentType}
                  </span>
                )}
                {isTranslated && (
                  <span className="inline-flex items-center gap-1 text-white/80 font-mono text-[0.65rem] uppercase tracking-[0.1em]">
                    <Globe size={11} /> {t('content.translated')}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display font-black text-white leading-[1.1] tracking-[-0.02em] mb-5"
                style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}
              >
                {title}
              </h1>

              {/* Summary */}
              {summary && (
                <p className="text-white/90 leading-[1.7] mb-6 max-w-[600px]" style={{ fontSize: '1.1rem' }}>
                  {summary.length > 200 ? summary.slice(0, 200) + '...' : summary}
                </p>
              )}

              {/* CTA */}
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white rounded-full font-bold text-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ color: themeColor }}
                >
                  <ExternalLink size={16} />
                  {contentType === 'video' ? 'Watch Now' : contentType === 'tool' ? 'Use the Tool' : contentType === 'podcast' ? 'Listen Now' : 'Read the Full Resource'}
                </a>
              )}

              {/* Meta strip */}
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1 mt-6">
                {item.published_at && (
                  <span>{new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
                {orgData && (
                  <>
                    <span>&middot;</span>
                    <span>{orgData.org_name}</span>
                  </>
                )}
                {sourceDomain && (
                  <>
                    <span>&middot;</span>
                    <span>{sourceDomain}</span>
                  </>
                )}
              </div>
            </div>

            {/* Hero image */}
            {item.image_url && (
              <div className="w-full lg:w-[380px] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/30">
                <ContentImage src={item.image_url} alt={title || ''} themeColor={themeColor} pathway={item.pathway_primary} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── QUOTE BANNER ── */}
      {heroQuote && (
        <section className="bg-white">
          <div className="max-w-[1080px] mx-auto px-6 py-8">
            <div className="rounded-r-2xl pl-6 py-6 pr-8" style={{ borderLeft: `5px solid ${themeColor}`, background: '#fafafa' }}>
              <p className="italic leading-[1.7] text-slate-600" style={{ fontSize: '1.2rem' }}>
                &ldquo;{heroQuote}&rdquo;
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TWO-COLUMN LAYOUT — Body + Taxonomy Wayfinder Sidebar
         ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT: Body Content ── */}
            <div className="flex-1 min-w-0" style={{ maxWidth: 740 }}>

              {/* Video embed — YouTube + Vimeo */}
              {(item as any).video_url && (() => {
                const vurl = (item as any).video_url as string
                const ytMatch = vurl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
                const vimeoMatch = vurl.match(/vimeo\.com\/(\d+)/)
                const embedSrc = ytMatch
                  ? 'https://www.youtube-nocookie.com/embed/' + ytMatch[1]
                  : vimeoMatch
                    ? 'https://player.vimeo.com/video/' + vimeoMatch[1]
                    : null
                if (!embedSrc) return null
                return (
                  <div className="mb-6">
                    <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%', border: `1px solid ${RULE}` }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={embedSrc}
                        title={t('content.video')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Body blocks with numbered sections + highlight boxes */}
              {bodyBlocks.length > 0 ? (
                <div className="space-y-5 font-body">
                  {bodyBlocks.map(function (block, i) {
                    if (!block) return null

                    {/* Section headers with numbered circle badges */}
                    if (block.startsWith('## ')) {
                      sectionNumber++
                      return (
                        <div key={i} className="flex items-center gap-4 mt-10 first:mt-0 pb-3" style={{ borderBottom: `1px solid ${RULE}` }}>
                          <span
                            className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold text-sm"
                            style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}88 100%)` }}
                          >
                            {sectionNumber}
                          </span>
                          <h2 className="font-display text-xl font-bold text-ink">{block.replace(/^## /, '')}</h2>
                        </div>
                      )
                    }

                    {/* Blockquotes → Highlight boxes */}
                    if (block.startsWith('> ')) {
                      const quoteText = block.replace(/^> /gm, '').trim()
                      return (
                        <div key={i} className="rounded-r-xl py-5 px-6 my-4" style={{ background: '#fef3c7', borderLeft: '5px solid #F59E0B' }}>
                          <p className="text-amber-900 leading-[1.7]" style={{ fontSize: '1rem' }}>{quoteText}</p>
                        </div>
                      )
                    }

                    {/* Bullet lists with arrow markers */}
                    if (block.match(/^[-\u2022*] /m)) {
                      const listItems = block.split(/\n/).filter(function (l) { return l.trim() })
                      return (
                        <ul key={i} className="space-y-2 my-4">
                          {listItems.map(function (li, j) {
                            return (
                              <li key={j} className="flex gap-3 items-start" style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
                                <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: themeColor }}>&rarr;</span>
                                <span className="text-ink">{li.replace(/^[-\u2022*]\s*/, '').trim()}</span>
                              </li>
                            )
                          })}
                        </ul>
                      )
                    }

                    {/* Drop cap on first paragraph */}
                    const isFirst = i === bodyBlocks.findIndex(function (b) { return b && !b.startsWith('## ') && !b.startsWith('> ') && !b.match(/^[-\u2022*] /m) })
                    if (isFirst && block.length > 40) {
                      const firstChar = block.charAt(0)
                      const rest = block.slice(1)
                      return (
                        <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>
                          <span className="float-left mr-2.5 mt-1 font-display" style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 0.8, color: themeColor }}>
                            {firstChar}
                          </span>
                          {rest}
                        </p>
                      )
                    }

                    {/* Bold parsing */}
                    if (block.match(/\*\*[^*]+\*\*/)) {
                      const parts = block.split(/(\*\*[^*]+\*\*)/)
                      return (
                        <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>
                          {parts.map(function (part, j) {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                            }
                            return <span key={j}>{part}</span>
                          })}
                        </p>
                      )
                    }

                    return <p key={i} className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>{block}</p>
                  })}
                </div>
              ) : summary ? (
                <p className="text-ink" style={{ fontSize: '1.0625rem', lineHeight: 1.85 }}>{summary}</p>
              ) : null}

              {/* ── SOURCE CTA BOX ── */}
              {item.source_url && (
                <div className="mt-8 p-5 flex items-center justify-between gap-4 rounded-lg" style={{ border: `1px solid ${RULE}`, background: SIDEBAR_BG }}>
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.1em] mb-1" style={{ color: DIM }}>
                      {contentType === 'video' ? 'Watch the video' :
                       contentType === 'tool' ? 'Use the tool' :
                       contentType === 'podcast' ? 'Listen now' :
                       contentType === 'course' ? 'Start the course' :
                       'Go to this resource'}
                    </p>
                    <p style={{ fontSize: '0.9rem' }}>
                      We found this for you at <strong>{item.source_org_name || item.source_domain || sourceDomain}</strong>
                    </p>
                  </div>
                  <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90 rounded-full font-mono text-[0.7rem] uppercase tracking-[0.08em] font-bold"
                    style={{ background: themeColor }}
                  >
                    <ExternalLink size={14} /> Take me there
                  </a>
                </div>
              )}

              {/* ── Break It Down ── */}
              {(summary || item.body) && (
                <div className="mt-6 p-5 rounded-lg" style={{ border: `1px solid ${RULE}` }}>
                  <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.2em]" style={{ color: DIM }}>AI Summary</p>
                  <p className="mb-4 text-sm" style={{ color: DIM }}>Let us break this down in plain language.</p>
                  <BreakItDown title={title} summary={summary} type="content" accentColor={themeColor} />
                </div>
              )}

              {/* ── PROGRAMS ── */}
              {programs.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-4" style={{ color: DIM }}>Programs</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {programs.map(function (prog, i) {
                      return (
                        <div key={i} className="p-5 rounded-lg flex gap-3" style={{ border: `1px solid ${RULE}`, background: 'white' }}>
                          <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                          <div>
                            <p className="font-semibold text-sm">{prog.name}</p>
                            <p className="mt-1 text-sm leading-relaxed" style={{ color: DIM }}>{prog.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── ACTION CARDS ── */}
              {(hasActions || relatedPolicies.length > 0) && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-5" style={{ color: DIM }}>Take Action</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {actionItems.volunteer_url && (
                      <ActionCard href={actionItems.volunteer_url} icon="🤝" label="Volunteer" desc="Give your time and talent" cta="Show Up" themeColor={themeColor} />
                    )}
                    {actionItems.donate_url && (
                      <ActionCard href={actionItems.donate_url} icon="💛" label="Donate" desc="Support this work" cta="Contribute" themeColor={themeColor} />
                    )}
                    {actionItems.signup_url && (
                      <ActionCard href={actionItems.signup_url} icon="✍️" label="Sign Up" desc="Get involved today" cta="Join" themeColor={themeColor} />
                    )}
                    {actionItems.register_url && (
                      <ActionCard href={actionItems.register_url} icon="📋" label="Register" desc="Reserve your spot" cta="Register" themeColor={themeColor} />
                    )}
                    {actionItems.attend_url && (
                      <ActionCard href={actionItems.attend_url} icon="📍" label="Attend" desc="Show up in person" cta="Attend" themeColor={themeColor} />
                    )}
                    {relatedPolicies.length > 0 && (
                      <Link href={'/policies/' + relatedPolicies[0].policy_id}
                        className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-purple-400 hover:shadow-lg bg-white"
                      >
                        <span className="text-3xl block mb-3">📜</span>
                        <h4 className="font-bold mb-2">Follow the Policy</h4>
                        <p className="text-sm mb-4" style={{ color: DIM }}>Track related legislation</p>
                        <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
                          style={{ background: `linear-gradient(135deg, #4a2870, ${themeColor})` }}
                        >Learn More &rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* ── COMMUNITY RESOURCES (211-style) ── */}
              {relatedServices.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Community Resources</h3>
                  <p className="text-sm mb-5" style={{ color: DIM }}>Services available in your community related to this topic</p>
                  <div className="space-y-3">
                    {relatedServices.map(function (svc: any) {
                      return (
                        <Link key={svc.service_id} href={'/services/' + svc.service_id}
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-emerald-400 hover:shadow-sm transition-all bg-white group"
                        >
                          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#dcfce7', color: '#16a34a' }}
                          >
                            <Globe size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-bold group-hover:underline truncate">{svc.service_name}</span>
                            {svc.phone && <span className="block text-xs mt-0.5" style={{ color: DIM }}>{svc.phone}</span>}
                            {svc.address && <span className="block text-xs" style={{ color: DIM }}>{svc.address}{svc.city ? `, ${svc.city}` : ''}</span>}
                          </div>
                          <ArrowRight size={14} className="flex-shrink-0 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── WHO IS RESPONSIBLE ── */}
              {responsibleOfficials.length > 0 && (
                <div className="mt-10">
                  <h3 className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] mb-5" style={{ color: DIM }}>Who Is Responsible</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {responsibleOfficials.map(function (o: any) {
                      return (
                        <Link key={o.official_id} href={'/officials/' + o.official_id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group bg-white"
                        >
                          <div className="w-12 h-12 overflow-hidden flex-shrink-0 rounded-full border-2 border-gray-200">
                            {o.photo_url ? (
                              <img src={o.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ color: themeColor, background: themeColor + '15' }}>
                                {o.official_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-bold group-hover:underline truncate">{o.official_name}</span>
                            <span className="block text-xs truncate" style={{ color: DIM }}>
                              {[o.title, o.party, o.level].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                RIGHT: TAXONOMY WAYFINDER SIDEBAR
               ══════════════════════════════════════════════════════════════════ */}
            <aside className="w-full lg:w-[340px] flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-0 rounded-2xl overflow-hidden" style={{ border: '2px solid #1a1a1a', background: 'white' }}>

                {/* Wayfinder Header */}
                <div className="px-6 pt-6 pb-4" style={{ borderBottom: '3px solid transparent', borderImage: `linear-gradient(90deg, ${themeColor}, ${themeColor}66) 1` }}>
                  <h2 className="font-display text-lg font-black uppercase tracking-[0.05em] mb-1"
                    style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    Wayfinder
                  </h2>
                  <p className="text-xs" style={{ color: DIM }}>Navigate by topic to find related resources</p>
                </div>

                {/* Source Box */}
                {item.source_url && (
                  <div className="px-6 py-4" style={{ background: SIDEBAR_BG, borderBottom: `1px solid ${RULE}` }}>
                    <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: DIM }}>Source</h4>
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline block truncate" style={{ color: themeColor }}
                    >
                      {item.source_org_name || sourceDomain} &rarr;
                    </a>
                  </div>
                )}

                {/* Organization */}
                {orgData && (
                  <div className="px-6 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
                    <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: DIM }}>Organization</h4>
                    <Link href={'/organizations/' + orgData.org_id} className="group">
                      <span className="text-sm font-bold group-hover:underline block" style={{ color: INK }}>{orgData.org_name}</span>
                      {orgData.description_5th_grade && (
                        <span className="text-xs block mt-1 line-clamp-2" style={{ color: DIM }}>{orgData.description_5th_grade}</span>
                      )}
                    </Link>
                  </div>
                )}

                {/* Your Journey */}
                <div className="px-6 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
                  <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: DIM }}>Your Journey</h4>
                  <div className="space-y-0">
                    {TRAIL_LEVELS.map(function (level, i) {
                      const n = i + 1
                      const isActive = n === currentLevel
                      const isPast = n < currentLevel
                      const Icon = level.icon
                      return (
                        <Link key={n} href={'/explore?engagement=' + encodeURIComponent(level.name)}
                          className="flex items-center gap-2.5 py-1.5 group transition-opacity hover:!opacity-100"
                          style={{ opacity: isActive ? 1 : isPast ? 0.7 : 0.35 }}
                        >
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 rounded-full transition-colors"
                            style={{ background: isActive ? level.color : 'transparent' }}
                          >
                            <Icon size={11} style={{ color: isActive ? 'white' : level.color }} strokeWidth={2.5} />
                          </div>
                          <span className={'text-xs leading-tight group-hover:underline ' + (isActive ? 'font-bold' : 'font-medium')}
                            style={{ color: isActive ? INK : undefined }}
                          >
                            {level.name}
                          </span>
                          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: level.color }} />}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Topic */}
                {themeEntry && (
                  <SidebarSection title="Topic">
                    <Link href={'/pathways/' + (themeSlug || '')} className="flex items-center gap-2 group">
                      <FlowerOfLife size={18} color={themeColor} opacity={0.7} />
                      <span className="text-sm font-semibold group-hover:underline" style={{ color: themeColor }}>{themeEntry.name}</span>
                    </Link>
                  </SidebarSection>
                )}

                {/* Focus Areas */}
                {focusAreas.length > 0 && (
                  <SidebarSection title="Focus Areas">
                    {focusAreas.map(function (fa: any) {
                      return (
                        <Link key={fa.focus_id} href={'/explore/focus/' + fa.focus_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {fa.focus_area_name}
                        </Link>
                      )
                    })}
                  </SidebarSection>
                )}

                {/* UN Sustainable Development Goals */}
                {matchedSDGs.length > 0 && (
                  <CollapsibleSidebarSection title="UN Sustainable Development Goals">
                    {matchedSDGs.map(function (sdg) {
                      return (
                        <Link key={sdg.sdg_number} href={'/explore?sdg=SDG-' + String(sdg.sdg_number).padStart(2, '0')}
                          className="flex items-center gap-2 py-0.5 group"
                        >
                          <span className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0"
                            style={{ background: sdg.sdg_color || themeColor }}
                          >
                            {sdg.sdg_number}
                          </span>
                          <span className="text-sm font-medium group-hover:underline" style={{ color: themeColor }}>{sdg.sdg_name}</span>
                        </Link>
                      )
                    })}
                  </CollapsibleSidebarSection>
                )}

                {/* SDOH Domain */}
                {sdohEntry && (
                  <CollapsibleSidebarSection title="Social Determinant of Health">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{sdohEntry.sdoh_name}</span>
                  </CollapsibleSidebarSection>
                )}

                {/* Audience */}
                {audienceData && (audienceData as any[]).length > 0 && (
                  <CollapsibleSidebarSection title="Audience">
                    {(audienceData as any[]).map(function (seg: any) {
                      return (
                        <Link key={seg.segment_id} href={'/explore?audience=' + seg.segment_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {seg.segment_name}
                        </Link>
                      )
                    })}
                  </CollapsibleSidebarSection>
                )}

                {/* Action Types */}
                {actionTypeData && (actionTypeData as any[]).length > 0 && (
                  <CollapsibleSidebarSection title="Action Types">
                    {(actionTypeData as any[]).map(function (at: any) {
                      return (
                        <span key={at.action_type_id} className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mr-1.5 mb-1.5"
                          style={{ background: themeColor + '15', color: themeColor }}
                        >
                          {at.action_type_name}
                        </span>
                      )
                    })}
                  </CollapsibleSidebarSection>
                )}

                {/* Time Commitment */}
                {timeData && (
                  <CollapsibleSidebarSection title="Time Commitment">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{(timeData as any).time_name}</span>
                  </CollapsibleSidebarSection>
                )}

                {/* Government Level */}
                {govData && (
                  <CollapsibleSidebarSection title="Government Level">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{(govData as any).gov_level_name}</span>
                  </CollapsibleSidebarSection>
                )}

                {/* Geographic Scope */}
                {geoScope && (
                  <CollapsibleSidebarSection title="Location">
                    <span className="text-sm font-medium" style={{ color: themeColor }}>{geoScope}</span>
                  </CollapsibleSidebarSection>
                )}

                {/* Content Type */}
                {contentType && (
                  <CollapsibleSidebarSection title="Content Type">
                    <span className="text-sm font-medium capitalize" style={{ color: themeColor }}>{contentType}</span>
                  </CollapsibleSidebarSection>
                )}

                {/* Related Policies */}
                {relatedPolicies.length > 0 && (
                  <CollapsibleSidebarSection title="Related Legislation">
                    {relatedPolicies.map(function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id}
                          className="text-sm font-medium hover:underline block py-0.5" style={{ color: themeColor }}
                        >
                          {p.title_6th_grade || p.policy_name}
                          {p.level && <span className="text-xs ml-1" style={{ color: DIM }}>({p.level})</span>}
                        </Link>
                      )
                    })}
                  </CollapsibleSidebarSection>
                )}

                <div className="h-4" />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── RELATED CONTENT ── */}
      {related && related.length > 0 && (
        <section className="bg-paper border-t border-gray-200">
          <div className="max-w-[1080px] mx-auto px-6 py-8 sm:py-10">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] block mb-1" style={{ color: DIM }}>Related</span>
            <h2 className="font-display text-[1.5rem] font-bold tracking-[-0.015em] mb-6">More to explore</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(function (r: any) {
                const rTheme = r.pathway_primary ? (THEMES as Record<string, { name: string; color: string }>)[r.pathway_primary] : null
                return (
                  <Link
                    key={r.id}
                    href={'/content/' + r.id}
                    className="block group relative transition-colors hover:bg-paper rounded-lg overflow-hidden"
                    style={{ background: '#ffffff', border: `1.5px solid ${RULE}` }}
                  >
                    {r.image_url ? (
                      <div className="w-full h-36 overflow-hidden" style={{ borderBottom: `1.5px solid ${RULE}` }}>
                        <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <FolFallback pathway={r.pathway_primary} height="h-20" />
                    )}
                    <div className="p-4">
                      {rTheme && (
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] block mb-1.5" style={{ color: DIM }}>{rTheme.name}</span>
                      )}
                      <span className="font-display text-[0.85rem] font-bold leading-[1.3] block group-hover:underline mb-1">
                        {r.title_6th_grade}
                      </span>
                      {r.summary_6th_grade && (
                        <span className="font-body text-[0.78rem] leading-relaxed block line-clamp-3" style={{ color: DIM }}>
                          {r.summary_6th_grade.length > 150 ? r.summary_6th_grade.slice(0, 150) + '...' : r.summary_6th_grade}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── LIBRARY NUGGETS ── */}
      {libraryNuggets.length > 0 && (
        <section style={{ background: SIDEBAR_BG }}>
          <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} />
          </div>
        </section>
      )}

      {/* ── FOOTER CODA ── */}
      <section style={{ background: SIDEBAR_BG, borderTop: `1px solid ${RULE}` }}>
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

/* ── Sidebar Section Component ── */
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: `1px solid ${RULE}` }}>
      <h4 className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.1em] mb-2"
        style={{ color: DIM }}
      >
        {title}
      </h4>
      <div>{children}</div>
    </div>
  )
}

/* ── Action Card Component ── */
function ActionCard({ href, icon, label, desc, cta, themeColor }: { href: string; icon: string; label: string; desc: string; cta: string; themeColor: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="block p-6 rounded-xl text-center border-[2px] border-gray-200 transition-all hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg bg-white"
    >
      <span className="text-3xl block mb-3">{icon}</span>
      <h4 className="font-bold mb-2">{label}</h4>
      <p className="text-sm mb-4" style={{ color: DIM }}>{desc}</p>
      <span className="inline-block px-5 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider"
        style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)` }}
      >{cta} &rarr;</span>
    </a>
  )
}
