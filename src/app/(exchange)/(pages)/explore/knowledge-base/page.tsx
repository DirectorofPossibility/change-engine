import type { Metadata } from 'next'
import Link from 'next/link'
import { THEMES } from '@/lib/constants'
import { getPublishedDocuments } from '@/lib/data/library'
import { KnowledgeBaseTree } from '../KnowledgeBaseSection'
import { PageHero } from '@/components/exchange/PageHero'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { BookOpen, MessageCircle, FileText } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Knowledge Base — Community Exchange',
  description: 'Browse all articles A-Z in the Community Exchange knowledge base.',
}

export default async function KnowledgeBasePage() {
  const { documents } = await getPublishedDocuments(1, 500)

  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return { id, name: theme.name, color: theme.color, emoji: theme.emoji }
  })

  return (
    <div>
      <PageHero
        variant="editorial"
        title="Knowledge Base"
        subtitle="Browse all articles and research, organized A-Z."
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            {documents.length} article{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* A-Z Tree */}
        {documents.length > 0 ? (
          <KnowledgeBaseTree
            articles={documents.map(function (d: any) {
              return {
                id: d.id,
                title: d.title,
                summary: d.summary || '',
                tags: d.tags || [],
                theme_ids: d.theme_ids || [],
                page_count: d.page_count || 0,
                published_at: d.published_at,
              }
            })}
            themes={themes}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-brand-border">
            <BookOpen size={36} className="mx-auto text-brand-muted mb-4" />
            <p className="text-brand-muted mb-2">The knowledge base is being built.</p>
            <p className="text-sm text-brand-muted">Check back soon for articles and guides.</p>
          </div>
        )}
      </div>
    </div>
  )
}
