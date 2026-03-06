import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Download, MessageCircle, Tag, ArrowLeft } from 'lucide-react'
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

export default async function Design2DocumentDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = await getDocumentById(id)
  if (!doc) notFound()

  const related = await getRelatedDocuments(doc.id, doc.theme_ids, doc.tags)

  // Resolve theme info
  const themeInfo = doc.theme_ids
    .map(function (tid) {
      const theme = (THEMES as Record<string, { color: string; name: string; slug: string }>)[tid]
      return theme ? { color: theme.color, name: theme.name, slug: theme.slug } : null
    })
    .filter(Boolean) as { color: string; name: string; slug: string }[]

  const primaryTheme = themeInfo[0] || { color: '#C75B2A', name: 'Library', slug: '' }
  const fileSizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)

  return (
    <div style={{ backgroundColor: '#FAF8F5' }} className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/design2/library"
          className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
          style={{ color: '#6B6560' }}
        >
          <ArrowLeft size={15} />
          Back to Library
        </Link>

        {/* Pathway dots */}
        {themeInfo.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            {themeInfo.map(function (theme) {
              return (
                <span
                  key={theme.name}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: '#6B6560' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  {theme.name}
                </span>
              )
            })}
          </div>
        )}

        {/* Title */}
        <h1
          className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-3"
          style={{ color: '#1a1a1a' }}
        >
          {doc.title}
        </h1>

        {/* Meta line */}
        <div className="flex flex-wrap items-center gap-3 text-sm mb-8" style={{ color: '#6B6560' }}>
          <span className="flex items-center gap-1.5">
            <FileText size={14} />
            {doc.page_count} pages
          </span>
          <span style={{ color: '#E2DDD5' }}>|</span>
          <span>{fileSizeMB} MB</span>
          {doc.published_at && (
            <>
              <span style={{ color: '#E2DDD5' }}>|</span>
              <span>{new Date(doc.published_at).toLocaleDateString()}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Summary */}
            <div
              className="bg-white rounded-xl p-6"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <h2
                className="font-serif text-lg font-bold mb-3"
                style={{ color: '#1a1a1a' }}
              >
                Summary
              </h2>
              <p className="leading-relaxed text-[15px]" style={{ color: '#6B6560' }}>
                {doc.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            {doc.key_points.length > 0 && (
              <div
                className="bg-white rounded-xl p-6"
                style={{ border: '1px solid #E2DDD5' }}
              >
                <h2
                  className="font-serif text-lg font-bold mb-4"
                  style={{ color: '#1a1a1a' }}
                >
                  Key Takeaways
                </h2>
                <div className="space-y-4">
                  {doc.key_points.map(function (point, i) {
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: primaryTheme.color }}
                        >
                          {i + 1}
                        </div>
                        <p className="leading-relaxed" style={{ color: '#1a1a1a' }}>
                          {point}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            {doc.tags.length > 0 && (
              <div
                className="bg-white rounded-xl p-6"
                style={{ border: '1px solid #E2DDD5' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={14} style={{ color: '#6B6560' }} />
                  <h2
                    className="font-serif text-base font-bold"
                    style={{ color: '#1a1a1a' }}
                  >
                    Topics
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.tags.slice(0, 8).map(function (tag) {
                    return (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: '#FAF8F5',
                          color: '#6B6560',
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Actions card */}
            <div
              className="bg-white rounded-xl p-5 space-y-3"
              style={{ border: '1px solid #E2DDD5' }}
            >
              <a
                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kb-documents/${doc.file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  border: '1px solid #E2DDD5',
                  color: '#1a1a1a',
                }}
              >
                <Download size={15} />
                Download PDF
              </a>

              <Link
                href={'/design2/chat?doc=' + doc.id}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#C75B2A' }}
              >
                <MessageCircle size={15} />
                Ask About This Document
              </Link>
            </div>

            {/* Related documents */}
            {related.length > 0 && (
              <div>
                <h3
                  className="font-serif text-base font-bold mb-3"
                  style={{ color: '#1a1a1a' }}
                >
                  Related Research
                </h3>
                <div className="space-y-3">
                  {related.slice(0, 4).map(function (rel) {
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
    </div>
  )
}
