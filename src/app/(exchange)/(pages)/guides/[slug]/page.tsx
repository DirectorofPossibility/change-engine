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
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { ExternalLink, Building2, Newspaper, FileText, Scale } from 'lucide-react'
import { getUIStrings } from '@/lib/i18n'
import { ENGAGEMENT_LEVEL_COLORS } from '@/lib/constants'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'

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

  const userProfile = await getUserProfile()

  // Fetch all related data in parallel
  const [
    focusAreas,
    relatedOrgs,
    relatedContent,
    opportunities,
    policies,
    adjacentGuides,
    wayfinderData,
  ] = await Promise.all([
    focusAreaIds.length > 0 ? getFocusAreasByIds(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOrgsForGuide(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedContentForGuide(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedOpportunities(focusAreaIds) : Promise.resolve([]),
    focusAreaIds.length > 0 ? getRelatedPolicies(focusAreaIds) : Promise.resolve([]),
    getAdjacentGuides(guide.display_order, guide.theme_id),
    getWayfinderContext('guide', guide.guide_id, userProfile?.role),
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

  const hasSidebar = focusAreas.length > 0 || sdgIds.length > 0 || sdohCodes.length > 0
    || relatedOrgs.length > 0 || opportunities.length > 0 || policies.length > 0
    || relatedContent.length > 0 || guide.source_url

  const heroImage = guide.hero_image_url ? (
    <div className="relative w-full h-56 sm:h-72 md:h-80 overflow-hidden">
      <Image
        src={guide.hero_image_url}
        alt={guideTitle}
        fill
        className="object-cover"
        priority
      />
    </div>
  ) : undefined

  const metaRow = (
    <>
      {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
      {guide.engagement_level && (
        <span className={'text-xs px-2 py-0.5 font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')}>
          {guide.engagement_level}
        </span>
      )}
      {guide.source_url && (
        <a
          href={guide.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-accent hover:underline flex items-center gap-1"
        >
          <ExternalLink size={12} />
          {t('guides.original_source')}
        </a>
      )}
    </>
  )

  const sidebarContent = hasSidebar ? (
    <>
      {/* Focus areas */}
      {focusAreas.length > 0 && (
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3">{t('guides.focus_areas')}</h3>
          <FocusAreaPills focusAreas={focusAreas} />
        </div>
      )}

      {/* SDG badges */}
      {sdgIds.length > 0 && (
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3">{t('guides.global_goals')}</h3>
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3">{t('guides.social_determinants')}</h3>
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3 flex items-center gap-1.5">
            <Building2 size={14} className="text-brand-muted" />
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
                        className="rounded object-contain flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1">
                        {org.org_name}
                      </span>
                      {org.description_5th_grade && (
                        <p className="text-xs text-brand-muted line-clamp-2 mt-0.5">{org.description_5th_grade}</p>
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3 flex items-center gap-1.5">
            <Newspaper size={14} className="text-brand-muted" />
            {t('guides.opportunities')}
          </h3>
          <div className="space-y-2">
            {opportunities.slice(0, 5).map(function (opp: any) {
              return (
                <div key={opp.opportunity_id} className="border-b border-brand-border pb-2 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-brand-text line-clamp-2">{opp.opportunity_name}</p>
                  {opp.description_5th_grade && (
                    <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">{opp.description_5th_grade}</p>
                  )}
                  {opp.registration_url && (
                    <a
                      href={opp.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-accent hover:underline mt-0.5 inline-block"
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3 flex items-center gap-1.5">
            <Scale size={14} className="text-brand-muted" />
            {t('guides.related_policies')}
          </h3>
          <ul className="space-y-2">
            {policies.slice(0, 5).map(function (pol: any) {
              return (
                <li key={pol.policy_id} className="border-b border-brand-border pb-2 last:border-0 last:pb-0">
                  <Link href={'/policies/' + pol.policy_id} className="group">
                    <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                      {pol.policy_name}
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {pol.bill_number && (
                      <span className="text-xs font-mono text-brand-muted">{pol.bill_number}</span>
                    )}
                    {pol.status && (
                      <span className="text-xs text-brand-muted">{pol.status}</span>
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3 flex items-center gap-1.5">
            <FileText size={14} className="text-brand-muted" />
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
                        className="rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                        {itemTitle}
                      </span>
                      {itemSummary && (
                        <p className="text-xs text-brand-muted line-clamp-1 mt-0.5">{itemSummary}</p>
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
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-3">{t('guides.knowledge_map')}</h3>
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

      {/* Source link */}
      {guide.source_url && (
        <div className="bg-white border border-brand-border p-4">
          <h3 className="text-sm font-display font-semibold text-brand-text mb-2">{t('guides.source')}</h3>
          <a
            href={guide.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-accent hover:underline flex items-center gap-1"
          >
            <ExternalLink size={14} />
            {t('guides.view_source')}
          </a>
        </div>
      )}
    </>
  ) : undefined

  return (
    <>
      <ReadingProgressBar />

      <DetailPageLayout
        breadcrumbs={[
          { label: t('guides.title'), href: '/guides' },
          { label: guideTitle },
        ]}
        eyebrow={{ text: 'Guide' }}
        title={guideTitle}
        subtitle={guideDescription || null}
        heroImage={heroImage}
        metaRow={metaRow}
        themeColor="#1b5e8a"
        wayfinderData={wayfinderData}
        wayfinderType="guide"
        wayfinderEntityId={guide.guide_id}
        userRole={userProfile?.role}
        sidebar={sidebarContent}
        feedbackType="guide"
        feedbackId={guide.guide_id}
        feedbackName={guideTitle}
        actions={{
          translate: { isTranslated: !!guideTranslations[guide.guide_id], contentType: 'guide', contentId: guide.guide_id },
          share: { title: guideTitle, url: `https://www.changeengine.us/guides/${slug}` },
        }}
      >
        {/* Table of contents */}
        <TableOfContents sections={sections} />

        {/* Sections */}
        {sections.length > 0 && (
          <div className="space-y-8">
            {sections.map(function (section) {
              return (
                <section key={section.id} id={'section-' + section.id} className="bg-white border border-brand-border p-6 scroll-mt-16">
                  <h2 className="text-xl font-display font-bold text-brand-text mb-3">
                    {section.icon && <span className="mr-2">{section.icon}</span>}
                    {section.title}
                  </h2>
                  <div
                    className="prose prose-sm max-w-none text-brand-text"
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
            className="prose prose-sm max-w-none text-brand-text mt-8 bg-white border border-brand-border p-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content_html) }}
          />
        )}

        {/* Guide navigation */}
        <GuideNavigation prev={adjacentGuides.prev} next={adjacentGuides.next} />
      </DetailPageLayout>
    </>
  )
}
