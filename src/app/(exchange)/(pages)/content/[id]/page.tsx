import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { THEMES, LANGUAGES } from '@/lib/constants'
import { ThemePill } from '@/components/ui/ThemePill'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { RelatedContent } from '@/components/exchange/RelatedContent'
import { DetailWayfinder } from '@/components/exchange/DetailWayfinder'
import { getWayfinderContext, getRandomQuote } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { getFocusAreasByIds, getRelatedOpportunities, getRelatedPolicies } from '@/lib/data/exchange'
import { getLibraryNuggets } from '@/lib/data/library'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { ExternalLink, Globe, Sparkles } from 'lucide-react'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { BreakItDown } from '@/components/exchange/BreakItDown'
import { QuoteCard } from '@/components/exchange/QuoteCard'

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

  // Language + translations
  const cookieStore = await cookies()
  const langCode = cookieStore.get('lang')?.value || 'en'
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
  const themeColor = themeEntry?.color || '#C75B2A'

  const bodyText = sanitizeBody(translatedBody || item.body || '')
  const bodyBlocks = bodyText.split(/\n\n+/).map(function (b) { return b.trim() }).filter(Boolean)
  let sectionNumber = 0

  return (
    <div>
      <Breadcrumb items={[
        ...(themeEntry ? [{ label: themeEntry.name, href: '/pathways/' + themeSlug }] : []),
        { label: title || 'Content' },
      ]} />

      {/* ── HERO ── */}
      <section className="bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-10">
            <div className="flex-1 min-w-0">
              {/* Meta row */}
              <div className="flex items-center gap-3 mb-4">
                <ThemePill themeId={item.pathway_primary} size="sm" />
                {(item.source_org_name || item.source_domain) && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light">
                    {item.source_org_name || item.source_domain}
                  </span>
                )}
                {item.published_at && (
                  <>
                    <span className="text-brand-border">/</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light">
                      {new Date(item.published_at).toLocaleDateString()}
                    </span>
                  </>
                )}
                {isTranslated && (
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-success flex items-center gap-1">
                    <Globe size={11} /> Translated
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[clamp(1.8rem,4vw,2.8rem)] leading-tight text-brand-text mb-4">
                {title}
              </h1>

              {summary && (
                <p className="text-lg leading-relaxed text-brand-muted max-w-2xl mb-6">
                  {summary}
                </p>
              )}

              {/* Single source button */}
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-brand-text rounded-lg text-sm font-semibold text-brand-text hover:bg-brand-text hover:text-white transition-colors"
                style={{ boxShadow: '2px 2px 0 #2d2d2d' }}
              >
                <ExternalLink size={15} />
                Visit source
              </a>
            </div>

            {/* Image */}
            {item.image_url && (
              <div className="mt-6 lg:mt-0 lg:flex-shrink-0 lg:w-80">
                <div className="rounded-lg overflow-hidden border-2 border-brand-border" style={{ boxShadow: '3px 3px 0 #D4CCBE' }}>
                  <img src={item.image_url} alt={title || ''} className="w-full h-56 object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, ' + themeColor + ', transparent 60%)' }} />
      </section>

      {/* Quote banner */}
      {heroQuote && (
        <div className="bg-brand-bg-alt border-b border-brand-border">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            <div className="flex gap-4">
              <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
              <blockquote className="text-lg font-serif italic text-brand-text leading-relaxed">
                &ldquo;{heroQuote}&rdquo;
              </blockquote>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN + SIDEBAR ── */}
      <div className="max-w-[1200px] mx-auto px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Main content */}
          <div>
            {/* Video embed */}
            {(item as any).video_url && (() => {
              const match = (item as any).video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/)
              const videoId = match ? match[1] : null
              if (!videoId) return null
              return (
                <div className="mb-8">
                  <div className="relative w-full overflow-hidden rounded-lg border-2 border-brand-border" style={{ paddingBottom: '56.25%', boxShadow: '3px 3px 0 #D4CCBE' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={'https://www.youtube-nocookie.com/embed/' + videoId}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )
            })()}

            {/* Body */}
            {bodyBlocks.length > 0 && (
              <div className="space-y-5">
                {bodyBlocks.map(function (block, i) {
                  if (!block) return null
                  if (block.startsWith('## ')) {
                    sectionNumber++
                    return (
                      <div key={i} className="flex items-center gap-3 mt-8 first:mt-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          {sectionNumber}
                        </div>
                        <h2 className="text-xl font-serif text-brand-text">{block.replace(/^## /, '')}</h2>
                      </div>
                    )
                  }
                  if (block.match(/^[-\u2022*] /m)) {
                    const items = block.split(/\n/).filter(function (l) { return l.trim() })
                    return (
                      <ul key={i} className="list-disc list-inside space-y-1.5 text-brand-text leading-relaxed pl-10">
                        {items.map(function (li, j) {
                          return <li key={j}>{li.replace(/^[-\u2022*]\s*/, '').trim()}</li>
                        })}
                      </ul>
                    )
                  }
                  if (block.match(/\*\*[^*]+\*\*/)) {
                    const parts = block.split(/(\*\*[^*]+\*\*)/)
                    return (
                      <p key={i} className="text-brand-text leading-relaxed pl-10">
                        {parts.map(function (part, j) {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                          }
                          return <span key={j}>{part}</span>
                        })}
                      </p>
                    )
                  }
                  return <p key={i} className="text-brand-text leading-relaxed pl-10">{block}</p>
                })}
              </div>
            )}

            {/* Break It Down */}
            <BreakItDown title={title} summary={summary} type="content" accentColor={themeColor} />

            {/* Programs */}
            {programs.length > 0 && (
              <div className="mt-8">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-3">Programs</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {programs.map(function (prog, i) {
                    return (
                      <div key={i} className="border-2 border-brand-border rounded-lg p-4 flex gap-3" style={{ boxShadow: '2px 2px 0 #E8DFCF' }}>
                        <div className="w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: themeColor }} />
                        <div>
                          <p className="text-sm font-semibold text-brand-text">{prog.name}</p>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed">{prog.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4">
            {/* Wayfinder */}
            <DetailWayfinder data={wayfinderData} currentType="content" currentId={id} userRole={userProfile?.role} />

            {/* At a Glance */}
            <div className="border-2 border-brand-border rounded-lg p-4" style={{ boxShadow: '2px 2px 0 #E8DFCF' }}>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-3">At a Glance</p>
              <div className="space-y-2">
                {orgInfo && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-muted">Organization</span>
                    <Link href={'/organizations/' + orgInfo.org_id} className="font-semibold text-brand-accent hover:underline truncate ml-2">{orgInfo.org_name}</Link>
                  </div>
                )}
                {themeSlug && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-brand-muted">Pathway</span>
                    <Link href={'/pathways/' + themeSlug}><ThemePill themeId={item.pathway_primary} size="sm" /></Link>
                  </div>
                )}
                {focusAreas.length > 0 && (
                  <div className="pt-2 border-t border-brand-border">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-2">Focus Areas</p>
                    <FocusAreaPills focusAreas={focusAreas} />
                  </div>
                )}
              </div>
            </div>

            {/* Take Action */}
            {(opportunities.length > 0 || policies.length > 0) && (
              <div className="border-2 border-brand-border rounded-lg p-4" style={{ boxShadow: '2px 2px 0 #E8DFCF' }}>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mb-3">Take Action</p>
                <div className="space-y-2">
                  {opportunities.slice(0, 3).map(function (o: any) {
                    return (
                      <Link key={o.opportunity_id} href={'/opportunities/' + o.opportunity_id} className="block text-sm font-medium text-brand-accent hover:underline">
                        {o.opportunity_name}
                      </Link>
                    )
                  })}
                  {policies.slice(0, 3).map(function (p: any) {
                    return (
                      <Link key={p.policy_id} href={'/policies/' + p.policy_id} className="block text-sm font-medium text-brand-accent hover:underline">
                        {p.title_6th_grade || p.policy_name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Suggest Edit */}
            <div className="border-2 border-brand-border rounded-lg p-4 text-center" style={{ boxShadow: '2px 2px 0 #E8DFCF' }}>
              <Link
                href={'/dashboard/submit?ref=' + encodeURIComponent(id)}
                className="text-sm text-brand-accent hover:underline font-semibold"
              >
                Suggest an edit
              </Link>
              <p className="text-xs text-brand-muted mt-1">Help us keep information accurate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Library nuggets */}
      {libraryNuggets.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-8">
          <LibraryNugget nuggets={libraryNuggets} variant="section" color={themeColor} />
        </div>
      )}

      {/* Quote */}
      {quote && (
        <div className="max-w-[1200px] mx-auto px-8">
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={themeColor} />
        </div>
      )}

      {/* Related */}
      {related && related.length > 0 && (
        <div className="max-w-[1200px] mx-auto px-8 pb-12">
          <RelatedContent items={related} />
        </div>
      )}
    </div>
  )
}
