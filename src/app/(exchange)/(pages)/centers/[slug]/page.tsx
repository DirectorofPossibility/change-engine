import { notFound } from 'next/navigation'
import Link from 'next/link'
import { THEMES, CENTERS, CENTER_COLORS } from '@/lib/constants'
import { ContentCard } from '@/components/exchange/ContentCard'
import { ContentShelf, type ShelfItem } from '@/components/exchange/ContentShelf'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import type { ContentPublished } from '@/lib/types/exchange'

function resolveCenter(slug: string) {
  for (const [name, config] of Object.entries(CENTERS)) {
    if (config.slug === slug) return { name, ...config }
  }
  return null
}

export const revalidate = 3600

export default async function CenterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const center = resolveCenter(slug)
  if (!center) notFound()

  const supabase = await createClient()
  const { data: content } = await supabase
    .from('content_published')
    .select('*')
    .eq('is_active', true)
    .eq('center', center.name)
    .order('published_at', { ascending: false })
    .limit(50)

  const items = (content ?? []) as ContentPublished[]

  // Group by pathway for shelf braid (inverse direction: shelves = pathways)
  const byPathway: Record<string, ContentPublished[]> = {}
  items.forEach((item) => {
    const pw = item.pathway_primary || 'unknown'
    if (!byPathway[pw]) byPathway[pw] = []
    byPathway[pw].push(item)
  })

  // Fetch translations for non-English
  const langId = await getLangId()
  const inboxIds = items.map(function (i) { return i.inbox_id }).filter(function (id): id is string { return id != null })
  const translations = langId && inboxIds.length > 0 ? await fetchTranslationsForTable('content_published', inboxIds, langId) : {}

  const centerColor = CENTER_COLORS[center.name] || '#8B7E74'

  return (
    <div>
      {/* ── Compact Hero ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Breadcrumb items={[
          { label: 'Centers', href: '/centers' },
          { label: center.name }
        ]} />

        <div className="mt-4 text-center sm:text-left">
          <span className="text-6xl block mb-3">{center.emoji}</span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-brand-text">{center.name}</h1>
          <p className="text-base font-serif italic text-brand-muted mt-2">{center.question}</p>
          <div className="h-0.5 w-12 rounded-full mt-4 mx-auto sm:mx-0" style={{ backgroundColor: centerColor }} />
          <p className="text-sm text-brand-muted mt-3">{items.length} resources</p>
        </div>
      </div>

      {/* ── Shelves by pathway ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-2">
          {Object.entries(THEMES).map(([themeId, theme]) => {
            const pathwayItems = byPathway[themeId]
            if (!pathwayItems || pathwayItems.length === 0) return null

            const shelfItems: ShelfItem[] = pathwayItems.map((item) => ({
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
            }))

            return (
              <ContentShelf
                key={themeId}
                title={theme.name}
                question={theme.description?.slice(0, 80) + '...'}
                color={theme.color}
                items={shelfItems}
                translations={translations}
                seeAllHref={'/pathways/' + theme.slug}
              />
            )
          })}
        </div>
      </div>

      <div className="h-8" />
    </div>
  )
}
