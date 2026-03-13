import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { THEMES } from '@/lib/constants'
import {
  getPathwaysHubData,
  getExchangeStats,
  getPathwayBridges,
  getRandomQuote,
} from '@/lib/data/exchange'
import { getLibraryNuggets } from '@/lib/data/library'
import { getUIStrings } from '@/lib/i18n'
import Image from 'next/image'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Seven Pathways Into Community Life',
  description: 'Explore health, families, neighborhood, voice, money, planet, and bridging divides across services, content, officials, policies, and learning paths.',
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: 'Articles',
  report: 'Reports',
  video: 'Videos',
  event: 'Events',
  tool: 'Tools',
  course: 'Courses',
  guide: 'Guides',
  campaign: 'Campaigns',
  opportunity: 'Opportunities',
}

const ENTITY_ICONS: Record<string, { label: string; href: string }> = {
  services: { label: 'Services', href: '/services' },
  officials: { label: 'Officials', href: '/officials' },
  policies: { label: 'Policies', href: '/policies' },
  opportunities: { label: 'Opportunities', href: '/opportunities' },
}

/* ── Design tokens ── */
const PARCHMENT_LIGHT = '#f4f5f7'
const SAGE = '#5C7A5E'

export default async function PathwaysPage() {
  const [hubData, stats, bridges, quote] = await Promise.all([
    getPathwaysHubData(),
    getExchangeStats(),
    getPathwayBridges(),
    getRandomQuote(),
  ])

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  const totalContent = Object.values(hubData).reduce(function (sum, p) { return sum + p.totalContent }, 0)
  const totalServices = Object.values(hubData).reduce(function (sum, p) { return sum + p.entityCounts.services }, 0)
  const totalPolicies = Object.values(hubData).reduce(function (sum, p) { return sum + p.entityCounts.policies }, 0)

  const themeEntries = Object.entries(THEMES)

  return (
    <div style={{  }}>

      {/* ══════════════════════════════════════════
          1. HERO
          ══════════════════════════════════════════ */}
      <section style={{ backgroundColor: '#f4f5f7' }}>
        {/* 3px clay top bar */}
        <div style={{ height: 3, backgroundColor: '#1b5e8a' }} />

        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          {/* MONO breadcrumb */}
          <nav style={{  }} className="text-xs tracking-wider uppercase mb-6">
            <Link href="/explore" className="hover:underline" style={{ color: "#5c6474" }}>
              The Exchange
            </Link>
            <span style={{ color: "#5c6474" }}> / </span>
            <span style={{ color: "#1b5e8a" }}>Pathways</span>
          </nav>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
            style={{  }}
          >
            Seven pathways into community life.
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-8"
            style={{ fontStyle: 'italic', color: "#5c6474" }}
          >
            Every pathway connects you to content, services, officials, learning paths, and opportunities across Houston's civic landscape.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 mb-8">
            {[
              { value: totalContent, label: 'Published' },
              { value: stats.services, label: 'Services' },
              { value: stats.officials, label: 'Officials' },
              { value: totalPolicies, label: 'Policies' },
              { value: stats.learningPaths, label: 'Learning Paths' },
            ].map(function (stat) {
              return (
                <div key={stat.label} style={{  }} className="text-center">
                  <p className="text-2xl font-bold" style={{  }}>{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5c6474" }}>{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* 60px clay rule */}
          <div style={{ width: 60, height: 3, backgroundColor: '#1b5e8a' }} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          2. PATHWAY SECTIONS
          ══════════════════════════════════════════ */}
      {themeEntries.map(function ([themeId, theme], idx) {
        const data = hubData[themeId]
        if (!data) return null

        const hero = data.heroContent[0]
        const secondary = data.heroContent.slice(1, 3)
        const topFocusAreas = data.focusAreas.slice(0, 8)
        const bgColor = idx % 2 === 0 ? '#ffffff' : PARCHMENT_LIGHT

        return (
          <section key={themeId} style={{ backgroundColor: bgColor }}>
            {/* Section divider label */}
            <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
              <p
                className="text-[11px] uppercase tracking-[0.2em] mb-6"
                style={{ color: theme.color }}
              >
                Pathway {idx + 1} &middot; {theme.name}
              </p>
            </div>

            <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

                {/* ── Left column: content ── */}
                <div>
                  {/* Pathway heading with colored left border */}
                  <div style={{ borderLeft: `4px solid ${theme.color}`, paddingLeft: 16 }} className="mb-5">
                    <Link
                      href={'/pathways/' + theme.slug}
                      className="block hover:underline"
                      style={{
                                                fontSize: 'clamp(24px, 3vw, 36px)',
                                                textDecorationColor: theme.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {theme.name}
                    </Link>
                    <p
                      className="mt-2 leading-relaxed max-w-xl"
                      style={{ fontStyle: 'italic', color: "#5c6474", fontSize: '0.95rem' }}
                    >
                      {theme.description}
                    </p>
                  </div>

                  {/* Hero content card */}
                  {hero && (
                    <Link
                      href={'/content/' + hero.id}
                      className="group block border mb-5 transition-colors"
                      style={{ borderColor: '#dde1e8' }}
                    >
                      <div className="group-hover:border-current" style={{ borderColor: theme.color }}>
                        {hero.image_url && (
                          <div className="aspect-[16/9] overflow-hidden">
                            <Image
                              src={hero.image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              width={800}
                              height={400}
                            />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-2">
                            {hero.content_type && (
                              <span
                                className="text-[10px] uppercase tracking-wider font-bold"
                                style={{ color: theme.color }}
                              >
                                {hero.content_type}
                              </span>
                            )}
                            {hero.source_domain && (
                              <span
                                className="text-[10px]"
                                style={{ color: "#5c6474" }}
                              >
                                {hero.source_domain}
                              </span>
                            )}
                          </div>
                          <h3
                            className="text-lg leading-snug group-hover:underline"
                            style={{  }}
                          >
                            {hero.title}
                          </h3>
                          {hero.summary && (
                            <p
                              className="text-sm mt-2 line-clamp-2 leading-relaxed"
                              style={{ color: "#5c6474" }}
                            >
                              {hero.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Secondary content cards */}
                  {secondary.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {secondary.map(function (item) {
                        return (
                          <Link
                            key={item.id}
                            href={'/content/' + item.id}
                            className="group block border transition-colors"
                            style={{ borderColor: '#dde1e8' }}
                          >
                            {item.image_url && (
                              <div className="aspect-[16/9] overflow-hidden">
                                <Image
                                  src={item.image_url}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  width={800}
                                  height={400}
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <span
                                className="text-[9px] uppercase tracking-wider font-bold"
                                style={{ color: theme.color }}
                              >
                                {item.content_type}
                              </span>
                              <h4
                                className="text-sm leading-snug mt-1 line-clamp-2 group-hover:underline"
                                style={{  }}
                              >
                                {item.title}
                              </h4>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Right column: data sidebar ── */}
                <div>
                  {/* What you will find */}
                  <div className="border p-5 mb-4" style={{ borderColor: '#dde1e8' }}>
                    <p
                      className="text-[10px] uppercase tracking-[0.15em] mb-4"
                      style={{ color: "#5c6474" }}
                    >
                      What you will find
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '0.9rem' }}>Content</span>
                        <span style={{ color: theme.color }} className="text-lg font-bold">{data.totalContent}</span>
                      </div>
                      {Object.entries(data.entityCounts).map(function ([key, count]) {
                        if (count === 0) return null
                        const info = ENTITY_ICONS[key]
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <span style={{ fontSize: '0.9rem' }}>{info?.label || key}</span>
                            <span style={{ color: theme.color }} className="text-lg font-bold">{count}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Content type breakdown */}
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(data.contentCounts)
                        .sort(function (a, b) { return b[1] - a[1] })
                        .map(function ([type, count]) {
                          return (
                            <Link
                              key={type}
                              href={'/news?pathway=' + themeId + '&type=' + type}
                              className="inline-flex items-center gap-1 text-xs border px-2 py-1 transition-colors hover:border-current"
                              style={{ borderColor: '#dde1e8',  }}
                            >
                              <span className="font-bold">{count}</span>
                              <span style={{ color: "#5c6474" }}>{CONTENT_TYPE_LABELS[type] || type}</span>
                            </Link>
                          )
                        })}
                    </div>
                  </div>

                  {/* Topics (focus areas) */}
                  {topFocusAreas.length > 0 && (
                    <div className="border p-5 mb-4" style={{ borderColor: '#dde1e8' }}>
                      <div className="flex items-center justify-between mb-4">
                        <p
                          className="text-[10px] uppercase tracking-[0.15em]"
                          style={{ color: "#5c6474" }}
                        >
                          Topics
                        </p>
                        <span className="text-[10px]" style={{ color: "#5c6474" }}>
                          {data.focusAreas.length} total
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {topFocusAreas.map(function (fa) {
                          return (
                            <li key={fa.focus_id}>
                              <Link
                                href={'/explore/focus/' + fa.focus_id}
                                className="group flex items-center gap-2 hover:underline"
                              >
                                <span
                                  className="w-2 h-2 flex-shrink-0"
                                  style={{ backgroundColor: theme.color }}
                                />
                                <span style={{ fontSize: '0.9rem' }}>
                                  {fa.focus_area_name}
                                </span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                      {data.focusAreas.length > 8 && (
                        <Link
                          href={'/pathways/' + theme.slug}
                          className="inline-block mt-3 text-xs hover:underline"
                          style={{ color: theme.color }}
                        >
                          +{data.focusAreas.length - 8} more
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Keep Learning */}
                  {(data.learningPaths.length > 0 || data.guides.length > 0) && (
                    <div className="border p-5 mb-4" style={{ borderColor: '#dde1e8' }}>
                      <p
                        className="text-[10px] uppercase tracking-[0.15em] mb-4"
                        style={{ color: "#5c6474" }}
                      >
                        Keep Learning
                      </p>
                      <div className="space-y-3">
                        {data.learningPaths.map(function (lp) {
                          return (
                            <Link
                              key={lp.path_id}
                              href={'/learning/' + lp.path_id}
                              className="group block hover:underline"
                            >
                              <h4 style={{ fontSize: '0.9rem' }}>
                                {lp.path_name}
                              </h4>
                              {lp.estimated_minutes && (
                                <span className="text-[10px]" style={{ color: "#5c6474" }}>
                                  ~{lp.estimated_minutes} min
                                </span>
                              )}
                            </Link>
                          )
                        })}
                        {data.guides.map(function (g) {
                          return (
                            <Link
                              key={g.guide_id}
                              href={'/guides/' + g.slug}
                              className="group block hover:underline"
                            >
                              <h4 style={{ fontSize: '0.9rem' }}>
                                {g.title}
                              </h4>
                              <span className="text-[10px]" style={{ color: "#5c6474" }}>
                                Community Guide
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Connected pathways */}
                  {data.bridges.length > 0 && (
                    <div className="mb-4">
                      <p
                        className="text-[10px] uppercase tracking-[0.15em] mb-2"
                        style={{ color: "#5c6474" }}
                      >
                        Connected to
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {data.bridges.slice(0, 4).map(function (b) {
                          return (
                            <Link
                              key={b.targetThemeId}
                              href={'/pathways/' + b.targetSlug}
                              className="inline-flex items-center gap-1.5 text-xs hover:underline"
                              style={{ color: b.targetColor }}
                            >
                              <span className="w-2 h-2" style={{ backgroundColor: b.targetColor }} />
                              {b.targetName}
                              <span style={{ color: "#5c6474" }}>({b.sharedCount})</span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Explore CTA */}
                  <Link
                    href={'/pathways/' + theme.slug}
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: theme.color, letterSpacing: '0.05em' }}
                  >
                    Explore {theme.name}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>

              </div>
            </div>
          </section>
        )
      })}

      {/* ══════════════════════════════════════════
          3. CROSS-PATHWAY CONNECTIONS
          ══════════════════════════════════════════ */}
      {bridges.length > 0 && (
        <section style={{ backgroundColor: '#f4f5f7' }} className="py-12">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
            <p
              className="text-[11px] uppercase tracking-[0.2em] mb-3"
              style={{ color: "#1b5e8a" }}
            >
              How pathways connect
            </p>
            <p
              className="text-lg mb-8 max-w-xl"
              style={{ fontStyle: 'italic', color: "#5c6474" }}
            >
              Community issues do not live in silos. These pathways share content, services, and focus areas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bridges.slice(0, 9).map(function (b) {
                const themeA = (THEMES as any)[b[0]]
                const themeB = (THEMES as any)[b[1]]
                if (!themeA || !themeB) return null
                return (
                  <div
                    key={b[0] + '|' + b[1]}
                    className="flex items-center gap-3 border p-4"
                    style={{ borderColor: '#dde1e8', backgroundColor: '#ffffff' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: themeA.color }} />
                      <Link
                        href={'/pathways/' + themeA.slug}
                        className="text-sm truncate hover:underline"
                        style={{  }}
                      >
                        {themeA.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-6 h-px" style={{ backgroundColor: '#dde1e8' }} />
                      <span className="text-xs font-bold" style={{ color: "#5c6474" }}>{b[2]}</span>
                      <div className="w-6 h-px" style={{ backgroundColor: '#dde1e8' }} />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 flex-shrink-0" style={{ backgroundColor: themeB.color }} />
                      <Link
                        href={'/pathways/' + themeB.slug}
                        className="text-sm truncate hover:underline"
                        style={{  }}
                      >
                        {themeB.name}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          4. QUOTE (inline blockquote)
          ══════════════════════════════════════════ */}
      {quote && (
        <section style={{ backgroundColor: '#f4f5f7' }} className="py-10">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
            <blockquote
              className="max-w-2xl mx-auto text-center"
              style={{ borderTop: `1px solid ${'#dde1e8'}`, borderBottom: `1px solid ${'#dde1e8'}`, padding: '2rem 0' }}
            >
              <p
                className="text-xl sm:text-2xl leading-relaxed mb-4"
                style={{ fontStyle: 'italic',  }}
              >
                &ldquo;{quote.quote_text}&rdquo;
              </p>
              {quote.attribution && (
                <cite
                  className="text-xs uppercase tracking-wider not-italic"
                  style={{ color: "#5c6474" }}
                >
                  {quote.attribution}
                </cite>
              )}
            </blockquote>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          5. SPECTRUM BAR
          ══════════════════════════════════════════ */}
      <div className="flex h-1.5 overflow-hidden">
        {Object.values(THEMES).map(function (theme) {
          return <div key={theme.slug} className="flex-1" style={{ backgroundColor: theme.color }} />
        })}
      </div>

      {/* ══════════════════════════════════════════
          6. FOOTER CODA
          ══════════════════════════════════════════ */}
      <div className="py-10 text-center" style={{ backgroundColor: '#f4f5f7' }}>
        <Link
          href="/explore"
          className="hover:underline"
          style={{ fontStyle: 'italic', color: "#1b5e8a", fontSize: '1rem' }}
        >
          &larr; Back to The Exchange
        </Link>
      </div>
    </div>
  )
}
