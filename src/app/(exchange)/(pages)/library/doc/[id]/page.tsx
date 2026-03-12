import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Download, MessageCircle, Tag } from 'lucide-react'
import { getDocumentById, getRelatedDocuments } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'
import { LibraryCard } from '@/components/exchange/LibraryCard'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { ArticleVoting } from './ArticleVoting'

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

  const userProfile = await getUserProfile()
  const [related, wayfinderData] = await Promise.all([
    getRelatedDocuments(doc.id, doc.theme_ids, doc.tags),
    getWayfinderContext('kb_document', id, userProfile?.role),
  ])

  // Resolve theme info
  const themeInfo = doc.theme_ids
    .map(function (tid) {
      const theme = (THEMES as Record<string, { color: string; name: string; slug: string }>)[tid]
      return theme ? { color: theme.color, name: theme.name, slug: theme.slug } : null
    })
    .filter(Boolean) as { color: string; name: string; slug: string }[]

  const primaryTheme = themeInfo[0] || { color: '#E8723A', name: 'Library', slug: '' }
  const fileSizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)

  const breadcrumbs = [
    { label: 'Library', href: '/library' },
    ...(primaryTheme.slug
      ? [{ label: primaryTheme.name, href: '/library/category/' + primaryTheme.slug }]
      : []),
    { label: doc.title },
  ]

  const metaRow = (
    <>
      <span className="flex items-center gap-1.5 text-sm text-brand-muted">
        <FileText size={14} />
        {doc.page_count} pages
      </span>
      <span className="text-brand-border text-sm">|</span>
      <span className="text-sm text-brand-muted">{fileSizeMB} MB</span>
      {doc.published_at && (
        <>
          <span className="text-brand-border text-sm">|</span>
          <span className="text-sm text-brand-muted">{new Date(doc.published_at).toLocaleDateString()}</span>
        </>
      )}
    </>
  )

  const eyebrowMeta = themeInfo.length > 0 ? (
    <div className="flex items-center gap-3">
      {themeInfo.map(function (theme) {
        return (
          <Link
            key={theme.name}
            href={'/library/category/' + theme.slug}
            className="inline-flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-text transition-colors"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.color }} />
            {theme.name}
          </Link>
        )
      })}
    </div>
  ) : undefined

  const sidebarContent = (
    <>
      {/* Actions */}
      <div className="bg-white border border-brand-border p-5 space-y-3">
        <a
          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kb-documents/${doc.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-brand-border text-sm font-semibold text-brand-text hover:bg-gray-50 transition-colors"
        >
          <Download size={15} />
          Download PDF
        </a>

        <Link
          href={'/library/chat?doc=' + doc.id}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <MessageCircle size={15} />
          Ask About This Document
        </Link>
      </div>

      {/* Related documents */}
      {related.length > 0 && (
        <div>
          <h3 className="font-display text-base font-bold text-brand-text mb-3">Related Research</h3>
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
    </>
  )

  return (
    <DetailPageLayout
      breadcrumbs={breadcrumbs}
      eyebrow={{ text: 'Library', bgColor: primaryTheme.color }}
      eyebrowMeta={eyebrowMeta}
      title={doc.title}
      subtitle={doc.summary}
      metaRow={metaRow}
      themeColor={primaryTheme.color}
      wayfinderData={wayfinderData}
      wayfinderType="kb_document"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      sidebar={sidebarContent}
      feedbackType="kb_document"
      feedbackId={doc.id}
      feedbackName={doc.title}
      actions={{
        share: { title: doc.title, url: `https://www.changeengine.us/library/doc/${id}` },
      }}
    >
      {/* Key Takeaways */}
      {doc.key_points.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold text-brand-text mb-4">Key Takeaways</h2>
          <div className="space-y-3">
            {doc.key_points.map(function (point, i) {
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: primaryTheme.color }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-brand-text leading-relaxed">{point}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tags — compact */}
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          <Tag size={12} className="text-brand-muted mr-1" />
          {doc.tags.slice(0, 6).map(function (tag) {
            return (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-brand-bg text-[11px] text-brand-muted"
              >
                {tag}
              </span>
            )
          })}
        </div>
      )}

      <ArticleVoting documentId={doc.id} />
    </DetailPageLayout>
  )
}
