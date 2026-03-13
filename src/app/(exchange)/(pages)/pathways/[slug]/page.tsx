import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
import { ThemeMasthead } from '@/components/templates/ThemeMasthead'
import { SectionHeader } from '@/components/templates/SectionHeader'
import { ControlPanel } from '@/components/templates/ControlPanel'
import { CouchGrid } from '@/components/templates/CouchGrid'
import { DataStories } from '@/components/templates/DataStories'
import { FeatureOpener } from '@/components/templates/FeatureOpener'

// Map theme IDs to sacred geometry types
const THEME_GEO: Record<string, string> = {
  THEME_01: 'flower_of_life',
  THEME_02: 'seed_of_life',
  THEME_03: 'hex_grid',
  THEME_04: 'concentric_rings',
  THEME_05: 'golden_spiral',
  THEME_06: 'torus',
  THEME_07: 'metatron_cube',
}

// Map focus area to geo type by name pattern
const FOCUS_GEO: Record<string, string> = {
  mental: 'vesica_piscis',
  food: 'flower_of_life',
  healthcare: 'compass_rose',
  maternal: 'nested_circles',
  substance: 'outward_spiral',
  disability: 'hub_and_spokes',
  oral: 'six_petal_rose',
  environment: 'torus',
}

function resolveTheme(slug: string) {
  for (const [id, theme] of Object.entries(THEMES)) {
    if (theme.slug === slug) return { id, ...theme }
  }
  return null
}

