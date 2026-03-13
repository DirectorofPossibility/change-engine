import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getNewsFeed } from '@/lib/data/exchange'
import { createClient } from '@/lib/supabase/server'
import { THEMES } from '@/lib/constants'
import Image from 'next/image'

const PARCHMENT = '#F5F0E8'
const PARCHMENT_WARM = '#EDE7D8'
const INK = '#1A1A1A'
const CLAY = '#C4663A'
const MUTED = '#7a7265'
const RULE_COLOR = 'rgba(196,102,58,0.3)'
const SERIF = 'Georgia, "Times New Roman", serif'
const MONO = '"Courier New", Courier, monospace'

export const metadata: Metadata = {
  title: 'The News Stand — Change Engine',
  description: 'Articles, videos, guides, reports, tools, courses, and more from across the Houston community.',
}

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return hours + 'h ago'
  const days = Math.floor(hours / 24)
  if (days < 2) return 'Yesterday'
  if (days < 7) return days + ' days ago'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function shortDate(dateStr: string | null) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CONTENT_TYPES = [
  { key: '', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'report', label: 'Reports' },
  { key: 'video', label: 'Videos' },
  { key: 'guide', label: 'Guides' },
  { key: 'tool', label: 'Tools' },
  { key: 'course', label: 'Courses' },
  { key: 'event', label: 'Events' },
  { key: 'campaign', label: 'Campaigns' },
  { key: 'opportunity', label: 'Opportunities' },
]

type Item = { id: string; title_6th_grade: string | null; summary_6th_grade: string | null; pathway_primary: string | null; center: string | null; image_url: string | null; source_url: string | null; source_domain: string | null; published_at: string | null; content_type: string | null }

function hasValidImage(item: Item) {
  return item.image_url && item.image_url.trim() && item.image_url.startsWith('http')
}

