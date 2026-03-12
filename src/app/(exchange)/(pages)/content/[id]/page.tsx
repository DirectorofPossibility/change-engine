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
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { ExternalLink, Globe, Sparkles, ArrowRight } from 'lucide-react'
import { WayfinderTooltipPos } from '@/components/exchange/WayfinderTooltips'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { AdminEditPanel } from '@/components/exchange/AdminEditPanel'
import type { EditField } from '@/components/exchange/AdminEditPanel'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'
import { ContentImage } from '@/components/exchange/ContentImage'
import { articleJsonLd } from '@/lib/jsonld'
import { FlowerOfLife } from '@/components/geo/sacred'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { FolFallback } from '@/components/ui/FolFallback'

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

  return (
    <div style={{ background: '#f4f5f7' }}>
      <SpiralTracker action="read_article" pathway={item.pathway_primary || undefined} />

      <DetailPageLayout
        eyebrow={{ text: themeEntry?.name || t('content.news') }}
        eyebrowMeta={
          <>
            {(item as any).content_type && (
              <span className="font-mono uppercase tracking-[0.2em] text-[0.58rem]" style={{ color: '#5c6474' }}>
                {(item as any).content_type}
                {item.pathway_primary && ' / ' + (themeEntry?.name || '')}
              </span>
            )}
            {isTranslated && (
              <span className="relative font-mono uppercase tracking-[0.2em] text-[0.58rem] flex items-center gap-1" style={{ color: '#1b5e8a' }}>
                <Globe size={11} /> {t('content.translated')}
                <WayfinderTooltipPos tipKey="translation_indicator" position="bottom" />
              </span>
            )}
          </>
        }
        title={title}
        heroImage={
          <>
            {item.image_url ? (
              <div className="overflow-hidden" style={{ border: '1px solid #dde1e8' }}>
                <ContentImage src={item.image_url} alt={title || ''} themeColor={themeColor} pathway={item.pathway_primary} />
              </div>
            ) : (
              <FolFallback pathway={item.pathway_primary} height="h-40" />
            )}
            {/* Summary — directly under image */}
            {summary && (
              <div className="mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={11} style={{ color: '#1b5e8a' }} />
                  <span className="font-mono uppercase tracking-[0.2em] text-[0.58rem]" style={{ color: '#5c6474' }}>{t('content.summary')}</span>
                  <WayfinderTooltipPos tipKey="ai_summary_badge" position="bottom" />
                </div>
                <p className="font-body text-[15px] leading-relaxed" style={{ color: '#5c6474' }}>
                  {summary}
                </p>
              </div>
            )}
          </>
        }
        metaRow={
          (item.published_at || item.last_updated) ? (
            <span className="font-mono uppercase tracking-[0.2em] text-[0.58rem]" style={{ color: '#8a929e' }}>
              {item.published_at && new Date(item.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {item.last_updated && item.published_at && item.last_updated !== item.published_at && (
                <> &middot; Updated {new Date(item.last_updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</>
              )}
            </span>
          ) : undefined
        }
        actions={{
          translate: { isTranslated, contentType: 'content_published', contentId: item.inbox_id || id },
          share: { title: title || undefined, via: item.source_org_name || item.source_domain || undefined, url: 'https://www.changeengine.us/content/' + (item.slug || id) },
        }}
        themeColor={themeColor}
        wayfinderData={wayfinderData}
        wayfinderType="content"
        wayfinderEntityId={id}
        userRole={userProfile?.role}
        feedbackType="content_published"
        feedbackId={id}
        feedbackName={item.title_6th_grade || ''}
        jsonLd={jsonLd}
        footer={
          libraryNuggets.length > 0 ? (
            <div className="max-w-[1200px] mx-auto px-8">
              <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} />
            </div>
          ) : undefined
        }
        sidebar={
          <>
            {/* Topics & Focus Areas */}
            <div className="p-4" style={{ border: '1px solid #dde1e8', background: '#ffffff' }}>
              <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>{t('content.at_a_glance')}</p>
              <div className="space-y-2">
                {orgInfo && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5c6474' }}>Organization</span>
                    <Link href={'/organizations/' + orgInfo.org_id} className="font-semibold hover:underline truncate ml-2" style={{ color: '#1b5e8a' }}>{orgInfo.org_name}</Link>
                  </div>
                )}
                {themeSlug && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5c6474' }}>{t('content.pathway')}</span>
                    <ThemePill themeId={item.pathway_primary} size="sm" />
                  </div>
                )}
                {item.center && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5c6474' }}>Center</span>
                    <CenterBadge center={item.center} />
                  </div>
                )}
                {focusAreas.length > 0 && (
                  <div className="pt-2" style={{ borderTop: '1px solid #dde1e8' }}>
                    <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-2" style={{ color: '#5c6474' }}>Focus Areas</p>
                    <FocusAreaPills focusAreas={focusAreas} />
                  </div>
                )}
              </div>
            </div>

            {/* Who Is Responsible */}
            {responsibleOfficials.length > 0 && (
              <div className="p-4" style={{ border: '1px solid #dde1e8', background: '#ffffff' }}>
                <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>Who Is Responsible</p>
                <div className="space-y-3">
                  {responsibleOfficials.slice(0, 5).map(function (o) {
                    return (
                      <Link key={o.official_id} href={'/officials/' + o.official_id} className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#dde1e8' }}>
                          {o.photo_url ? (
                            <img src={o.photo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-display font-bold text-xs" style={{ color: '#5c6474' }}>
                              {o.official_name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium group-hover:underline truncate" style={{ color: '#0d1117' }}>{o.official_name}</span>
                          <span className="block text-[0.65rem] truncate" style={{ color: '#8a929e' }}>
                            {[o.title, o.party, o.level].filter(Boolean).join(' · ')}
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
              <div className="p-4" style={{ border: '1px solid #dde1e8', background: '#ffffff' }}>
                <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>{t('content.take_action')}</p>
                <div className="space-y-2">
                  {opportunities.slice(0, 3).map(function (o: any) {
                    return (
                      <Link key={o.opportunity_id} href={'/opportunities/' + o.opportunity_id} className="block text-sm font-medium hover:underline" style={{ color: '#1b5e8a' }}>
                        {o.opportunity_name}
                      </Link>
                    )
                  })}
                  {policies.slice(0, 3).map(function (p: any) {
                    return (
                      <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block text-sm font-medium hover:underline" style={{ color: '#1b5e8a' }}>
                        {p.title_6th_grade || p.policy_name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Hero Quote in sidebar */}
            {heroQuote && (
              <div className="p-4" style={{ borderLeft: `3px solid ${themeColor}`, background: '#ffffff' }}>
                <blockquote className="font-body italic text-[1.05rem] leading-relaxed" style={{ color: '#0d1117' }}>
                  &ldquo;{heroQuote}&rdquo;
                </blockquote>
              </div>
            )}
          </>
        }
      >
        {/* Video embed */}
        {(item as any).video_url && (() => {
          const match = (item as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
          const videoId = match ? match[1] : null
          if (!videoId) return null
          return (
            <div className="mb-6">
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%', border: '1px solid #dde1e8' }}>
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
            <span className="font-mono uppercase tracking-[0.2em] text-[0.58rem] block mb-2" style={{ color: '#5c6474' }}>{t('content.article')}</span>
            {bodyBlocks.map(function (block, i) {
              if (!block) return null
              if (block.startsWith('## ')) {
                sectionNumber++
                return (
                  <div key={i} className="flex items-baseline gap-2.5 mt-6 first:mt-0 pb-1.5" style={{ borderBottom: '1px solid #dde1e8' }}>
                    <span
                      className="font-mono text-xs font-bold flex-shrink-0"
                      style={{ color: themeColor }}
                    >
                      {String(sectionNumber).padStart(2, '0')}
                    </span>
                    <h2 className="text-lg font-display font-bold" style={{ color: '#0d1117' }}>{block.replace(/^## /, '')}</h2>
                  </div>
                )
              }
              if (block.match(/^[-\u2022*] /m)) {
                const items = block.split(/\n/).filter(function (l) { return l.trim() })
                return (
                  <ul key={i} className="font-body list-disc list-outside space-y-1 leading-relaxed ml-5" style={{ color: '#0d1117' }}>
                    {items.map(function (li, j) {
                      return <li key={j}>{li.replace(/^[-\u2022*]\s*/, '').trim()}</li>
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
                  <p key={i} className="font-body leading-relaxed" style={{ color: '#0d1117' }}>
                    <span
                      className="font-display float-left leading-[0.8] mr-2 mt-1"
                      style={{ fontSize: '3.5rem', fontWeight: 900, color: themeColor }}
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
                  <p key={i} className="font-body leading-relaxed" style={{ color: '#0d1117' }}>
                    {parts.map(function (part, j) {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                      }
                      return <span key={j}>{part}</span>
                    })}
                  </p>
                )
              }
              return <p key={i} className="font-body leading-relaxed" style={{ color: '#0d1117' }}>{block}</p>
            })}
          </div>
        ) : (
          item.source_url ? (
          <div className="p-5 flex items-center justify-between gap-4" style={{ border: `2px solid ${themeColor}`, background: '#ffffff' }}>
            <div>
              <p className="font-mono uppercase tracking-[0.08em] text-[0.56rem] mb-1" style={{ color: '#5c6474' }}>
                {(item as any).content_type === 'video' ? 'Watch the video' :
                 (item as any).content_type === 'tool' ? 'Use the tool' :
                 (item as any).content_type === 'podcast' ? 'Listen now' :
                 'Read the full guide'}
              </p>
              <p className="font-body text-sm" style={{ color: '#0d1117' }}>
                We found this for you at <strong>{item.source_org_name || item.source_domain || (() => { try { return new URL(item.source_url).hostname } catch { return 'the source' } })()}</strong>
              </p>
            </div>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 font-mono uppercase tracking-[0.08em] text-[0.7rem] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: themeColor }}
            >
              <ExternalLink size={14} /> Take me there
            </a>
          </div>
          ) : null
        )}

        {/* Break It Down */}
        <BreakItDown title={title} summary={summary} type="content" accentColor={themeColor} />

        {/* Deep link CTA — concierge handoff to the actual resource */}
        {item.source_url && (
          <div className="mt-6 p-5 flex items-center justify-between gap-4" style={{ border: `2px solid ${themeColor}`, background: '#ffffff' }}>
            <div>
              <p className="font-mono uppercase tracking-[0.08em] text-[0.56rem] mb-1" style={{ color: '#5c6474' }}>
                {(item as any).content_type === 'book' ? 'Read the book' :
                 (item as any).content_type === 'course' ? 'Start the course' :
                 (item as any).content_type === 'video' ? 'Watch the video' :
                 (item as any).content_type === 'diy_kit' ? 'Get the kit' :
                 (item as any).content_type === 'tool' ? 'Use the tool' :
                 (item as any).content_type === 'podcast' ? 'Listen now' :
                 'Go to this resource'}
              </p>
              <p className="font-body text-sm" style={{ color: '#0d1117' }}>
                We found this for you at <strong>{item.source_org_name || item.source_domain || (() => { try { return new URL(item.source_url).hostname } catch { return 'the source' } })()}</strong>
              </p>
            </div>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 font-mono uppercase tracking-[0.08em] text-[0.7rem] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: themeColor }}
            >
              <ExternalLink size={14} /> Take me there
            </a>
          </div>
        )}

        {/* Programs */}
        {programs.length > 0 && (
          <div className="mt-6">
            <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-3" style={{ color: '#5c6474' }}>Programs</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {programs.map(function (prog, i) {
                return (
                  <div key={i} className="p-4 flex gap-3" style={{ border: '1px solid #dde1e8' }}>
                    <div className="w-1 flex-shrink-0" style={{ backgroundColor: themeColor }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0d1117' }}>{prog.name}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: '#5c6474' }}>{prog.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Related */}
        {related && related.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1.5px solid #dde1e8' }}>
            <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-4" style={{ color: '#5c6474' }}>Related</p>
            <RelatedContent items={related} />
          </div>
        )}

        {/* Also part of these destinations */}
        {focusAreas.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1.5px solid #dde1e8' }}>
            <p className="font-mono uppercase tracking-[0.2em] text-[0.58rem] mb-4" style={{ color: '#5c6474' }}>
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
                    style={{ border: '1px solid #dde1e8' }}
                  >
                    <FlowerOfLife size={28} color={faColor} opacity={0.6} />
                    <div>
                      <span className="font-body text-[.88rem] font-semibold block" style={{ color: '#0d1117' }}>
                        {fa.focus_area_name}
                      </span>
                      {fa.theme_id && (THEMES as Record<string, { name: string }>)[fa.theme_id] && (
                        <span className="font-mono uppercase tracking-[0.08em] text-[0.52rem]" style={{ color: faColor }}>
                          {(THEMES as Record<string, { name: string }>)[fa.theme_id].name}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={14} className="ml-auto text-faint group-hover:text-blue transition-colors" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Quote */}
        {quote && (
          <div className="mt-8">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />
          </div>
        )}
      </DetailPageLayout>

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
    </div>
  )
}
