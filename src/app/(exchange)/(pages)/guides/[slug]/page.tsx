import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import {
  getGuideBySlug,
  getFocusAreasByIds,
  getRelatedOpportunities,
  getRelatedPolicies,
  getRelatedOrgsForGuide,
  getRelatedContentForGuide,
  getAdjacentGuides,
  getSDGMap,
  getSDOHMap,
  getLangId,
  fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { ThemePill } from '@/components/ui/ThemePill'
import { FocusAreaPills } from '@/components/exchange/FocusAreaPills'
import { SDGBadge } from '@/components/ui/SDGBadge'
import { SDOHBadge } from '@/components/ui/SDOHBadge'
import { ReadingProgressBar } from '@/components/exchange/ReadingProgressBar'
import { TableOfContents } from '@/components/exchange/TableOfContents'
import { GuideNavigation } from '@/components/exchange/GuideNavigation'
import { GuideMiniGraph } from '@/components/exchange/GuideMiniGraph'
import { ExternalLink, Building2, Newspaper, FileText, Scale } from 'lucide-react'
import { getUIStrings } from '@/lib/i18n'
import { ENGAGEMENT_LEVEL_COLORS } from '@/lib/constants'

/** Strip dangerous HTML tags and attributes to prevent XSS. */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*\S+/gi, '')
    .replace(/(?:href|src)\s*=\s*["']?\s*javascript:/gi, 'data-blocked=')
    .replace(/<(iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '')
}

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

interface GuideSection {
  id: string
  title: string
  content: string
  icon?: string
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)
  if (!guide) return { title: 'Not Found' }
  return {
    title: guide.title + ' — Change Engine',
    description: guide.description || 'A guide on the Change Engine.',
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) notFound()

  const sections: GuideSection[] = Array.isArray(guide.sections) ? (guide.sections as unknown as GuideSection[]) : []
  const focusAreaIds = guide.focus_area_ids ?? []

  // Fetch translations
  const langId = await getLangId()
  const guideTranslations = langId
    ? await fetchTranslationsForTable('guides', [guide.guide_id], langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const guideTitle = guideTranslations[guide.guide_id]?.title || guide.title
  const guideDescription = guideTranslations[guide.guide_id]?.summary || guide.description

  // Fetch all related data in parallel
  const [
    focusAreas,
    relatedOrgs,
    relatedContent,
    opportunities,
    policies,
    adjacentGuides,
  ] = await Promise.all([
    focusAreaIds.length > 0 ? getFocusAreasByIds(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOrgsForGuide(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedContentForGuide(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    getAdjacentGuides(guide.display_order, guide.theme_id),
  ])

  // Fetch translations for related content
  const contentTranslations = langId && relatedContent.length > 0
    ? await fetchTranslationsForTable('content_published', relatedContent.map((c: any) => c.inbox_id || c.id), langId)
    : {}

  // Collect unique SDG IDs and SDOH codes from focus areas
  const sdgIds = Array.from(new Set(focusAreas.map(fa => fa.sdg_id).filter(Boolean))) as string[]
  const sdohCodes = Array.from(new Set(focusAreas.map(fa => fa.sdoh_code).filter(Boolean))) as string[]

  // Fetch SDG and SDOH maps only if needed
  const [sdgMap, sdohMap] = await Promise.all([
    sdgIds.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    sdohCodes.length > 0 ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
  ])

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      <ReadingProgressBar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-16 sm:py-20" style={{ background: PARCHMENT_WARM }}>
        <Image
          src="/images/fol/seed-of-life.svg"
          alt=""
          width={500}
          height={500}
          className="opacity-[0.04] absolute top-1/2 right-8 -translate-y-1/2 pointer-events-none"
        />
        <div className="relative z-10 max-w-[900px] mx-auto px-6">
          <p style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-[0.15em] uppercase mb-4">
            Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, color: INK }} className="text-3xl sm:text-4xl leading-[1.15] mb-4">
            {guideTitle}
          </h1>
          {guideDescription && (
            <p style={{ fontFamily: SERIF, color: MUTED }} className="text-lg leading-relaxed max-w-2xl">
              {guideDescription}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
            {guide.engagement_level && (
              <span className={'text-xs px-2 py-0.5 font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')} style={{ fontFamily: MONO }}>
                {guide.engagement_level}
              </span>
            )}
            {guide.source_url && (
              <a
                href={guide.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ fontFamily: MONO, color: CLAY }}
              >
                <ExternalLink size={12} />
                {t('guides.original_source')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      {guide.hero_image_url && (
        <div className="max-w-[900px] mx-auto px-6 -mt-4">
          <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
            <Image
              src={guide.hero_image_url}
              alt={guideTitle}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* ── BREADCRUMB ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-4 pb-2">
        <nav style={{ fontFamily: MONO, color: MUTED }} className="text-xs tracking-wide">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline" style={{ color: CLAY }}>{t('guides.title')}</Link>
          <span className="mx-2">/</span>
          <span>{guideTitle}</span>
        </nav>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Table of contents */}
        <TableOfContents sections={sections} />

        {/* Sections */}
        {sections.length > 0 && (
          <div className="space-y-8 mt-8">
            {sections.map(function (section) {
              return (
                <section key={section.id} id={'section-' + section.id} className="scroll-mt-16" style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '2rem' }}>
                  <h2 style={{ fontFamily: SERIF, color: INK, fontSize: '1.5rem' }} className="mb-3">
                    {section.title}
                  </h2>
                  <div
                    className="prose prose-sm max-w-none"
                    style={{ color: INK }}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                  />
                </section>
              )
            })}
          </div>
        )}

        {/* content_html */}
        {guide.content_html && (
          <div
            className="prose prose-sm max-w-none mt-8"
            style={{ color: INK }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content_html) }}
          />
        )}

        {/* ── SIDEBAR CONTENT INLINED ── */}
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, marginTop: '2rem', paddingTop: '2rem' }}>
          {/* Focus areas */}
          {focusAreas.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3">{t('guides.focus_areas')}</h3>
              <FocusAreaPills focusAreas={focusAreas} />
            </div>
          )}

          {/* SDG badges */}
          {sdgIds.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3">{t('guides.global_goals')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {sdgIds.map(function (sdg) {
                  const info = sdgMap[sdg]
                  if (!info) return null
                  return (
                    <SDGBadge
                      key={sdg}
                      sdgNumber={info.sdg_number}
                      sdgName={info.sdg_name}
                      sdgColor={info.sdg_color}
                      linkToExplore
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* SDOH badges */}
          {sdohCodes.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3">{t('guides.social_determinants')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {sdohCodes.map(function (code) {
                  const info = sdohMap[code]
                  if (!info) return null
                  return (
                    <SDOHBadge
                      key={code}
                      sdohCode={code}
                      sdohName={info.sdoh_name}
                      sdohDescription={info.sdoh_description}
                      linkToExplore
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Related organizations */}
          {relatedOrgs.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3 flex items-center gap-1.5">
                <Building2 size={16} style={{ color: MUTED }} />
                {t('guides.related_orgs')}
              </h3>
              <div className="space-y-3">
                {relatedOrgs.map(function (org) {
                  return (
                    <Link
                      key={org.org_id}
                      href={'/organizations/' + org.org_id}
                      className="block group"
                    >
                      <div className="flex items-start gap-2">
                        {org.logo_url && (
                          <Image
                            src={org.logo_url}
                            alt=""
                            width={28}
                            height={28}
                            className="object-contain flex-shrink-0 mt-0.5"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-medium group-hover:underline line-clamp-1" style={{ color: INK }}>
                            {org.org_name}
                          </span>
                          {org.description_5th_grade && (
                            <p className="text-xs line-clamp-2 mt-0.5" style={{ color: MUTED }}>{org.description_5th_grade}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Related opportunities */}
          {opportunities.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3 flex items-center gap-1.5">
                <Newspaper size={16} style={{ color: MUTED }} />
                {t('guides.opportunities')}
              </h3>
              <div className="space-y-2">
                {opportunities.slice(0, 5).map(function (opp: any) {
                  return (
                    <div key={opp.opportunity_id} style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.5rem' }}>
                      <p className="text-sm font-medium line-clamp-2" style={{ color: INK }}>{opp.opportunity_name}</p>
                      {opp.description_5th_grade && (
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: MUTED }}>{opp.description_5th_grade}</p>
                      )}
                      {opp.registration_url && (
                        <a
                          href={opp.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline mt-0.5 inline-block"
                          style={{ color: CLAY }}
                        >
                          {t('guides.learn_more')} &rarr;
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Related policies */}
          {policies.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3 flex items-center gap-1.5">
                <Scale size={16} style={{ color: MUTED }} />
                {t('guides.related_policies')}
              </h3>
              <ul className="space-y-2">
                {policies.slice(0, 5).map(function (pol: any) {
                  return (
                    <li key={pol.policy_id} style={{ borderBottom: '1px dotted ' + RULE_COLOR, paddingBottom: '0.5rem' }}>
                      <Link href={'/policies/' + pol.policy_id} className="group">
                        <span className="text-sm font-medium group-hover:underline line-clamp-2" style={{ color: INK }}>
                          {pol.policy_name}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pol.bill_number && (
                          <span className="text-xs" style={{ fontFamily: MONO, color: MUTED }}>{pol.bill_number}</span>
                        )}
                        {pol.status && (
                          <span className="text-xs" style={{ color: MUTED }}>{pol.status}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Related content articles */}
          {relatedContent.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3 flex items-center gap-1.5">
                <FileText size={16} style={{ color: MUTED }} />
                {t('guides.related_articles')}
              </h3>
              <div className="space-y-3">
                {relatedContent.map(function (item: any) {
                  const itemId = item.inbox_id || item.id
                  const itemTitle = contentTranslations[itemId]?.title || item.title_6th_grade
                  const itemSummary = contentTranslations[itemId]?.summary || item.summary_6th_grade
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="block group"
                    >
                      <div className="flex gap-2">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt=""
                            width={48}
                            height={36}
                            className="object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-medium group-hover:underline line-clamp-2" style={{ color: INK }}>
                            {itemTitle}
                          </span>
                          {itemSummary && (
                            <p className="text-xs line-clamp-1 mt-0.5" style={{ color: MUTED }}>{itemSummary}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mini knowledge graph */}
          {focusAreas.length > 0 && (
            <div className="mb-6">
              <h3 style={{ fontFamily: SERIF, color: INK, fontSize: '1.25rem' }} className="mb-3">{t('guides.knowledge_map')}</h3>
              <GuideMiniGraph
                guideTitle={guideTitle}
                focusAreas={focusAreas.map(fa => ({
                  focus_id: fa.focus_id,
                  focus_area_name: fa.focus_area_name,
                  theme_id: fa.theme_id ?? null,
                }))}
                relatedOrgs={relatedOrgs.map(o => ({ org_id: o.org_id, org_name: o.org_name }))}
                relatedServices={0}
                relatedContent={relatedContent.length}
              />
            </div>
          )}
        </div>

        {/* Guide navigation */}
        <GuideNavigation prev={adjacentGuides.prev} next={adjacentGuides.next} />
      </div>

      {/* ── FOOTER LINK ── */}
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <div style={{ borderTop: '1px dotted ' + RULE_COLOR, paddingTop: '1.5rem' }}>
          <Link href="/guides" style={{ fontFamily: MONO, color: CLAY }} className="text-sm hover:underline">
            &larr; Back to Guides
          </Link>
        </div>
      </div>
    </div>
  )
}
