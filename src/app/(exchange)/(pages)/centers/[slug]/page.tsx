/**
 * @fileoverview Center detail page — editorial culture-guide style.
 *
 * Each center (Learning, Action, Resource, Accountability) gets a
 * full-page treatment: parchment hero with sacred geometry motif,
 * featured content lead, pathway shelves, and quick-links footer.
 *
 * Design system: Georgia serif, Courier New mono, parchment palette,
 * zero border-radius, no emojis, no shadows.
 *
 * @route GET /centers/:slug
 * @caching ISR with revalidate = 3600 (1 hour)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { ContentCard } from '@/components/exchange/ContentCard'
import { ContentShelf, type ShelfItem } from '@/components/exchange/ContentShelf'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import type { ContentPublished } from '@/lib/types/exchange'

// ── Design tokens (locked — matches CommunityGuide.tsx) ─────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'

const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

// ── Center metadata ─────────────────────────────────────────────────────

const CENTER_META: Record<string, {
  motif: string
  tagline: string
  description: string
  question: string
  relatedLinks: Array<{ label: string; href: string }>
}> = {
  Learning: {
    motif: '/images/fol/vesica-piscis.svg',
    tagline: 'Knowledge is the first step.',
    description: 'Understand what is happening in your community. Read research, explore data, follow the news, and learn how the issues that shape Houston connect to your daily life.',
    question: 'How can I understand?',
    relatedLinks: [
      { label: 'News Feed', href: '/news' },
      { label: 'Library', href: '/library' },
      { label: 'Learning Paths', href: '/learning-paths' },
      { label: 'Search Everything', href: '/search' },
    ],
  },
  Action: {
    motif: '/images/fol/tripod-of-life.svg',
    tagline: 'Your energy can change things.',
    description: 'Put your energy into motion. Volunteer, attend events, sign petitions, join campaigns, and organize with your neighbors. Houston moves when you do.',
    question: 'How can I help?',
    relatedLinks: [
      { label: 'Events Calendar', href: '/events' },
      { label: 'Opportunities', href: '/opportunities' },
      { label: 'Organizations', href: '/organizations' },
      { label: 'Donate', href: '/donate' },
    ],
  },
  Resource: {
    motif: '/images/fol/seed-of-life.svg',
    tagline: 'Your community has resources waiting.',
    description: 'Access what you need. Find services, benefits, hotlines, and organizations that provide direct support. No matter what you are facing, Houston has something for you.',
    question: "What's available to me?",
    relatedLinks: [
      { label: 'Services', href: '/services' },
      { label: 'Organizations', href: '/organizations' },
      { label: 'Polling Places', href: '/polling-places' },
      { label: 'Search Everything', href: '/search' },
    ],
  },
  Accountability: {
    motif: '/images/fol/metatrons-cube.svg',
    tagline: 'Follow the trail.',
    description: 'Know who makes decisions and how to influence them. Track your elected officials, follow policy, understand government spending, and show up at public meetings.',
    question: 'Who makes decisions?',
    relatedLinks: [
      { label: 'Elected Officials', href: '/officials' },
      { label: 'Elections', href: '/elections' },
      { label: 'Policies', href: '/policies' },
      { label: 'Districts', href: '/districts' },
    ],
  },
}

// ── Route helpers ───────────────────────────────────────────────────────

function resolveCenter(slug: string) {
  for (const [name, config] of Object.entries(CENTERS)) {
    if (config.slug === slug) return { name, ...config }
  }
  return null
}

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const center = resolveCenter(slug)
  if (!center) return { title: 'Center Not Found' }
  const meta = CENTER_META[center.name]
  return {
    title: `${center.name} Center — The Community Exchange | The Change Engine`,
    description: meta?.description || `Explore ${center.name} resources in the Houston Community Exchange.`,
  }
}

export default async function CenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const center = resolveCenter(slug)
  if (!center) notFound()

  const meta = CENTER_META[center.name] || CENTER_META.Learning
  const centerColor = CENTER_COLORS[center.name] || '#8B7E74'

  const supabase = await createClient()
  const { data: content } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('center', center.name)
    .order('published_at', { ascending: false })
    .limit(60)

  const items = (content ?? []) as ContentPublished[]

  // Featured lead: first item with an image, or first item
  const featuredItem = items.find(function (item) { return item.image_url }) || items[0] || null

  // Group remaining by pathway
  const byPathway: Record<string, ContentPublished[]> = {}
  const pathwayCounts: Record<string, number> = {}
  items.forEach(function (item) {
    const pw = item.pathway_primary || 'unknown'
    if (!byPathway[pw]) byPathway[pw] = []
    byPathway[pw].push(item)
    pathwayCounts[pw] = (pathwayCounts[pw] || 0) + 1
  })

  // Sort pathways by count descending
  const sortedPathways = Object.entries(byPathway)
    .sort(function (a, b) { return b[1].length - a[1].length })

  // Fetch translations for non-English
  const langId = await getLangId()
  const inboxIds = items.map(function (i) { return i.inbox_id }).filter(function (id): id is string { return id != null })
  const translations = langId && inboxIds.length > 0 ? await fetchTranslationsForTable('content_published', inboxIds, langId) : {}

  return (
    <div style={{ background: '#ffffff' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Full-width parchment banner with sacred geometry motif
          ═══════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: PARCHMENT, minHeight: 420 }}
      >
        {/* Sacred geometry motif — large, low opacity */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none" aria-hidden="true">
          <Image
            src={meta.motif}
            alt=""
            width={500}
            height={500}
            className="opacity-[0.06] mr-[-60px]"
          />
        </div>

        {/* Top rule */}
        <div style={{ height: 3, background: centerColor }} />

        <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/exchange" className="hover:underline" style={{ color: MUTED }}>
                The Exchange
              </Link>
              <span style={{ color: MUTED }}> / </span>
              <Link href="/centers" className="hover:underline" style={{ color: MUTED }}>
                Centers
              </Link>
              <span style={{ color: MUTED }}> / </span>
              <span style={{ color: CLAY }}>{center.name}</span>
            </p>
          </nav>

          {/* Center label */}
          <p
            className="mt-8"
            style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: centerColor, textTransform: 'uppercase' }}
          >
            {center.name} Center &middot; {items.length} resources
          </p>

          {/* Main heading */}
          <h1
            className="mt-4"
            style={{ fontFamily: SERIF, fontSize: 'clamp(32px, 5vw, 52px)', color: INK, lineHeight: 1.15, maxWidth: 600 }}
          >
            {meta.question}
          </h1>

          {/* Tagline */}
          <p
            className="mt-4"
            style={{ fontFamily: SERIF, fontSize: 'clamp(16px, 2vw, 20px)', fontStyle: 'italic', color: MUTED, maxWidth: 520 }}
          >
            {meta.tagline}
          </p>

          {/* Description */}
          <p
            className="mt-6"
            style={{ fontFamily: SERIF, fontSize: 16, color: INK, lineHeight: 1.7, maxWidth: 560, opacity: 0.85 }}
          >
            {meta.description}
          </p>

          {/* Colored rule */}
          <div className="mt-8" style={{ width: 60, height: 2, background: centerColor }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED LEAD — Hero content card if available
          ═══════════════════════════════════════════════════════════════ */}
      {featuredItem && (
        <section style={{ background: PARCHMENT_WARM, borderBottom: `1px solid ${RULE_COLOR}` }}>
          <div className="max-w-[1000px] mx-auto px-6 py-12">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 20 }}>
              Latest in {center.name}
            </p>

            <Link href={'/content/' + featuredItem.id} className="group block">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 items-start">
                <div>
                  {/* Pathway pill */}
                  {featuredItem.pathway_primary && THEMES[featuredItem.pathway_primary as keyof typeof THEMES] && (
                    <p
                      className="mb-3"
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: THEMES[featuredItem.pathway_primary as keyof typeof THEMES].color,
                      }}
                    >
                      {THEMES[featuredItem.pathway_primary as keyof typeof THEMES].name}
                    </p>
                  )}

                  <h2
                    className="group-hover:underline"
                    style={{ fontFamily: SERIF, fontSize: 'clamp(22px, 3vw, 30px)', color: INK, lineHeight: 1.25, marginBottom: 12 }}
                  >
                    {featuredItem.title_6th_grade}
                  </h2>

                  {featuredItem.summary_6th_grade && (
                    <p style={{ fontFamily: SERIF, fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 480 }}>
                      {featuredItem.summary_6th_grade.length > 200
                        ? featuredItem.summary_6th_grade.slice(0, 200) + '...'
                        : featuredItem.summary_6th_grade}
                    </p>
                  )}

                  {featuredItem.source_domain && (
                    <p className="mt-4" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                      {featuredItem.source_domain}
                      {featuredItem.published_at && (
                        <span> &middot; {new Date(featuredItem.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </p>
                  )}

                  <span
                    className="inline-block mt-5 group-hover:text-[#a8522e] transition-colors"
                    style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
                  >
                    Read more &rarr;
                  </span>
                </div>

                {/* Featured image */}
                {featuredItem.image_url && (
                  <div className="hidden md:block overflow-hidden" style={{ border: `1px solid ${RULE_COLOR}` }}>
                    <Image
                      src={featuredItem.image_url}
                      alt=""
                      width={680}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      style={{ maxHeight: 260 }}
                    />
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PATHWAY INDEX — Table-of-contents showing what's inside
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: PARCHMENT, borderBottom: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[1000px] mx-auto px-6 py-12">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 24 }}>
            Browse by pathway
          </p>

          <div className="space-y-0">
            {sortedPathways.map(function ([themeId, pwItems]) {
              const theme = THEMES[themeId as keyof typeof THEMES]
              if (!theme) return null
              return (
                <Link
                  key={themeId}
                  href={'#pathway-' + themeId}
                  className="group flex items-baseline gap-3 py-3 transition-colors"
                  style={{ borderBottom: `1px solid ${RULE_COLOR}` }}
                >
                  {/* Color dot */}
                  <span className="w-2.5 h-2.5 flex-shrink-0" style={{ background: theme.color, marginTop: 4 }} />

                  {/* Name */}
                  <span
                    className="flex-1 group-hover:underline"
                    style={{ fontFamily: SERIF, fontSize: 18, color: INK }}
                  >
                    {theme.name}
                  </span>

                  {/* Dotted leader */}
                  <span className="flex-1 border-b border-dotted" style={{ borderColor: RULE_COLOR, minWidth: 40 }} />

                  {/* Count */}
                  <span style={{ fontFamily: MONO, fontSize: 13, color: MUTED }}>
                    {pwItems.length}
                  </span>
                </Link>
              )
            })}
          </div>

          <p className="mt-6" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
            {items.length} total resources in {center.name}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT SHELVES — Horizontal scrolling rows by pathway
          ═══════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="space-y-10">
          {sortedPathways.map(function ([themeId, pwItems]) {
            const theme = THEMES[themeId as keyof typeof THEMES]
            if (!theme || pwItems.length === 0) return null

            const shelfItems: ShelfItem[] = pwItems.map(function (item) {
              return {
                type: 'content' as const,
                id: item.inbox_id || item.id,
                title: item.title_6th_grade,
                summary: item.summary_6th_grade,
                pathway: item.pathway_primary,
                center: item.center,
                sourceUrl: item.source_url,
                publishedAt: item.published_at,
                imageUrl: item.image_url,
                href: '/content/' + item.id,
              }
            })

            return (
              <div key={themeId} id={'pathway-' + themeId}>
                {/* Section label */}
                <div className="mb-2 flex items-center gap-3">
                  <span className="w-3 h-3 flex-shrink-0" style={{ background: theme.color }} />
                  <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: theme.color, textTransform: 'uppercase' }}>
                    {theme.name} &middot; {pwItems.length} resources
                  </p>
                </div>
                <ContentShelf
                  title={theme.name}
                  question={theme.description?.slice(0, 100)}
                  color={theme.color}
                  items={shelfItems}
                  translations={translations}
                  seeAllHref={'/pathways/' + theme.slug}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          RELATED LINKS — Quick navigation strip
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[1000px] mx-auto px-6 py-12">
          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 20 }}>
            Go deeper
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {meta.relatedLinks.map(function (link) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block py-4 px-5 transition-all"
                  style={{
                    background: '#ffffff',
                    border: `1px solid ${RULE_COLOR}`,
                  }}
                  onMouseEnter={function (e) { (e.currentTarget as HTMLElement).style.borderColor = CLAY }}
                  onMouseLeave={function (e) { (e.currentTarget as HTMLElement).style.borderColor = RULE_COLOR }}
                >
                  <span
                    className="block group-hover:underline"
                    style={{ fontFamily: SERIF, fontSize: 16, color: INK }}
                  >
                    {link.label}
                  </span>
                  <span
                    className="block mt-1 group-hover:text-[#a8522e] transition-colors"
                    style={{ fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', color: CLAY }}
                  >
                    Explore &rarr;
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER CODA — Back to Exchange
          ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center py-10" style={{ background: PARCHMENT_WARM }}>
        <Link
          href="/exchange"
          className="hover:underline"
          style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
        >
          &larr; Back to The Community Exchange
        </Link>
      </div>
    </div>
  )
}
