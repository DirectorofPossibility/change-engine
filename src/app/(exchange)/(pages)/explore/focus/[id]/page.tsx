import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { THEMES } from '@/lib/constants'
import {
  getFocusAreasByIds, getContentByFocusArea, getRelatedOpportunities, getRelatedPolicies,
  getFoundationsByFocusArea,
  getSDGMap, getSDOHMap, getLangId, fetchTranslationsForTable,
} from '@/lib/data/exchange'
import { getRelatedServices } from '@/lib/data/services'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ContentCard } from '@/components/exchange/ContentCard'
import { OpportunityCard } from '@/components/exchange/OpportunityCard'
import { PolicyCard } from '@/components/exchange/PolicyCard'
import { ClusteredMap } from '@/components/maps/dynamic'
import type { MarkerData } from '@/components/maps/MapMarker'

export const revalidate = 3600

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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

  // Sibling focus areas for discovery
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

  // SDG + SDOH info
  const sdg = fa.sdg_id ? sdgMap[fa.sdg_id] : null
  const sdoh = fa.sdoh_code ? sdohMap[fa.sdoh_code] : null

  // Sort content by date (newest first)
  const sortedContent = [...content].sort(function (a, b) {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0
    const db = b.published_at ? new Date(b.published_at).getTime() : 0
    return db - da
  })

  // Split: first 4 visible, rest behind disclosure
  const contentPreview = sortedContent.slice(0, 4)
  const contentRest = sortedContent.slice(4)
  const servicesPreview = services.slice(0, 4)
  const servicesRest = services.slice(4)
  const opportunitiesPreview = opportunities.slice(0, 3)
  const opportunitiesRest = opportunities.slice(3)
  const policiesPreview = policies.slice(0, 3)
  const policiesRest = policies.slice(3)

  // Section counts for the table of contents
  const sections: Array<{ label: string; count: number; anchor: string }> = []
  if (content.length > 0) sections.push({ label: 'Articles & Guides', count: content.length, anchor: 'articles' })
  if (services.length > 0) sections.push({ label: 'Services', count: services.length, anchor: 'services' })
  if (opportunities.length > 0) sections.push({ label: 'Opportunities', count: opportunities.length, anchor: 'opportunities' })
  if (policies.length > 0) sections.push({ label: 'Policies & Legislation', count: policies.length, anchor: 'policies' })
  if (foundations.length > 0) sections.push({ label: 'Foundations', count: foundations.length, anchor: 'foundations' })

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>

        <div className="relative z-10 max-w-[900px] mx-auto px-6 py-16 md:py-20">
          {/* Pathway breadcrumb */}
          <div className="flex items-center gap-2 mb-6">
            {fa.theme_id && themeSlug && (
              <Link
                href={'/explore/theme/' + themeSlug}
                className="hover:underline"
                style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: themeColor, textTransform: 'uppercase' }}
              >
                {themeName}
              </Link>
            )}
            {!fa.theme_id && (
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase' }}>
                Focus Area
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.1, color: INK }}>
            {fa.focus_area_name}
          </h1>

          {fa.description && (
            <p className="mt-4 max-w-[600px]" style={{ fontFamily: SERIF, fontSize: 17, lineHeight: 1.7, color: MUTED }}>
              {fa.description}
            </p>
          )}

          {/* Metadata tags */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {sdg && (
              <span
                className="px-3 py-1"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: sdg.sdg_color || MUTED, border: '1px solid ' + (sdg.sdg_color || RULE_COLOR), textTransform: 'uppercase' }}
              >
                SDG {sdg.sdg_number}: {sdg.sdg_name}
              </span>
            )}
            {sdoh && (
              <span
                className="px-3 py-1"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: MUTED, border: '1px solid ' + RULE_COLOR, textTransform: 'uppercase' }}
              >
                SDOH: {sdoh.sdoh_name}
              </span>
            )}
            {fa.is_bridging && (
              <span
                className="px-3 py-1"
                style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', color: MUTED, border: '1px dashed ' + RULE_COLOR, textTransform: 'uppercase' }}
              >
                Bridging Area
              </span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: RULE_COLOR }} />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.06em', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/explore" className="hover:underline" style={{ color: CLAY }}>Explore</Link>
          <span className="mx-2">/</span>
          <span>{fa.focus_area_name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* ── Table of Contents — progressive disclosure starts here ── */}
        {sections.length > 0 && (
          <nav className="mb-10 p-5" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
            <p className="mb-3" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase' }}>
              What's here
            </p>
            <div className="space-y-1.5">
              {sections.map(function (s) {
                return (
                  <a
                    key={s.anchor}
                    href={'#' + s.anchor}
                    className="flex items-baseline gap-2 group"
                  >
                    <span className="flex-1 truncate" style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>
                      {s.label}
                    </span>
                    <span className="flex-1 border-b border-dotted" style={{ borderColor: RULE_COLOR }} />
                    <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                      {s.count}
                    </span>
                  </a>
                )
              })}
            </div>
          </nav>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <div className="mb-10 text-center py-12">
            <Image src="/images/fol/vesica-piscis.svg" alt="" width={80} height={80} className="opacity-[0.08] mx-auto mb-6" />
            <p style={{ fontFamily: SERIF, fontSize: 18, color: INK }}>
              We're building out resources for {fa.focus_area_name}.
            </p>
            <p className="mt-2 max-w-md mx-auto" style={{ fontFamily: SERIF, fontSize: 14, color: MUTED }}>
              In the meantime, try these starting points:
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="tel:211"
                className="px-5 py-2.5 text-white transition-opacity hover:opacity-90"
                style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em', background: CLAY }}
              >
                Call 211
              </a>
              <Link
                href={'/search?q=' + encodeURIComponent(fa.focus_area_name)}
                className="px-5 py-2.5 transition-colors hover:bg-[#EDE7D8]"
                style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em', color: INK, border: '1px solid ' + RULE_COLOR }}
              >
                Search "{fa.focus_area_name}"
              </Link>
              <Link
                href="/services"
                className="px-5 py-2.5 transition-colors hover:bg-[#EDE7D8]"
                style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.04em', color: INK, border: '1px solid ' + RULE_COLOR }}
              >
                Browse Services
              </Link>
            </div>
          </div>
        )}

        {/* ── Articles & Guides ── */}
        {content.length > 0 && (
          <section id="articles" className="scroll-mt-8">
            <SectionHeader label="Articles & Guides" count={content.length} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contentPreview.map(function (c) {
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
            {contentRest.length > 0 && (
              <details className="mt-4 group">
                <summary
                  className="cursor-pointer list-none hover:underline"
                  style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                >
                  <span className="group-open:hidden">Show {contentRest.length} more articles &darr;</span>
                  <span className="hidden group-open:inline">Show fewer &uarr;</span>
                </summary>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {contentRest.map(function (c) {
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
              </details>
            )}

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Services ── */}
        {services.length > 0 && (
          <section id="services" className="scroll-mt-8">
            <SectionHeader label="Services" count={services.length} />
            <div className="mt-5 divide-y" style={{ borderTop: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}>
              {servicesPreview.map(function (svc: any) {
                return (
                  <Link
                    key={svc.service_id || svc.id}
                    href={'/services/' + (svc.service_id || svc.id)}
                    className="block py-4 px-4 transition-colors hover:bg-[#EDE7D8]"
                    style={{ borderColor: RULE_COLOR }}
                  >
                    <p style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>{svc.service_name}</p>
                    {svc.description_5th_grade && (
                      <p className="mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED }}>
                        {svc.description_5th_grade}
                      </p>
                    )}
                    {(svc.phone || svc.city) && (
                      <p className="mt-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                        {[svc.city, svc.phone].filter(Boolean).join(' \u00b7 ')}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
            {servicesRest.length > 0 && (
              <details className="mt-3 group">
                <summary
                  className="cursor-pointer list-none hover:underline"
                  style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                >
                  <span className="group-open:hidden">Show {servicesRest.length} more services &darr;</span>
                  <span className="hidden group-open:inline">Show fewer &uarr;</span>
                </summary>
                <div className="mt-3 divide-y" style={{ borderTop: '1px solid ' + RULE_COLOR, borderBottom: '1px solid ' + RULE_COLOR }}>
                  {servicesRest.map(function (svc: any) {
                    return (
                      <Link
                        key={svc.service_id || svc.id}
                        href={'/services/' + (svc.service_id || svc.id)}
                        className="block py-4 px-4 transition-colors hover:bg-[#EDE7D8]"
                        style={{ borderColor: RULE_COLOR }}
                      >
                        <p style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>{svc.service_name}</p>
                        {svc.description_5th_grade && (
                          <p className="mt-1 line-clamp-2" style={{ fontFamily: SERIF, fontSize: 13, color: MUTED }}>
                            {svc.description_5th_grade}
                          </p>
                        )}
                        {(svc.phone || svc.city) && (
                          <p className="mt-1" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                            {[svc.city, svc.phone].filter(Boolean).join(' \u00b7 ')}
                          </p>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Opportunities ── */}
        {opportunities.length > 0 && (
          <section id="opportunities" className="scroll-mt-8">
            <SectionHeader label="Opportunities" count={opportunities.length} />

            {opportunityMarkers.length > 0 && (
              <div className="mt-5 mb-4" style={{ border: '1px solid ' + RULE_COLOR }}>
                <ClusteredMap markers={opportunityMarkers} className="w-full h-[250px]" showLegend={false} />
              </div>
            )}

            <div className="mt-5 space-y-3">
              {opportunitiesPreview.map(function (o) {
                const ot = opportunityTranslations[o.opportunity_id]
                return (
                  <OpportunityCard
                    key={o.opportunity_id}
                    name={o.opportunity_name}
                    description={o.description_5th_grade}
                    startDate={o.start_date}
                    endDate={o.end_date}
                    address={o.address}
                    city={o.city}
                    isVirtual={o.is_virtual}
                    registrationUrl={o.registration_url}
                    spotsAvailable={o.spots_available}
                    translatedName={ot?.title}
                    translatedDescription={ot?.summary}
                  />
                )
              })}
            </div>
            {opportunitiesRest.length > 0 && (
              <details className="mt-3 group">
                <summary
                  className="cursor-pointer list-none hover:underline"
                  style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                >
                  <span className="group-open:hidden">Show {opportunitiesRest.length} more opportunities &darr;</span>
                  <span className="hidden group-open:inline">Show fewer &uarr;</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {opportunitiesRest.map(function (o) {
                    const ot = opportunityTranslations[o.opportunity_id]
                    return (
                      <OpportunityCard
                        key={o.opportunity_id}
                        name={o.opportunity_name}
                        description={o.description_5th_grade}
                        startDate={o.start_date}
                        endDate={o.end_date}
                        address={o.address}
                        city={o.city}
                        isVirtual={o.is_virtual}
                        registrationUrl={o.registration_url}
                        spotsAvailable={o.spots_available}
                        translatedName={ot?.title}
                        translatedDescription={ot?.summary}
                      />
                    )
                  })}
                </div>
              </details>
            )}

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Policies & Legislation ── */}
        {policies.length > 0 && (
          <section id="policies" className="scroll-mt-8">
            <SectionHeader label="Policies & Legislation" count={policies.length} />
            <div className="mt-5 space-y-3">
              {policiesPreview.map(function (p) {
                const pt = policyTranslations[p.policy_id]
                return (
                  <PolicyCard
                    key={p.policy_id}
                    name={p.title_6th_grade || p.policy_name}
                    summary={p.summary_6th_grade || p.summary_5th_grade}
                    billNumber={p.bill_number}
                    status={p.status}
                    level={p.level}
                    sourceUrl={p.source_url}
                    translatedName={pt?.title}
                    translatedSummary={pt?.summary}
                  />
                )
              })}
            </div>
            {policiesRest.length > 0 && (
              <details className="mt-3 group">
                <summary
                  className="cursor-pointer list-none hover:underline"
                  style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                >
                  <span className="group-open:hidden">Show {policiesRest.length} more policies &darr;</span>
                  <span className="hidden group-open:inline">Show fewer &uarr;</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {policiesRest.map(function (p) {
                    const pt = policyTranslations[p.policy_id]
                    return (
                      <PolicyCard
                        key={p.policy_id}
                        name={p.title_6th_grade || p.policy_name}
                        summary={p.summary_6th_grade || p.summary_5th_grade}
                        billNumber={p.bill_number}
                        status={p.status}
                        level={p.level}
                        sourceUrl={p.source_url}
                        translatedName={pt?.title}
                        translatedSummary={pt?.summary}
                      />
                    )
                  })}
                </div>
              </details>
            )}

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Foundations ── */}
        {foundations.length > 0 && (
          <section id="foundations" className="scroll-mt-8">
            <SectionHeader label="Foundations" count={foundations.length} />
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {foundations.map(function (f: any) {
                return (
                  <Link
                    key={f.id}
                    href="/foundations"
                    className="block p-4 transition-colors hover:bg-[#EDE7D8]"
                    style={{ border: '1px solid ' + RULE_COLOR }}
                  >
                    <p style={{ fontFamily: SERIF, fontSize: 15, color: INK }}>{f.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {f.assets && (
                        <span style={{ fontFamily: MONO, fontSize: 11, color: CLAY }}>{f.assets}</span>
                      )}
                      {f.annual_giving && (
                        <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{f.annual_giving}/yr</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Related Focus Areas ── */}
        {siblingFocusAreas.length > 0 && (
          <section className="scroll-mt-8">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 12 }}>
              Related Focus Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {siblingFocusAreas.map(function (sib) {
                return (
                  <Link
                    key={sib.focus_id}
                    href={'/explore/focus/' + sib.focus_id}
                    className="px-4 py-2 transition-colors hover:bg-[#EDE7D8]"
                    style={{ fontFamily: SERIF, fontSize: 14, color: INK, border: '1px solid ' + RULE_COLOR }}
                  >
                    {sib.focus_area_name}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <div className="mt-12" style={{ height: 1, background: RULE_COLOR }} />
        <div className="py-8 flex flex-wrap gap-6">
          <Link href="/explore" className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
            &larr; Back to Explore
          </Link>
          {themeSlug && (
            <Link href={'/explore/theme/' + themeSlug} className="hover:underline" style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: MUTED }}>
              &larr; Back to {themeName}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Section header with count ── */

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: INK }}>{label}</h2>
      <div className="flex-1" style={{ height: 1, background: RULE_COLOR }} />
      <span style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </div>
  )
}
