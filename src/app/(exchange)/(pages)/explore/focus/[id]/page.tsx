import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import {
  getFocusAreasByIds, getContentByFocusArea, getRelatedOpportunities, getRelatedPolicies,
  getFoundationsByFocusArea,
  getSDGMap, getSDOHMap, getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { getRelatedServices } from '@/lib/data/services'
import { darken } from '@/lib/colors'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ContentCard } from '@/components/exchange/ContentCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { InteractiveMap } from '@/components/maps/dynamic'
import { GEO_LAYERS } from '@/lib/constants'
import type { MarkerData } from '@/components/maps/MapMarker'
import { Geo } from '@/components/geo/sacred'
import { FocusTrail, LEVEL_META } from '@/components/templates/FocusTrail'
import type { TrailLevel, TrailEntry } from '@/components/templates/FocusTrail'
import { SectionHeader } from '@/components/templates/SectionHeader'

export const revalidate = 3600

// Map focus area name patterns to geo types
const FOCUS_GEO: Record<string, string> = {
  mental: 'vesica_piscis',
  food: 'flower_of_life',
  healthcare: 'compass_rose',
  maternal: 'nested_circles',
  substance: 'outward_spiral',
  disability: 'hub_and_spokes',
  oral: 'six_petal_rose',
  environment: 'torus',
  education: 'seed_of_life',
  housing: 'hex_grid',
  job: 'golden_spiral',
  transit: 'concentric_rings',
  safety: 'metatron_cube',
}

function focusGeo(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, geo] of Object.entries(FOCUS_GEO)) {
    if (lower.includes(key)) return geo
  }
  return 'seed_of_life'
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const areas = await getFocusAreasByIds([id])
  if (areas.length === 0) return { title: 'Not Found' }
  return {
    title: areas[0].focus_area_name + ' — The Change Engine',
    description: areas[0].description || 'Explore resources related to ' + areas[0].focus_area_name,
  }
}

