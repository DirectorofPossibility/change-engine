import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getUnifiedKBItems } from '@/lib/data/library'
import { getFocusAreas } from '@/lib/data/exchange'
import { KnowledgeBaseClient } from '../KnowledgeBaseSection'
import { PageHero } from '@/components/exchange/PageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { MessageCircle, FileText } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Knowledge Base — Change Engine',
  description: 'Browse articles, reports, guides, videos, and research across all pathways.',
}

export default async function KnowledgeBasePage() {
  const [items, allFocusAreas] = await Promise.all([
    getUnifiedKBItems(),
    getFocusAreas(),
  ])

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, emoji: theme.emoji }
  })

  const focusAreas = allFocusAreas.map(function (fa: any) {
    return { focus_id: fa.focus_id, focus_area_name: fa.focus_area_name, theme_id: fa.theme_id || null }
  })

  return (
    <div>
      <PageHero
        variant="editorial"
        title="Knowledge Base"
        subtitle="Explore articles, reports, guides, videos, and tools — organized by pathway, topic, or A-Z."
      />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Explore', href: '/explore' },
          { label: 'Knowledge Base' },
        ]} />

        {/* Quick links */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/library"
            className="text-sm text-brand-accent hover:underline flex items-center gap-1.5"
          >
            <FileText size={14} />
            Research Library
          </Link>
          <Link
            href="/library/chat"
            className="text-sm text-brand-accent hover:underline flex items-center gap-1.5"
          >
            <MessageCircle size={14} />
            Ask AI
          </Link>
          <span className="text-xs text-brand-muted ml-auto">
            {items.length} item{items.length !== 1 ? 's' : ''} in knowledge base
          </span>
        </div>

        <KnowledgeBaseClient
          items={items}
          themes={themes}
          focusAreas={focusAreas}
        />
      </div>
    </div>
  )
}
