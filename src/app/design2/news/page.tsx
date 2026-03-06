import Link from 'next/link'
import { getNewsFeed } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'

export const revalidate = 300

export const metadata = {
  title: 'News — Community Exchange',
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default async function NewsPage() {
  const news = await getNewsFeed(undefined, 50)

  return (
    <div className="min-h-screen" style={{ background: '#F0EAE0' }}>
      {/* Top navigation */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/design2"
          className="inline-block text-sm font-sans transition-colors"
          style={{ color: '#6B6560' }}
        >
          &larr; Home
        </Link>
      </div>

      {/* Page header */}
      <header className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        {/* Accent bar */}
        <div
          className="mb-6 h-1 w-16 rounded-full"
          style={{ background: '#C75B2A' }}
        />
        <h1
          className="font-serif text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ color: '#1a1a1a' }}
        >
          News
        </h1>
        <p
          className="mt-3 max-w-2xl font-sans text-base leading-relaxed sm:text-lg"
          style={{ color: '#6B6560' }}
        >
          The latest stories, reports, and announcements from across Houston —
          rewritten for clarity and connected to the topics that matter to your
          community.
        </p>
      </header>

      {/* Card grid */}
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => {
            const themeKey = item.pathway_primary as keyof typeof THEMES | null
            const theme = themeKey ? THEMES[themeKey] : null
            const color = theme?.color ?? '#8B7E74'
            const pathwayName = theme?.name ?? 'Community'

            return (
              <Link
                key={item.id}
                href={`/design2/content/${item.id}`}
                className="group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-lg"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D4CCBE',
                  borderRadius: '0.75rem',
                }}
              >
                {/* Image or color bar fallback */}
                {item.image_url ? (
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={item.image_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className="h-2 w-full"
                    style={{ background: color }}
                  />
                )}

                {/* Card body */}
                <div className="flex flex-1 flex-col p-4">
                  {/* Pathway dot + name */}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: color }}
                    />
                    <span
                      className="text-xs font-bold uppercase tracking-wider font-sans"
                      style={{ color }}
                    >
                      {pathwayName}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className="font-serif text-base font-semibold leading-snug line-clamp-3 sm:text-lg"
                    style={{ color: '#1a1a1a' }}
                  >
                    {item.title_6th_grade}
                  </h2>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Meta row */}
                  <div
                    className="mt-3 flex items-center justify-between font-sans text-xs"
                    style={{ color: '#6B6560' }}
                  >
                    <span className="truncate max-w-[60%]">
                      {item.source_domain ?? 'Source'}
                    </span>
                    {item.published_at && (
                      <span className="whitespace-nowrap">
                        {timeAgo(item.published_at)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Empty state */}
        {news.length === 0 && (
          <div className="py-20 text-center font-sans" style={{ color: '#6B6560' }}>
            <p className="text-lg">No news articles yet. Check back soon.</p>
          </div>
        )}
      </main>
    </div>
  )
}
