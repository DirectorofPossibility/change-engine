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

export const dynamic = 'force-dynamic'


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
    <div className="bg-paper min-h-screen">
      <ReadingProgressBar />

      {/* Hero */}
      <div className="bg-paper relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: "#5c6474", textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, marginTop: '0.75rem' }}>
            {guideTitle}
          </h1>
          {guideDescription && (
            <p style={{ fontSize: '1rem', color: "#5c6474", marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
              {guideDescription}
            </p>
          )}
          {/* Meta */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {guide.theme_id && <ThemePill themeId={guide.theme_id} size="sm" />}
            {guide.engagement_level && (
              <span className={'px-2 py-0.5 font-medium ' + (ENGAGEMENT_LEVEL_COLORS[guide.engagement_level] || 'bg-gray-100 text-gray-700')} style={{ fontSize: '0.7rem' }}>
                {guide.engagement_level}
              </span>
            )}
            {guide.source_url && (
              <a
                href={guide.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
                style={{ fontSize: '0.7rem', color: "#1b5e8a" }}
              >
                <ExternalLink size={12} />
                {t('guides.original_source')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hero Image */}
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

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontSize: '0.7rem', color: "#5c6474" }}>
          <Link href="/" className="hover:underline" style={{ color: "#1b5e8a" }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline" style={{ color: "#1b5e8a" }}>{t('guides.title')}</Link>
          <span className="mx-2">/</span>
          <span>{guideTitle}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Table of contents */}
        <TableOfContents sections={sections} />

        {/* Sections */}
        {sections.length > 0 && (
          <div className="space-y-8 mt-8">
            {sections.map(function (section) {
              return (
                <section key={section.id} id={'section-' + section.id} className="scroll-mt-16" style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                    {section.title}
                  </h2>
                  <div
                    style={{ fontSize: '0.95rem', lineHeight: 1.85 }}
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
            style={{ fontSize: '0.95rem', lineHeight: 1.85, marginTop: '2rem' }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(guide.content_html) }}
          />
        )}

        {/* Sidebar Content Inlined */}
        <div style={{ borderTop: '1px dotted ' + '#dde1e8', marginTop: '2rem', paddingTop: '2rem' }}>
          {/* Focus areas */}
          {focusAreas.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }}>{t('guides.focus_areas')}</h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
              <FocusAreaPills focusAreas={focusAreas} />
            </section>
          )}

          {/* SDG badges */}
          {sdgIds.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }}>{t('guides.global_goals')}</h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
            </section>
          )}

          {/* SDOH badges */}
          {sdohCodes.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }}>{t('guides.social_determinants')}</h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
            </section>
          )}

          {/* Related organizations */}
          {relatedOrgs.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }} className="flex items-center gap-1.5">
                  <Building2 size={16} style={{ color: "#5c6474" }} />
                  {t('guides.related_orgs')}
                </h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }} className="group-hover:underline line-clamp-1">
                            {org.org_name}
                          </span>
                          {org.description_5th_grade && (
                            <p style={{ fontSize: '0.8rem', color: "#5c6474", marginTop: '0.15rem' }} className="line-clamp-2">{org.description_5th_grade}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Related opportunities */}
          {opportunities.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }} className="flex items-center gap-1.5">
                  <Newspaper size={16} style={{ color: "#5c6474" }} />
                  {t('guides.opportunities')}
                </h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
              <div className="space-y-2">
                {opportunities.slice(0, 5).map(function (opp: any) {
                  return (
                    <div key={opp.opportunity_id} style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 500,  }} className="line-clamp-2">{opp.opportunity_name}</p>
                      {opp.description_5th_grade && (
                        <p style={{ fontSize: '0.8rem', color: "#5c6474", marginTop: '0.15rem' }} className="line-clamp-1">{opp.description_5th_grade}</p>
                      )}
                      {opp.registration_url && (
                        <a
                          href={opp.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline mt-0.5 inline-block"
                          style={{ fontSize: '0.8rem', color: "#1b5e8a" }}
                        >
                          {t('guides.learn_more')} &rarr;
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Related policies */}
          {policies.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }} className="flex items-center gap-1.5">
                  <Scale size={16} style={{ color: "#5c6474" }} />
                  {t('guides.related_policies')}
                </h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
              <ul className="space-y-2">
                {policies.slice(0, 5).map(function (pol: any) {
                  return (
                    <li key={pol.policy_id} style={{ borderBottom: '1px dotted ' + '#dde1e8', paddingBottom: '0.5rem' }}>
                      <Link href={'/policies/' + pol.policy_id} className="group">
                        <span style={{ fontSize: '0.9rem', fontWeight: 500,  }} className="group-hover:underline line-clamp-2">
                          {pol.policy_name}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {pol.bill_number && (
                          <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{pol.bill_number}</span>
                        )}
                        {pol.status && (
                          <span style={{ fontSize: '0.7rem', color: "#5c6474" }}>{pol.status}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* Related content articles */}
          {relatedContent.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }} className="flex items-center gap-1.5">
                  <FileText size={16} style={{ color: "#5c6474" }} />
                  {t('guides.related_articles')}
                </h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
                          <span style={{ fontSize: '0.9rem', fontWeight: 500,  }} className="group-hover:underline line-clamp-2">
                            {itemTitle}
                          </span>
                          {itemSummary && (
                            <p style={{ fontSize: '0.8rem', color: "#5c6474", marginTop: '0.15rem' }} className="line-clamp-1">{itemSummary}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Mini knowledge graph */}
          {focusAreas.length > 0 && (
            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <h3 style={{ fontSize: '1.25rem',  }}>{t('guides.knowledge_map')}</h3>
              </div>
              <div style={{ height: 1, borderBottom: '1px dotted ' + '#dde1e8', marginBottom: '1rem' }} />
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
            </section>
          )}
        </div>

        {/* Guide navigation */}
        <GuideNavigation prev={adjacentGuides.prev} next={adjacentGuides.next} />
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: '#dde1e8' }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/guides" style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '0.95rem' }} className="hover:underline">
          Back to Guides
        </Link>
      </div>
    </div>
  )
}
