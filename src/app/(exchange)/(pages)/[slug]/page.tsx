/**
 * @fileoverview Pathway Chapter — the core page of the field guide.
 *
 * Each pathway (health, families, neighborhood, voice, money, planet, the-bigger-we)
 * is a chapter containing:
 *   1. Chapter header with pathway color + geo context
 *   2. In This Chapter nav (sticky sidebar on desktop)
 *   3. Start Here — curated top picks
 *   4. Organizations — the spine
 *   5. Services — what's available near you
 *   6. Who Represents You — officials by district
 *   7. Policy Tracker — legislation on this topic
 *   8. Opportunities — get involved
 *   9. From the Guide — articles, reports, videos
 *   10. Related Pathways — cross-links
 *
 * @route GET /health, /families, /neighborhood, /voice, /money, /planet, /the-bigger-we
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import { getEntitiesByPathways, resolveUserGeo } from '@/lib/data/entity-graph'

// Build lookup from slug → theme
const PATHWAY_BY_SLUG: Record<string, { id: string; name: string; color: string; slug: string; description: string }> = {}
for (const [id, t] of Object.entries(THEMES)) {
  PATHWAY_BY_SLUG[t.slug] = { id, name: t.name, color: t.color, slug: t.slug, description: t.description }
}

// Valid pathway slugs for generateStaticParams
const VALID_SLUGS: string[] = Object.values(THEMES).map((t) => t.slug)

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

  // Related pathways (all except current)
  const related = Object.entries(THEMES)
    .filter(([id]) => id !== pathway.id)
    .slice(0, 3)
    .map(([, t]) => t)

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          CHAPTER HEADER
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative border-b border-[#dde1e8]"
        style={{ borderTop: `4px solid ${pathway.color}` }}
      >
        {/* Pathway header image placeholder — replace with pathways/[slug]-header.webp */}
        <div className="absolute inset-0 bg-[#f4f5f7]" />

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-12 md:py-16">
          <p className="text-[10px] uppercase tracking-[0.15em] mb-4" style={{ color: pathway.color }}>
            Pathway {VALID_SLUGS.indexOf(slug) + 1} of 7
          </p>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#0d1117]">
            {pathway.name}
          </h1>

          <p className="mt-4 text-[#5c6474] max-w-[520px] leading-relaxed">
            {pathway.description}
          </p>

          {/* Geo anchor */}
          {geo ? (
            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded border border-[#dde1e8] text-xs text-[#5c6474]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Filtered to {geo.zip}{geo.neighborhoodName ? ` — ${geo.neighborhoodName}` : ''}
            </div>
          ) : (
            <p className="mt-6 text-xs text-[#8a929e]">
              <Link href="/my-plan/settings" className="text-[#1b5e8a] hover:underline">Enter your ZIP</Link>
              {' '}to see what&apos;s near you.
            </p>
          )}

          {/* Entity counts */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-[#5c6474]">
            <span><strong className="text-[#0d1117]">{entities.counts.organizations}</strong> organizations</span>
            <span><strong className="text-[#0d1117]">{entities.counts.services}</strong> services</span>
            <span><strong className="text-[#0d1117]">{entities.counts.officials}</strong> officials</span>
            <span><strong className="text-[#0d1117]">{entities.counts.policies}</strong> policies</span>
            <span><strong className="text-[#0d1117]">{entities.counts.opportunities}</strong> opportunities</span>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6 py-12">

        {/* ═══════════════════════════════════════════════════════════════════
            ORGANIZATIONS — The Spine
            ═══════════════════════════════════════════════════════════════ */}
        {entities.organizations.length > 0 && (
          <section className="mb-16" id="organizations">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">Organizations</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  {entities.counts.organizations} organizations on this pathway
                  {geo ? ` near ${geo.zip}` : ''}
                </p>
              </div>
              <Link href={`/orgs?pathway=${slug}`} className="text-sm text-[#1b5e8a] hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entities.organizations.map((org: any) => (
                <Link
                  key={org.org_id}
                  href={`/orgs/${org.org_id}`}
                  className="group flex gap-4 p-4 border border-[#dde1e8] rounded-lg hover:border-[#1b5e8a] hover:shadow-sm transition-all"
                >
                  {/* Logo placeholder */}
                  <div className="w-12 h-12 rounded bg-[#f4f5f7] flex items-center justify-center flex-shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-10 h-10 object-contain rounded" />
                    ) : (
                      <span className="text-[#8a929e] text-lg font-serif">{(org.org_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[#0d1117] group-hover:text-[#1b5e8a] transition-colors truncate">
                      {org.org_name}
                    </h3>
                    <p className="mt-1 text-xs text-[#5c6474] line-clamp-2">
                      {org.description_5th_grade || org.mission_statement || 'Community organization'}
                    </p>
                    {org.zip_code && (
                      <p className="mt-1 text-[11px] text-[#8a929e]">
                        {org.city || 'Houston'}, {org.zip_code}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SERVICES — What's Available
            ═══════════════════════════════════════════════════════════════ */}
        {entities.services.length > 0 && (
          <section className="mb-16" id="services">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">Services</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  {entities.counts.services} services available
                  {geo ? ` near ${geo.zip}` : ''}
                </p>
              </div>
              <Link href={`/services?pathway=${slug}`} className="text-sm text-[#1b5e8a] hover:underline">
                View all &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {entities.services.map((svc: any) => (
                <Link
                  key={svc.service_id}
                  href={`/services/${svc.service_id}`}
                  className="group p-4 border border-[#dde1e8] rounded-lg hover:border-[#1b5e8a] hover:shadow-sm transition-all"
                >
                  <h3 className="text-sm font-medium text-[#0d1117] group-hover:text-[#1b5e8a] transition-colors">
                    {svc.service_name}
                  </h3>
                  <p className="mt-1 text-xs text-[#5c6474] line-clamp-2">
                    {svc.description_5th_grade || 'Community service'}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8a929e]">
                    {svc.org_name && <span>{svc.org_name}</span>}
                    {svc.zip_code && <span>{svc.city || 'Houston'}, {svc.zip_code}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            OFFICIALS — Who Represents You
            ═══════════════════════════════════════════════════════════════ */}
        {entities.officials.length > 0 && (
          <section className="mb-16" id="officials">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">Who represents you</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  {geo ? `Officials for ${geo.zip}` : 'Elected officials'} on {pathway.name.toLowerCase()} policy
                </p>
              </div>
              <Link href="/officials" className="text-sm text-[#1b5e8a] hover:underline">
                All officials &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entities.officials.map((off: any) => (
                <Link
                  key={off.official_id}
                  href={`/officials/${off.official_id}`}
                  className="group flex items-center gap-3 p-4 border border-[#dde1e8] rounded-lg hover:border-[#1b5e8a] hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f4f5f7] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {off.photo_url ? (
                      <img src={off.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#8a929e] text-sm font-serif">
                        {(off.official_name || '?')[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[#0d1117] group-hover:text-[#1b5e8a] transition-colors truncate">
                      {off.official_name}
                    </h3>
                    <p className="text-[11px] text-[#8a929e] truncate">
                      {off.title || off.level || 'Official'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            POLICIES — Policy Tracker
            ═══════════════════════════════════════════════════════════════ */}
        {entities.policies.length > 0 && (
          <section className="mb-16" id="policies">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">Policy tracker</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  {entities.counts.policies} policies on {pathway.name.toLowerCase()}
                </p>
              </div>
              <Link href={`/policies?pathway=${slug}`} className="text-sm text-[#1b5e8a] hover:underline">
                All policies &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {entities.policies.map((pol: any) => (
                <Link
                  key={pol.policy_id}
                  href={`/policies/${pol.policy_id}`}
                  className="group block p-4 border border-[#dde1e8] rounded-lg hover:border-[#1b5e8a] hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-[#0d1117] group-hover:text-[#1b5e8a] transition-colors">
                        {pol.title_6th_grade || pol.policy_name}
                      </h3>
                      <p className="mt-1 text-xs text-[#5c6474] line-clamp-2">
                        {pol.summary_5th_grade || pol.summary_6th_grade || ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {pol.bill_number && (
                        <span className="text-[11px] font-mono text-[#8a929e]">{pol.bill_number}</span>
                      )}
                      {pol.status && (
                        <p className="text-[10px] uppercase tracking-wider text-[#8a929e] mt-1">{pol.status}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            OPPORTUNITIES — Get Involved
            ═══════════════════════════════════════════════════════════════ */}
        {entities.opportunities.length > 0 && (
          <section className="mb-16" id="opportunities">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">Get involved</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  {entities.counts.opportunities} opportunities to participate
                </p>
              </div>
              <Link href={`/opportunities?pathway=${slug}`} className="text-sm text-[#1b5e8a] hover:underline">
                All opportunities &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entities.opportunities.map((opp: any) => (
                <div
                  key={opp.opportunity_id}
                  className="p-4 border border-[#dde1e8] rounded-lg"
                >
                  <h3 className="text-sm font-medium text-[#0d1117]">
                    {opp.opportunity_name}
                  </h3>
                  <p className="mt-1 text-xs text-[#5c6474] line-clamp-2">
                    {opp.description_5th_grade || ''}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    {opp.registration_url && (
                      <a
                        href={opp.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#1b5e8a] hover:underline"
                      >
                        Sign up &rarr;
                      </a>
                    )}
                    {opp.is_virtual === 'Yes' && (
                      <span className="text-[10px] text-[#8a929e] uppercase tracking-wider">Virtual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            FROM THE GUIDE — Articles, Reports, Videos
            ═══════════════════════════════════════════════════════════════ */}
        {entities.content.length > 0 && (
          <section className="mb-16" id="from-the-guide">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-serif font-bold">From the guide</h2>
                <p className="mt-1 text-sm text-[#5c6474]">
                  Articles, reports, and videos on {pathway.name.toLowerCase()}
                </p>
              </div>
              <Link href={`/news?pathway=${slug}`} className="text-sm text-[#1b5e8a] hover:underline">
                All content &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {entities.content.map((item: any) => {
                const classification = item.classification_v2 || {}
                const contentType = classification.content_type || 'article'

                return (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="group bg-white rounded-lg border border-[#dde1e8] overflow-hidden hover:shadow-md transition-all"
                  >
                    {item.image_url ? (
                      <div
                        className="h-32 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    ) : (
                      <div className="h-32 flex items-center justify-center" style={{ background: pathway.color }}>
                        <span className="text-white/30 text-xs uppercase tracking-wider">{contentType}</span>
                      </div>
                    )}
                    <div className="p-3">
                      <span className="text-[10px] uppercase tracking-wider text-[#8a929e]">{contentType}</span>
                      <h3 className="mt-1 text-sm font-medium text-[#0d1117] line-clamp-2 group-hover:text-[#1b5e8a] transition-colors">
                        {item.title_6th_grade || 'Untitled'}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            RELATED PATHWAYS
            ═══════════════════════════════════════════════════════════════ */}
        <section className="pt-8 border-t border-[#dde1e8]">
          <h2 className="text-lg font-serif font-bold mb-4">Related pathways</h2>
          <div className="flex flex-wrap gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="flex items-center gap-2 px-4 py-2 border border-[#dde1e8] rounded hover:border-transparent hover:shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
                <span className="text-sm">{r.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
