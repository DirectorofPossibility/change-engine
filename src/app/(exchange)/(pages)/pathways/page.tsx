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
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { FeaturedPromo } from '@/components/exchange/FeaturedPromo'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
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

  return (
    <div>
      {/* ── Masthead ── */}
      <IndexPageHero
        title="Seven Pathways Into Community Life"
        subtitle="Every pathway connects you to content, services, officials, learning paths, and opportunities across Houston's civic landscape."
        color="#C75B2A"
        pattern="flower"
        stats={[
          { value: totalContent, label: 'Published' },
          { value: stats.services, label: 'Services' },
          { value: stats.officials, label: 'Officials' },
          { value: totalPolicies, label: 'Policies' },
          { value: stats.learningPaths, label: 'Learning Paths' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <Breadcrumb items={[{ label: 'Topics' }]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
        <div>
        {/* ── Pathway Sections ── */}
        {Object.entries(THEMES).map(function ([themeId, theme], idx) {
          const data = hubData[themeId]
          if (!data) return null

          const hero = data.heroContent[0]
          const secondary = data.heroContent.slice(1, 3)
          const topFocusAreas = data.focusAreas.slice(0, 8)
          const isEven = idx % 2 === 0

          return (
            <section key={themeId} className="mb-12 first:mt-0">
              {/* Pathway color band header */}
              <div
                className="rounded-xl overflow-hidden mb-6"
                style={{ borderLeft: `5px solid ${theme.color}` }}
              >
                <div className="bg-white border-2 border-brand-border border-l-0 rounded-r-xl px-6 py-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <Link
                        href={'/pathways/' + theme.slug}
                        className="font-serif font-bold text-2xl sm:text-3xl text-brand-text hover:underline decoration-2 underline-offset-4"
                        style={{ textDecorationColor: theme.color }}
                      >
                        {theme.name}
                      </Link>
                      <p className="text-sm text-brand-muted leading-relaxed mt-1 max-w-xl font-serif italic">
                        {theme.description}
                      </p>
                    </div>
                    <Link
                      href={'/pathways/' + theme.slug}
                      className="text-sm font-medium px-4 py-2 rounded-lg border-2 border-brand-border hover:shadow-sm transition-shadow flex-shrink-0"
                      style={{ color: theme.color }}
                    >
                      Explore {theme.name} &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* ── Left: Pathway identity + hero ── */}
                <div className={`flex-1 min-w-0 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>

                  {/* Hero content card */}
                  {hero && (
                    <Link
                      href={'/content/' + hero.id}
                      className="group block bg-white rounded-xl border-2 border-brand-border overflow-hidden card-lift mb-4"
                    >
                      {hero.image_url && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <Image
                            src={hero.image_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                           width={800} height={400} />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          {hero.content_type && (
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>
                              {hero.content_type}
                            </span>
                          )}
                          {hero.source_domain && (
                            <span className="text-[10px] text-brand-muted">{hero.source_domain}</span>
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-brand-text text-lg leading-snug group-hover:underline">
                          {hero.title}
                        </h3>
                        {hero.summary && (
                          <p className="text-sm text-brand-muted mt-1 line-clamp-2 leading-relaxed">{hero.summary}</p>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* Secondary content */}
                  {secondary.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {secondary.map(function (item) {
                        return (
                          <Link
                            key={item.id}
                            href={'/content/' + item.id}
                            className="group bg-white rounded-lg border-2 border-brand-border overflow-hidden card-lift"
                          >
                            {item.image_url && (
                              <div className="aspect-[16/9] overflow-hidden">
                                <Image src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"  width={800} height={400} />
                              </div>
                            )}
                            <div className="p-3">
                              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.color }}>
                                {item.content_type}
                              </span>
                              <h4 className="font-serif font-semibold text-sm text-brand-text leading-snug mt-0.5 line-clamp-2 group-hover:underline">
                                {item.title}
                              </h4>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* ── Right: Integrated data sidebar ── */}
                <div className={`lg:w-[380px] flex-shrink-0 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                  {/* Entity counts grid */}
                  <div className="bg-white rounded-xl border-2 border-brand-border p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">What You Will Find</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center py-2 rounded-lg" style={{ backgroundColor: theme.color + '0A' }}>
                        <p className="text-xl font-serif font-bold" style={{ color: theme.color }}>{data.totalContent}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Content</p>
                      </div>
                      {Object.entries(data.entityCounts).map(function ([key, count]) {
                        if (count === 0) return null
                        const info = ENTITY_ICONS[key]
                        return (
                          <div key={key} className="text-center py-2 rounded-lg" style={{ backgroundColor: theme.color + '0A' }}>
                            <p className="text-xl font-serif font-bold" style={{ color: theme.color }}>{count}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">{info?.label || key}</p>
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
                              className="inline-flex items-center gap-1 text-xs bg-brand-bg-alt rounded-lg px-2 py-1 hover:shadow-sm transition-shadow"
                            >
                              <span className="font-medium text-brand-text">{count}</span>
                              <span className="text-brand-muted">{CONTENT_TYPE_LABELS[type] || type}</span>
                            </Link>
                          )
                        })}
                    </div>
                  </div>

                  {/* Focus area topics */}
                  {topFocusAreas.length > 0 && (
                    <div className="bg-white rounded-xl border-2 border-brand-border p-4 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Topics</span>
                        <span className="text-[10px] text-brand-muted ml-auto">{data.focusAreas.length} total</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {topFocusAreas.map(function (fa) {
                          return (
                            <Link
                              key={fa.focus_id}
                              href={'/explore/focus/' + fa.focus_id}
                              className="group inline-flex items-center gap-1.5 text-xs border-2 border-brand-border rounded-lg px-2.5 py-1.5 hover:border-transparent hover:shadow-sm transition-all"
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
                              <span className="text-brand-text group-hover:underline">{fa.focus_area_name}</span>
                            </Link>
                          )
                        })}
                        {data.focusAreas.length > 8 && (
                          <Link
                            href={'/pathways/' + theme.slug}
                            className="text-xs font-medium px-2.5 py-1.5"
                            style={{ color: theme.color }}
                          >
                            +{data.focusAreas.length - 8} more
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Learning paths + guides */}
                  {(data.learningPaths.length > 0 || data.guides.length > 0) && (
                    <div className="bg-white rounded-xl border-2 border-brand-border p-4 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Keep Learning</span>
                      </div>
                      <div className="space-y-2">
                        {data.learningPaths.map(function (lp) {
                          return (
                            <Link
                              key={lp.path_id}
                              href={'/learning/' + lp.path_id}
                              className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-brand-bg-alt transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.color + '14' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={theme.color}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-brand-text leading-snug group-hover:underline">{lp.path_name}</h4>
                                {lp.estimated_minutes && (
                                  <span className="text-[10px] text-brand-muted">~{lp.estimated_minutes} min</span>
                                )}
                              </div>
                            </Link>
                          )
                        })}
                        {data.guides.map(function (g) {
                          return (
                            <Link
                              key={g.guide_id}
                              href={'/guides/' + g.slug}
                              className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-brand-bg-alt transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: theme.color + '14' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={theme.color}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-semibold text-brand-text leading-snug group-hover:underline">{g.title}</h4>
                                <span className="text-[10px] text-brand-muted">Community Guide</span>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Connected pathways */}
                  {data.bridges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Connected to</span>
                      {data.bridges.slice(0, 4).map(function (b) {
                        return (
                          <Link
                            key={b.targetThemeId}
                            href={'/pathways/' + b.targetSlug}
                            className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                            style={{ color: b.targetColor }}
                          >
                            <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: b.targetColor }} />
                            {b.targetName}
                            <span className="text-brand-muted">({b.sharedCount})</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {/* Explore CTA */}
                  <Link
                    href={'/pathways/' + theme.slug}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
                    style={{ backgroundColor: theme.color }}
                  >
                    Explore {theme.name}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )
        })}

        {/* ── Cross-Pathway Connections ── */}
        {bridges.length > 0 && (
          <section className="py-8 border-t border-brand-border">
            <h2 className="text-xl font-serif font-bold text-brand-text mb-1">How Pathways Connect</h2>
            <p className="text-sm text-brand-muted mb-5 font-serif italic">
              Community issues do not live in silos. These pathways share content, services, and focus areas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bridges.slice(0, 9).map(function (b) {
                const themeA = (THEMES as any)[b[0]]
                const themeB = (THEMES as any)[b[1]]
                if (!themeA || !themeB) return null
                return (
                  <div
                    key={b[0] + '|' + b[1]}
                    className="flex items-center gap-3 bg-white rounded-xl border-2 border-brand-border p-3"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: themeA.color }} />
                      <Link href={'/pathways/' + themeA.slug} className="text-sm font-medium text-brand-text truncate hover:underline">
                        {themeA.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="w-6 h-px bg-brand-border" />
                      <span className="text-xs font-bold text-brand-muted">{b[2]}</span>
                      <div className="w-6 h-px bg-brand-border" />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: themeB.color }} />
                      <Link href={'/pathways/' + themeB.slug} className="text-sm font-medium text-brand-text truncate hover:underline">
                        {themeB.name}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Quote ── */}
        {quote && (
          <div className="py-6">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor="#C75B2A" />
          </div>
        )}

        {/* ── Spectrum bar ── */}
        <div className="flex h-1.5 rounded-full overflow-hidden mb-8">
          {Object.values(THEMES).map(function (theme) {
            return <div key={theme.slug} className="flex-1" style={{ backgroundColor: theme.color }} />
          })}
        </div>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <IndexWayfinder
              currentPage="pathways"
              color="#C75B2A"
              related={[
                { label: 'Explore', href: '/explore' },
                { label: 'Centers', href: '/centers' },
                { label: 'Guides', href: '/guides' },
              ]}
            />
            <FeaturedPromo variant="card" />
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