function getTheme(item: Item) {
  return item.pathway_primary ? (THEMES as Record<string, { color: string; name: string }>)[item.pathway_primary] : null
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ pathway?: string; type?: string }>
}) {
  const { pathway, type } = await searchParams
  const cookieStore = await cookies()
  const userZip = cookieStore.get('zip')?.value || ''

  const rawItems = await getNewsFeed(pathway, 80, type || undefined)

  let items = rawItems
  if (userZip && rawItems.length > 0) {
    const supabase = await createClient()
    const { data: zipRows } = await supabase
      .from('content_zip_codes' as any)
      .select('content_id')
      .eq('zip_code', userZip)
    const localIds = new Set((zipRows || []).map(function (r: any) { return r.content_id }))
    if (localIds.size > 0) {
      items = [
        ...rawItems.filter(function (i) { return localIds.has(i.id) }),
        ...rawItems.filter(function (i) { return !localIds.has(i.id) }),
      ]
    }
  }

  const themeEntries = Object.entries(THEMES) as [string, { name: string; color: string; slug: string }][]

  const withImages = items.filter(hasValidImage)
  const hero = withImages[0] || items[0]
  const secondary = withImages.slice(1, 4).length >= 2 ? withImages.slice(1, 4) : items.slice(1, 4)
  const usedIds = new Set([hero?.id, ...secondary.map(function (s) { return s.id })].filter(Boolean))
  const remaining = items.filter(function (i) { return !usedIds.has(i.id) })

  const sections: { type: string; label: string; items: Item[] }[] = []
  const typeOrder = ['article', 'report', 'video', 'guide', 'tool', 'course', 'event', 'campaign', 'opportunity']
  const typeLabels: Record<string, string> = {
    article: 'Latest Articles', report: 'Reports & Research', video: 'Watch',
    guide: 'Guides', tool: 'Tools & Resources', course: 'Courses',
    event: 'Events', campaign: 'Campaigns', opportunity: 'Opportunities',
  }

  if (!type) {
    typeOrder.forEach(function (t) {
      const group = remaining.filter(function (i) { return i.content_type === t })
      if (group.length > 0) sections.push({ type: t, label: typeLabels[t] || t, items: group })
    })
    const grouped = new Set(typeOrder)
    const other = remaining.filter(function (i) { return !grouped.has(i.content_type || '') })
    if (other.length > 0) sections.push({ type: 'other', label: 'More', items: other })
  } else {
    if (remaining.length > 0) {
      sections.push({ type: type, label: typeLabels[type] || type, items: remaining })
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  function isPastEvent(item: Item) {
    return item.content_type === 'event' && item.published_at && new Date(item.published_at).getTime() < thirtyDaysAgo
  }

  return (
    <div style={{ background: PARCHMENT }} className="min-h-screen">
      {/* Hero */}
      <div style={{ background: PARCHMENT_WARM }} className="relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/images/fol/seed-of-life.svg" alt="" width={500} height={500} className="opacity-[0.04]" />
        </div>
        <div className="max-w-[900px] mx-auto px-6 py-16 relative z-10">
          <p style={{ fontFamily: MONO, fontSize: '0.7rem', letterSpacing: '0.15em', color: MUTED, textTransform: 'uppercase' }}>
            The Change Engine
          </p>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.5rem', color: INK, lineHeight: 1.15, marginTop: '0.75rem' }}>
            The News Stand
          </h1>
          <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED, marginTop: '0.75rem', maxWidth: '38rem', lineHeight: 1.7 }}>
            Articles, videos, guides, reports, and community content from across Houston.
          </p>
          <p style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, marginTop: '0.5rem', fontStyle: 'italic' }}>{today}</p>
          <div className="flex justify-start mt-4">
            <div className="flex h-1 w-48 overflow-hidden">
              {Object.values(THEMES).map(function (theme) {
                return <div key={theme.slug} className="flex-1" style={{ backgroundColor: theme.color }} />
              })}
            </div>
          </div>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-6">
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{items.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Items</span>
              </div>
              <div>
                <span style={{ fontFamily: SERIF, fontSize: '2rem', color: INK }}>{sections.length}</span>
                <span style={{ fontFamily: MONO, fontSize: '0.65rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block' }}>Sections</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ borderBottom: '1px solid ' + RULE_COLOR, background: PARCHMENT }} className="sticky top-0 z-20">
        <div className="max-w-[900px] mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {CONTENT_TYPES.map(function (ct) {
              const active = (type || '') === ct.key
              const href = ct.key
                ? '/news?type=' + ct.key + (pathway ? '&pathway=' + pathway : '')
                : '/news' + (pathway ? '?pathway=' + pathway : '')
              return (
                <Link
                  key={ct.key}
                  href={href}
                  className="hover:opacity-80"
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                    padding: '4px 10px',
                    color: active ? INK : MUTED,
                    borderBottom: active ? '1px solid ' + INK : '1px solid transparent',
                  }}
                >
                  {ct.label}
                </Link>
              )
            })}
            <span className="w-px h-4 mx-1" style={{ background: RULE_COLOR }} />
            {themeEntries.map(function ([id, theme]) {
              const active = pathway === id
              const href = '/news?pathway=' + id + (type ? '&type=' + type : '')
              return (
                <Link
                  key={id}
                  href={active ? '/news' + (type ? '?type=' + type : '') : href}
                  className="flex items-center gap-1.5 hover:opacity-80"
                  style={{ fontFamily: MONO, fontSize: '0.65rem', color: active ? theme.color : MUTED }}
                >
                  <span className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: theme.color, opacity: active ? 1 : 0.5 }} />
                  {active ? theme.name : ''}
                </Link>
              )
            })}
            {pathway && (
              <Link href={'/news' + (type ? '?type=' + type : '')} style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }} className="hover:underline ml-1">clear</Link>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[900px] mx-auto px-6 pt-6">
        <nav style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>
          <Link href="/" className="hover:underline" style={{ color: CLAY }}>Home</Link>
          <span className="mx-2">/</span>
          <span>News Stand</span>
        </nav>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16" style={{ border: '1px dashed ' + RULE_COLOR }}>
            <p style={{ fontFamily: SERIF, fontSize: '1.1rem', color: MUTED }}>No content found{type ? ' for ' + type + 's' : ''}{pathway ? ' in this pathway' : ''}.</p>
          </div>
        ) : (
          <>
            {/* Hero + Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8" style={{ borderBottom: '1px solid ' + RULE_COLOR }}>
              {hero && (
                <Link href={'/content/' + hero.id} className="lg:col-span-7 group block">
                  {hasValidImage(hero) && (
                    <div className="aspect-[16/9] overflow-hidden mb-4">
                      <Image src={hero.image_url!} alt="" className="w-full h-full object-cover" width={800} height={400} />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {getTheme(hero) && (
                      <span style={{ fontFamily: MONO, fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: getTheme(hero)!.color }}>
                        {getTheme(hero)!.name}
                      </span>
                    )}
                    {hero.content_type && hero.content_type !== 'article' && (
                      <span style={{ fontFamily: MONO, fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: MUTED }}>
                        {hero.content_type}
                      </span>
                    )}
                    {isPastEvent(hero) && (
                      <span style={{ fontFamily: MONO, fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: MUTED }}>Past</span>
                    )}
                  </div>
                  <h2 className="group-hover:underline" style={{ fontFamily: SERIF, fontSize: '2rem', fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                    {hero.title_6th_grade}
                  </h2>
                  {hero.summary_6th_grade && (
                    <p className="line-clamp-3 mt-3" style={{ fontFamily: SERIF, fontSize: '1rem', color: MUTED, lineHeight: 1.6 }}>
                      {hero.summary_6th_grade}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    {hero.source_domain && <span style={{ fontFamily: MONO, fontSize: '0.6875rem', fontWeight: 500, color: MUTED }}>{hero.source_domain}</span>}
                    <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{formatDate(hero.published_at)}</span>
                  </div>
                </Link>
              )}

              <div className="lg:col-span-5 flex flex-col">
                {secondary.map(function (item, idx) {
                  const theme = getTheme(item)
                  return (
                    <Link key={item.id} href={'/content/' + item.id} className="group flex gap-4 py-4 hover:opacity-80" style={{ borderBottom: idx < secondary.length - 1 ? '1px solid ' + RULE_COLOR : 'none' }}>
                      {hasValidImage(item) ? (
                        <Image src={item.image_url!} alt="" className="w-28 h-20 object-cover flex-shrink-0" width={112} height={80} />
                      ) : (
                        <div className="w-28 h-20 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: PARCHMENT_WARM }}>
                          <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, textTransform: 'uppercase' }}>{item.content_type || 'item'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {theme && (
                          <span style={{ fontFamily: MONO, fontSize: '0.6875rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em', color: theme.color }}>
                            {theme.name}
                          </span>
                        )}
                        <h3 className="line-clamp-3 group-hover:underline" style={{ fontFamily: SERIF, fontSize: '1.05rem', fontWeight: 700, color: INK, lineHeight: 1.3 }}>
                          {item.title_6th_grade}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          {item.source_domain && <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{item.source_domain}</span>}
                          <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{shortDate(item.published_at)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Sections by content type */}
            <div className="mt-8">
              {sections.map(function (section) {
                return (
                  <section key={section.type} className="mb-10">
                    <div className="flex items-baseline justify-between mb-1">
                      <h2 style={{ fontFamily: SERIF, fontSize: '1.5rem', color: INK }}>
                        {section.label}
                      </h2>
                      <span style={{ fontFamily: MONO, fontSize: '0.7rem', color: MUTED }}>{section.items.length}</span>
                    </div>
                    <div style={{ height: 1, borderBottom: '1px dotted ' + RULE_COLOR, marginBottom: '1rem' }} />

                    {section.items.slice(0, 4).map(function (item) {
                      const theme = getTheme(item)
                      return (
                        <Link key={item.id} href={'/content/' + item.id} className="group flex items-start gap-4 py-3 hover:opacity-80" style={{ borderBottom: '1px solid ' + RULE_COLOR }}>
                          {hasValidImage(item) ? (
                            <Image src={item.image_url!} alt="" className="w-20 h-14 object-cover flex-shrink-0" width={80} height={56} />
                          ) : (
                            <div className="w-20 h-14 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: PARCHMENT_WARM }}>
                              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, textTransform: 'uppercase' }}>{item.content_type || 'item'}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="line-clamp-2 group-hover:underline" style={{ fontFamily: SERIF, fontSize: '0.95rem', fontWeight: 600, color: INK, lineHeight: 1.4 }}>
                              {item.title_6th_grade}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {theme && (
                                <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: theme.color }} />
                              )}
                              {item.source_domain && <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{item.source_domain}</span>}
                              <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{shortDate(item.published_at)}</span>
                              {isPastEvent(item) && (
                                <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, fontWeight: 700, textTransform: 'uppercase' }}>Past</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                    {section.items.length > 4 && (
                      <details className="mt-2">
                        <summary style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.9rem', cursor: 'pointer' }}>
                          See {section.items.length - 4} more
                        </summary>
                        {section.items.slice(4).map(function (item) {
                          const theme = getTheme(item)
                          return (
                            <Link key={item.id} href={'/content/' + item.id} className="group flex items-start gap-4 py-3 hover:opacity-80" style={{ borderBottom: '1px solid ' + RULE_COLOR }}>
                              {hasValidImage(item) ? (
                                <Image src={item.image_url!} alt="" className="w-20 h-14 object-cover flex-shrink-0" width={80} height={56} />
                              ) : (
                                <div className="w-20 h-14 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: PARCHMENT_WARM }}>
                                  <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, textTransform: 'uppercase' }}>{item.content_type || 'item'}</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="line-clamp-2 group-hover:underline" style={{ fontFamily: SERIF, fontSize: '0.95rem', fontWeight: 600, color: INK, lineHeight: 1.4 }}>
                                  {item.title_6th_grade}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {theme && <span className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: theme.color }} />}
                                  {item.source_domain && <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{item.source_domain}</span>}
                                  <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED }}>{shortDate(item.published_at)}</span>
                                  {isPastEvent(item) && (
                                    <span style={{ fontFamily: MONO, fontSize: '0.6875rem', color: MUTED, fontWeight: 700, textTransform: 'uppercase' }}>Past</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </details>
                    )}
                  </section>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="my-10 max-w-[900px] mx-auto px-6" style={{ height: 1, background: RULE_COLOR }} />
      <div className="max-w-[900px] mx-auto px-6 pb-12">
        <Link href="/" style={{ fontFamily: SERIF, fontStyle: 'italic', color: CLAY, fontSize: '0.95rem' }} className="hover:underline">
          Back to the Guide
        </Link>
      </div>
    </div>
  )
}
