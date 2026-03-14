/**
 * @fileoverview Pathway Chapter — the core page of the field guide.
 *
 * Each pathway is a chapter: ThemeMasthead hero, editorial photo,
 * organizations as the spine, services/officials/policies woven between,
 * content in CouchGrid, trail level CTA.
 *
 * Uses the design system: sharp corners, no shadows, sacred geometry,
 * pathway gradients, monospace labels, editorial typography.
 *
 * @route GET /health, /families, /neighborhood, /voice, /money, /planet, /the-bigger-we
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import { getEntitiesByPathways, resolveUserGeo } from '@/lib/data/entity-graph'
import { ThemeMasthead } from '@/components/templates/ThemeMasthead'
import { CouchGrid } from '@/components/templates/CouchGrid'
import { FolFallback } from '@/components/ui/FolFallback'
import { Geo } from '@/components/geo/sacred'

// Build lookup from slug → theme
const PATHWAY_BY_SLUG: Record<string, { id: string; name: string; color: string; slug: string; description: string }> = {}
for (const [id, t] of Object.entries(THEMES)) {
  PATHWAY_BY_SLUG[t.slug] = { id, name: t.name, color: t.color, slug: t.slug, description: t.description }
}

const VALID_SLUGS: string[] = Object.values(THEMES).map((t) => t.slug)

// Map pathway IDs to their sacred geometry types
const PATHWAY_GEO: Record<string, string> = {
  THEME_01: 'seed_of_life',
  THEME_02: 'nested_circles',
  THEME_03: 'hex_grid',
  THEME_04: 'compass_rose',
  THEME_05: 'golden_spiral',
  THEME_06: 'flower_of_life',
  THEME_07: 'metatron_cube',
}

// Map pathway IDs to editorial photos
const PATHWAY_PHOTOS: Record<string, string> = {
  THEME_01: '/images/editorial/health-fair.jpg',
  THEME_02: '/images/editorial/two-people-talking.jpg',
  THEME_03: '/images/editorial/neighborhood.jpg',
  THEME_04: '/images/editorial/town-hall.jpg',
  THEME_05: '/images/editorial/organizing.jpg',
  THEME_06: '/images/editorial/cleanup.jpg',
  THEME_07: '/images/editorial/community-meeting.jpg',
}

export function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const pathway = PATHWAY_BY_SLUG[slug]
  if (!pathway) return {}
  return {
    title: `${pathway.name} — Change Engine`,
    description: pathway.description,
  }
}

export const dynamic = 'force-dynamic'

export default async function PathwayChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pathway = PATHWAY_BY_SLUG[slug]
  if (!pathway) notFound()

  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  const entities = await getEntitiesByPathways(
    [pathway.id],
    { content: 8, services: 6, orgs: 8, officials: 6, policies: 4, opportunities: 4 },
    zip,
  )

  const geo = entities.geo
  const geoType = PATHWAY_GEO[pathway.id] || 'seed_of_life'
  const photoUrl = PATHWAY_PHOTOS[pathway.id] || '/images/editorial/community-meeting.jpg'

  // Related pathways (all except current)
  const related = Object.entries(THEMES)
    .filter(([id]) => id !== pathway.id)
    .slice(0, 3)
    .map(([id, t]) => ({ id, ...t }))

  // Format content for CouchGrid
  const couchItems = entities.content.map((item: any, i: number) => ({
    id: item.id,
    href: `/content/${item.id}`,
    title: item.title_6th_grade || 'Untitled',
    dek: item.summary_6th_grade || undefined,
    type: item.classification_v2?.content_type || 'article',
    meta: item.source_domain || undefined,
    imageUrl: item.image_url || undefined,
    isFeature: i === 0,
  }))

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER HEADER — ThemeMasthead
          ═══════════════════════════════════════════════════════════════ */}
      <ThemeMasthead
        themeName={pathway.name}
        themeColor={pathway.color}
        description={pathway.description}
        geoType={geoType}
        dateline={`Pathway ${VALID_SLUGS.indexOf(slug) + 1} of 7`}
        stats={[
          { num: entities.counts.organizations.toString(), desc: 'Organizations' },
          { num: entities.counts.services.toString(), desc: 'Services' },
          { num: entities.counts.officials.toString(), desc: 'Officials' },
          { num: entities.counts.content.toString(), desc: 'Articles' },
        ]}
      />

      {/* Spectrum bar */}
      <div className="spectrum-bar">
        {Object.entries(THEMES).map(([id, t]) => (
          <div key={id} style={{ background: id === pathway.id ? t.color : `${t.color}33` }} />
        ))}
      </div>

      {/* Geo anchor */}
      <div className="border-b border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-3 flex items-center justify-between">
          {geo ? (
            <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Filtered to {geo.zip}{geo.neighborhoodName ? ` — ${geo.neighborhoodName}` : ''}
            </span>
          ) : (
            <span className="font-mono text-micro text-faint">
              <Link href="/my-plan/settings" className="text-blue hover:underline">Enter your ZIP</Link>
              {' '}to see what's near you
            </span>
          )}
          <nav className="hidden md:flex items-center gap-4 font-mono text-micro uppercase tracking-[0.1em] text-faint">
            {entities.organizations.length > 0 && <a href="#organizations" className="hover:text-ink transition-colors">Orgs</a>}
            {entities.services.length > 0 && <a href="#services" className="hover:text-ink transition-colors">Services</a>}
            {entities.officials.length > 0 && <a href="#officials" className="hover:text-ink transition-colors">Officials</a>}
            {entities.policies.length > 0 && <a href="#policies" className="hover:text-ink transition-colors">Policies</a>}
            {entities.content.length > 0 && <a href="#from-the-guide" className="hover:text-ink transition-colors">Articles</a>}
          </nav>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          EDITORIAL PHOTO + INTRO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 items-start">
          <div className="relative border border-rule overflow-hidden">
            <Image
              src={photoUrl}
              alt={`${pathway.name} in Houston`}
              width={700}
              height={420}
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-ink/30 to-transparent" />
          </div>
          <div>
            <span className="font-mono text-micro uppercase tracking-[0.18em] block mb-3" style={{ color: pathway.color }}>
              About this pathway
            </span>
            <p className="font-body italic text-base leading-[1.8] text-dim">
              {pathway.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/start" className="btn-primary">
                Find what you need →
              </Link>
              <Link href="/map" className="btn-secondary">
                View on map
              </Link>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule" />

      {/* ═══════════════════════════════════════════════════════════════════
          ORGANIZATIONS — The Spine
          ═══════════════════════════════════════════════════════════════ */}
      {entities.organizations.length > 0 && (
        <section className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="organizations">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                The spine of the guide
              </span>
              <h2 className="font-display text-title font-black text-ink">
                Organizations
              </h2>
              <p className="font-body italic text-sm text-dim mt-1">
                {entities.counts.organizations} organizations on this pathway
                {geo ? ` near ${geo.zip}` : ''}
              </p>
            </div>
            <Link href={`/orgs?pathway=${slug}`} className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
              View all →
            </Link>
          </div>

          <div className="border border-rule divide-y divide-rule">
            {entities.organizations.map((org: any) => (
              <Link
                key={org.org_id}
                href={`/orgs/${org.org_id}`}
                className="group flex gap-5 p-5 hover:bg-paper transition-colors"
              >
                {/* Logo */}
                <div className="w-14 h-14 border border-rule flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {org.logo_url ? (
                    <img src={org.logo_url} alt="" className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `${pathway.color}10` }}>
                      <span className="font-display text-xl font-bold" style={{ color: pathway.color }}>
                        {(org.org_name || '?')[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold text-ink group-hover:text-blue transition-colors">
                    {org.org_name}
                  </h3>
                  <p className="font-body text-sm text-dim line-clamp-2 mt-1 leading-relaxed">
                    {org.description_5th_grade || org.mission_statement || 'Community organization'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {org.zip_code && (
                      <span className="font-mono text-micro text-faint">
                        {org.city || 'Houston'}, {org.zip_code}
                      </span>
                    )}
                    {org.website_url && (
                      <span className="font-mono text-micro text-faint">
                        {new URL(org.website_url).hostname.replace('www.', '')}
                      </span>
                    )}
                  </div>
                </div>

                <span className="font-mono text-blue flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <hr className="section-rule" />

      {/* ═══════════════════════════════════════════════════════════════════
          SERVICES — What's Available
          ═══════════════════════════════════════════════════════════════ */}
      {entities.services.length > 0 && (
        <section className="bg-paper">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="services">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                  What&apos;s available
                </span>
                <h2 className="font-display text-title font-black text-ink">Services</h2>
              </div>
              <Link href={`/services?pathway=${slug}`} className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-rule">
              {entities.services.map((svc: any, i: number) => (
                <Link
                  key={svc.service_id}
                  href={`/services/${svc.service_id}`}
                  className="group p-5 border-b border-r border-rule hover:bg-white transition-colors"
                >
                  <span className="font-mono text-micro uppercase tracking-[0.14em] text-faint block mb-1">
                    {svc.org_name || 'Service'}
                  </span>
                  <h3 className="font-display text-sm font-bold text-ink group-hover:text-blue transition-colors leading-tight">
                    {svc.service_name}
                  </h3>
                  <p className="font-body text-sm text-dim line-clamp-2 mt-2">
                    {svc.description_5th_grade || 'Community service'}
                  </p>
                  {svc.zip_code && (
                    <span className="font-mono text-micro text-faint block mt-2">
                      {svc.city || 'Houston'}, {svc.zip_code}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          OFFICIALS — Who Represents You
          ═══════════════════════════════════════════════════════════════ */}
      {entities.officials.length > 0 && (
        <section className="border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="officials">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                  {geo ? `Your representatives` : 'Elected officials'}
                </span>
                <h2 className="font-display text-title font-black text-ink">
                  Who represents you
                </h2>
              </div>
              <Link href="/officials" className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
                All officials →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-rule">
              {entities.officials.map((off: any) => (
                <Link
                  key={off.official_id}
                  href={`/officials/${off.official_id}`}
                  className="group flex items-center gap-4 p-5 border-b border-r border-rule hover:bg-paper transition-colors"
                >
                  {/* Photo */}
                  <div className="w-12 h-12 rounded-full border border-rule flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {off.photo_url ? (
                      <img src={off.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-lg font-bold text-faint">
                        {(off.official_name || '?')[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-blue transition-colors truncate">
                      {off.official_name}
                    </h3>
                    <span className="font-mono text-micro text-faint truncate block">
                      {off.title || off.level || 'Official'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          POLICIES — Policy Tracker
          ═══════════════════════════════════════════════════════════════ */}
      {entities.policies.length > 0 && (
        <section className="bg-paper border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="policies">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                  Legislation
                </span>
                <h2 className="font-display text-title font-black text-ink">Policy Tracker</h2>
              </div>
              <Link href={`/policies?pathway=${slug}`} className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
                All policies →
              </Link>
            </div>

            <div className="border border-rule divide-y divide-rule bg-white">
              {entities.policies.map((pol: any) => (
                <Link
                  key={pol.policy_id}
                  href={`/policies/${pol.policy_id}`}
                  className="group flex items-start justify-between gap-6 p-5 hover:bg-paper transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm font-bold text-ink group-hover:text-blue transition-colors">
                      {pol.title_6th_grade || pol.policy_name}
                    </h3>
                    <p className="font-body text-sm text-dim line-clamp-2 mt-1">
                      {pol.summary_5th_grade || pol.summary_6th_grade || ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {pol.bill_number && (
                      <span className="font-mono text-micro text-faint block">{pol.bill_number}</span>
                    )}
                    {pol.status && (
                      <span className="effort-tag mt-1 inline-block">{pol.status}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          OPPORTUNITIES — Get Involved
          ═══════════════════════════════════════════════════════════════ */}
      {entities.opportunities.length > 0 && (
        <section className="border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="opportunities">
            <div className="mb-8">
              <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                Take action
              </span>
              <h2 className="font-display text-title font-black text-ink">Get Involved</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-rule">
              {entities.opportunities.map((opp: any) => (
                <div
                  key={opp.opportunity_id}
                  className="p-5 border-b border-r border-rule"
                >
                  <h3 className="font-display text-sm font-bold text-ink">
                    {opp.opportunity_name}
                  </h3>
                  <p className="font-body text-sm text-dim line-clamp-2 mt-1">
                    {opp.description_5th_grade || ''}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    {opp.registration_url && (
                      <a
                        href={opp.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline"
                      >
                        Sign up →
                      </a>
                    )}
                    {opp.is_virtual === 'Yes' && (
                      <span className="effort-tag">Virtual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FROM THE GUIDE — CouchGrid Magazine Layout
          ═══════════════════════════════════════════════════════════════ */}
      {couchItems.length > 0 && (
        <section className="bg-paper border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12" id="from-the-guide">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                  Reading
                </span>
                <h2 className="font-display text-title font-black text-ink">From the Guide</h2>
              </div>
              <Link href={`/news?pathway=${slug}`} className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
                All content →
              </Link>
            </div>

            <CouchGrid
              items={couchItems}
              themeColor={pathway.color}
              geoType={geoType}
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          RELATED PATHWAYS
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-12">
          <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-4">
            Continue exploring
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-rule">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="group flex flex-col border-b border-r border-rule hover:bg-paper transition-colors"
              >
                <FolFallback pathway={r.id} height="h-20" />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-[6px] h-[6px]" style={{ background: r.color }} />
                    <span className="font-mono text-micro uppercase tracking-[0.1em]" style={{ color: r.color }}>
                      Pathway
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-ink group-hover:text-blue transition-colors">
                    {r.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Spectrum bar */}
      <div className="spectrum-bar">
        {Object.entries(THEMES).map(([id, t]) => (
          <div key={id} style={{ background: t.color }} />
        ))}
      </div>
    </div>
  )
}
