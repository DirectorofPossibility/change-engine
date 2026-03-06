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
    <div className="min-h-screen" style={{ backgroundColor: '#F0EAE0' }}>
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: '#D4CCBE' }}>
        <div className="mx-auto max-w-7xl px-4 py-3">
          <Link
            href="/design2/news"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#6B6560' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to News
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            {/* Hero image or gradient */}
            {(content as any).image_url ? (
              <div className="mb-6 overflow-hidden rounded-lg">
                <img
                  src={(content as any).image_url}
                  alt={(content as any).title_6th_grade || 'Content image'}
                  className="w-full max-h-[300px] object-cover"
                />
              </div>
            ) : (
              <div
                className="mb-6 h-[180px] rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.color}33 0%, ${theme.color}11 100%)`,
                }}
              />
            )}

            {/* Pathway dot + name */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-sm font-medium" style={{ color: theme.color }}>
                {theme.name}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-serif text-3xl font-bold leading-tight lg:text-4xl"
              style={{ color: '#1A1A1A' }}
            >
              {(content as any).title_6th_grade || (content as any).title || 'Untitled'}
            </h1>

            {/* Date + source */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm" style={{ color: '#6B6560' }}>
              {publishedDate && <span>{publishedDate}</span>}
              {publishedDate && sourceDomain && (
                <span style={{ color: '#D4CCBE' }}>|</span>
              )}
              {sourceDomain && <span>{sourceDomain}</span>}
            </div>

            {/* Summary */}
            {((content as any).summary_6th_grade || (content as any).summary) && (
              <div className="mt-8 max-w-[720px]">
                <p
                  className="text-lg leading-relaxed"
                  style={{ color: '#2C2C2C' }}
                >
                  {(content as any).summary_6th_grade || (content as any).summary}
                </p>
              </div>
            )}

            {/* Read original button */}
            {(content as any).source_url && (
              <div className="mt-8">
                <a
                  href={(content as any).source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#C75B2A' }}
                >
                  Read original
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5.25 2.625H2.625V11.375H11.375V8.75" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.75 2.625H11.375V5.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.125 7.875L11.375 2.625" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            )}
          </article>

          {/* Right sidebar: Related */}
          <aside className="w-full lg:w-[320px] lg:flex-shrink-0">
            <div className="rounded-lg border p-5" style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CCBE' }}>
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
                          style={{ borderColor: '#D4CCBE' }}
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
                        style={{ borderColor: '#D4CCBE' }}
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
                        style={{ borderColor: '#D4CCBE' }}
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