export default async function FocusAreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const areas = await getFocusAreasByIds([id])
  if (areas.length === 0) notFound()
  const fa = areas[0]

  const [content, opportunities, policies, foundations, services, sdgMap, sdohMap] = await Promise.all([
    getContentByFocusArea(id),
    getRelatedOpportunities([id]),
    getRelatedPolicies([id]),
    getFoundationsByFocusArea(fa.focus_area_name),
    getRelatedServices([id]),
    fa.sdg_id ? getSDGMap() : Promise.resolve({} as Record<string, { sdg_number: number; sdg_name: string; sdg_color: string | null }>),
    fa.sdoh_code ? getSDOHMap() : Promise.resolve({} as Record<string, { sdoh_name: string; sdoh_description: string | null }>),
  ])

  // Sibling focus areas
  let siblingFocusAreas: Array<{ focus_id: string; focus_area_name: string }> = []
  if (fa.theme_id) {
    const supabase = await createClient()
    const { data: siblings } = await supabase
      .from('focus_areas')
      .select('focus_id, focus_area_name')
      .eq('theme_id', fa.theme_id)
      .neq('focus_id', id)
      .limit(8)
    siblingFocusAreas = siblings || []
  }

  const isEmpty = content.length === 0 && opportunities.length === 0 && policies.length === 0 && services.length === 0

  // Translations
  const langId = await getLangId()
  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  let opportunityTranslations: Record<string, { title?: string; summary?: string }> = {}
  let policyTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(function (c) { return c.inbox_id }).filter(function (cid): cid is string { return cid != null })
    const oppIds = opportunities.map(function (o) { return o.opportunity_id })
    const polIds = policies.map(function (p) { return p.policy_id })
    ;[contentTranslations, opportunityTranslations, policyTranslations] = await Promise.all([
      contentIds.length > 0 ? fetchTranslationsForTable('content_published', contentIds, langId) : {},
      oppIds.length > 0 ? fetchTranslationsForTable('opportunities', oppIds, langId) : {},
      polIds.length > 0 ? fetchTranslationsForTable('policies', polIds, langId) : {},
    ])
  }

  // Opportunity map markers
  const opportunityMarkers: MarkerData[] = opportunities
    .filter(o => (o as any).latitude != null && (o as any).longitude != null)
    .map(o => ({
      id: o.opportunity_id,
      lat: (o as any).latitude as number,
      lng: (o as any).longitude as number,
      title: o.opportunity_name,
      type: 'opportunity' as const,
      address: [o.address, o.city].filter(Boolean).join(', '),
    }))

  // Theme info
  let themeSlug: string | null = null
  let themeName = ''
  let themeColor = '#1b5e8a'
  if (fa.theme_id && THEMES[fa.theme_id as keyof typeof THEMES]) {
    themeSlug = THEMES[fa.theme_id as keyof typeof THEMES].slug
    themeName = THEMES[fa.theme_id as keyof typeof THEMES].name
    themeColor = THEMES[fa.theme_id as keyof typeof THEMES].color
  }

  // SDG + SDOH
  const sdg = fa.sdg_id ? sdgMap[fa.sdg_id] : null
  const sdoh = fa.sdoh_code ? sdohMap[fa.sdoh_code] : null

  // Sort content by trail_level then date
  const sortedContent = [...content].sort(function (a, b) {
    const la = (a as any).trail_level || 1
    const lb = (b as any).trail_level || 1
    if (la !== lb) return la - lb
    const da = a.published_at ? new Date(a.published_at).getTime() : 0
    const db = b.published_at ? new Date(b.published_at).getTime() : 0
    return db - da
  })

  // Build trail levels from content + opportunities + services + policies
  const trailLevels: TrailLevel[] = []

  // Level 1: Articles, explainers, data — "Before You Go"
  const level1Content = sortedContent.filter(function (c) {
    const tl = (c as any).trail_level
    const ct = (c as any).content_type || ''
    return tl === 1 || (!tl && ['news', 'article', 'report', 'data', 'video', 'explainer', 'podcast'].includes(ct))
  })
  if (level1Content.length > 0) {
    trailLevels.push({
      level: 1,
      totalCount: level1Content.length,
      entries: level1Content.slice(0, 3).map(function (c): TrailEntry {
        return {
          id: c.id,
          href: '/content/' + c.id,
          title: c.title_6th_grade || 'Untitled',
          type: (c as any).content_type || 'Article',
          meta: c.source_org_name || undefined,
        }
      }),
    })
  }

  // Level 2: Guides, tools — "Packing List"
  const level2Content = sortedContent.filter(function (c) {
    const tl = (c as any).trail_level
    const ct = (c as any).content_type || ''
    return tl === 2 || (!tl && ['guide', 'tool', 'course', 'diy_kit', 'book'].includes(ct))
  })
  if (level2Content.length > 0) {
    trailLevels.push({
      level: 2,
      totalCount: level2Content.length,
      entries: level2Content.slice(0, 3).map(function (c): TrailEntry {
        return {
          id: c.id,
          href: '/content/' + c.id,
          title: c.title_6th_grade || 'Untitled',
          type: (c as any).content_type || 'Guide',
          meta: c.source_org_name || undefined,
        }
      }),
    })
  }

  // Level 3: Events, opportunities — "Day Trips"
  if (opportunities.length > 0) {
    trailLevels.push({
      level: 3,
      totalCount: opportunities.length,
      entries: opportunities.slice(0, 3).map(function (o): TrailEntry {
        return {
          id: o.opportunity_id,
          href: '/opportunities/' + o.opportunity_id,
          title: o.opportunity_name,
          type: o.is_virtual ? 'Virtual Event' : 'In-Person',
          meta: [o.city, o.start_date ? new Date(o.start_date).toLocaleDateString() : ''].filter(Boolean).join(' \u00b7 '),
        }
      }),
    })
  }

  // Level 4: Organizations & services — "Local Guides"
  if (services.length > 0) {
    trailLevels.push({
      level: 4,
      totalCount: services.length,
      entries: services.slice(0, 3).map(function (svc: any): TrailEntry {
        return {
          id: svc.service_id || svc.id,
          href: '/services/' + (svc.service_id || svc.id),
          title: svc.service_name,
          type: 'Service',
          meta: [svc.city, svc.phone].filter(Boolean).join(' \u00b7 '),
        }
      }),
    })
  }

  // Level 5: Policies — "The Deep Journey"
  if (policies.length > 0) {
    trailLevels.push({
      level: 5,
      totalCount: policies.length,
      entries: policies.slice(0, 3).map(function (p): TrailEntry {
        return {
          id: p.policy_id,
          href: '/policies/' + p.policy_id,
          title: p.title_6th_grade || p.policy_name,
          type: p.bill_number ? p.bill_number : 'Policy',
          meta: [p.level, p.status].filter(Boolean).join(' \u00b7 '),
        }
      }),
    })
  }

  // Remaining content that didn't fit levels 1-2
  const usedIds = new Set([
    ...level1Content.map(c => c.id),
    ...level2Content.map(c => c.id),
  ])
  const remainingContent = sortedContent.filter(c => !usedIds.has(c.id))

  // Compute trail depth (how many levels have content)
  const trailDepth = trailLevels.length

  const geoType = focusGeo(fa.focus_area_name)

  return (
    <div className="min-h-screen bg-white">

      {/* ═══ DARK GRADIENT FOCUS MASTHEAD ═══ */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(158deg, ${darken(themeColor)} 0%, ${themeColor} 100%)`,
          padding: '3rem 1.5rem 2.5rem',
        }}
      >
        {/* Background geo */}
        <div
          className="absolute pointer-events-none animate-[spin_90s_linear_infinite]"
          style={{
            top: '50%', right: '-40px',
            transform: 'translateY(-50%)',
            width: '300px', height: '300px', opacity: 0.12,
          }}
        >
          <Geo type={geoType} size={300} color="#ffffff" opacity={0.6} />
        </div>

        <div className="max-w-[1080px] mx-auto relative z-[2]">
          {/* Region link */}
          {themeName && (
            <Link
              href={'/pathways/' + (themeSlug || '')}
              className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] hover:underline mb-4 block"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              {themeName} &middot; Region
            </Link>
          )}

          {/* Headline with geo mark */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-[50px] h-[50px] flex-shrink-0 opacity-[0.6]">
              <Geo type={geoType} size={50} color="#ffffff" />
            </div>
            <h1
              className="font-display font-black text-white leading-[0.95] tracking-[-0.02em]"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
            >
              {fa.focus_area_name}
            </h1>
          </div>

          {/* Deck */}
          {fa.description && (
            <p
              className="font-body italic text-[0.92rem] leading-[1.7] max-w-[560px] mb-5"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {fa.description}
            </p>
          )}

          {/* Metadata pills */}
          <div className="flex flex-wrap items-center gap-2">
            {sdg && (
              <span
                className="font-mono text-[0.6rem] uppercase tracking-[0.08em] px-2.5 py-1"
                style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                SDG {sdg.sdg_number}
              </span>
            )}
            {sdoh && (
              <span
                className="font-mono text-[0.6rem] uppercase tracking-[0.08em] px-2.5 py-1"
                style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                SDOH: {sdoh.sdoh_name}
              </span>
            )}
            <span
              className="font-mono text-[0.6rem] uppercase tracking-[0.08em] px-2.5 py-1"
              style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {trailDepth} of 5 levels
            </span>
          </div>

          {/* Trail depth dots */}
          <div className="flex items-center gap-2 mt-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Trail depth
            </span>
            <div className="flex gap-[3px]">
              {[1,2,3,4,5].map(function (n) {
                const isLit = trailLevels.some(l => l.level === n)
                return (
                  <span
                    key={n}
                    className="w-[6px] h-[6px]"
                    style={{ background: isLit ? '#ffffff' : 'rgba(255,255,255,0.2)' }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ WAYFINDER BREADCRUMB ═══ */}
      <div className="border-b-2 border-ink">
        <div className="max-w-[1080px] mx-auto px-6 py-3 flex items-center justify-between">
          <nav className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim">
            <Link href="/guide" className="hover:text-blue transition-colors">Guide</Link>
            <span className="mx-1.5 text-faint">&rsaquo;</span>
            {themeName && (
              <>
                <Link href={'/pathways/' + (themeSlug || '')} className="hover:text-blue transition-colors">{themeName}</Link>
                <span className="mx-1.5 text-faint">&rsaquo;</span>
              </>
            )}
            <span className="text-blue">{fa.focus_area_name}</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6rem] text-faint uppercase tracking-[0.1em]">Trail depth</span>
            <div className="flex gap-[2.5px]">
              {[1,2,3,4,5].map(function (n) {
                const isLit = trailLevels.some(l => l.level === n)
                return (
                  <span
                    key={n}
                    className="w-[5px] h-[5px]"
                    style={{ background: isLit ? themeColor : '#dde1e8' }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FIVE-LEVEL TRAIL ═══ */}
      {trailLevels.length > 0 ? (
        <FocusTrail
          levels={trailLevels}
          themeColor={themeColor}
          focusName={fa.focus_area_name}
        />
      ) : (
        /* Empty state */
        <div className="max-w-[1080px] mx-auto px-6 py-16 text-center">
          <div className="w-[80px] h-[80px] mx-auto mb-6 opacity-[0.15]">
            <Geo type={geoType} size={80} color={themeColor} />
          </div>
          <p className="font-display text-[1.2rem] font-bold text-ink mb-2">
            We&apos;re building out resources for {fa.focus_area_name}.
          </p>
          <p className="font-body text-[0.85rem] text-dim max-w-md mx-auto mb-6">
            In the meantime, try these starting points:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:211"
              className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] font-semibold px-5 py-2.5 bg-ink text-white hover:opacity-90 transition-opacity"
            >
              Call 211
            </a>
            <Link
              href={'/search?q=' + encodeURIComponent(fa.focus_area_name)}
              className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] px-5 py-2.5 border border-rule hover:bg-paper transition-colors"
            >
              Search &ldquo;{fa.focus_area_name}&rdquo;
            </Link>
          </div>
        </div>
      )}

      {/* ═══ REMAINING ARTICLES (not in trail levels) ═══ */}
      {remainingContent.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-6 border-t-2 border-ink">
          <SectionHeader
            kicker="More resources"
            heading="All"
            headingEm="Articles"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {remainingContent.slice(0, 6).map(function (c) {
              const t = c.inbox_id ? contentTranslations[c.inbox_id] : undefined
              return (
                <ContentCard
                  key={c.id}
                  id={c.id}
                  title={c.title_6th_grade}
                  summary={c.summary_6th_grade}
                  pathway={c.pathway_primary}
                  center={c.center}
                  sourceUrl={c.source_url}
                  publishedAt={c.published_at}
                  imageUrl={c.image_url ?? null}
                  translatedTitle={t?.title}
                  translatedSummary={t?.summary}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ OPPORTUNITY MAP ═══ */}
      {opportunityMarkers.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-6 border-t border-rule-inner">
          <SectionHeader
            kicker="Near you"
            heading="Opportunities"
            headingEm="Map"
          />
          <div style={{ border: '1.5px solid var(--color-rule, #dde1e8)' }}>
            <InteractiveMap
              markers={opportunityMarkers}
              layers={[GEO_LAYERS.superNeighborhoods]}
              defaultVisibleLayers={[]}
              className="w-full h-[280px]"
              showLegend={false}
            />
          </div>
        </section>
      )}

      {/* ═══ FOUNDATIONS ═══ */}
      {foundations.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-6 border-t border-rule-inner">
          <SectionHeader
            kicker="Funders"
            heading="Foundations"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-rule-inner">
            {foundations.map(function (f: any) {
              return (
                <Link
                  key={f.id}
                  href="/foundations"
                  className="p-5 border-b border-r border-rule-inner hover:bg-paper transition-colors"
                >
                  <span className="font-display text-[0.88rem] font-bold text-ink block">{f.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    {f.assets && (
                      <span className="font-mono text-[0.6875rem] text-blue">{f.assets}</span>
                    )}
                    {f.annual_giving && (
                      <span className="font-mono text-[0.6875rem] text-dim">{f.annual_giving}/yr</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ RELATED FOCUS AREAS ═══ */}
      {siblingFocusAreas.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-6 border-t-2 border-ink">
          <SectionHeader
            kicker="Also in this region"
            heading="Related"
            headingEm="Destinations"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border border-rule-inner">
            {siblingFocusAreas.map(function (sib) {
              return (
                <Link
                  key={sib.focus_id}
                  href={'/explore/focus/' + sib.focus_id}
                  className="group p-5 border-b border-r border-rule-inner hover:bg-paper transition-colors"
                >
                  <div className="w-[28px] h-[28px] mb-2 opacity-[0.3] group-hover:opacity-[0.5] transition-opacity">
                    <Geo type={focusGeo(sib.focus_area_name)} size={28} color={themeColor} />
                  </div>
                  <span className="font-display text-[0.82rem] font-bold text-ink group-hover:text-blue transition-colors block">
                    {sib.focus_area_name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ FOOTER CODA ═══ */}
      <div className="border-t border-rule-inner">
        <div className="max-w-[1080px] mx-auto px-6 py-8 flex flex-wrap gap-6">
          <Link href="/explore" className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim hover:text-blue transition-colors">
            &larr; Back to Explore
          </Link>
          {themeSlug && (
            <Link href={'/pathways/' + themeSlug} className="font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-dim hover:text-blue transition-colors">
              &larr; Back to {themeName}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

