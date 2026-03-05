import type { Metadata } from 'next'
import { getUnifiedKBItems } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { PageHero } from '@/components/exchange/PageHero'
import { LibraryClient } from './LibraryClient'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Research Library — Community Exchange',
  description: 'Explore articles, reports, videos, guides, tools, and research from Houston organizations and community partners.',
}

export default async function LibraryPage() {
  const items = await getUnifiedKBItems()

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, slug: theme.slug, description: theme.description }
  })

  // Map to library items with page_count
  const libraryItems = items.map(function (item) {
    return {
      id: item.id,
      title: item.title,
      summary: item.summary,
      tags: item.tags,
      theme_ids: item.theme_ids,
      content_type: item.content_type,
      source: item.source,
      image_url: item.image_url,
      published_at: item.published_at,
      page_count: 0,
    }
  })

  // Pick featured items: prefer items with images, most recent
  const withImages = libraryItems
    .filter(function (i) { return !!i.image_url })
    .sort(function (a, b) {
      if (!a.published_at) return 1
      if (!b.published_at) return -1
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })

  const withoutImages = libraryItems
    .filter(function (i) { return !i.image_url })
    .sort(function (a, b) {
      if (!a.published_at) return 1
      if (!b.published_at) return -1
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    })

  // Featured: up to 4, prefer items with images
  const featured = [...withImages.slice(0, 4)]
  if (featured.length < 4) {
    featured.push(...withoutImages.slice(0, 4 - featured.length))
  }

  return (
    <div>
      <PageHero
        variant="editorial"
        title="Research Library"
        subtitle="Articles, reports, videos, guides, and tools from Houston organizations and community partners — all in one place."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Breadcrumb items={[{ label: 'Library' }]} />

        <LibraryClient
          items={libraryItems}
          themes={themes}
          featured={featured}
        />
      </div>
    </div>
  )
}
