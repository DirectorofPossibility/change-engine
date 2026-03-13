import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { THEMES, CENTER_COLORS, CIVIC_DATA_REFERENCES } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway,
  getRelatedOpportunities, getRelatedPolicies, getRelatedServices, getRelatedOfficials,
  getFocusAreas, getBridgesForPathway,
  getPathwayNewsCount,
  getLangId, fetchTranslationsForTable,
  getRandomQuote,
} from '@/lib/data/exchange'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { getLibraryNuggets } from '@/lib/data/library'
import { getUIStrings } from '@/lib/i18n'
import type { ContentPublished } from '@/lib/types/exchange'

function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) return { title: 'Not Found' }
  return {
    title: theme.name,
    description: theme.description,
  }
}

// ── Design tokens ─────────────────────────────────────────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export default async function SinglePathwayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const theme = resolveTheme(slug)
  if (!theme) notFound()

  const [content, centerCounts, allFocusAreas, bridgeData, newsCount] = await Promise.all([
    getPathwayContent(theme.id),
    getCenterContentForPathway(theme.id),
    getFocusAreas(),
    getBridgesForPathway(theme.id),
    getPathwayNewsCount(theme.id),
  ])

  const themeFocusAreas = allFocusAreas.filter(fa => fa.theme_id === theme.id)
  const themeFocusAreaIds = themeFocusAreas.map(fa => fa.focus_id)

  const [opportunities, policies, relatedServices, relatedOfficials, libraryNuggets, quote] = await Promise.all([
    getRelatedOpportunities(themeFocusAreaIds),
    getRelatedPolicies(themeFocusAreaIds),
    getRelatedServices(themeFocusAreaIds),
    getRelatedOfficials(themeFocusAreaIds),
    getLibraryNuggets([theme.id], themeFocusAreaIds, 3),
    getRandomQuote(theme.id),
  ])

  const langId = await getLangId()
  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  let contentTranslations: Record<string, { title?: string; summary?: string }> = {}
  if (langId) {
    const contentIds = content.map(c => c.inbox_id).filter((id): id is string => id != null)
    if (contentIds.length > 0) {
      contentTranslations = await fetchTranslationsForTable('content_published', contentIds, langId)
    }
  }

  const sorted = [...content].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  })

  const leadStory = sorted.find(c => c.is_featured && c.image_url)
    || sorted.find(c => c.image_url)
    || sorted[0]
    || null

  const sidebarStories: ContentPublished[] = []
  const usedCenters = new Set<string>()
  if (leadStory) usedCenters.add(leadStory.center || '')
  for (const c of sorted) {
    if (sidebarStories.length >= 4) break
    if (c === leadStory) continue
    if (sidebarStories.length < 2 && usedCenters.has(c.center || '') && sorted.filter(s => s !== leadStory && !usedCenters.has(s.center || '')).length > 0) continue
    sidebarStories.push(c)
    usedCenters.add(c.center || '')
  }

  const usedIds = new Set([leadStory?.id, ...sidebarStories.map(s => s.id)])
  const remaining = sorted.filter(c => !usedIds.has(c.id))
  const byCenter: Record<string, ContentPublished[]> = { Learning: [], Action: [], Resource: [], Accountability: [] }
  for (const c of remaining) {
    const key = c.center || 'Learning'
    if (byCenter[key]) byCenter[key].push(c)
  }

  const getTitle = (c: ContentPublished) => {
    const tr = contentTranslations[c.inbox_id || '']
    return tr?.title || c.title_6th_grade || 'Untitled'
  }
  const getSummary = (c: ContentPublished) => {
    const tr = contentTranslations[c.inbox_id || '']
    return tr?.summary || c.summary_6th_grade || ''
  }
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

  const totalStories = content.length
  const totalEntities = opportunities.length + policies.length + relatedServices.length + relatedOfficials.length

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ background: PARCHMENT_WARM }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="relative max-w-[900px] mx-auto px-6 py-16">
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase mb-4">
            Change Engine -- Pathways
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-3 h-3" style={{ backgroundColor: theme.color }} />
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)', color: INK, lineHeight: 1.1 }}>
              {theme.name}
            </h1>
          </div>
          <p style={{ fontFamily: SERIF, fontSize: '1.05rem', color: MUTED, lineHeight: 1.7 }} className="max-w-xl">
            {theme.description}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">
              {totalStories} stories -- {totalEntities} resources
              {newsCount > 0 && <> -- {newsCount} in the wire</>}
            </span>
          </div>
          {bridgeData.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {bridgeData.slice(0, 4).map(b => (
                <Link
                  key={b.targetThemeId}
                  href={'/pathways/' + b.targetSlug}
                  style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.08em', color: MUTED }}
                  className="uppercase hover:underline flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5" style={{ backgroundColor: b.targetColor }} />
                  {b.targetName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="max-w-[900px] mx-auto px-6 pt-6 pb-2">
        <nav style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <Link href="/pathways" className="hover:underline" style={{ color: CLAY }}>{t('nav.pathways')}</Link>
          <span className="mx-2">/</span>
          <span>{theme.name}</span>
        </nav>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* ── Lead Story + Sidebar ── */}
        {leadStory && (
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0">
              {/* Lead */}
              <div className="lg:pr-8" style={{ borderRight: '1px solid ' + RULE_COLOR }}>
                {leadStory.image_url && (
                  <Link href={'/content/' + leadStory.id} className="block mb-5 overflow-hidden" style={{ border: '1px solid ' + RULE_COLOR }}>
                    <Image
                      src={leadStory.image_url}
                      alt={getTitle(leadStory)}
                      width={700}
                      height={400}
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '380px', background: PARCHMENT_WARM }}
                    />
                  </Link>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.12em', color: '#fff', background: theme.color, padding: '2px 8px' }} className="uppercase">
                    {leadStory.center || 'Feature'}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                    {fmtDate(leadStory.published_at)}
                    {leadStory.source_domain && <> -- {leadStory.source_domain}</>}
                  </span>
                </div>
                <Link href={'/content/' + leadStory.id}>
                  <h2
                    style={{ fontFamily: SERIF, fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', color: INK, lineHeight: 1.15 }}
                    className="mb-3 hover:underline"
                  >
                    {getTitle(leadStory)}
                  </h2>
                </Link>
                <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: MUTED, lineHeight: 1.75, maxWidth: '520px' }} className="mb-4">
                  {getSummary(leadStory)}
                </p>
                <Link
                  href={'/content/' + leadStory.id}
                  style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.08em', color: CLAY, fontWeight: 600 }}
                  className="uppercase hover:underline"
                >
                  {t('card.read_more')}
                </Link>
              </div>

              {/* Sidebar stories */}
              <div className="lg:pl-8 mt-8 lg:mt-0">
                {sidebarStories.map((c, i) => (
                  <Link
                    key={c.id}
                    href={'/content/' + c.id}
                    className="group block py-4 px-2 -mx-2 transition-colors hover:bg-white/40"
                    style={{ borderBottom: i < sidebarStories.length - 1 ? '1px solid ' + RULE_COLOR : undefined }}
                  >
                    <div className="flex gap-4">
                      {i === 0 && c.image_url && (
                        <div className="w-24 h-16 flex-shrink-0 overflow-hidden" style={{ border: '1px solid ' + RULE_COLOR }}>
                          <Image src={c.image_url} alt="" width={96} height={64} className="w-full h-full object-contain" style={{ background: PARCHMENT_WARM }} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5" style={{ backgroundColor: theme.color }} />
                          <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }}>
                            {c.center || 'Feature'} -- {fmtDate(c.published_at)}
                          </span>
                        </div>
                        <h3
                          style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK, lineHeight: 1.3 }}
                          className="line-clamp-2 group-hover:underline"
                        >
                          {getTitle(c)}
                        </h3>
                        {i === 0 && (
                          <p style={{ fontFamily: SERIF, fontSize: '0.8rem', color: MUTED }} className="mt-1 line-clamp-2">{getSummary(c)}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Four Desks ── */}
        <section>
          <div className="flex items-baseline gap-4 mb-6">
            <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>By Center</h2>
            <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">4 desks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <DeskBlock label="How can I understand?" color={CENTER_COLORS.Learning} borderRight borderBottom>
              {byCenter.Learning.slice(0, 5).map(c => (
                <DeskItem key={c.id} href={'/content/' + c.id} title={getTitle(c)} meta={fmtDate(c.published_at)} color={theme.color} />
              ))}
              {libraryNuggets.length > 0 && libraryNuggets.slice(0, 2).map(n => (
                <DeskItem
                  key={n.documentId}
                  href={n.link}
                  title={n.chunkExcerpt || n.documentTitle}
                  meta="From the archives"
                  color={CENTER_COLORS.Learning}
                  typeLabel="Guide"
                />
              ))}
            </DeskBlock>

            <DeskBlock label="How can I help?" color={CENTER_COLORS.Action} borderBottom>
              {byCenter.Action.slice(0, 3).map(c => (
                <DeskItem key={c.id} href={'/content/' + c.id} title={getTitle(c)} meta={fmtDate(c.published_at)} color={theme.color} />
              ))}
              {opportunities.slice(0, 4).map(o => (
                <DeskItem
                  key={o.opportunity_id}
                  href={'/opportunities/' + o.opportunity_id}
                  title={o.opportunity_name}
                  meta={o.start_date ? 'Starts ' + new Date(o.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined}
                  color={CENTER_COLORS.Action}
                  typeLabel="Opportunity"
                />
              ))}
            </DeskBlock>

            <DeskBlock label="What's available?" color={CENTER_COLORS.Resource} borderRight>
              {byCenter.Resource.slice(0, 3).map(c => (
                <DeskItem key={c.id} href={'/content/' + c.id} title={getTitle(c)} meta={fmtDate(c.published_at)} color={theme.color} />
              ))}
              {relatedServices.slice(0, 4).map(s => (
                <DeskItem
                  key={s.service_id}
                  href={'/services/' + s.service_id}
                  title={s.service_name}
                  meta={undefined}
                  color={CENTER_COLORS.Resource}
                  typeLabel="Service"
                />
              ))}
            </DeskBlock>

            <DeskBlock label="Who makes decisions?" color={CENTER_COLORS.Accountability}>
              {byCenter.Accountability.slice(0, 3).map(c => (
                <DeskItem key={c.id} href={'/content/' + c.id} title={getTitle(c)} meta={fmtDate(c.published_at)} color={theme.color} />
              ))}
              {relatedOfficials.slice(0, 3).map(o => (
                <DeskItem
                  key={o.official_id}
                  href={'/officials/' + o.official_id}
                  title={o.official_name}
                  meta={o.title || undefined}
                  color={CENTER_COLORS.Accountability}
                  typeLabel="Official"
                />
              ))}
              {policies.slice(0, 3).map(p => (
                <DeskItem
                  key={p.policy_id}
                  href={'/policies/' + p.policy_id}
                  title={p.title_6th_grade || p.policy_name}
                  meta={[p.bill_number, p.status].filter(Boolean).join(' / ') || undefined}
                  color={CENTER_COLORS.Accountability}
                  typeLabel="Policy"
                />
              ))}
            </DeskBlock>
          </div>
        </section>

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Topic Index ── */}
        {themeFocusAreas.length > 0 && (
          <section>
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>Topic Index</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
              <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED, letterSpacing: '0.1em' }} className="uppercase">{themeFocusAreas.length} topics</span>
            </div>

            {themeFocusAreas.slice(0, 4).map((fa, i) => (
              <Link
                key={fa.focus_id}
                href={'/explore/focus/' + fa.focus_id}
                className="group flex items-center gap-3 py-3 -mx-2 px-2 transition-colors hover:bg-white/40"
                style={{ borderBottom: '1px solid ' + RULE_COLOR }}
              >
                <span className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                <span style={{ fontFamily: SERIF, fontSize: '0.88rem', color: INK }} className="group-hover:underline">{fa.focus_area_name}</span>
                {fa.description && (
                  <span style={{ fontFamily: SERIF, fontSize: '0.78rem', color: MUTED }} className="hidden sm:inline">-- {fa.description}</span>
                )}
              </Link>
            ))}

            {themeFocusAreas.length > 4 && (
              <details className="mt-2">
                <summary style={{ fontFamily: MONO, fontSize: '0.65rem', color: CLAY, letterSpacing: '0.1em', cursor: 'pointer' }} className="uppercase hover:underline py-2">
                  Show all {themeFocusAreas.length} topics
                </summary>
                {themeFocusAreas.slice(4).map((fa) => (
                  <Link
                    key={fa.focus_id}
                    href={'/explore/focus/' + fa.focus_id}
                    className="group flex items-center gap-3 py-3 -mx-2 px-2 transition-colors hover:bg-white/40"
                    style={{ borderBottom: '1px solid ' + RULE_COLOR }}
                  >
                    <span className="w-1 h-4 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                    <span style={{ fontFamily: SERIF, fontSize: '0.88rem', color: INK }} className="group-hover:underline">{fa.focus_area_name}</span>
                    {fa.description && (
                      <span style={{ fontFamily: SERIF, fontSize: '0.78rem', color: MUTED }} className="hidden sm:inline">-- {fa.description}</span>
                    )}
                  </Link>
                ))}
              </details>
            )}

            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Civic Data ── */}
        {(CIVIC_DATA_REFERENCES as Record<string, readonly { label: string; url: string; source: string }[]>)[theme.id] && (
          <section>
            <div className="flex items-baseline gap-4 mb-6">
              <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>See the Data</h2>
              <div className="flex-1" style={{ height: 1, borderBottom: '1px dotted', borderColor: RULE_COLOR }} />
            </div>
            <div className="flex flex-wrap gap-3">
              {(CIVIC_DATA_REFERENCES as Record<string, readonly { label: string; url: string; source: string }[]>)[theme.id].map(ref => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 py-2.5 px-4 transition-colors hover:bg-white/40"
                  style={{ border: '1px solid ' + RULE_COLOR }}
                >
                  <span style={{ fontFamily: SERIF, fontSize: '0.85rem', color: INK }} className="group-hover:underline">{ref.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: '0.55rem', letterSpacing: '0.08em', color: MUTED }} className="uppercase">{ref.source}</span>
                </a>
              ))}
            </div>
            <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />
          </section>
        )}

        {/* ── Quote ── */}
        {quote && (
          <section className="mb-10">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={theme.color} />
          </section>
        )}

        {/* ── News Wire ── */}
        {newsCount > 0 && (
          <section className="p-6 mb-10" style={{ background: PARCHMENT_WARM, border: '1px solid ' + RULE_COLOR }}>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.2em', color: MUTED }} className="uppercase block mb-2">
              The Wire
            </span>
            <p style={{ fontFamily: SERIF, fontSize: '0.9rem', color: INK }}>
              {newsCount} news {newsCount === 1 ? 'article' : 'articles'} covering {theme.name} in Houston
            </p>
            <Link
              href={'/news?pathway=' + theme.id}
              style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY, fontWeight: 600 }}
              className="uppercase hover:underline mt-2 inline-block"
            >
              Read the latest
            </Link>
          </section>
        )}

        {/* ── Deeper Reading ── */}
        {libraryNuggets.length > 0 && (
          <section className="mb-10">
            <LibraryNugget
              nuggets={libraryNuggets}
              variant="sidebar"
              color={theme.color}
              labels={{ fromThe: t('library.from_the'), readMore: t('library.read_more') }}
            />
          </section>
        )}

        <div className="my-10" style={{ height: 1, background: RULE_COLOR }} />

        {/* ── Colophon ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <Link
            href="/pathways"
            style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: CLAY }}
            className="uppercase hover:underline"
          >
            All Pathways
          </Link>
          {bridgeData.map(b => (
            <Link
              key={b.targetThemeId}
              href={'/pathways/' + b.targetSlug}
              className="inline-flex items-center gap-1.5 hover:underline"
              style={{ fontFamily: MONO, fontSize: '0.65rem', letterSpacing: '0.08em', color: b.targetColor }}
            >
              <span className="w-1.5 h-1.5" style={{ backgroundColor: b.targetColor }} />
              {b.targetName}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Desk Block Component ─────────────────────────────────────────────────

function DeskBlock({ label, color, borderRight, borderBottom, children }: {
  label: string
  color: string
  borderRight?: boolean
  borderBottom?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="py-6"
      style={{
        paddingRight: borderRight ? '2rem' : undefined,
        paddingLeft: !borderRight ? '2rem' : undefined,
        borderRight: borderRight ? '1px solid ' + RULE_COLOR : undefined,
        borderBottom: borderBottom ? '1px solid ' + RULE_COLOR : undefined,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2" style={{ backgroundColor: color }} />
        <span style={{ fontFamily: MONO, fontSize: '0.6rem', letterSpacing: '0.12em', color: MUTED }} className="uppercase">
          {label}
        </span>
      </div>
      <div className="h-0.5 w-8 mb-4" style={{ backgroundColor: color }} />
      <div>
        {children}
      </div>
    </div>
  )
}

// ── Desk Item Component ──────────────────────────────────────────────────

function DeskItem({ href, title, meta, color, typeLabel }: {
  href: string
  title: string
  meta?: string
  color: string
  typeLabel?: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 py-2.5 -mx-2 px-2 transition-colors hover:bg-white/40"
      style={{ borderBottom: '1px solid ' + RULE_COLOR }}
    >
      <span className="w-1 min-h-[1.5rem] flex-shrink-0 mt-0.5" style={{ backgroundColor: color + '40' }} />
      <div className="min-w-0 flex-1">
        {typeLabel && (
          <span style={{ fontFamily: MONO, fontSize: '0.5rem', letterSpacing: '0.12em', color }} className="uppercase block mb-0.5">
            {typeLabel}
          </span>
        )}
        <h4 style={{ fontFamily: SERIF, fontSize: '0.85rem', color: INK, lineHeight: 1.35 }} className="line-clamp-2 group-hover:underline">
          {title}
        </h4>
        {meta && (
          <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: MUTED }} className="mt-0.5 block">
            {meta}
          </span>
        )}
      </div>
    </Link>
  )
}
