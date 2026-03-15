/**
 * @fileoverview Pathway hub — magazine front page.
 *
 * Shows all the objects in the database for this pathway:
 * content (articles, videos, guides, DIY kits), services, organizations,
 * opportunities, and policies. Each object links to its detail page.
 * No stats, no "state of health" descriptions — just the actual stuff.
 *
 * @route GET /pathways/:slug
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { THEMES } from '@/lib/constants'
import {
  getPathwayBraidedFeed,
  getFocusAreas,
  getRelatedOrgsForGuide,
  getRelatedOpportunities,
  getBridgesForPathway,
} from '@/lib/data/exchange'
import { FlowerOfLife } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'

function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

const THEME_LIST = Object.entries(THEMES).map(function ([id, t]) {
  return { id, ...t }
})

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) return { title: 'Not Found' }
  return {
    title: `${theme.name} — Community Exchange`,
    description: theme.description,
  }
}

export default async function PathwayHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  const [feed, allFocusAreas, bridgeData] = await Promise.all([
    getPathwayBraidedFeed(theme.id),
    getFocusAreas(),
    getBridgesForPathway(theme.id),
  ])

  const themeFocusAreas = allFocusAreas.filter(fa => fa.theme_id === theme.id)
  const focusAreaIds = themeFocusAreas.map(fa => fa.focus_id)

  const [orgs, opportunities] = await Promise.all([
    getRelatedOrgsForGuide(focusAreaIds),
    getRelatedOpportunities(focusAreaIds),
  ])

  const content = feed.content || []
  const services = feed.services || []

  // Split content: featured (has image) + rest
  const featured = content.find(c => c.image_url) || content[0] || null
  const restContent = content.filter(c => c !== featured)

  // Content type labels for badges
  function typeLabel(ct: string | null): string {
    if (!ct) return 'Article'
    const map: Record<string, string> = {
      article: 'Article', news: 'News', video: 'Video', guide: 'Guide',
      report: 'Report', podcast: 'Podcast', course: 'Course', tool: 'Tool',
      diy_kit: 'DIY Kit', infographic: 'Infographic', event: 'Event',
    }
    return map[ct] || ct.charAt(0).toUpperCase() + ct.slice(1)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="border-b border-rule">
        <div className="max-w-[1080px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-4 h-4" style={{ background: theme.color }} />
            <Link href="/pathways" className="text-sm text-muted hover:text-ink transition-colors">
              All pathways
            </Link>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-3">
            {theme.name}
          </h1>
          <p className="text-lg text-muted max-w-2xl">
            {theme.description}
          </p>

          {/* Pathway nav — all 7 pathways */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-1">
            {THEME_LIST.map(function (t) {
              const isCurrent = t.id === theme.id
              return (
                <Link
                  key={t.id}
                  href={'/pathways/' + t.slug}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors"
                  style={{
                    background: isCurrent ? theme.color : undefined,
                    color: isCurrent ? '#ffffff' : undefined,
                  }}
                >
                  <span className="w-2 h-2 flex-shrink-0" style={{ background: isCurrent ? '#ffffff' : t.color }} />
                  {t.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1080px] mx-auto px-6">

        {/* ── Featured + Latest ── */}
        {content.length > 0 && (
          <section className="py-10">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
              {/* Featured */}
              {featured && (
                <Link
                  href={'/content/' + featured.id}
                  className="group bg-white border border-rule overflow-hidden hover:shadow-md transition-all"
                >
                  {featured.image_url ? (
                    <div className="h-[260px] overflow-hidden">
                      <Image
                        src={featured.image_url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={800}
                        height={400}
                      />
                    </div>
                  ) : (
                    <FolFallback pathway={theme.id} size="hero" />
                  )}
                  <div className="p-5">
                    {(featured as any).content_type && (
                      <span className="inline-block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.color }}>
                        {typeLabel((featured as any).content_type)}
                      </span>
                    )}
                    <h2 className="font-display text-xl font-bold text-ink leading-snug mb-2 group-hover:text-blue transition-colors">
                      {featured.title_6th_grade || 'Untitled'}
                    </h2>
                    {featured.summary_6th_grade && (
                      <p className="text-sm text-muted line-clamp-3">{featured.summary_6th_grade}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-rule">
                      <span className="w-2 h-2" style={{ background: theme.color }} />
                      {featured.source_domain && (
                        <span className="text-xs text-muted">{featured.source_domain}</span>
                      )}
                      {featured.published_at && (
                        <span className="text-xs text-muted">
                          {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Sidebar stack */}
              <div className="flex flex-col gap-4">
                {restContent.slice(0, 4).map(function (item) {
                  return (
                    <Link
                      key={item.id}
                      href={'/content/' + item.id}
                      className="flex gap-3 group border-b border-rule pb-4 last:border-0"
                    >
                      {item.image_url ? (
                        <div className="w-[100px] h-[70px] flex-shrink-0 overflow-hidden">
                          <Image src={item.image_url} alt="" className="w-full h-full object-cover" width={200} height={140} />
                        </div>
                      ) : (
                        <div className="w-[100px] flex-shrink-0">
                          <FolFallback pathway={theme.id} height="h-[70px]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        {(item as any).content_type && (
                          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.color }}>
                            {typeLabel((item as any).content_type)}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-blue transition-colors">
                          {item.title_6th_grade || 'Untitled'}
                        </h3>
                        {item.source_domain && (
                          <span className="text-xs text-muted mt-1 block">{item.source_domain}</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Organizations doing this work ── */}
        {orgs.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Organizations</h2>
                <p className="text-sm text-muted mt-1">Local groups doing this work in Houston</p>
              </div>
              <Link href={'/organizations?pathway=' + theme.id} className="text-sm font-semibold text-blue hover:text-ink transition-colors">
                See all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.slice(0, 6).map(function (org) {
                return (
                  <Link
                    key={org.org_id}
                    href={'/organizations/' + org.org_id}
                    className="flex items-start gap-3 p-4 border border-rule hover:shadow-md transition-all group"
                  >
                    {(org as any).logo_url ? (
                      <Image src={(org as any).logo_url} alt="" className="w-10 h-10 object-contain flex-shrink-0" width={40} height={40} />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center flex-shrink-0" style={{ background: theme.color + '15' }}>
                        <FlowerOfLife color={theme.color} size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-blue transition-colors line-clamp-1">
                        {org.org_name}
                      </h3>
                      {org.description_5th_grade && (
                        <p className="text-xs text-muted mt-1 line-clamp-2">{org.description_5th_grade}</p>
                      )}
                      {(org as any).org_type && (
                        <span className="text-xs text-muted mt-1 block">{(org as any).org_type}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Services you can use ── */}
        {services.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Services</h2>
                <p className="text-sm text-muted mt-1">Free and low-cost help available right now</p>
              </div>
              <Link href={'/help?pathway=' + theme.id} className="text-sm font-semibold text-blue hover:text-ink transition-colors">
                See all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.slice(0, 6).map(function (svc) {
                return (
                  <Link
                    key={svc.service_id}
                    href={'/services/' + svc.service_id}
                    className="p-4 border border-rule hover:shadow-md transition-all group"
                  >
                    <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-blue transition-colors">
                      {svc.service_name}
                    </h3>
                    {svc.description_5th_grade && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{svc.description_5th_grade}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                      {(svc as any).org_name && <span>{(svc as any).org_name}</span>}
                      {svc.city && <span>&middot; {svc.city}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Ways to get involved ── */}
        {opportunities.length > 0 && (
          <section className="py-10 border-t border-rule">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">Get Involved</h2>
                <p className="text-sm text-muted mt-1">Volunteer, attend, or sign up</p>
              </div>
              <Link href={'/opportunities?pathway=' + theme.id} className="text-sm font-semibold text-blue hover:text-ink transition-colors">
                See all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map(function (opp: any) {
                return (
                  <Link
                    key={opp.opportunity_id}
                    href={'/opportunities/' + opp.opportunity_id}
                    className="p-4 border border-rule hover:shadow-md transition-all group"
                  >
                    <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-blue transition-colors line-clamp-2">
                      {opp.opportunity_name}
                    </h3>
                    {opp.description_5th_grade && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{opp.description_5th_grade}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                      {opp.start_date && (
                        <span>{new Date(opp.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                      {opp.is_virtual && <span className="text-blue">Virtual</span>}
                      {opp.time_commitment && <span>&middot; {opp.time_commitment}</span>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── More articles ── */}
        {restContent.length > 4 && (
          <section className="py-10 border-t border-rule">
            <h2 className="font-display text-2xl font-bold text-ink mb-6">More on {theme.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restContent.slice(4, 16).map(function (item) {
                return (
                  <Link
                    key={item.id}
                    href={'/content/' + item.id}
                    className="group border border-rule overflow-hidden hover:shadow-md transition-all"
                  >
                    {item.image_url ? (
                      <div className="h-[140px] overflow-hidden">
                        <Image src={item.image_url} alt="" className="w-full h-full object-cover" width={400} height={280} />
                      </div>
                    ) : (
                      <FolFallback pathway={theme.id} height="h-[140px]" />
                    )}
                    <div className="p-4">
                      {(item as any).content_type && (
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.color }}>
                          {typeLabel((item as any).content_type)}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 mt-1 group-hover:text-blue transition-colors">
                        {item.title_6th_grade || 'Untitled'}
                      </h3>
                      {item.source_domain && (
                        <span className="text-xs text-muted mt-2 block">{item.source_domain}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Explore other pathways ── */}
        <section className="py-10 border-t border-rule">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">Explore other pathways</h2>
          <div className="flex flex-wrap gap-3">
            {bridgeData.map(function (b: any) {
              return (
                <Link
                  key={b.targetThemeId}
                  href={'/pathways/' + b.targetSlug}
                  className="flex items-center gap-2 px-4 py-2 border border-rule text-sm hover:shadow-md transition-all"
                >
                  <span className="w-3 h-3" style={{ background: b.targetColor }} />
                  {b.targetName}
                </Link>
              )
            })}
            <Link
              href="/pathways"
              className="flex items-center gap-2 px-4 py-2 border border-rule text-sm text-muted hover:text-ink hover:shadow-md transition-all"
            >
              All pathways &rarr;
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
