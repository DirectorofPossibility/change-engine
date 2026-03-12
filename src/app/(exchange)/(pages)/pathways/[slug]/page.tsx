import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { THEMES, CENTER_COLORS } from '@/lib/constants'
import {
  getPathwayContent, getCenterContentForPathway,
  getRelatedOpportunities, getRelatedPolicies, getRelatedServices, getRelatedOfficials,
  getFocusAreas, getBridgesForPathway,
  getPathwayNewsCount,
  getLangId, fetchTranslationsForTable,
  getRandomQuote,
} from '@/lib/data/exchange'
import { LibraryNugget } from '@/components/exchange/LibraryNugget'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { QuoteCard } from '@/components/exchange/QuoteCard'
import { getLibraryNuggets } from '@/lib/data/library'
import { getUIStrings } from '@/lib/i18n'
import { ArrowRight, BookOpen, Heart, Package, Scale, FileText, Phone, MapPin, Calendar } from 'lucide-react'
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

  // ── Editorial content selection ──
  // Sort: featured first, then by recency
  const sorted = [...content].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  })

  // Lead story: prefer featured with image, then any with image, then first
  const leadStory = sorted.find(c => c.is_featured && c.image_url)
    || sorted.find(c => c.image_url)
    || sorted[0]
    || null

  // Sidebar stories: next 4, skip lead, prefer variety of centers
  const sidebarStories: ContentPublished[] = []
  const usedCenters = new Set<string>()
  if (leadStory) usedCenters.add(leadStory.center || '')
  for (const c of sorted) {
    if (sidebarStories.length >= 4) break
    if (c === leadStory) continue
    // Prefer different centers for variety
    if (sidebarStories.length < 2 && usedCenters.has(c.center || '') && sorted.filter(s => s !== leadStory && !usedCenters.has(s.center || '')).length > 0) continue
    sidebarStories.push(c)
    usedCenters.add(c.center || '')
  }

  // Remaining content grouped by center for the desk blocks
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

  // Stats for masthead
  const totalStories = content.length
  const totalEntities = opportunities.length + policies.length + relatedServices.length + relatedOfficials.length

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          1. MASTHEAD
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(158deg, #0d1117 0%, ${theme.color}88 50%, ${theme.color} 100%)` }}
      >
        <div className="max-w-[1080px] mx-auto px-6 relative z-10" style={{ padding: '3.5rem 1.5rem 3rem' }}>
          <Breadcrumb items={[
            { label: t('nav.pathways'), href: '/pathways' },
            { label: theme.name }
          ]} variant="dark" />

          <div className="flex items-center gap-2.5 mt-6 mb-2.5">
            <span className="block w-6 h-px" style={{ background: 'rgba(255,255,255,.3)' }} />
            <span className="font-mono text-[.6rem] tracking-[0.24em] uppercase" style={{ color: 'rgba(255,255,255,.4)' }}>
              Houston, TX &middot; {theme.name}
            </span>
          </div>

          <h1
            className="font-display font-black leading-[.95] tracking-tight text-white"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', letterSpacing: '-.025em' }}
          >
            {theme.name}
          </h1>

          <div className="my-5" style={{ width: '50px', height: '2px', background: 'rgba(255,255,255,.3)' }} />

          <p
            className="font-body italic leading-[1.7]"
            style={{ fontSize: '1rem', color: 'rgba(255,255,255,.65)', maxWidth: '560px' }}
          >
            {theme.description}
          </p>

          {/* Inside this section + connected pathways */}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="font-mono text-[.58rem] tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,.35)' }}>
              {totalStories} stories &middot; {totalEntities} resources
              {newsCount > 0 && <> &middot; {newsCount} in the wire</>}
            </span>
            {bridgeData.length > 0 && (
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {bridgeData.slice(0, 4).map(b => (
                  <Link
                    key={b.targetThemeId}
                    href={'/pathways/' + b.targetSlug}
                    className="inline-flex items-center gap-1.5 font-mono text-[.58rem] uppercase tracking-[0.08em] hover:underline"
                    style={{ color: 'rgba(255,255,255,.45)' }}
                  >
                    <span className="block w-1.5 h-1.5" style={{ backgroundColor: b.targetColor }} />
                    {b.targetName}
                  </Link>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. LEAD STORY + SIDEBAR
         ═══════════════════════════════════════════════════════════════════ */}
      {leadStory && (
        <section className="max-w-[1080px] mx-auto px-6 py-10" style={{ borderBottom: '2px solid #0d1117' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0">
            {/* Lead */}
            <div className="lg:pr-8 lg:border-r" style={{ borderColor: '#dde1e8' }}>
              {leadStory.image_url && (
                <Link href={'/content/' + leadStory.id} className="block mb-5 relative overflow-hidden" style={{ border: '1px solid #dde1e8' }}>
                  <Image
                    src={leadStory.image_url}
                    alt={getTitle(leadStory)}
                    width={700}
                    height={400}
                    className="w-full h-auto object-contain bg-[#f4f5f7]"
                    style={{ maxHeight: '380px' }}
                  />
                </Link>
              )}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="font-mono text-[.52rem] tracking-[0.12em] uppercase px-2 py-0.5"
                  style={{ background: theme.color, color: '#fff' }}
                >
                  {leadStory.center || 'Feature'}
                </span>
                <span className="font-mono text-[.52rem] tracking-[0.12em] uppercase" style={{ color: '#5c6474' }}>
                  {fmtDate(leadStory.published_at)}
                  {leadStory.source_domain && <> &middot; {leadStory.source_domain}</>}
                </span>
              </div>
              <Link href={'/content/' + leadStory.id}>
                <h2
                  className="font-display font-black leading-[1.05] tracking-tight mb-3 hover:underline"
                  style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#0d1117' }}
                >
                  {getTitle(leadStory)}
                </h2>
              </Link>
              <p
                className="font-body italic leading-[1.75] mb-4"
                style={{ fontSize: '0.95rem', color: '#5c6474', maxWidth: '520px' }}
              >
                {getSummary(leadStory)}
              </p>
              <Link
                href={'/content/' + leadStory.id}
                className="inline-flex items-center gap-1.5 font-mono text-[.65rem] uppercase tracking-[0.08em] hover:underline"
                style={{ color: theme.color, fontWeight: 600 }}
              >
                {t('card.read_more')} <ArrowRight size={12} />
              </Link>
            </div>

            {/* Sidebar stories */}
            <div className="lg:pl-8 mt-8 lg:mt-0 space-y-0">
              {sidebarStories.map((c, i) => (
                <Link
                  key={c.id}
                  href={'/content/' + c.id}
                  className="group block py-4 transition-colors hover:bg-[#f4f5f7] px-2 -mx-2"
                  style={{ borderBottom: i < sidebarStories.length - 1 ? '1px solid #dde1e8' : undefined }}
                >
                  <div className="flex gap-4">
                    {i === 0 && c.image_url && (
                      <div className="w-24 h-16 flex-shrink-0 overflow-hidden" style={{ border: '1px solid #dde1e8' }}>
                        <Image src={c.image_url} alt="" width={96} height={64} className="w-full h-full object-contain bg-[#f4f5f7]" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                        <span className="font-mono text-[.5rem] tracking-[0.1em] uppercase" style={{ color: '#5c6474' }}>
                          {c.center || 'Feature'} &middot; {fmtDate(c.published_at)}
                        </span>
                      </div>
                      <h3
                        className="font-display font-bold leading-snug line-clamp-2 group-hover:underline"
                        style={{ fontSize: '0.92rem', color: '#0d1117' }}
                      >
                        {getTitle(c)}
                      </h3>
                      {i === 0 && (
                        <p className="font-body text-[.8rem] italic text-[#5c6474] mt-1 line-clamp-2">{getSummary(c)}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. FOUR DESKS — editorial center blocks
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-10" style={{ borderBottom: '1.5px solid #dde1e8' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

          {/* ── Learning Desk ── */}
          <DeskBlock
            icon={<BookOpen size={14} />}
            label="How can I understand?"
            color={CENTER_COLORS.Learning}
            themeColor={theme.color}
            borderRight
            borderBottom
          >
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

          {/* ── Action Desk ── */}
          <DeskBlock
            icon={<Heart size={14} />}
            label="How can I help?"
            color={CENTER_COLORS.Action}
            themeColor={theme.color}
            borderBottom
          >
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

          {/* ── Resource Desk ── */}
          <DeskBlock
            icon={<Package size={14} />}
            label="What's available?"
            color={CENTER_COLORS.Resource}
            themeColor={theme.color}
            borderRight
          >
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

          {/* ── Accountability Desk ── */}
          <DeskBlock
            icon={<Scale size={14} />}
            label="Who makes decisions?"
            color={CENTER_COLORS.Accountability}
            themeColor={theme.color}
          >
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
                meta={[p.bill_number, p.status].filter(Boolean).join(' · ') || undefined}
                color={CENTER_COLORS.Accountability}
                typeLabel="Policy"
              />
            ))}
          </DeskBlock>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. TOPIC INDEX — focus areas as compact pills
         ═══════════════════════════════════════════════════════════════════ */}
      {themeFocusAreas.length > 0 && (
        <section className="max-w-[1080px] mx-auto px-6 py-8" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <span className="font-mono text-[.58rem] tracking-[0.2em] uppercase text-[#5c6474] block mb-4">
            Topic index
          </span>
          <div className="flex flex-wrap gap-2">
            {themeFocusAreas.map(fa => (
              <Link
                key={fa.focus_id}
                href={'/explore/focus/' + fa.focus_id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-white transition-colors hover:bg-[#f4f5f7]"
                style={{ border: '1px solid #dde1e8' }}
              >
                <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                <span className="font-body text-[.82rem] font-medium text-[#0d1117]">{fa.focus_area_name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. QUOTE
         ═══════════════════════════════════════════════════════════════════ */}
      {quote && (
        <div className="max-w-[1080px] mx-auto px-6 py-8" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={theme.color} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          6. NEWS WIRE
         ═══════════════════════════════════════════════════════════════════ */}
      {newsCount > 0 && (
        <section style={{ backgroundColor: theme.color + '08', borderBottom: '1.5px solid #dde1e8' }}>
          <div className="max-w-[1080px] mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="font-mono text-[.58rem] tracking-[0.2em] uppercase text-[#5c6474] block mb-1">
                The wire
              </span>
              <p className="font-body text-[.88rem]" style={{ color: '#0d1117' }}>
                {newsCount} news {newsCount === 1 ? 'article' : 'articles'} covering {theme.name} in Houston
              </p>
            </div>
            <Link
              href={'/news?pathway=' + theme.id}
              className="inline-flex items-center gap-2 font-mono text-[.65rem] uppercase tracking-[0.08em] hover:underline flex-shrink-0"
              style={{ color: theme.color, fontWeight: 600 }}
            >
              Read the latest <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          7. DEEPER READING
         ═══════════════════════════════════════════════════════════════════ */}
      {libraryNuggets.length > 0 && (
        <div className="max-w-[1080px] mx-auto px-6 py-8" style={{ borderBottom: '1.5px solid #dde1e8' }}>
          <LibraryNugget
            nuggets={libraryNuggets}
            variant="sidebar"
            color={theme.color}
            labels={{ fromThe: t('library.from_the'), readMore: t('library.read_more') }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          8. COLOPHON
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1080px] mx-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/pathways"
            className="font-mono text-[.62rem] uppercase tracking-[0.08em] hover:underline"
            style={{ color: '#5c6474' }}
          >
            &larr; All sections
          </Link>
          {bridgeData.map(b => (
            <Link
              key={b.targetThemeId}
              href={'/pathways/' + b.targetSlug}
              className="inline-flex items-center gap-1.5 font-mono text-[.58rem] uppercase tracking-[0.08em] hover:underline"
              style={{ color: b.targetColor }}
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

function DeskBlock({ icon, label, color, themeColor, borderRight, borderBottom, children }: {
  icon: React.ReactNode
  label: string
  color: string
  themeColor: string
  borderRight?: boolean
  borderBottom?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="py-6 first:pt-0"
      style={{
        paddingRight: borderRight ? '2rem' : undefined,
        paddingLeft: !borderRight ? '2rem' : undefined,
        borderRight: borderRight ? '1px solid #dde1e8' : undefined,
        borderBottom: borderBottom ? '1px solid #dde1e8' : undefined,
      }}
    >
      {/* Desk header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 flex items-center justify-center" style={{ backgroundColor: color + '18', color }}>
          {icon}
        </div>
        <span className="font-mono text-[.58rem] tracking-[0.12em] uppercase" style={{ color: '#5c6474' }}>
          {label}
        </span>
      </div>
      <div className="h-0.5 w-8 mb-4" style={{ backgroundColor: color }} />
      <div className="space-y-0">
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
      className="group flex items-start gap-3 py-2.5 transition-colors hover:bg-[#f4f5f7] -mx-2 px-2"
      style={{ borderBottom: '1px solid #f0f1f3' }}
    >
      <span className="w-1 h-full min-h-[1.5rem] flex-shrink-0 mt-0.5" style={{ backgroundColor: color + '40' }} />
      <div className="min-w-0 flex-1">
        {typeLabel && (
          <span className="font-mono text-[.48rem] tracking-[0.12em] uppercase block mb-0.5" style={{ color }}>
            {typeLabel}
          </span>
        )}
        <h4 className="font-body text-[.84rem] font-medium leading-snug text-[#0d1117] line-clamp-2 group-hover:underline">
          {title}
        </h4>
        {meta && (
          <span className="font-mono text-[.52rem] tracking-[0.05em] uppercase text-[#5c6474] mt-0.5 block">
            {meta}
          </span>
        )}
      </div>
    </Link>
  )
}
