import { notFound } from 'next/navigation'
import { THEMES, CENTERS } from '@/lib/constants'
import { ContentCard } from '@/components/exchange/ContentCard'
import { CenterFilterClient } from './CenterFilterClient'
import { createClient } from '@/lib/supabase/server'
import { getLangId, fetchTranslationsForTable } from '@/lib/data/exchange'

// Resolve slug to center name
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

  const items = content ?? []

  // Count by pathway for filter pills
  const pathwayCounts: Record<string, number> = {}
  items.forEach((item) => {
    if (item.pathway_primary) {
      pathwayCounts[item.pathway_primary] = (pathwayCounts[item.pathway_primary] || 0) + 1
    }
  })

  // Fetch translations for non-English
  const langId = await getLangId()
  const inboxIds = items.map(function (i) { return i.inbox_id }).filter(function (id): id is string { return id != null })
  const translations = langId && inboxIds.length > 0 ? await fetchTranslationsForTable('content_published', inboxIds, langId) : {}

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <span className="text-5xl block mb-3">{center.emoji}</span>
        <h1 className="text-3xl font-bold text-brand-text mb-2">{center.name}</h1>
        <p className="text-lg text-brand-muted">{center.question}</p>
        <p className="text-sm text-brand-muted mt-2">{items.length} resources</p>
      </div>

      <CenterFilterClient
        items={items}
        pathwayCounts={pathwayCounts}
        translations={translations}
      />
    </div>
  )
}
