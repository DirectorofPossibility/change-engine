/**
 * @fileoverview Homepage — Guide Cover
 *
 * The front page of the field guide. Not a marketing page.
 * Structure:
 *   1. Hero — what this is + ZIP anchor
 *   2. Seven Pathways — table of contents
 *   3. Start Here — top picks near you
 *   4. What's Happening — timely/seasonal content
 *   5. Your Neighborhood — geographic context
 *   6. What's New — latest from the guide
 *   7. Trust Strip — credibility
 *
 * @route GET /
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { resolveUserGeo, getPathwayCounts } from '@/lib/data/entity-graph'

export const metadata: Metadata = {
  title: 'Change Engine — A Field Guide to Greater Houston',
  description: 'Discover 10,000+ free civic resources from 1,800+ organizations across Greater Houston. Find services, officials, policies, and opportunities organized along 7 pathways.',
}

export const dynamic = 'force-dynamic'

const PATHWAY_LIST = Object.entries(THEMES).map(([id, t]) => ({
  id,
  name: t.name,
  slug: t.slug,
  color: t.color,
  description: t.description,
}))

export default async function HomePage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  const supabase = await createClient()

  // Parallel data fetching
  const [
    geo,
    pathwayCounts,
    { count: orgCount },
    { count: serviceCount },
    { data: latestContent },
  ] = await Promise.all([
    zip ? resolveUserGeo(zip) : Promise.resolve(null),
    getPathwayCounts(),
    supabase.from('organizations').select('org_id', { count: 'exact', head: true }),
    supabase.from('services_211').select('service_id', { count: 'exact', head: true }).eq('is_active', 'Yes'),
    supabase
      .from('content_published')
      .select('id, title_6th_grade, summary_6th_grade, source_domain, published_at, image_url, classification_v2')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(4),
  ])

  const totalResources = (orgCount || 0) + (serviceCount || 0)

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO — Guide Cover
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative bg-[#0d1117] text-white overflow-hidden">
        {/* Background — replace with home/hero-bg.webp when ready */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#1a2332] to-[#0d1117]" />

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-24 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a929e] mb-6">
            A field guide to Greater Houston
          </p>

          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
            {totalResources.toLocaleString()} free resources.
            <br />
            <span className="text-[#7ec8e3]">{(orgCount || 0).toLocaleString()} organizations.</span>
            <br />
            Your community.
          </h1>

          <p className="mt-6 text-[#8a929e] max-w-[480px] mx-auto leading-relaxed">
            Everything you need to learn, connect, and take action in Greater Houston —
            sorted by what matters to you.
          </p>

          {/* ZIP anchor */}
          {geo ? (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>
                Showing resources near <strong>{geo.zip}</strong>
                {geo.neighborhoodName && <> &mdash; {geo.neighborhoodName}</>}
              </span>
            </div>
          ) : (
            <Link
              href="/my-plan/settings"
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1b5e8a] hover:bg-[#2a7ab5] rounded text-sm font-medium transition-colors"
            >
              Enter your ZIP code to personalize
            </Link>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/start"
              className="px-6 py-3 bg-white text-[#0d1117] rounded font-medium text-sm hover:bg-[#f4f5f7] transition-colors"
            >
              What do you need? &rarr;
            </Link>
            <Link
              href="#pathways"
              className="px-6 py-3 border border-white/20 rounded text-sm hover:bg-white/10 transition-colors"
            >
              Browse pathways
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. SEVEN PATHWAYS — Table of Contents
          ═══════════════════════════════════════════════════════════════ */}
      <section id="pathways" className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-serif font-bold">Explore by pathway</h2>
          <p className="mt-3 text-sm text-[#5c6474] max-w-[500px] mx-auto">
            Seven lenses into your community. Each pathway connects you to organizations,
            services, officials, and opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PATHWAY_LIST.map((p) => {
            const counts = pathwayCounts[p.id] || { content: 0, orgs: 0, total: 0 }
            return (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                className="group block border border-[#dde1e8] rounded-lg p-5 hover:border-transparent hover:shadow-md transition-all"
                style={{ borderLeftWidth: 4, borderLeftColor: p.color }}
              >
                <h3 className="font-semibold text-[#0d1117] group-hover:text-[#1b5e8a] transition-colors">
                  {p.name}
                </h3>
                <p className="mt-2 text-xs text-[#5c6474] leading-relaxed line-clamp-2">
                  {p.description}
                </p>
                <p className="mt-3 text-[11px] text-[#8a929e]">
                  {counts.total.toLocaleString()} resources &middot; {counts.orgs.toLocaleString()} orgs
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. WHAT'S NEW — Latest from the Guide
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[#f4f5f7]">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-serif font-bold">What&apos;s new</h2>
              <p className="mt-1 text-sm text-[#5c6474]">Latest from the guide</p>
            </div>
            <Link href="/news" className="text-sm text-[#1b5e8a] hover:underline">
              All updates &rarr;
            </Link>
          </div>

          {latestContent && latestContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestContent.map((item: any) => {
                const classification = item.classification_v2 || {}
                const contentType = classification.content_type || 'article'
                const themeId = classification.theme_primary
                const theme = themeId ? (THEMES as any)[themeId] : null

                return (
                  <Link
                    key={item.id}
                    href={`/content/${item.id}`}
                    className="group bg-white rounded-lg border border-[#dde1e8] overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Image placeholder */}
                    {item.image_url ? (
                      <div
                        className="h-36 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.image_url})` }}
                      />
                    ) : (
                      <div
                        className="h-36 flex items-center justify-center"
                        style={{ background: theme?.color || '#1b5e8a' }}
                      >
                        <span className="text-white/30 text-xs uppercase tracking-wider">
                          {contentType}
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#8a929e]">
                          {contentType}
                        </span>
                        {theme && (
                          <>
                            <span className="text-[#dde1e8]">&middot;</span>
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.color }}>
                              {theme.name}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-[#0d1117] line-clamp-2 group-hover:text-[#1b5e8a] transition-colors">
                        {item.title_6th_grade || 'Untitled'}
                      </h3>
                      {item.source_domain && (
                        <p className="mt-2 text-[11px] text-[#8a929e]">{item.source_domain}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[#8a929e]">No content yet.</p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. TRUST STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-b border-[#dde1e8]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#5c6474]">
            <span><strong className="text-[#0d1117]">{totalResources.toLocaleString()}</strong> resources</span>
            <span className="hidden sm:inline text-[#dde1e8]">|</span>
            <span><strong className="text-[#0d1117]">{(orgCount || 0).toLocaleString()}</strong> organizations</span>
            <span className="hidden sm:inline text-[#dde1e8]">|</span>
            <span>4 levels of government</span>
            <span className="hidden sm:inline text-[#dde1e8]">|</span>
            <span>3 languages</span>
            <span className="hidden sm:inline text-[#dde1e8]">|</span>
            <span>Updated daily</span>
            <span className="hidden sm:inline text-[#dde1e8]">|</span>
            <span>Free forever</span>
          </div>
        </div>
      </section>
    </div>
  )
}
