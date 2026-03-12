/**
 * @fileoverview Library document detail — editorial research paper layout.
 *
 * Full-page treatment for a research document: parchment hero with title
 * and summary, metadata strip, key takeaways as numbered editorial list,
 * PDF download, "Ask about this" chat link, related research, and tags.
 *
 * Design system: Georgia serif, Courier New mono, parchment palette,
 * zero border-radius, no emojis, no shadows.
 *
 * @route GET /library/doc/:id
 * @caching ISR with revalidate = 300 (5 minutes)
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getDocumentById, getRelatedDocuments } from '@/lib/data/library'
import { THEMES } from '@/lib/constants'
import { LibraryCard } from '@/components/exchange/LibraryCard'
import { ArticleVoting } from './ArticleVoting'

// ── Design tokens (locked — matches CommunityGuide.tsx) ─────────────────

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const PARCHMENT_LIGHT = '#F8F4EC'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'

const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

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

  const primaryTheme = themeInfo[0] || { id: '', color: CLAY, name: 'Research', slug: '' }
  const fileSizeMB = (doc.file_size / (1024 * 1024)).toFixed(1)
  const pdfUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kb-documents/${doc.file_path}`

  return (
    <div style={{ background: '#ffffff' }}>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — Parchment banner with document title
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: PARCHMENT }}>
        {/* Sacred geometry watermark */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none" aria-hidden="true">
          <Image
            src="/images/fol/seed-of-life.svg"
            alt=""
            width={400}
            height={400}
            className="opacity-[0.05] mr-[-40px]"
          />
        </div>

        {/* Theme color top bar */}
        <div style={{ height: 3, background: primaryTheme.color }} />

        <div className="relative z-10 max-w-[820px] mx-auto px-6 py-14 md:py-20">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Link href="/exchange" className="hover:underline" style={{ color: MUTED }}>
                The Exchange
              </Link>
              <span style={{ color: MUTED }}> / </span>
              <Link href="/library" className="hover:underline" style={{ color: MUTED }}>
                Library
              </Link>
              {primaryTheme.slug && (
                <>
                  <span style={{ color: MUTED }}> / </span>
                  <Link href={'/library/category/' + primaryTheme.slug} className="hover:underline" style={{ color: primaryTheme.color }}>
                    {primaryTheme.name}
                  </Link>
                </>
              )}
            </p>
          </nav>

          {/* Document type label */}
          <p
            className="mt-8"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: CLAY, textTransform: 'uppercase' }}
          >
            Research Document
          </p>

          {/* Themes */}
          {themeInfo.length > 0 && (
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              {themeInfo.map(function (theme) {
                return (
                  <Link
                    key={theme.id}
                    href={'/library/category/' + theme.slug}
                    className="inline-flex items-center gap-1.5 hover:underline"
                    style={{ fontFamily: MONO, fontSize: 11, color: theme.color }}
                  >
                    <span className="w-2 h-2 flex-shrink-0" style={{ background: theme.color }} />
                    {theme.name}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Title */}
          <h1
            className="mt-5"
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(26px, 4.5vw, 44px)',
              color: INK,
              lineHeight: 1.15,
              fontWeight: 'normal',
            }}
          >
            {doc.title}
          </h1>

          {/* Summary */}
          {doc.summary && (
            <p
              className="mt-5"
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(15px, 2vw, 18px)',
                color: MUTED,
                lineHeight: 1.7,
              }}
            >
              {doc.summary}
            </p>
          )}

          {/* Metadata strip */}
          <div className="mt-8 flex items-center gap-4 flex-wrap" style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
            {doc.page_count > 0 && (
              <span>{doc.page_count} pages</span>
            )}
            {doc.file_size > 0 && (
              <>
                <span style={{ color: RULE_COLOR }}>|</span>
                <span>{fileSizeMB} MB</span>
              </>
            )}
            {doc.published_at && (
              <>
                <span style={{ color: RULE_COLOR }}>|</span>
                <span>{new Date(doc.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </>
            )}
          </div>

          {/* Rule */}
          <div className="mt-8" style={{ width: 60, height: 2, background: primaryTheme.color }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ACTIONS — PDF download + Ask AI
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: PARCHMENT_WARM, borderBottom: `1px solid ${RULE_COLOR}` }}>
        <div className="max-w-[820px] mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 transition-all bg-white border border-[rgba(196,102,58,0.3)] hover:border-[#C4663A]"
              style={{
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.04em',
                color: INK,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>

            <Link
              href={'/library/chat?doc=' + doc.id}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 text-white transition-all bg-[#C4663A] hover:bg-[#a8522e]"
              style={{
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: '0.04em',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Ask About This Document
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          KEY TAKEAWAYS — Numbered editorial list
          ═══════════════════════════════════════════════════════════════ */}
      {doc.key_points.length > 0 && (
        <section style={{ background: '#ffffff' }}>
          <div className="max-w-[820px] mx-auto px-6 py-14">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 24 }}>
              Key Takeaways
            </p>

            <div className="space-y-0">
              {doc.key_points.map(function (point, i) {
                return (
                  <div
                    key={i}
                    className="flex items-start gap-5 py-5"
                    style={{ borderBottom: i < doc.key_points.length - 1 ? `1px solid ${RULE_COLOR}` : 'none' }}
                  >
                    {/* Number */}
                    <span
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center"
                      style={{
                        fontFamily: SERIF,
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: primaryTheme.color,
                        border: `2px solid ${primaryTheme.color}`,
                      }}
                    >
                      {i + 1}
                    </span>

                    {/* Point text */}
                    <p style={{ fontFamily: SERIF, fontSize: 16, color: INK, lineHeight: 1.7 }}>
                      {point}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAGS — Compact keyword strip
          ═══════════════════════════════════════════════════════════════ */}
      {doc.tags.length > 0 && (
        <section style={{ background: PARCHMENT_LIGHT, borderTop: `1px solid ${RULE_COLOR}`, borderBottom: `1px solid ${RULE_COLOR}` }}>
          <div className="max-w-[820px] mx-auto px-6 py-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: MUTED, textTransform: 'uppercase' }}>
                Keywords
              </span>
              <span style={{ color: RULE_COLOR }}>|</span>
              {doc.tags.map(function (tag) {
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1"
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: MUTED,
                      background: '#ffffff',
                      border: `1px solid ${RULE_COLOR}`,
                    }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FEEDBACK — Was this helpful?
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#ffffff' }}>
        <div className="max-w-[820px] mx-auto px-6 py-10">
          <ArticleVoting documentId={doc.id} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          RELATED RESEARCH — Editorial card grid
          ═══════════════════════════════════════════════════════════════ */}
      {related.length > 0 && (
        <section style={{ background: PARCHMENT, borderTop: `1px solid ${RULE_COLOR}` }}>
          <div className="max-w-[1000px] mx-auto px-6 py-14">
            <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: CLAY, textTransform: 'uppercase', marginBottom: 8 }}>
              Related Research
            </p>
            <p style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: MUTED, marginBottom: 24 }}>
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
                    className="group block p-6 transition-all bg-white border border-[rgba(196,102,58,0.3)] hover:border-[#C4663A]"
                  >
                    {/* Theme indicators */}
                    {relThemes.length > 0 && (
                      <div className="flex items-center gap-3 mb-3">
                        {relThemes.slice(0, 3).map(function (t) {
                          return (
                            <span key={t.name} className="inline-flex items-center gap-1" style={{ fontFamily: MONO, fontSize: 10, color: t.color }}>
                              <span className="w-1.5 h-1.5" style={{ background: t.color }} />
                              {t.name}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    <h3
                      className="group-hover:underline line-clamp-2"
                      style={{ fontFamily: SERIF, fontSize: 17, color: INK, lineHeight: 1.3, marginBottom: 8 }}
                    >
                      {rel.title}
                    </h3>

                    {rel.summary && (
                      <p className="line-clamp-2" style={{ fontFamily: SERIF, fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                        {rel.summary}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-3" style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                      {rel.page_count > 0 && <span>{rel.page_count} pages</span>}
                      {rel.tags.length > 0 && (
                        <>
                          <span style={{ color: RULE_COLOR }}>|</span>
                          <span>{rel.tags.slice(0, 2).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/library"
                className="hover:underline"
                style={{ fontFamily: SERIF, fontSize: 14, fontStyle: 'italic', color: CLAY }}
              >
                Browse the full library &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER CODA
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
