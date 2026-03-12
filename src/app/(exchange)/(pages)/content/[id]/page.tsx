import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { getUIStrings } from '@/lib/i18n'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { ThemePill } from '@/components/ui/ThemePill'
import { CenterBadge } from '@/components/ui/CenterBadge'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { ExternalLink, Globe, ArrowRight } from 'lucide-react'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ContentImage } from '@/components/exchange/ContentImage'
import { articleJsonLd } from '@/lib/jsonld'
import { FlowerOfLife } from '@/components/geo/sacred'

/* ── Design Tokens ── */
const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const PARCHMENT_LIGHT = '#F8F4EC'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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
  return {
    title: item.title_6th_grade,
    description: item.summary_6th_grade || 'Details on the Change Engine.',
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
      translations.forEach(function (t) {
        if ((t.field_name === 'title' || t.field_name === 'title_6th_grade') && t.translated_text) { translatedTitle = t.translated_text; isTranslated = true }
        if ((t.field_name === 'summary' || t.field_name === 'summary_6th_grade') && t.translated_text) { translatedSummary = t.translated_text; isTranslated = true }
        if ((t.field_name === 'body') && t.translated_text) { translatedBody = t.translated_text; isTranslated = true }
      })
    }
  }

  // Focus areas
  const { data: focusJunctions } = await supabase
    .from('content_focus_areas')
    .select('focus_id')
    .eq('content_id', item.id)
  const focusAreaIds = (focusJunctions ?? []).map(j => j.focus_id)
  const focusAreas = focusAreaIds.length > 0 ? await getFocusAreasByIds(focusAreaIds) : []

  // Parallel fetches
  const pathwayThemeIds = item.pathway_primary ? [item.pathway_primary] : []
  const [opportunities, policies, libraryNuggets] = await Promise.all([
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    getLibraryNuggets(pathwayThemeIds, focusAreaIds, 3),
  ])

  // Officials connected to related policies (sponsors, committee members)
  let responsibleOfficials: Array<{ official_id: string; official_name: string; title: string | null; party: string | null; level: string | null; photo_url: string | null }> = []
  if (policies.length > 0) {
    const policyIds = policies.map((p: any) => p.policy_id)
    const { data: officialJunctions } = await supabase
      .from('policy_officials')
      .select('official_id')
      .in('policy_id', policyIds)
    if (officialJunctions && officialJunctions.length > 0) {
      const officialIds = Array.from(new Set(officialJunctions.map(j => j.official_id)))
      const { data: officials } = await supabase
        .from('elected_officials')
        .select('official_id, official_name, title, party, level, photo_url')
        .in('official_id', officialIds)
        .limit(8)
      responsibleOfficials = officials || []
    }
  }

  // Cross-references from AI classification
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

  // Org info
  let orgInfo: { org_id: string; org_name: string; website: string | null } | null = null
  if (item.org_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('org_id, org_name, website')
      .eq('org_id', item.org_id)
      .single()
    orgInfo = org
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
  const [wayfinderData, quote] = await Promise.all([
    getWayfinderContext('content', id, userProfile?.role),
    getRandomQuote(item.pathway_primary || undefined),
  ])

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

  return (
    <>
      <SpiralTracker action="read_article" pathway={item.pathway_primary || undefined} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO SECTION ── */}
      <section style={{ background: PARCHMENT }}>
        {/* Top color bar */}
        <div style={{ height: 3, background: themeColor }} />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {/* Breadcrumb */}
          <nav className="mb-5" style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}>
            <Link href="/explore" className="hover:text-[#C4663A] transition-colors">The Exchange</Link>
            {themeEntry && (
              <>
                <span className="mx-1.5">/</span>
                <Link href={'/explore/pathway/' + (themeSlug || '')} className="hover:text-[#C4663A] transition-colors">{themeEntry.name}</Link>
              </>
            )}
            {(item as any).content_type && (
              <>
                <span className="mx-1.5">/</span>
                <span>{(item as any).content_type}</span>
              </>
            )}
          </nav>

          {/* Content type label + translation indicator */}
          <div className="flex items-center gap-3 mb-4">
            {(item as any).content_type && (
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>
                {(item as any).content_type}
                {item.pathway_primary && themeEntry && (
                  <span style={{ color: CLAY }}> &middot; {themeEntry.name}</span>
                )}
              </span>
            )}
            {isTranslated && (
              <span className="relative flex items-center gap-1" style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: CLAY }}>
                <Globe size={11} /> {t('content.translated')}
                <WayfinderTooltipPos tipKey="translation_indicator" position="bottom" />
              </span>
            )}
          </div>

          {/* Theme indicators as colored dots */}
          {themeEntry && (
            <div className="flex items-center gap-2 mb-4">
              <span style={{ width: 8, height: 8, background: themeColor, display: 'inline-block' }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: themeColor }}>{themeEntry.name}</span>
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontFamily: SERIF,
            fontSize: 'clamp(26px, 4vw, 44px)',
            fontWeight: 400,
            lineHeight: 1.15,
            color: INK,
            marginBottom: summary ? '0.75rem' : '1rem',
          }}>
            {title}
          </h1>

          {/* Summary */}
          {summary && (
            <p style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontSize: 'clamp(15px, 2vw, 19px)',
              lineHeight: 1.6,
              color: MUTED,
              marginBottom: '1rem',
              maxWidth: 740,
            }}>
              {summary}
            </p>
          )}

          {/* Metadata strip */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1" style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
            {item.published_at && (
              <span>{new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
            {item.last_updated && item.published_at && item.last_updated !== item.published_at && (
              <span>&middot; Updated {new Date(item.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            )}
            {sourceDomain && (
              <>
                <span>&middot;</span>
                <span>{item.source_org_name || sourceDomain}</span>
              </>
            )}
            {orgInfo && (
              <>
                <span>&middot;</span>
                <span>{orgInfo.org_name}</span>
              </>
            )}
          </div>

          {/* Hero image */}
          {item.image_url && (
            <div className="mt-6" style={{ border: `1px solid ${RULE_COLOR}` }}>
              <ContentImage src={item.image_url} alt={title || ''} themeColor={themeColor} pathway={item.pathway_primary} />
            </div>
          )}
        </div>
      </section>

      {/* ── TWO-COLUMN LAYOUT: Body + Sidebar ── */}
      <section style={{ background: '#ffffff' }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-10">

            {/* ── LEFT COLUMN: Article Body ── */}
            <div className="flex-1 min-w-0" style={{ maxWidth: 700 }}>

              {/* Video embed */}
              {(item as any).video_url && (() => {
                const match = (item as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
                const videoId = match ? match[1] : null
                if (!videoId) return null
                return (
                  <div className="mb-6">
                    <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%', border: `1px solid ${RULE_COLOR}` }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={'https://www.youtube-nocookie.com/embed/' + videoId}
                        title={t('content.video')}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Body */}
              {bodyBlocks.length > 0 ? (
                <div className="space-y-4">
                  <span className="block mb-2" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>{t('content.article')}</span>
                  {bodyBlocks.map(function (block, i) {
                    if (!block) return null
                    if (block.startsWith('## ')) {
                      sectionNumber++
                      return (
                        <div key={i} className="flex items-baseline gap-2.5 mt-6 first:mt-0 pb-1.5" style={{ borderBottom: `1px solid ${RULE_COLOR}` }}>
                          <span
                            className="flex-shrink-0"
                            style={{ fontFamily: MONO, fontSize: '0.75rem', fontWeight: 700, color: themeColor }}
                          >
                            {String(sectionNumber).padStart(2, '0')}
                          </span>
                          <h2 style={{ fontFamily: SERIF, fontSize: '1.15rem', fontWeight: 700, color: INK }}>{block.replace(/^## /, '')}</h2>
                        </div>
                      )
                    }
                    if (block.match(/^[-\u2022*] /m)) {
                      const items = block.split(/\n/).filter(function (l) { return l.trim() })
                      return (
                        <ul key={i} className="space-y-1 ml-5" style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.8, color: INK, listStyleType: 'disc' }}>
                          {items.map(function (li, j) {
                            return <li key={j} style={{ color: CLAY }}><span style={{ color: INK }}>{li.replace(/^[-\u2022*]\s*/, '').trim()}</span></li>
                          })}
                        </ul>
                      )
                    }
                    // Drop cap on first regular paragraph
                    const isFirstParagraph = i === bodyBlocks.findIndex(function (b) { return b && !b.startsWith('## ') && !b.match(/^[-\u2022*] /m) })
                    if (isFirstParagraph && block.length > 40) {
                      const firstChar = block.charAt(0)
                      const rest = block.slice(1)
                      return (
                        <p key={i} style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.8, color: INK }}>
                          <span
                            className="float-left mr-2 mt-1"
                            style={{ fontFamily: SERIF, fontSize: '3.5rem', fontWeight: 900, lineHeight: 0.8, color: themeColor }}
                          >
                            {firstChar}
                          </span>
                          {rest}
                        </p>
                      )
                    }
                    if (block.match(/\*\*[^*]+\*\*/)) {
                      const parts = block.split(/(\*\*[^*]+\*\*)/)
                      return (
                        <p key={i} style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.8, color: INK }}>
                          {parts.map(function (part, j) {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                            }
                            return <span key={j}>{part}</span>
                          })}
                        </p>
                      )
                    }
                    return <p key={i} style={{ fontFamily: SERIF, fontSize: 16, lineHeight: 1.8, color: INK }}>{block}</p>
                  })}
                </div>
              ) : (
                item.source_url ? (
                  <div className="p-5 flex items-center justify-between gap-4" style={{ border: `1px solid ${RULE_COLOR}`, background: PARCHMENT_LIGHT }}>
                    <div>
                      <p className="mb-1" style={{ fontFamily: MONO, fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                        {(item as any).content_type === 'video' ? 'Watch the video' :
                         (item as any).content_type === 'tool' ? 'Use the tool' :
                         (item as any).content_type === 'podcast' ? 'Listen now' :
                         'Read the full guide'}
                      </p>
                      <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                        We found this for you at <strong>{item.source_org_name || item.source_domain || sourceDomain}</strong>
                      </p>
                    </div>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90"
                      style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, background: CLAY }}
                    >
                      <ExternalLink size={14} /> Take me there
                    </a>
                  </div>
                ) : null
              )}

              {/* Source CTA box — shown after body content */}
              {item.source_url && bodyBlocks.length > 0 && (
                <div className="mt-6 p-5 flex items-center justify-between gap-4" style={{ border: `1px solid ${RULE_COLOR}`, background: PARCHMENT_LIGHT }}>
                  <div>
                    <p className="mb-1" style={{ fontFamily: MONO, fontSize: '0.56rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                      {(item as any).content_type === 'book' ? 'Read the book' :
                       (item as any).content_type === 'course' ? 'Start the course' :
                       (item as any).content_type === 'video' ? 'Watch the video' :
                       (item as any).content_type === 'diy_kit' ? 'Get the kit' :
                       (item as any).content_type === 'tool' ? 'Use the tool' :
                       (item as any).content_type === 'podcast' ? 'Listen now' :
                       'Go to this resource'}
                    </p>
                    <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
                      We found this for you at <strong>{item.source_org_name || item.source_domain || sourceDomain}</strong>
                    </p>
                  </div>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90"
                    style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, background: CLAY }}
                  >
                    <ExternalLink size={14} /> Take me there
                  </a>
                </div>
              )}

              {/* Break It Down */}
              <div className="mt-6">
                <BreakItDown title={title} summary={summary} type="content" accentColor={themeColor} />
              </div>

              {/* Programs */}
              {programs.length > 0 && (
                <div className="mt-8">
                  <p className="mb-3" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>Programs</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {programs.map(function (prog, i) {
                      return (
                        <div key={i} className="p-4 flex gap-3" style={{ border: `1px solid ${RULE_COLOR}` }}>
                          <div className="w-1 flex-shrink-0" style={{ backgroundColor: themeColor }} />
                          <div>
                            <p className="font-semibold" style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>{prog.name}</p>
                            <p className="mt-1" style={{ fontFamily: SERIF, fontSize: '0.8rem', lineHeight: 1.6, color: MUTED }}>{prog.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Sidebar ── */}
            <aside className="w-full lg:w-[340px] flex-shrink-0 space-y-5">

              {/* At a Glance */}
              <div className="p-5" style={{ background: PARCHMENT_LIGHT, border: `1px solid ${RULE_COLOR}` }}>
                <p className="mb-3" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>{t('content.at_a_glance')}</p>
                <div className="space-y-2.5">
                  {orgInfo && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ fontFamily: SERIF, color: MUTED }}>Organization</span>
                      <Link href={'/organizations/' + orgInfo.org_id} className="font-semibold truncate ml-2 hover:text-[#C4663A] transition-colors" style={{ fontFamily: SERIF, color: CLAY }}>{orgInfo.org_name}</Link>
                    </div>
                  )}
                  {themeSlug && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ fontFamily: SERIF, color: MUTED }}>{t('content.pathway')}</span>
                      <ThemePill themeId={item.pathway_primary} size="sm" />
                    </div>
                  )}
                  {item.center && (
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ fontFamily: SERIF, color: MUTED }}>Center</span>
                      <CenterBadge center={item.center} />
                    </div>
                  )}
                  {focusAreas.length > 0 && (
                    <div className="pt-2.5" style={{ borderTop: `1px solid ${RULE_COLOR}` }}>
                      <p className="mb-2" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>Focus Areas</p>
                      <FocusAreaPills focusAreas={focusAreas} />
                    </div>
                  )}
                </div>
              </div>

              {/* Who Is Responsible */}
              {responsibleOfficials.length > 0 && (
                <div className="p-5" style={{ background: PARCHMENT_LIGHT, border: `1px solid ${RULE_COLOR}` }}>
                  <p className="mb-3" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>Who Is Responsible</p>
                  <div className="space-y-3">
                    {responsibleOfficials.slice(0, 5).map(function (o) {
                      return (
                        <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 overflow-hidden flex-shrink-0" style={{ background: PARCHMENT_WARM }}>
                            {o.photo_url ? (
                              <img src={o.photo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: SERIF, fontWeight: 700, fontSize: '0.75rem', color: MUTED }}>
                                {o.official_name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block text-sm font-medium group-hover:underline truncate" style={{ fontFamily: SERIF, color: INK }}>{o.official_name}</span>
                            <span className="block truncate" style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                              {[o.title, o.party, o.level].filter(Boolean).join(' / ')}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Take Action */}
              {(opportunities.length > 0 || policies.length > 0) && (
                <div className="p-5" style={{ background: PARCHMENT_LIGHT, border: `1px solid ${RULE_COLOR}` }}>
                  <p className="mb-3" style={{ fontFamily: MONO, fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>{t('content.take_action')}</p>
                  <div className="space-y-2">
                    {opportunities.slice(0, 3).map(function (o: any) {
                      return (
                        <Link key={o.opportunity_id} href={'/opportunities/' + o.opportunity_id} className="block text-sm font-medium hover:underline" style={{ fontFamily: SERIF, color: CLAY }}>
                          {o.opportunity_name}
                        </Link>
                      )
                    })}
                    {policies.slice(0, 3).map(function (p: any) {
                      return (
                        <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block text-sm font-medium hover:underline" style={{ fontFamily: SERIF, color: CLAY }}>
                          {p.title_6th_grade || p.policy_name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Hero Quote in sidebar */}
              {heroQuote && (
                <div className="p-5" style={{ borderLeft: `3px solid ${themeColor}`, background: PARCHMENT_WARM }}>
                  <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.6, color: INK }}>
                    &ldquo;{heroQuote}&rdquo;
                  </blockquote>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* ── RELATED CONTENT ── */}
      {related && related.length > 0 && (
        <section style={{ background: PARCHMENT }}>
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="mb-5" style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>Related</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map(function (r: any) {
                const rTheme = r.pathway_primary ? (THEMES as Record<string, { name: string; color: string }>)[r.pathway_primary] : null
                const rColor = rTheme?.color || themeColor
                return (
                  <Link
                    key={r.id}
                    href={'/content/' + r.id}
                    className="block group transition-colors"
                    style={{ background: '#ffffff', border: `1px solid ${RULE_COLOR}` }}
                  >
                    {r.image_url ? (
                      <div className="w-full h-36 overflow-hidden" style={{ borderBottom: `1px solid ${RULE_COLOR}` }}>
                        <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-2" style={{ background: rColor }} />
                    )}
                    <div className="p-4">
                      {rTheme && (
                        <span className="block mb-1.5" style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: rColor }}>{rTheme.name}</span>
                      )}
                      <span className="block group-hover:underline" style={{ fontFamily: SERIF, fontSize: '0.95rem', lineHeight: 1.35, color: INK, fontWeight: 600 }}>
                        {r.title_6th_grade}
                      </span>
                      {r.summary_6th_grade && (
                        <span className="block mt-1.5 line-clamp-2" style={{ fontFamily: SERIF, fontSize: '0.8rem', lineHeight: 1.5, color: MUTED }}>
                          {r.summary_6th_grade}
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

      {/* ── FOCUS AREAS / DESTINATIONS ── */}
      {focusAreas.length > 0 && (
        <section style={{ background: PARCHMENT_LIGHT }}>
          <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <p className="mb-5" style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: MUTED }}>
              {t('content.also_part_of') || 'Also part of these destinations'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {focusAreas.slice(0, 4).map(function (fa: any) {
                const faTheme = fa.theme_id ? (THEMES as Record<string, { color: string }>)[fa.theme_id] : null
                const faColor = faTheme?.color || themeColor
                return (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="group flex items-center gap-3 p-4 transition-colors hover:bg-white"
                    style={{ border: `1px solid ${RULE_COLOR}` }}
                  >
                    <FlowerOfLife size={28} color={faColor} opacity={0.6} />
                    <div>
                      <span className="block" style={{ fontFamily: SERIF, fontSize: '0.88rem', fontWeight: 600, color: INK }}>
                        {fa.focus_area_name}
                      </span>
                      {fa.theme_id && (THEMES as Record<string, { name: string }>)[fa.theme_id] && (
                        <span style={{ fontFamily: MONO, fontSize: '0.52rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: faColor }}>
                          {(THEMES as Record<string, { name: string }>)[fa.theme_id].name}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={14} className="ml-auto transition-colors" style={{ color: MUTED }} />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── QUOTE ── */}
      {quote && (
        <section style={{ background: PARCHMENT_WARM }}>
          <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <blockquote style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 'clamp(18px, 2.5vw, 24px)', lineHeight: 1.6, color: INK }}>
              &ldquo;{quote.quote_text}&rdquo;
            </blockquote>
            {quote.attribution && (
              <p className="mt-4" style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: MUTED }}>
                -- {quote.attribution}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── LIBRARY NUGGETS ── */}
      {libraryNuggets.length > 0 && (
        <section style={{ background: PARCHMENT_LIGHT }}>
          <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} />
          </div>
        </section>
      )}

      {/* ── FOOTER CODA ── */}
      <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 transition-colors hover:text-[#C4663A]"
            style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED }}
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
          { key: 'content_type', label: 'Content Type', type: 'select', value: (item as any).content_type, options: ['news', 'resource', 'guide', 'story', 'report', 'tool', 'video', 'event'] },
          { key: 'is_active', label: 'Active', type: 'select', value: String((item as any).is_active), options: ['true', 'false'] },
        ] as EditField[]}
      />
    </>
  )
}
