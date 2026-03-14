import Link from 'next/link'
import { FolFallback } from '@/components/ui/FolFallback'

interface NewsItem {
  id: string
  title_6th_grade: string
  summary_6th_grade?: string | null
  image_url?: string | null
  source_domain?: string | null
  published_at?: string | null
  content_type?: string | null
  pathway_primary?: string | null
}

interface LatestContentItem {
  id?: string | null
  inbox_id?: string | null
  title_6th_grade?: string | null
  summary_6th_grade?: string | null
  image_url?: string | null
  source_domain?: string | null
  pathway_primary?: string | null
  [key: string]: unknown
}

interface HomeNewsFeedProps {
  newsFeed: NewsItem[]
  latestContent: LatestContentItem[]
}

export function HomeNewsFeed({ newsFeed, latestContent }: HomeNewsFeedProps) {
  return (
    <>
      {/* News */}
      <section className="bg-paper">
        <div className="max-w-[720px] mx-auto px-6 py-16">
          <p className="font-mono text-[10px] tracking-[0.14em] text-blue uppercase mb-1.5">
            The front page
          </p>
          <p className="font-display text-[clamp(20px,3vw,28px)] leading-snug mb-8">
            What is happening in Houston.
          </p>

          {newsFeed[0] && (
            <div className="mb-10">
              <Link href={'/content/' + newsFeed[0].id} className="group block">
                <div className="mb-5 overflow-hidden">
                  {newsFeed[0].image_url ? (
                    <img src={newsFeed[0].image_url} alt="" className="w-full object-cover max-h-[340px]" />
                  ) : (
                    <FolFallback pathway={newsFeed[0].pathway_primary} size="hero" />
                  )}
                </div>
                <h3 className="font-display text-[clamp(22px,3vw,30px)] leading-tight mb-2.5 group-hover:text-blue transition-colors">
                  {newsFeed[0].title_6th_grade}
                </h3>
                {newsFeed[0].summary_6th_grade && (
                  <p className="font-body text-base text-muted leading-relaxed">
                    {newsFeed[0].summary_6th_grade.length > 300
                      ? newsFeed[0].summary_6th_grade.slice(0, 300) + '...'
                      : newsFeed[0].summary_6th_grade}
                  </p>
                )}
                {newsFeed[0].source_domain && (
                  <p className="font-mono text-[10px] text-muted mt-2.5 tracking-wider uppercase">
                    {newsFeed[0].source_domain}
                  </p>
                )}
              </Link>
            </div>
          )}

          {newsFeed.slice(1, 5).map(function (item) {
            return (
              <Link
                key={item.id}
                href={'/content/' + item.id}
                className="group flex gap-4 py-4 transition-colors border-t border-clay/10"
              >
                <div className="flex-1">
                  <h4 className="font-body text-base leading-snug mb-1 group-hover:text-blue transition-colors">
                    {item.title_6th_grade}
                  </h4>
                  {item.source_domain && (
                    <p className="font-mono text-[10px] text-muted uppercase tracking-wider">
                      {item.source_domain}
                    </p>
                  )}
                </div>
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-[72px] h-[72px] object-cover shrink-0" />
                ) : (
                  <div className="w-[72px] h-[72px] shrink-0 overflow-hidden">
                    <FolFallback pathway={item.pathway_primary} height="h-full" />
                  </div>
                )}
              </Link>
            )
          })}

          <div className="mt-6">
            <Link href="/news" className="font-body text-[13px] italic text-blue hover:underline">
              Read more news &rarr;
            </Link>
          </div>
        </div>
      </section>

      <div className="h-px bg-rule" />

      {/* From the library */}
      {latestContent.length > 0 && (
        <section className="bg-paper">
          <div className="max-w-[720px] mx-auto px-6 py-16">
            <p className="font-mono text-[10px] tracking-[0.14em] text-blue uppercase mb-1.5">
              From the library
            </p>
            <p className="font-display text-[clamp(20px,3vw,28px)] leading-snug mb-8">
              Recently published.
            </p>

            {latestContent.slice(0, 3).map(function (item, i) {
              const title = (item.title_6th_grade || '') as string
              const summary = (item.summary_6th_grade || '') as string
              const id = (item.id || '') as string
              return (
                <Link
                  key={id}
                  href={'/content/' + id}
                  className={'group flex gap-4 py-4 transition-colors' + (i < 2 ? ' border-b border-clay/10' : '')}
                >
                  <div className="flex-1">
                    <h4 className="font-body text-[17px] leading-snug mb-1 group-hover:text-blue transition-colors">
                      {title}
                    </h4>
                    {summary && (
                      <p className="font-body text-sm text-muted leading-relaxed line-clamp-2">
                        {summary}
                      </p>
                    )}
                    {item.source_domain && (
                      <p className="font-mono text-[10px] text-muted mt-1 uppercase tracking-wider">
                        {item.source_domain as string}
                      </p>
                    )}
                  </div>
                  {item.image_url ? (
                    <img src={item.image_url as string} alt="" className="w-20 h-20 object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 shrink-0 overflow-hidden">
                      <FolFallback pathway={item.pathway_primary} height="h-full" />
                    </div>
                  )}
                </Link>
              )
            })}

            {latestContent.length > 3 && (
              <details className="mt-4">
                <summary className="font-mono text-micro text-blue cursor-pointer tracking-wider">
                  + {latestContent.length - 3} more
                </summary>
                <div className="mt-2">
                  {latestContent.slice(3).map(function (item) {
                    const title = (item.title_6th_grade || '') as string
                    const id = (item.id || '') as string
                    return (
                      <Link key={id} href={'/content/' + id} className="group block py-3 border-b border-clay/[0.08]">
                        <p className="font-body text-[15px] group-hover:text-blue transition-colors">
                          {title}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </details>
            )}

            <div className="mt-6">
              <Link href="/news" className="font-body text-[13px] italic text-blue hover:underline">
                Browse the full library &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
