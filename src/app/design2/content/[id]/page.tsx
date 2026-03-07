import { createClient } from '@/lib/supabase/server'
import { getWayfinderContext } from '@/lib/data/exchange'
import { THEMES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 300

function getThemeForPathway(pathwayPrimary: string | null) {
  if (!pathwayPrimary) return { name: 'Community', color: '#6B6560' }
  const theme = THEMES[pathwayPrimary as keyof typeof THEMES]
  return theme ? { name: theme.name, color: theme.color } : { name: 'Community', color: '#6B6560' }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

function extractDomain(url: string | null) {
  if (!url) return null
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return null
  }
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: content } = await supabase
    .from('content_published')
    .select('*')
    .eq('id', id)
    .single()

  if (!content) {
    notFound()
  }

  const wayfinder = await getWayfinderContext('content', content.inbox_id || id)
  const theme = getThemeForPathway((content as any).pathway_primary)
  const publishedDate = formatDate((content as any).published_at || (content as any).created_at)
  const sourceDomain = extractDomain((content as any).source_url)

  return (
    <div className="min-h-screen">
      {/* Dark content hero */}
      <section style={{ background: '#1a1a2e' }}>
        <div className="max-w-[1152px] mx-auto px-8 py-10 pb-12">
          <div className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/design2" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>Home</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <Link href="/design2/news" className="hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}>News</Link>
            <span className="mx-2" style={{ color: '#C75B2A' }}>&rsaquo;</span>
            <span style={{ color: 'white' }}>Article</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1">
              {/* Color dot + rule */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-sm" style={{ background: theme.color }} />
                <div className="h-px flex-1 max-w-[60px]" style={{ background: theme.color, opacity: 0.4 }} />
              </div>
              <h1 className="font-serif text-[clamp(1.5rem,3.5vw,2.5rem)] leading-[1.2]" style={{ color: 'white' }}>
                {(content as any).title_6th_grade || (content as any).title || 'Untitled'}
              </h1>
              {((content as any).summary_6th_grade || (content as any).summary) && (
                <p className="text-[16px] mt-3 max-w-[540px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {(content as any).summary_6th_grade || (content as any).summary}
                </p>
              )}
              <div className="flex items-center gap-3 mt-4 text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {sourceDomain && <span className="font-medium">{sourceDomain}</span>}
                {sourceDomain && publishedDate && <span style={{ opacity: 0.4 }}>/</span>}
                {publishedDate && <span>{publishedDate}</span>}
              </div>
              {(content as any).source_url && (
                <a
                  href={(content as any).source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2 rounded-lg text-[14px] font-medium text-white"
                  style={{ background: theme.color }}
                >
                  Visit source
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
              )}
            </div>
            {/* Image thumbnail */}
            {(content as any).image_url ? (
              <div className="w-full lg:w-[280px] flex-shrink-0">
                <div className="rounded-lg overflow-hidden" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.2)', height: '180px' }}>
                  <img src={(content as any).image_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex w-[280px] flex-shrink-0 rounded-lg items-center justify-center" style={{ height: '180px', background: `linear-gradient(135deg, ${theme.color}25, ${theme.color}50)` }}>
                <svg width="48" height="48" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill={theme.color} opacity="0.2"/><circle cx="32" cy="32" r="14" fill={theme.color} opacity="0.3"/></svg>
              </div>
            )}
          </div>
        </div>
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${theme.color}, transparent 60%)` }} />
      </section>

      {/* Body + sidebar */}
      <div className="max-w-[1152px] mx-auto px-8 py-10" style={{ background: '#FAF8F5' }}>
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            {((content as any).summary_6th_grade || (content as any).summary) && (
              <div className="mb-8 max-w-[720px]">
                <p className="text-[16px] leading-relaxed" style={{ color: '#1A1A1A' }}>
                  {(content as any).summary_6th_grade || (content as any).summary}
                </p>
              </div>
            )}
          </article>

          {/* Right sidebar: Related */}
          <aside className="w-full lg:w-[320px] lg:flex-shrink-0">
            <div className="rounded-lg border p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD5' }}>
              <h2
                className="font-serif text-lg font-bold mb-4"
                style={{ color: '#1A1A1A' }}
              >
                Related
              </h2>

              {/* Related content */}
              {wayfinder.content.length > 0 && (
                <div className="mb-5">
                  <h3
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#6B6560' }}
                  >
                    More to read
                  </h3>
                  <div className="flex flex-col gap-2">
                    {wayfinder.content.slice(0, 5).map((item) => {
                      const itemTheme = getThemeForPathway(item.pathway_primary)
                      return (
                        <Link
                          key={item.id}
                          href={`/design2/content/${item.id}`}
                          className="group flex items-start gap-2 rounded-md border p-3 transition-shadow hover:shadow-sm"
                          style={{ borderColor: '#E2DDD5' }}
                        >
                          <span
                            className="mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: itemTheme.color }}
                          />
                          <span
                            className="text-sm font-medium leading-snug group-hover:underline"
                            style={{ color: '#1A1A1A' }}
                          >
                            {item.title_6th_grade || 'Untitled'}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Related officials */}
              {wayfinder.officials.length > 0 && (
                <div className="mb-5">
                  <h3
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#6B6560' }}
                  >
                    Officials
                  </h3>
                  <div className="flex flex-col gap-2">
                    {wayfinder.officials.slice(0, 4).map((official) => (
                      <Link
                        key={official.official_id}
                        href={`/design2/officials/${official.official_id}`}
                        className="group flex items-center gap-3 rounded-md border p-3 transition-shadow hover:shadow-sm"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        {official.photo_url ? (
                          <img
                            src={official.photo_url}
                            alt={official.official_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: '#6B6560' }}
                          >
                            {official.official_name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium leading-tight group-hover:underline truncate"
                            style={{ color: '#1A1A1A' }}
                          >
                            {official.official_name}
                          </p>
                          {official.title && (
                            <p className="text-xs truncate" style={{ color: '#6B6560' }}>
                              {official.title}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related policies */}
              {wayfinder.policies.length > 0 && (
                <div>
                  <h3
                    className="text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#6B6560' }}
                  >
                    Policies
                  </h3>
                  <div className="flex flex-col gap-2">
                    {wayfinder.policies.slice(0, 4).map((policy) => (
                      <Link
                        key={policy.policy_id}
                        href={`/design2/policies/${policy.policy_id}`}
                        className="group flex items-start gap-2 rounded-md border p-3 transition-shadow hover:shadow-sm"
                        style={{ borderColor: '#E2DDD5' }}
                      >
                        <svg
                          className="mt-0.5 flex-shrink-0"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="#6B6560" strokeWidth="1.2" />
                          <line x1="4.5" y1="4" x2="9.5" y2="4" stroke="#6B6560" strokeWidth="1" strokeLinecap="round" />
                          <line x1="4.5" y1="6.5" x2="9.5" y2="6.5" stroke="#6B6560" strokeWidth="1" strokeLinecap="round" />
                          <line x1="4.5" y1="9" x2="7.5" y2="9" stroke="#6B6560" strokeWidth="1" strokeLinecap="round" />
                        </svg>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-medium leading-snug group-hover:underline"
                            style={{ color: '#1A1A1A' }}
                          >
                            {policy.title_6th_grade || policy.policy_name}
                          </p>
                          {policy.bill_number && (
                            <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>
                              {policy.bill_number}
                              {policy.status && ` -- ${policy.status}`}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {wayfinder.content.length === 0 &&
                wayfinder.officials.length === 0 &&
                wayfinder.policies.length === 0 && (
                  <p className="text-sm" style={{ color: '#6B6560' }}>
                    No related items found for this content.
                  </p>
                )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
