import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { THEMES, PAGE_INTROS } from '@/lib/constants'
import { getFocusAreas, getSDGs, getSDOHDomains } from '@/lib/data/exchange'
import { getDocumentCountsByTheme, getPublishedDocuments } from '@/lib/data/library'
import { ExploreFilterClient } from './ExploreFilterClient'
import { KnowledgeBaseSection } from './KnowledgeBaseSection'
import { PageHero } from '@/components/exchange/PageHero'
import { getUIStrings } from '@/lib/i18n'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { BookOpen, Search, MessageCircle, FileText } from 'lucide-react'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Explore — Community Exchange',
  description: 'Browse the knowledge base, focus areas, SDGs, and social determinants of health across all pathways.',
}

/** Map theme IDs to i18n keys */
const THEME_I18N: Record<string, string> = {
  THEME_01: 'theme.our_health',
  THEME_02: 'theme.our_families',
  THEME_03: 'theme.our_neighborhood',
  THEME_04: 'theme.our_voice',
  THEME_05: 'theme.our_money',
  THEME_06: 'theme.our_planet',
  THEME_07: 'theme.the_bigger_we',
}

export default async function ExplorePage() {
  const [focusAreas, sdgs, sdohDomains, kbCountsByTheme, recentArticles] = await Promise.all([
    getFocusAreas(),
    getSDGs(),
    getSDOHDomains(),
    getDocumentCountsByTheme(),
    getPublishedDocuments(1, 6),
  ])

  const cookieStore = await cookies()
  const lang = cookieStore.get('lang')?.value || 'en'
  const t = getUIStrings(lang)

  // Build KB categories from themes
  const kbCategories = Object.entries(THEMES).map(function ([id, theme]) {
    return {
      id,
      name: t(THEME_I18N[id] || '') || theme.name,
      color: theme.color,
      emoji: theme.emoji,
      articleCount: kbCountsByTheme[id] || 0,
    }
  }).filter(function (cat) { return cat.articleCount > 0 })

  const totalArticles = Object.values(kbCountsByTheme).reduce(function (sum, n) { return sum + n }, 0)

  // Group focus areas by theme_id, using translated theme names
  const themes = Object.entries(THEMES).map(function ([id, theme]) {
    return {
      id,
      name: t(THEME_I18N[id] || '') || theme.name,
      color: theme.color,
      emoji: theme.emoji,
      focusAreas: focusAreas.filter(function (fa) { return fa.theme_id === id }),
    }
  })

  // Focus areas without a theme
  const unthemed = focusAreas.filter(function (fa) { return !fa.theme_id })

  return (
    <div>
      <PageHero variant="editorial" titleKey="explore.title" introKey="explore.intro" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[{ label: 'Explore' }]} />

        {/* ── Knowledge Base (Zendesk-style) ── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen size={22} className="text-brand-accent" />
              <h2 className="text-2xl font-serif font-bold text-brand-text">Knowledge Base</h2>
              {totalArticles > 0 && (
                <span className="text-sm text-brand-muted">{totalArticles} articles</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/library"
                className="text-sm text-brand-accent hover:underline flex items-center gap-1"
              >
                <FileText size={14} />
                Research Library
              </Link>
              <Link
                href="/library/chat"
                className="text-sm text-brand-accent hover:underline flex items-center gap-1"
              >
                <MessageCircle size={14} />
                Ask AI
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <KnowledgeBaseSection />

          {/* Category cards */}
          {kbCategories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {kbCategories.map(function (cat) {
                return (
                  <Link
                    key={cat.id}
                    href={'/library/category/' + THEMES[cat.id as keyof typeof THEMES]?.slug}
                    className="group bg-white rounded-xl border border-brand-border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: cat.color + '18' }}
                      >
                        {cat.emoji}
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-brand-text group-hover:text-brand-accent transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-brand-muted mt-1">
                          {cat.articleCount} {cat.articleCount === 1 ? 'article' : 'articles'}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Recent articles */}
          {recentArticles.documents.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-4">Recently Published</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentArticles.documents.map(function (doc: any) {
                  const docThemes = (doc.theme_ids || [])
                    .map(function (tid: string) { return THEMES[tid as keyof typeof THEMES] })
                    .filter(Boolean)
                  const primary = docThemes[0]
                  return (
                    <Link
                      key={doc.id}
                      href={'/library/doc/' + doc.id}
                      className="group bg-white rounded-xl border border-brand-border p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {primary && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: primary.color }}
                          />
                        )}
                        <span className="text-xs text-brand-muted">
                          {doc.page_count} pages
                          {doc.published_at && (' · ' + new Date(doc.published_at).toLocaleDateString())}
                        </span>
                      </div>
                      <h4 className="font-serif font-semibold text-sm text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                        {doc.title}
                      </h4>
                      {doc.summary && (
                        <p className="text-xs text-brand-muted mt-1.5 line-clamp-2">{doc.summary}</p>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.slice(0, 3).map(function (tag: string) {
                            return (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted">
                                {tag}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {kbCategories.length === 0 && recentArticles.documents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-brand-border">
              <BookOpen size={32} className="mx-auto text-brand-muted mb-3" />
              <p className="text-brand-muted">The knowledge base is being built. Check back soon for articles and guides.</p>
            </div>
          )}
        </section>

        {/* ── Divider ── */}
        <hr className="border-brand-border mb-12" />

        {/* ── Focus Area Explorer ── */}
        <section>
          <h2 className="text-2xl font-serif font-bold text-brand-text mb-6">Focus Areas</h2>
          <ExploreFilterClient
            themes={themes}
            unthemedAreas={unthemed}
            sdgs={sdgs.map(function (s) { return { sdg_id: s.sdg_id, sdg_number: s.sdg_number, sdg_name: s.sdg_name, sdg_color: s.sdg_color } })}
            sdohDomains={sdohDomains.map(function (d) { return { sdoh_code: d.sdoh_code, sdoh_name: d.sdoh_name } })}
          />
        </section>
      </div>
    </div>
  )
}
