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
    title: guide.title + ' — Community Exchange',
    description: guide.description || 'A guide on the Community Exchange.',
  }
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = await getGuideBySlug(slug)

  if (!guide) notFound()

  const sections: GuideSection[] = Array.isArray(guide.sections) ? (guide.sections as unknown as GuideSection[]) : []
  const focusAreaIds = guide.focus_area_ids ?? []

  const langId = await getLangId()
  const guideTranslations = langId
    ? await fetchTranslationsForTable('guides', [guide.guide_id], langId)
    : {}

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const guideTitle = guideTranslations[guide.guide_id]?.title || guide.title
  const guideDescription = guideTranslations[guide.guide_id]?.summary || guide.description

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

  const contentTranslations = langId && relatedContent.length > 0
    ? await fetchTranslationsForTable('content_published', relatedContent.map((c: any) => c.inbox_id || c.id), langId)
    : {}

  const sdgIds = Array.from(new Set(focusAreas.map(fa => fa.sdg_id).filter(Boolean))) as string[]
  const sdohCodes = Array.from(new Set(focusAreas.map(fa => fa.sdoh_code).filter(Boolean))) as string[]

  const [sdgMap, sdohMap] = await Promise.all([
    sdgIds.length > 0 ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    sdohCodes.length > 0 ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
  ])

  const hasSidebar = focusAreas.length > 0 || sdgIds.length > 0 || sdohCodes.length > 0
    || relatedOrgs.length > 0 || opportunities.length > 0 || policies.length > 0
    || relatedContent.length > 0 || guide.source_url

  return (
    <>
      <ReadingProgressBar />

      <div style={{ background: '#FAF8F5' }}>
        <div className="max-w-[1200px] mx-auto px-8 py-8">
          <Link href="/design2/library" className="text-[13px] font-semibold mb-4 inline-block" style={{ color: '#6B6560' }}>
            ← Library
          </Link>

          {/* Hero */}
          {guide.hero_image_url && (
            <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-xl overflow-hidden mb-8">
              <Image
                src={guide.hero_image_url}
                alt={guideTitle}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h1 className="absolute bottom-4 left-4 right-4 text-2xl sm:text-3xl font-serif font-bold text-white">
                {guideTitle}
              </h1>
            </div>
          )}

          {!guide.hero_image_url && (
            <>
              <h1 className="font-serif text-4xl mb-3" style={{ color: '#1a1a1a' }}>{guideTitle}</h1>
              <div className="h-1 w-16 rounded-full mb-4" style={{ background: '#C75B2A' }} />
            </>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-3 flex-wrap mb-6">
            {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
            {guide.engagement_level && (
              <span className={'text-xs px-2 py-0.5 rounded font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')}>
                {guide.engagement_level}
              </span>
            )}
            {guide.source_url && (
              <a
                href={guide.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs hover:underline flex items-center gap-1"
                style={{ color: '#C75B2A' }}
              >
                <ExternalLink size={12} />
                {t('guides.original_source')}
              </a>
            )}
          </div>

          {guideDescription && (
            <p className="text-[15px] mb-8 max-w-3xl" style={{ color: '#6B6560' }}>{guideDescription}</p>
          )}

          <TableOfContents sections={sections} />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {sections.length > 0 && (
                <div className="space-y-6">
                  {sections.map(function (section) {
                    return (
                      <section key={section.id} id={'section-' + section.id} className="bg-white rounded-xl border p-6 scroll-mt-16" style={{ borderColor: '#E2DDD5' }}>
                        <h2 className="text-xl font-serif font-bold mb-3" style={{ color: '#1a1a1a' }}>
                          {section.icon && <span className="mr-2">{section.icon}</span>}
                          {section.title}
                        </h2>
                        <div
                          className="prose prose-sm max-w-none"
                          style={{ color: '#1a1a1a' }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.content) }}
                        />
                      </section>
                    )
                  })}
                </div>
              )}

              {guide.content_html && (
                <div
                  className="prose prose-sm max-w-none mt-8 bg-white rounded-xl border p-6"
                  style={{ color: '#1a1a1a', borderColor: '#E2DDD5' }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content_html) }}
                />
              )}

              {/* Guide navigation — design2 links */}
              <div className="flex justify-between mt-12 pt-8" style={{ borderTop: '1px solid #E2DDD5' }}>
                {adjacentGuides.prev ? (
                  <Link href={'/design2/guides/' + adjacentGuides.prev.slug} className="group">
                    <span className="text-[11px] block mb-1" style={{ color: '#9B9590' }}>Previous guide</span>
                    <span className="font-serif font-medium" style={{ color: '#1a1a1a' }}>{adjacentGuides.prev.title}</span>
                  </Link>
                ) : <div />}
                {adjacentGuides.next ? (
                  <Link href={'/design2/guides/' + adjacentGuides.next.slug} className="text-right group">
                    <span className="text-[11px] block mb-1" style={{ color: '#9B9590' }}>Next guide</span>
                    <span className="font-serif font-medium" style={{ color: '#1a1a1a' }}>{adjacentGuides.next.title}</span>
                  </Link>
                ) : <div />}
              </div>
            </div>

            {/* Rich sidebar */}
            {hasSidebar && (
              <aside className="lg:w-80 shrink-0 space-y-4">
                {focusAreas.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3" style={{ color: '#1a1a1a' }}>{t('guides.focus_areas')}</h3>
                    <FocusAreaPills focusAreas={focusAreas} />
                  </div>
                )}

                {sdgIds.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3" style={{ color: '#1a1a1a' }}>{t('guides.global_goals')}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sdgIds.map(function (sdg) {
                        const info = sdgMap[sdg]
                        if (!info) return null
                        return <SDGBadge key={sdg} sdgNumber={info.sdg_number} sdgName={info.sdg_name} sdgColor={info.sdg_color} linkToExplore />
                      })}
                    </div>
                  </div>
                )}

                {sdohCodes.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3" style={{ color: '#1a1a1a' }}>{t('guides.social_determinants')}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sdohCodes.map(function (code) {
                        const info = sdohMap[code]
                        if (!info) return null
                        return <SDOHBadge key={code} sdohCode={code} sdohName={info.sdoh_name} sdohDescription={info.sdoh_description} linkToExplore />
                      })}
                    </div>
                  </div>
                )}

                {relatedOrgs.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#1a1a1a' }}>
                      <Building2 size={14} style={{ color: '#6B6560' }} />
                      {t('guides.related_orgs')}
                    </h3>
                    <div className="space-y-3">
                      {relatedOrgs.map(function (org) {
                        return (
                          <Link key={org.org_id} href={'/design2/organizations/' + org.org_id} className="block group">
                            <div className="flex items-start gap-2">
                              {org.logo_url && (
                                <img src={org.logo_url} alt="" width={28} height={28} className="rounded object-contain flex-shrink-0 mt-0.5" />
                              )}
                              <div className="min-w-0">
                                <span className="text-[13px] font-medium line-clamp-1" style={{ color: '#1a1a1a' }}>{org.org_name}</span>
                                {org.description_5th_grade && (
                                  <p className="text-[11px] line-clamp-2 mt-0.5" style={{ color: '#6B6560' }}>{org.description_5th_grade}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {opportunities.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#1a1a1a' }}>
                      <Newspaper size={14} style={{ color: '#6B6560' }} />
                      {t('guides.opportunities')}
                    </h3>
                    <div className="space-y-2">
                      {opportunities.slice(0, 5).map(function (opp: any) {
                        return (
                          <div key={opp.opportunity_id} className="border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: '#E2DDD5' }}>
                            <p className="text-[13px] font-medium line-clamp-2" style={{ color: '#1a1a1a' }}>{opp.opportunity_name}</p>
                            {opp.description_5th_grade && (
                              <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: '#6B6560' }}>{opp.description_5th_grade}</p>
                            )}
                            {opp.registration_url && (
                              <a href={opp.registration_url} target="_blank" rel="noopener noreferrer" className="text-[11px] hover:underline mt-0.5 inline-block" style={{ color: '#C75B2A' }}>
                                {t('guides.learn_more')} &rarr;
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {policies.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#1a1a1a' }}>
                      <Scale size={14} style={{ color: '#6B6560' }} />
                      {t('guides.related_policies')}
                    </h3>
                    <ul className="space-y-2">
                      {policies.slice(0, 5).map(function (pol: any) {
                        return (
                          <li key={pol.policy_id} className="border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: '#E2DDD5' }}>
                            <Link href={'/design2/policies/' + pol.policy_id} className="group">
                              <span className="text-[13px] font-medium line-clamp-2" style={{ color: '#1a1a1a' }}>{pol.policy_name}</span>
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              {pol.bill_number && <span className="text-[11px] font-mono" style={{ color: '#6B6560' }}>{pol.bill_number}</span>}
                              {pol.status && <span className="text-[11px]" style={{ color: '#6B6560' }}>{pol.status}</span>}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {relatedContent.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#1a1a1a' }}>
                      <FileText size={14} style={{ color: '#6B6560' }} />
                      {t('guides.related_articles')}
                    </h3>
                    <div className="space-y-3">
                      {relatedContent.map(function (item: any) {
                        const itemId = item.inbox_id || item.id
                        const itemTitle = contentTranslations[itemId]?.title || item.title_6th_grade
                        const itemSummary = contentTranslations[itemId]?.summary || item.summary_6th_grade
                        return (
                          <Link key={item.id} href={'/design2/content/' + item.id} className="block group">
                            <div className="flex gap-2">
                              {item.image_url && (
                                <img src={item.image_url} alt="" width={48} height={36} className="rounded object-cover flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="text-[13px] font-medium line-clamp-2" style={{ color: '#1a1a1a' }}>{itemTitle}</span>
                                {itemSummary && (
                                  <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: '#6B6560' }}>{itemSummary}</p>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {focusAreas.length > 0 && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-3" style={{ color: '#1a1a1a' }}>{t('guides.knowledge_map')}</h3>
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

                {guide.source_url && (
                  <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2DDD5' }}>
                    <h3 className="text-[13px] font-serif font-semibold mb-2" style={{ color: '#1a1a1a' }}>{t('guides.source')}</h3>
                    <a href={guide.source_url} target="_blank" rel="noopener noreferrer" className="text-[13px] hover:underline flex items-center gap-1" style={{ color: '#C75B2A' }}>
                      <ExternalLink size={14} />
                      {t('guides.view_source')}
                    </a>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
