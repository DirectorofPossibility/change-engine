/**
 * @fileoverview Homepage — Guide Cover
 *
 * The front page of the field guide. Editorial, warm, rich.
 * Uses the design system: sharp corners, no shadows, sacred geometry,
 * pathway gradients, monospace labels, editorial typography.
 *
 * Structure:
 *   1. Hero — editorial photo bg + sacred geometry + stats
 *   2. Spectrum bar — 7 pathway colors
 *   3. What Brings You Here — 5 trail levels as entry points
 *   4. Seven Pathways — FolFallback cards with descriptions
 *   5. From the Guide — CouchGrid magazine layout
 *   6. Trust strip
 *
 * @route GET /
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import { resolveUserGeo, getPathwayCounts } from '@/lib/data/entity-graph'
import { Geo } from '@/components/geo/sacred'
import { FolFallback } from '@/components/ui/FolFallback'
import { CouchGrid } from '@/components/templates/CouchGrid'

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

const TRAIL_LEVELS = [
  { level: 1, name: 'Get Curious', verb: 'Learn', description: 'Read an article, watch a video, explore a topic', color: '#1b5e8a', icon: 'compass_rose' },
  { level: 2, name: 'Find Your People', verb: 'Connect', description: 'Discover organizations and neighbors near you', color: '#1a6b56', icon: 'vesica_piscis' },
  { level: 3, name: 'Show Up', verb: 'Participate', description: 'Attend an event, volunteer, go to a meeting', color: '#4a2870', icon: 'hex_grid' },
  { level: 4, name: 'Go Deeper', verb: 'Build', description: 'Take a course, join a committee, develop skills', color: '#7a2018', icon: 'flower_of_life' },
  { level: 5, name: 'Make Your Move', verb: 'Lead', description: 'Organize, run for office, start something new', color: '#0d1117', icon: 'metatron_cube' },
]

export default async function HomePage() {
  const cookieStore = await cookies()
  const zip = cookieStore.get('zip')?.value || null

  const supabase = await createClient()

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
      .limit(5),
  ])

  const totalResources = (orgCount || 0) + (serviceCount || 0)

  // Format content for CouchGrid
  const couchItems = (latestContent || []).map((item: any, i: number) => ({
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
          1. HERO — Guide Cover
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(158deg, #050810 0%, #0d1a2a 50%, #1b5e8a 100%)' }}>
        {/* Editorial photo background */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/editorial/community-meeting.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Sacred geometry watermark */}
        <div className="absolute pointer-events-none animate-[spin_120s_linear_infinite]" style={{ top: '50%', right: '-80px', transform: 'translateY(-50%)', width: '420px', height: '420px', opacity: 0.08 }}>
          <Geo type="seed_of_life" size={420} color="#ffffff" opacity={0.6} />
        </div>
        <div className="absolute pointer-events-none animate-[spin_90s_linear_infinite_reverse]" style={{ bottom: '-40px', left: '-60px', width: '280px', height: '280px', opacity: 0.04 }}>
          <Geo type="flower_of_life" size={280} color="#ffffff" opacity={0.5} />
        </div>

        <div className="relative z-10 max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16 md:py-24">
          {/* Dateline */}
          <div className="flex items-center gap-3 mb-6">
            <span className="block w-8 h-px bg-white/30" />
            <span className="font-mono text-micro uppercase tracking-[0.24em] text-white/40">
              A Field Guide to Greater Houston
            </span>
          </div>

          <h1 className="font-display font-black text-white leading-[0.95] tracking-[-0.025em] mb-6" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)' }}>
            {totalResources.toLocaleString()} free resources.
            <br />
            <em className="text-teal">{(orgCount || 0).toLocaleString()} organizations.</em>
            <br />
            Your community.
          </h1>

          {/* Rule */}
          <div className="w-[50px] h-[2px] bg-white/30 mb-6" />

          <p className="font-body italic text-base leading-[1.7] max-w-[560px] text-white/65 mb-8">
            Everything you need to learn, connect, and take action in Greater Houston —
            sorted by what matters to you.
          </p>

          {/* ZIP anchor */}
          {geo ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 font-mono text-micro uppercase tracking-[0.1em] text-white/50 mb-8">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>
                Near <strong className="text-white/80">{geo.zip}</strong>
                {geo.neighborhoodName && <> — {geo.neighborhoodName}</>}
              </span>
            </div>
          ) : (
            <Link
              href="/my-plan/settings"
              className="inline-flex items-center gap-2 px-4 py-2 border border-white/15 font-mono text-micro uppercase tracking-[0.1em] text-white/50 hover:text-white/80 hover:border-white/30 transition-colors mb-8"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Enter your ZIP to personalize
            </Link>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap max-w-[640px] border border-white/12">
            {[
              { num: totalResources.toLocaleString(), desc: 'Resources' },
              { num: (orgCount || 0).toLocaleString(), desc: 'Organizations' },
              { num: '7', desc: 'Pathways' },
              { num: '3', desc: 'Languages' },
            ].map((s, i) => (
              <div key={i} className="flex-1 min-w-[120px] px-5 py-4" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.12)' : undefined }}>
                <span className="font-display font-black text-[1.75rem] leading-none block text-teal">{s.num}</span>
                <span className="font-mono text-micro uppercase tracking-[0.1em] mt-1 block text-white/40">{s.desc}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/start" className="btn-primary">
              What do you need? →
            </Link>
            <Link href="#pathways" className="btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
              Browse pathways
            </Link>
          </div>
        </div>
      </section>

      {/* Spectrum bar */}
      <div className="spectrum-bar">
        {PATHWAY_LIST.map((p) => (
          <div key={p.id} style={{ background: p.color }} />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. WHAT BRINGS YOU HERE — Trail Levels as Entry Points
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-paper">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
          <div className="mb-10">
            <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
              Your journey
            </span>
            <h2 className="font-display text-headline font-black text-ink">
              What brings you here?
            </h2>
            <div className="w-[40px] h-[2px] bg-rule mt-4" />
          </div>

          <div className="space-y-0">
            {TRAIL_LEVELS.map((trail) => (
              <Link
                key={trail.level}
                href="/start"
                className="group flex items-center gap-6 py-5 border-b border-rule hover:bg-white transition-colors -mx-4 px-4"
              >
                {/* Geo icon */}
                <div className="w-[48px] h-[48px] flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity">
                  <Geo type={trail.icon} size={48} color={trail.color} />
                </div>

                {/* Level marker */}
                <div className="flex items-center gap-2 w-[100px] flex-shrink-0">
                  <span className="w-[6px] h-[6px]" style={{ background: trail.color }} />
                  <span className="font-mono text-micro uppercase tracking-[0.1em]" style={{ color: trail.color }}>
                    Level {trail.level}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <span className="font-display text-lg font-bold text-ink group-hover:text-blue transition-colors block">
                    {trail.name}
                  </span>
                  <span className="font-body text-sm text-dim block mt-0.5">
                    {trail.description}
                  </span>
                </div>

                {/* Verb tag */}
                <span className="effort-tag hidden sm:inline-block flex-shrink-0">
                  {trail.verb}
                </span>

                {/* Arrow */}
                <span className="font-mono text-blue flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. SEVEN PATHWAYS — Rich Cards with Geometry
          ═══════════════════════════════════════════════════════════════ */}
      <section id="pathways" className="border-t border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
          <div className="mb-10">
            <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
              Table of contents
            </span>
            <h2 className="font-display text-headline font-black text-ink">
              Seven Pathways
            </h2>
            <p className="font-body italic text-base leading-[1.7] text-dim max-w-[560px] mt-3">
              Seven lenses into your community. Each pathway connects you to organizations,
              services, officials, and opportunities.
            </p>
            <div className="w-[40px] h-[2px] bg-rule mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-rule">
            {PATHWAY_LIST.map((p, i) => {
              const counts = pathwayCounts[p.id] || { content: 0, orgs: 0, total: 0 }
              return (
                <Link
                  key={p.slug}
                  href={`/${p.slug}`}
                  className="group flex flex-col border-b border-r border-rule hover:bg-paper transition-colors"
                >
                  {/* Pathway geometry header */}
                  <FolFallback pathway={p.id} size="card" />

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-[6px] h-[6px]" style={{ background: p.color }} />
                      <span className="font-mono text-micro uppercase tracking-[0.14em]" style={{ color: p.color }}>
                        Pathway {i + 1}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink group-hover:text-blue transition-colors">
                      {p.name}
                    </h3>

                    <p className="font-body text-sm text-dim leading-relaxed mt-2 flex-1 line-clamp-3">
                      {p.description}
                    </p>

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-rule">
                      <span className="font-mono text-micro text-faint">
                        {counts.total.toLocaleString()} resources
                      </span>
                      <span className="font-mono text-micro text-faint">
                        {counts.orgs.toLocaleString()} orgs
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Browse all — fill last cell */}
            <Link
              href="/start"
              className="group flex flex-col items-center justify-center p-8 border-b border-r border-rule bg-paper hover:bg-white transition-colors text-center"
            >
              <div className="w-[60px] h-[60px] opacity-30 group-hover:opacity-50 transition-opacity mb-4">
                <Geo type="compass_rose" size={60} color="#1b5e8a" />
              </div>
              <span className="font-display text-lg font-bold text-blue">
                Not sure where to start?
              </span>
              <span className="font-mono text-micro uppercase tracking-[0.1em] text-faint mt-2">
                Find what you need →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. FROM THE GUIDE — Magazine Layout
          ═══════════════════════════════════════════════════════════════ */}
      {couchItems.length > 0 && (
        <section className="bg-paper border-t border-rule">
          <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                  Latest
                </span>
                <h2 className="font-display text-headline font-black text-ink">
                  From the Guide
                </h2>
              </div>
              <Link href="/news" className="font-mono text-micro uppercase tracking-[0.1em] text-blue hover:underline">
                All updates →
              </Link>
            </div>

            <CouchGrid
              items={couchItems}
              themeColor="#1b5e8a"
              geoType="seed_of_life"
            />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. NEIGHBORHOOD — Geographic Context
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-rule">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-16">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 items-center">
            <div>
              <span className="font-mono text-micro uppercase tracking-[0.18em] text-dim block mb-2">
                You are here
              </span>
              <h2 className="font-display text-title font-black text-ink mb-4">
                {geo ? `Near ${geo.zip}` : 'Greater Houston'}
              </h2>
              <p className="font-body text-sm text-dim leading-relaxed mb-6">
                {geo
                  ? `Showing resources near ${geo.neighborhoodName || geo.zip}. Every service, official, and organization filtered to your area.`
                  : 'Eight counties, 88 super neighborhoods, thousands of organizations. Enter your ZIP to see what\'s near you.'
                }
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/map" className="btn-primary">
                  Open the map
                </Link>
                {!geo && (
                  <Link href="/my-plan/settings" className="btn-secondary">
                    Set your ZIP
                  </Link>
                )}
              </div>
            </div>

            {/* Map preview / editorial photo */}
            <div className="relative overflow-hidden border border-rule">
              <Image
                src="/images/editorial/neighborhood.jpg"
                alt="Houston neighborhood"
                width={600}
                height={350}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="font-mono text-micro uppercase tracking-[0.1em] text-white/60">
                  8 counties · 88 super neighborhoods · 4 levels of government
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. TRUST STRIP
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-rule bg-ink text-white">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--content-padding)] py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-micro uppercase tracking-[0.1em] text-white/40">
            <span><strong className="text-teal">{totalResources.toLocaleString()}</strong> resources</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span><strong className="text-teal">{(orgCount || 0).toLocaleString()}</strong> organizations</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>4 levels of govt</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>3 languages</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>Updated daily</span>
            <span className="hidden sm:inline text-white/15">|</span>
            <span>Free forever</span>
          </div>
        </div>
      </section>

      {/* Spectrum bar */}
      <div className="spectrum-bar">
        {PATHWAY_LIST.map((p) => (
          <div key={p.id} style={{ background: p.color }} />
        ))}
      </div>
    </div>
  )
}
