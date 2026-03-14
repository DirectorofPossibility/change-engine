/**
 * @fileoverview Library document detail — editorial research paper layout.
 *
 * Uses the shared DetailPageLayout template for consistency across the site.
 * Includes key takeaways, PDF download, chat link, related research, and tags.
 *
 * @route GET /library/doc/:id
 * @caching ISR with revalidate = 300 (5 minutes)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDocumentById, getRelatedDocuments } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'
import { LibraryCard } from '@/components/exchange/LibraryCard'
import { DetailPageLayout } from '@/components/exchange/DetailPageLayout'
import { getWayfinderContext } from '@/lib/data/exchange'
import { getUserProfile } from '@/lib/auth/roles'
import { ArticleVoting } from './ArticleVoting'
import { FileText, MessageSquare, Download } from 'lucide-react'


export const revalidate = 300

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const doc = await getDocumentById(id)
  if (!doc) return { title: 'Document Not Found' }
  return {
    title: doc.title + ' | Community Research Library — The Change Engine',
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
      const theme = (THEMES as Record<string, { color: string; name: string; slug: string }>)[tid]
      return theme ? { id: tid, color: theme.color, name: theme.name, slug: theme.slug } : null
    })
    .filter(Boolean) as { id: string; color: string; name: string; slug: string }[]

  const primaryTheme = themeInfo[0] || { id: '', color: '#1b5e8a', name: 'Research', slug: '' }
  const fileSizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)
  const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kb-documents/${doc.file_path}`

  const userProfile = await getUserProfile()
  const wayfinderData = await getWayfinderContext('document', id, userProfile?.role)

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Library', href: '/library' },
    ...(primaryTheme.slug ? [{ label: primaryTheme.name, href: '/library/category/' + primaryTheme.slug }] : []),
    { label: doc.title },
  ]

  const eyebrowMeta = themeInfo.length > 0 ? (
    <div className="flex items-center gap-3 flex-wrap">
      {themeInfo.map(function (theme) {
        return (
          <Link
            key={theme.id}
            href={'/library/category/' + theme.slug}
            className="inline-flex items-center gap-1.5 hover:underline text-[0.7rem]"
            style={{ color: theme.color }}
          >
            <span className="w-2 h-2 flex-shrink-0" style={{ background: theme.color }} />
            {theme.name}
          </Link>
        )
      })}
    </div>
  ) : undefined

  const metaRow = (
    <div className="flex flex-wrap items-center gap-4 text-muted text-[0.8rem]">
      {doc.page_count > 0 && (
        <span className="flex items-center gap-1.5">
          <FileText size={14} /> {doc.page_count} pages
        </span>
      )}
      {doc.file_size > 0 && (
        <span>{fileSizeMB} MB</span>
      )}
      {doc.published_at && (
        <span>{new Date(doc.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      )}
    </div>
  )

  const footerContent = (
    <>
      {/* Related Research */}
      {related.length > 0 && (
        <section className="bg-paper border-t border-rule">
          <div className="max-w-[900px] mx-auto px-6 py-14">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-2xl">Related Research</h2>
              <Link href="/library" className="inline-flex items-center gap-1 hover:underline font-mono text-[0.65rem] uppercase tracking-wider text-blue">
                Full Library
              </Link>
            </div>
            <div className="h-px border-b border-dotted border-rule mb-6" />
            <p className="italic text-muted text-[0.9rem] mb-6">
              More from the library on similar topics
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {related.slice(0, 4).map(function (rel) {
                const relThemes = rel.theme_ids
                  .map(function (tid) {
                    const t = (THEMES as Record<string, { color: string; name: string }>)[tid]
                    return t ? { color: t.color, name: t.name } : null
                  })
                  .filter(Boolean) as { color: string; name: string }[]

                return (
                  <Link
                    key={rel.id}
                    href={'/library/doc/' + rel.id}
                    className="group block p-6 transition-all bg-white border border-rule hover:border-blue"
                  >
                    {relThemes.length > 0 && (
                      <div className="flex items-center gap-3 mb-3">
                        {relThemes.slice(0, 3).map(function (t) {
                          return (
                            <span key={t.name} className="inline-flex items-center gap-1 text-[0.6rem]" style={{ color: t.color }}>
                              <span className="w-1.5 h-1.5" style={{ background: t.color }} />
                              {t.name}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <h3 className="group-hover:underline line-clamp-2 text-[1rem] leading-snug font-bold mb-2">
                      {rel.title}
                    </h3>

                    {rel.summary && (
                      <p className="line-clamp-2 text-muted text-[0.85rem] leading-relaxed">
                        {rel.summary.length > 150 ? rel.summary.slice(0, 150) + '...' : rel.summary}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-muted text-[0.7rem]">
                      {rel.page_count > 0 && <span>{rel.page_count} pages</span>}
                      {rel.tags.length > 0 && (
                        <>
                          <span className="text-rule">|</span>
                          <span>{rel.tags.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Back to Library */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="h-px bg-rule mb-10" />
        <Link href="/library" className="italic text-blue text-[0.95rem] hover:underline">
          Back to Library
        </Link>
      </div>
    </>
  )

  const sidebarContent = (
    <>
      {/* Tags */}
      {doc.tags.length > 0 && (
        <div>
          <p className="font-mono text-micro uppercase tracking-wider text-muted mb-3">Keywords</p>
          <div className="flex flex-wrap gap-2">
            {doc.tags.map(function (tag) {
              return (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-muted border border-rule text-[0.7rem] bg-white"
                >
                  {tag}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Voting */}
      <ArticleVoting documentId={doc.id} />
    </>
  )

  return (
    <DetailPageLayout
      title={doc.title}
      subtitle={doc.summary}
      eyebrow={{ text: 'Research Document' }}
      eyebrowMeta={eyebrowMeta}
      breadcrumbs={breadcrumbs}
      themeColor={primaryTheme.color}
      mastheadBorderTop={`3px solid ${primaryTheme.color}`}
      metaRow={metaRow}
      wayfinderData={wayfinderData}
      wayfinderType="document"
      wayfinderEntityId={id}
      userRole={userProfile?.role}
      actions={{
        bookmark: { contentType: 'content', contentId: id, title: doc.title },
      }}
      footer={footerContent}
      sidebar={sidebarContent}
    >
      {/* Actions — PDF download + Ask AI */}
      <div className="mb-10 p-6 border border-blue bg-faint">
        <p className="font-mono text-micro uppercase tracking-wider text-muted mb-3">
          Access this document
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white transition-opacity hover:opacity-90 font-mono text-micro uppercase tracking-wider font-semibold bg-blue"
          >
            <Download size={14} /> Download PDF
          </a>
          <Link
            href={'/library/chat?doc=' + doc.id}
            className="inline-flex items-center gap-2 px-5 py-2.5 transition-colors font-mono text-micro uppercase tracking-wider font-semibold border border-blue text-blue"
          >
            <MessageSquare size={14} /> Ask About This Document
          </Link>
        </div>
      </div>

      {/* Key Takeaways */}
      {doc.key_points.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-2xl">Key Takeaways</h2>
            <span className="font-mono text-[0.65rem] text-muted">{doc.key_points.length}</span>
          </div>
          <div className="h-px border-b border-dotted border-rule mb-4" />
          <div className="space-y-0">
            {doc.key_points.map(function (point, i) {
              return (
                <div
                  key={i}
                  className="flex items-start gap-5 py-5"
                  style={{ borderBottom: i < doc.key_points.length - 1 ? '1px solid var(--color-rule, #dde1e8)' : 'none' }}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[1.1rem] font-bold"
                    style={{
                      color: primaryTheme.color,
                      border: `2px solid ${primaryTheme.color}`,
                    }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[0.95rem] leading-relaxed">{point}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </DetailPageLayout>
  )
}
