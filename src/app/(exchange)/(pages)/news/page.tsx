import type { Metadata } from 'next'
import Link from 'next/link'
import { getNewsFeed } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { FileText } from 'lucide-react'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'

export const metadata: Metadata = {
  title: 'Community News — Community Exchange',
  description: 'Latest news, articles, and reports from across the Houston community.',
}

export const revalidate = 3600

function timeAgo(dateStr: string | null) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 7) return days + 'd ago'
  if (days < 30) return Math.floor(days / 7) + 'w ago'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string }>
}) {
  const { pathway } = await searchParams
  const items = await getNewsFeed(pathway, 40)
  const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string }][]

  const withImages = items.filter(i => i.image_url)
  const featured = withImages.slice(0, 3)
  const featuredIds = new Set(featured.map(f => f.id))
  const rest = items.filter(i => !featuredIds.has(i.id))

  // Count unique sources
  const uniqueSources = new Set(items.map(i => i.source_domain).filter(Boolean)).size

  return (
    <div>
      <IndexPageHero
        color="#319795"
        pattern="seed"
        title="Community News"
        subtitle="Stories, reports, and updates from across Houston"
        intro="Stay informed with news that matters to your community. Filter by pathway to focus on the topics you care about most."
        stats={[
          { value: items.length, label: 'Stories' },
          { value: uniqueSources, label: 'Sources' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'News' }]} />

        {/* Pathway filter */}
        <div className="flex flex-wrap items-center gap-2 mt-4 mb-8">
          <Link
            href="/news"
            className={'text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-colors ' +
              (!pathway ? 'bg-brand-text text-white border-brand-text' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
          >
            All
          </Link>
          {themeEntries.map(function ([id, theme]) {
            const active = pathway === id
            return (
              <Link
                key={id}
                href={'/news?pathway=' + id}
                className={'text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-colors ' +
                  (active ? 'text-white border-transparent' : 'bg-white text-brand-muted border-brand-border hover:border-brand-text')}
                style={active ? { backgroundColor: theme.color } : undefined}
              >
                {theme.name}
              </Link>
            )
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <FileText size={40} className="mx-auto text-brand-muted mb-4" />
                <p className="text-brand-muted">No news articles found{pathway ? ' for this pathway' : ''}.</p>
              </div>
            ) : (
              <>
                {/* Featured row */}
                {featured.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {featured.map(function (item) {
                      const theme = item.pathway_primary ? (THEMES as Record<string, { color: string; name: string }>)[item.pathway_primary] : null
                      return (
                        <Link key={item.id} href={'/content/' + item.id} className="group">
                          <div className="rounded-xl overflow-hidden border-2 border-brand-border hover:border-brand-text transition-all" style={{ boxShadow: '3px 3px 0 #D1D5E0' }}>
                            {item.image_url && (
                              <div className="aspect-[16/10] overflow-hidden">
                                <img
                                  src={item.image_url}
                                  alt=""
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                {theme && (
                                  <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
                                )}
                                <span className="text-[10px] font-mono text-brand-muted">{timeAgo(item.published_at)}</span>
                                {item.source_domain && (
                                  <span className="text-[10px] font-mono text-brand-muted">{item.source_domain}</span>
                                )}
                              </div>
                              <h3 className="text-sm font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                                {item.title_6th_grade}
                              </h3>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* List view */}
                <div className="space-y-1">
                  {rest.map(function (item) {
                    const theme = item.pathway_primary ? (THEMES as Record<string, { color: string; name: string }>)[item.pathway_primary] : null
                    return (
                      <Link
                        key={item.id}
                        href={'/content/' + item.id}
                        className="flex items-start gap-3 py-3 border-b border-brand-border/50 hover:bg-brand-bg/30 -mx-2 px-2 rounded-lg transition-colors group"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-16 h-12 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-12 rounded flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: (theme?.color || '#C75B2A') + '15' }}>
                            <FileText size={16} style={{ color: theme?.color || '#C75B2A' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-brand-text group-hover:text-brand-accent transition-colors line-clamp-2">
                            {item.title_6th_grade}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {theme && (
                              <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ backgroundColor: theme.color }} />
                            )}
                            <span className="text-[10px] font-mono text-brand-muted">{timeAgo(item.published_at)}</span>
                            {item.source_domain && (
                              <span className="text-[10px] font-mono text-brand-muted">{item.source_domain}</span>
                            )}
                            {item.content_type && item.content_type !== 'article' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg text-brand-muted capitalize">{item.content_type}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="news"
                color="#319795"
                related={[
                  { label: 'Library', href: '/library', color: '#d69e2e' },
                  { label: 'Officials', href: '/officials', color: '#805ad5' },
                  { label: 'Policies', href: '/policies', color: '#3182ce' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
