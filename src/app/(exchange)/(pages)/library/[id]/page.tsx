import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Download, ArrowLeft, Tag, MessageCircle } from 'lucide-react'
import { getDocumentById, getRelatedDocuments } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'
import { LibraryCard } from '@/components/exchange/LibraryCard'

export const revalidate = 300

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const doc = await getDocumentById(id)
  if (!doc) return { title: 'Document Not Found' }
  return {
    title: doc.title + ' | Community Research Library',
    description: doc.summary,
  }
}

export default async function DocumentDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = await getDocumentById(id)
  if (!doc) notFound()

  const related = await getRelatedDocuments(doc.id, doc.theme_ids, doc.tags)

  // Resolve theme info
  const themeInfo = doc.theme_ids
    .map(function (tid) {
      const theme = (THEMES as Record<string, { color: string; name: string }>)[tid]
      return theme ? { color: theme.color, name: theme.name } : null
    })
    .filter(Boolean) as { color: string; name: string }[]

  const fileSizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-accent transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Theme pills */}
          {themeInfo.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {themeInfo.map(function (theme) {
                return (
                  <span
                    key={theme.name}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: theme.color + '15', color: theme.color }}
                  >
                    {theme.name}
                  </span>
                )
              })}
            </div>
          )}

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-text leading-tight mb-4">
            {doc.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-brand-muted mb-6">
            <span className="flex items-center gap-1.5">
              <FileText size={14} />
              {doc.page_count} pages
            </span>
            <span>{fileSizeMB} MB</span>
            {doc.published_at && (
              <span>Published {new Date(doc.published_at).toLocaleDateString()}</span>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-brand-border p-6 mb-6">
            <h2 className="font-serif text-lg font-bold text-brand-text mb-3">Summary</h2>
            <p className="text-brand-text leading-relaxed">{doc.summary}</p>
          </div>

          {/* Key Points */}
          {doc.key_points.length > 0 && (
            <div className="bg-white rounded-xl border border-brand-border p-6 mb-6">
              <h2 className="font-serif text-lg font-bold text-brand-text mb-3">Key Takeaways</h2>
              <ul className="space-y-2">
                {doc.key_points.map(function (point, i) {
                  return (
                    <li key={i} className="flex items-start gap-3 text-brand-text">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 flex-shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Tags */}
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Tag size={14} className="text-brand-muted" />
              {doc.tags.map(function (tag) {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-brand-muted"
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Actions */}
          <div className="bg-white rounded-xl border border-brand-border p-5 space-y-3">
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kb-documents/${doc.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-brand-border text-sm font-semibold text-brand-text hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              Download PDF
            </a>

            <Link
              href={'/library/chat?doc=' + doc.id}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={15} />
              Ask About This Document
            </Link>
          </div>

          {/* Related documents */}
          {related.length > 0 && (
            <div>
              <h3 className="font-serif text-base font-bold text-brand-text mb-3">Related Documents</h3>
              <div className="space-y-3">
                {related.map(function (rel) {
                  return (
                    <LibraryCard
                      key={rel.id}
                      id={rel.id}
                      title={rel.title}
                      summary={rel.summary}
                      tags={rel.tags}
                      theme_ids={rel.theme_ids}
                      page_count={rel.page_count}
                      published_at={rel.published_at}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