function focusGeo(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, geo] of Object.entries(FOCUS_GEO)) {
    if (lower.includes(key)) return geo
  }
  return 'seed_of_life'
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

  const sorted = [...content].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime()
  })

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

  // Build couch grid items
  const leadStory = sorted.find(c => c.is_featured && c.image_url) || sorted.find(c => c.image_url) || sorted[0] || null
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

  const couchItems = [
    leadStory && {
      id: leadStory.id,
      href: '/content/' + leadStory.id,
      title: getTitle(leadStory),
      dek: getSummary(leadStory),
      type: leadStory.center || 'Feature',
      meta: fmtDate(leadStory.published_at) + (leadStory.source_domain ? ' -- ' + leadStory.source_domain : ''),
      imageUrl: leadStory.image_url || undefined,
      isFeature: true,
    },
    ...sidebarStories.map(c => ({
      id: c.id,
      href: '/content/' + c.id,
      title: getTitle(c),
      type: c.center || 'Feature',
      meta: fmtDate(c.published_at),
    })),
  ].filter(Boolean) as Array<{ id: string; href: string; title: string; dek?: string; type?: string; meta?: string; imageUrl?: string; isFeature?: boolean }>

  // Build remaining content by center
  const usedIds = new Set([leadStory?.id, ...sidebarStories.map(s => s.id)])
  const remaining = sorted.filter(c => !usedIds.has(c.id))
  const byCenter: Record<string, ContentPublished[]> = { Learning: [], Action: [], Resource: [], Accountability: [] }
  for (const c of remaining) {
    const key = c.center || 'Learning'
    if (byCenter[key]) byCenter[key].push(c)
  }

  // Build instrument data for control panel
  const instruments = themeFocusAreas.map(fa => ({
    name: fa.focus_area_name,
    href: '/explore/focus/' + fa.focus_id,
    geoType: focusGeo(fa.focus_area_name),
    themeColor: theme.color,
    levelsFilled: Math.min(5, Math.max(1, Math.ceil(Math.random() * 5))), // TODO: derive from actual content depth
    totalLevels: 5,
  }))

  return (
    <div className="min-h-screen bg-white">
      {/* Theme Masthead */}
      <ThemeMasthead
        themeName={theme.name}
        themeColor={theme.color}
        description={theme.description}
        geoType={THEME_GEO[theme.id] || 'seed_of_life'}
        dateline={`Houston, TX -- ${new Date().getFullYear()} Edition`}
        stats={[
          { num: String(totalStories), desc: 'Stories' },
          { num: String(totalEntities), desc: 'Resources' },
          { num: String(themeFocusAreas.length), desc: 'Focus areas' },
        ]}
      />

      {/* Editorial body */}
      <div className="max-w-[1080px] mx-auto px-6">

        {/* Feature Opener — lede + quote */}
        {leadStory && quote && (
          <FeatureOpener
            lede={getSummary(leadStory) || theme.description}
            themeColor={theme.color}
            quotes={[{ quote: quote.quote_text, source: quote.attribution }]}
          />
        )}

        {/* Data Stories — stats row */}
        <DataStories
          themeColor={theme.color}
          stories={[
            { num: String(totalStories), hed: 'Stories tracked', copy: 'Across learning, action, resource, and accountability centers' },
            { num: String(relatedServices.length), hed: 'Local services', copy: 'Available to Houston residents through 211 and partner organizations' },
            { num: String(policies.length), hed: 'Active policies', copy: 'Federal, state, and local legislation affecting this pathway' },
          ]}
        />

        {/* From the Couch — editorial grid */}
        {couchItems.length > 0 && (
          <section className="py-10 border-b border-rule-inner">
            <SectionHeader
              kicker="From the Couch"
              heading="Latest"
              headingEm="Reads"
              allHref={'/news?pathway=' + theme.id}
              allLabel="All stories"
            />
            <CouchGrid
              items={couchItems}
              themeColor={theme.color}
              geoType={THEME_GEO[theme.id] || 'seed_of_life'}
            />
          </section>
        )}

        {/* Four Desks — by center */}
        <section className="py-10 border-b border-rule-inner">
          <SectionHeader kicker="By Center" heading="Explore by Intent" />
          <div className="grid grid-cols-1 md:grid-cols-2 border border-rule-inner">
            <DeskBlock label="How can I understand?" color={CENTER_COLORS.Learning} position="tl">
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

            <DeskBlock label="How can I help?" color={CENTER_COLORS.Action} position="tr">
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

            <DeskBlock label="What's available?" color={CENTER_COLORS.Resource} position="bl">
              {byCenter.Resource.slice(0, 3).map(c => (
                <DeskItem key={c.id} href={'/content/' + c.id} title={getTitle(c)} meta={fmtDate(c.published_at)} color={theme.color} />
              ))}
              {relatedServices.slice(0, 4).map(s => (
                <DeskItem
                  key={s.service_id}
                  href={'/services/' + s.service_id}
                  title={s.service_name}
                  color={CENTER_COLORS.Resource}
                  typeLabel="Service"
                />
              ))}
            </DeskBlock>

            <DeskBlock label="Who makes decisions?" color={CENTER_COLORS.Accountability} position="br">
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

        {/* Control Panel — focus area instruments */}
        {instruments.length > 0 && (
          <ControlPanel
            instruments={instruments}
            kicker="Control Panel"
            heading="Focus Area Instruments"
          />
        )}

        {/* Civic Data */}
        {(CIVIC_DATA_REFERENCES as Record<string, readonly { label: string; url: string; source: string }[]>)[theme.id] && (
          <section className="py-10 border-b border-rule-inner">
            <SectionHeader kicker="Data" heading="See the Data" />
            <div className="flex flex-wrap gap-3">
              {(CIVIC_DATA_REFERENCES as Record<string, readonly { label: string; url: string; source: string }[]>)[theme.id].map(ref => (
                <a
                  key={ref.url}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 py-2.5 px-4 border border-rule-inner transition-colors hover:bg-paper"
                >
                  <span className="font-body text-[0.85rem] group-hover:underline">{ref.label}</span>
                  <span className="font-mono text-[0.6875rem] tracking-[0.08em] uppercase text-muted">{ref.source}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Quote */}
        {quote && (
          <section className="py-10 border-b border-rule-inner">
            <QuoteCard text={quote.quote_text} attribution={quote.attribution} accentColor={theme.color} />
          </section>
        )}

        {/* News Wire */}
        {newsCount > 0 && (
          <section className="py-10 border-b border-rule-inner">
            <div className="p-6 bg-paper border border-rule-inner">
              <span className="font-mono text-[0.6875rem] tracking-[0.2em] uppercase text-muted block mb-2">
                The Wire
              </span>
              <p className="font-body text-[0.9rem]">
                {newsCount} news {newsCount === 1 ? 'article' : 'articles'} covering {theme.name} in Houston
              </p>
              <Link
                href={'/news?pathway=' + theme.id}
                className="font-mono text-[0.6875rem] tracking-[0.08em] uppercase text-blue font-semibold hover:underline mt-2 inline-block"
              >
                Read the latest →
              </Link>
            </div>
          </section>
        )}

        {/* Deeper Reading */}
        {libraryNuggets.length > 0 && (
          <section className="py-10 border-b border-rule-inner">
            <LibraryNugget
              nuggets={libraryNuggets}
              variant="sidebar"
              color={theme.color}
              labels={{ fromThe: t('library.from_the'), readMore: t('library.read_more') }}
            />
          </section>
        )}

        {/* Colophon — pathway links */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-8">
          <Link
            href="/pathways"
            className="font-mono text-[0.6875rem] tracking-[0.08em] uppercase text-blue hover:underline"
          >
            All Pathways
          </Link>
          {bridgeData.map(b => (
            <Link
              key={b.targetThemeId}
              href={'/pathways/' + b.targetSlug}
              className="inline-flex items-center gap-1.5 hover:underline font-mono text-[0.6875rem] tracking-[0.08em] uppercase"
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

function DeskBlock({ label, color, position, children }: {
  label: string
  color: string
  position: 'tl' | 'tr' | 'bl' | 'br'
  children: React.ReactNode
}) {
  const borderClasses = {
    tl: 'md:border-r md:border-b',
    tr: 'md:border-b',
    bl: 'md:border-r',
    br: '',
  }

  return (
    <div className={`p-6 border-rule-inner ${borderClasses[position]}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2" style={{ backgroundColor: color }} />
        <span className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-muted">
          {label}
        </span>
      </div>
      <div className="h-0.5 w-8 mb-4" style={{ backgroundColor: color }} />
      <div>{children}</div>
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
      className="group flex items-start gap-3 py-2.5 -mx-2 px-2 transition-colors hover:bg-paper border-b border-rule"
    >
      <span className="w-1 min-h-[1.5rem] flex-shrink-0 mt-0.5" style={{ backgroundColor: color + '40' }} />
      <div className="min-w-0 flex-1">
        {typeLabel && (
          <span className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase block mb-0.5" style={{ color }}>
            {typeLabel}
          </span>
        )}
        <h4 className="font-body text-[0.85rem] leading-snug line-clamp-2 group-hover:underline">
          {title}
        </h4>
        {meta && (
          <span className="font-mono text-[0.6875rem] text-muted mt-0.5 block">
            {meta}
          </span>
        )}
      </div>
    </Link>
  )
}
