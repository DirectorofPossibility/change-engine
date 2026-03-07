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
    <div className="min-h-screen">
      {/* Dark editorial hero */}
      <section style={{ background: '#1a1a2e' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>News</span>
          </div>
          <div className="h-[2px] w-10 mb-5" style={{ background: '#C75B2A' }} />
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)]" style={{ color: 'white' }}>News</h1>
          <p className="font-serif text-[18px] italic mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Stories that shape Houston</p>
          <p className="text-[16px] mt-4 max-w-[720px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            The latest stories, reports, and announcements from across Houston — rewritten for clarity and connected to the topics that matter to your community.
          </p>
        </div>
      </section>

      {/* Card grid */}
      <main className="max-w-[1152px] mx-auto px-8 py-12" style={{ background: '#FAF8F5' }}>
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
                  border: '1px solid #E2DDD5',
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
